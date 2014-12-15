/*
 * Plugin to handle commands
 * The way to register commands is the following:
 *   self.core.emit("cmd.onecommand|twocommand", callback);
 * or to have ratelimited commands (not getting called before cooldown amount of
 * miliseconds pass, an anti-spam measure)
 *   self.core.emit("cmdratelimit.onecommand|twocommand", callback, cooldown);
 *
 * The way it works:
 *   assemble a regular expression out of the commands, the regexp will
 *   prefix-match the command, so !twitter will match !twitterino too
 *
 *   because you can pass in multiple commands to be registered at once, and
 *   the regexp only captures the actual command (so, if you have
 *   cmd.one|two|three and the input "!onerino", the regexp will capture "one")
 *   we need to have an extra object that connects the possible "sub" commands
 *   to the callback to call, so "one" to "one|two|three" which is what the
 *   callback is stored under
 *
 */
var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.state = state;

  // convenience function for !commands
  // currently it is not a prefix match, it only matches the proper, full command
  core.on("MSG", function(payload) {
    if (payload.data.length === 0 || payload.data[0] !== "!")
      return;

    var pos = payload.data.indexOf(" ");
    var command = null;
    var arg = null;
    if (pos < 0) // just a single command, no arguments
      command = payload.data;
    else {
      command = payload.data.substr(0, pos);
      // let the user of the command decide how they want to parse the arg
      // they can split it up after de-duplicating the spaces themselves, etc...
      arg = payload.data.substr(pos + 1);
    }

    var match = payload.data.match(self.state.ratelimitregex);
    var cmds = self.state.ratelimit;
    if (!match) {
      var match = payload.data.match(self.state.commandregex);
      var cmds = self.state.commands;
    }

    if (!match)
      return;

    var index = self.state.commandtokeymap[match[1]];
    cmds[index].cb(arg, payload);
  });

  self.assembleRegex = function(commands) {
    var d = [];
    for (var command in commands) {
      if (!commands.hasOwnProperty(command))
        continue;

      d.push(command);
    };

    return new RegExp("^!(" + d.join("|") + ")", "i");
  };

  core.on("cmd.*", function(cb) {
    var command = this.event.substr(4);

    self.state.commands[command] = {
      cb: cb
    };

    // insert all of the possible commands we can match at, so that
    // it is easy to look up the original command we store the callback under
    var parts = command.split("|");
    for (var i = parts.length - 1; i >= 0; i--) {
      self.state.commandtokeymap[parts[i]] = command;
    };

    // update the regex we use to check for commands
    self.state.commandregex = self.assembleRegex(self.state.commands);
  });

  // convenience function for handling !commands that should be ratelimited
  // the users of the function need to core.emit("ratelimit.!command", cb, cooldown)
  // instead of listening on the event, the cb will be called as appropriate
  core.on("cmdratelimit.*", function(cb, cooldown) {
    var command = this.event.substr(13);

    if (!self.state.ratelimit[command])
      self.state.ratelimit[command] = {
        lastused: 0
      };

    self.state.ratelimit[command].cb = function(arg, payload) {
      var now = Date.now();
      var s = self.state.ratelimit[command];
      if (now - s.lastused < cooldown)
        return;

      s.lastused = now;
      cb(arg, payload)
    };

    var parts = command.split("|");
    for (var i = parts.length - 1; i >= 0; i--) {
      self.state.commandtokeymap[parts[i]] = command;
    };

    self.state.ratelimitregex = self.assembleRegex(self.state.ratelimit);
  });
};

module.exports = {
  init: p,
  state: {
    commandregex: null,
    commandtokeymap: {},
    commands: {}, // an object to be able to always generate the regex
    ratelimitregex: null,
    ratelimit: {} // an object because we want to persist and re-use the lastused timestamp
  }
};
