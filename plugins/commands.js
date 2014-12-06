// plugin to handle the dispatching of !commands, incredibly simple right now
var p = function(core, config, state) {
  var self    = this;
  this.core   = core;

  // convenience function for !commands
  // currently it is not a prefix match, it only matches the proper, full command
  core.on("MSG", function(payload) {
    if (payload.data.indexOf("!") !== 0)
      return;

    var pos     = payload.data.indexOf(" ");
    var command = null;
    var arg     = null;
    if (pos < 0) // just a single command, no arguments
      command = payload.data;
    else {
      command = payload.data.substr(0, pos);
      // let the user of the command decide how they want to parse the arg
      // they can split it up after de-duplicating the spaces themselves, etc...
      arg     = payload.data.substr(pos + 1);
    }

    core.emit(command, arg, payload);
  });
};

module.exports = {init: p};
