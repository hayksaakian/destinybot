var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.config = config;
  this.state = state;

  self.core.on("!givemeblt", function(arg, payload) {
    self.core.say("/me gives a juicy BLT to " + payload.nick);
  });

  self.core.emit("ratelimit.!givemeclub", function(arg, payload) {
    self.core.say("/me gives a fresh Turkey Club to " + payload.nick);
  }, 5 * 1000);
};

module.exports = {
  init: p
};
