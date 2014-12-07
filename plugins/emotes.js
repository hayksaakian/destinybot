var request = require("request");

var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.config = config;
  this.state = state;

  self.core.on("MSG", function(payload) {
    var match = payload.data.match(self.state.regex);
    if (!match || match.length < 6)
      return;

    self.core.emit("penalize.minor", payload.nick, "facespam");
  });

  self.core.on("ratelimit.!emotes", function(arg, payload) {
    self.core.say(payload.nick + ": /emotes or see " + config.linkurl + " also, don't forget that we have tab-autocomplete for emotes");
  }, config.ratelimit);

  self.compileRegex = function() {
    var self = this;
    self.state.regex = new RegExp('(?:^|[\\s,\\.\\?!])(' + self.state.emoticons.join('|') + ')(?=$|[\\s,\\.\\?!])', 'gm');
  }.bind(self);

  self.refreshEmotes = function() {
    request({
      url: self.config.fetchurl,
      json: true
    }, function(err, response, data) {
      if (err || response.statusCode !== 200) {
        self.core.log("Emotes - could not get emotes, err: ", err, " code: ", response.statusCode);
        return;
      }

      if (!data || !data.length) {
        self.core.log("Emotes - data empty or not an array? ", data);
        return;
      }

      self.state.emotes = data;
      self.compileRegex();
    });
  }.bind(self);

  // refresh emotes every two minutes
  setInterval(self.refreshEmotes, 2 * 60 * 1000);
};

module.exports = {
  init: p,
  config: {
    fetchurl: 'http://www.destiny.gg/chat/emotes.json',
    linkurl: 'destiny.gg/emotes',
    ratelimit: 30 * 1000
  },
  state: {
    emotes: [
      "Dravewin", "INFESTINY", "FIDGETLOL", "Hhhehhehe", "GameOfThrows",
      "WORTH", "FeedNathan", "Abathur", "LUL", "Heimerdonger", "SoSad",
      "DURRSTINY", "SURPRISE", "NoTears", "OverRustle", "DuckerZ", "Kappa",
      "Klappa", "DappaKappa", "BibleThump", "AngelThump", "FrankerZ",
      "BasedGod", "TooSpicy", "OhKrappa", "SoDoge", "WhoahDude",
      "MotherFuckinGame", "DaFeels", "UWOTM8", "CallCatz", "CallChad",
      "DatGeoff", "Disgustiny", "FerretLOL", "Sippy", "DestiSenpaii", "KINGSLY",
      "Nappa", "DAFUK", "AYYYLMAO", "DANKMEMES", "MLADY", "SOTRIGGERED"
    ]
  }
};
