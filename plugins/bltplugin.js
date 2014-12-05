var p = function(core, config, state) {
  var self    = this;
  this.core   = core;
  this.config = config;
  this.state  = state;

  self.core.on("!givemeblt", function(arg, payload) {
    self.core.send("MSG", {data: "/me gives a juicy BLT to " + payload.nick});
  });
};

module.exports = {init: p};
