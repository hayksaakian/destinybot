// plugin to handle the dispatching of !commands, incredibly simple right now
var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.state = state;

  // convenience function for !commands
  // currently it is not a prefix match, it only matches the proper, full command
  core.on("MSG", function(payload) {
    if (payload.data.indexOf("!") !== 0)
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

    core.emit(command, arg, payload);
  });

  // convenience function for handling !commands that should be ratelimited
  // the users of the function need to core.emit("ratelimit.!command", cb, cooldown)
  // instead of listening on the event, the cb will be called as appropriate
  core.on("ratelimit.*", function(cb, cooldown) {
    var command = this.event.substr(10);

    if (command.indexOf("!") !== 0)
      throw new Error("Not a !command passed to the ratelimit. event");

    if (!self.state.ratelimit[command])
      self.state.ratelimit[command] = {
        lastused: 0
      };

    core.on(command, function(arg, payload) {
      var now = Date.now();
      var s = self.state.ratelimit[command];
      if (now - s.lastused < cooldown)
        return;

      s.lastused = now;
      cb(arg, payload)
    });
  });
};

module.exports = {
  init: p,
  state: {
    ratelimit: {}
  }
};
