var extend = require("extend");

var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.config = config;
  this.state = state;

  self.core.on("penalize.minor", function(nick, reason) {
    self.penalize("minor", nick, reason);
  });

  self.core.on("penalize.major", function(nick, reason) {
    self.penalize("major", nick, reason);
  });

  self.core.on("penalize.mute", function(nick, duration, reason) {
    self.core.send("MUTE", {
      duration: duration * 1000000, // the chat server deals with nanoseconds, so multiply it up
      data: nick
    });

    // format the duration as a timestamp, in the simplest way possible
    var time = "";
    var days = Math.floor(duration / (24 * 60 * 60 * 1000));
    if (days > 0) {
      time += days + " days ";
      duration -= days * 24 * 60 * 60 * 1000;
    }

    var hours = Math.floor(duration / (60 * 60 * 1000));
    if (hours > 0) {
      time += hours + "h ";
      duration -= hours * 60 * 60 * 1000;
    }

    var minutes = Math.floor(duration / (60 * 1000));
    if (minutes > 0)
      time = time + minutes + "m";

    time = time.trim();
    self.core.say(time + " " + nick + ": " + reason);
  });

  self.core.on("penalize.unmute", function(nick) {
    self.core.send("UNMUTE", {
      data: nick
    });
  });

  self.penalize = function(type, nick, reason) {
    var now = Date.now();
    var settings = config[type];
    var record = {
      score: 0,
      lastinfraction: 0,
      numberofinfractions: 0
    };

    if (state.nicks[nick])
      record = extend(record, state.nicks[nick]);

    record.lastinfraction = now;
    record.numberofinfractions += 1;

    if (!record.score)
      record.score = settings.def;
    else
      record.score = record.score * settings.mul;

    state.nicks[nick] = record;
    self.core.emit("penalize.mute", nick, record.score, reason);
  };

  self.decayScores = function(penalties, settings) {
    var now = Date.now();
    for (var nick in penalties) {
      if (!penalties.hasOwnProperty(nick))
        continue;

      var record = penalties[nick];
      if (!record.score || now - record.lastinfraction < settings.decayafter)
        return;

      // add it back, so that we can decrease it again after decayafter time passes
      record.lastinfraction = now;
      record.score = Math.round(record.score / settings.decayby);
      if (record.score <= settings.def)
        record.score = 0;

    };
  }.bind(self);

  setInterval(function() {
    self.decayScores(state.minor, config.minor);
    self.decayScores(state.major, config.major);
  }, 60 * 1000);
};

module.exports = {
  init: p,
  config,
  {
    minor: {
      def: 60 * 1000, // default 1 minute mute
      mul: 5, // every other infraction will multiply it by this much
      decayafter: 60 * 60 * 1000, // penalties start decaying after an hour
      decayby: 5 // the number of miliseconds is divided by this number after decaying
    },
    major: {
      def: 5 * 60 * 1000, // 5 min
      mul: 5,
      decayafter: 24 * 60 * 60 * 1000, // 24h
      decayby: 5
    }
  },
  state: {
    minor: {},
    major: {}
  }
};
