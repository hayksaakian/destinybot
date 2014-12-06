var p = function(core, config, state) {
  var self    = this;
  this.core   = core;
  this.config = config;
  this.state  = state;

  self.core.on("!givemeblt", function(arg, payload) {
    self.core.ay("/me gives a juicy BLT to " + payload.nick);
  });

  self.core.on("!givemeclub", function(arg, payload) {
    self.core.say("/me gives a fresh Turkey Club to " + payload.nick);
  });
};

module.exports = {init: p};
