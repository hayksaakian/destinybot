var request = require("request")
var moment = require("moment")
var querystring = require("querystring")

var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.config = config;
  this.state = state;

  if (!config.apiparams.user)
    throw "No user specified in config/song.json";

  if (!config.apiparams.api_key)
    throw "No API key specified in config/song.json, Get a key from last.fm/api";

  var endpointurl = config.apiurl + '?' + querystring.stringify(config.apiparams);

  self.cb = function(arg, payload) {
    if (state.lastresult && moment().diff(moment(state.lastcheck)) < config.cooldown) {
      self.core.say(state.lastresult)
      return
    }

    request({
      url: endpointurl,
      json: true
    }, function(error, response, data) {
      if (error || response.statusCode !== 200) {
        self.core.say('Song API timed out. DaFeels');
        return
      }

      if (!data.recenttracks.track['@attr']) {
        var lastPlayed = moment.unix(data.recenttracks.track['date']['uts']).fromNow();
        var output = 'No song played/scrobbled. ' + lastPlayed + ': ' + data.recenttracks.track['artist']['#text'] + ' - ' + data.recenttracks.track['name'];
      } else {
        var output = data.recenttracks.track['artist']['#text'] + ' - ' + data.recenttracks.track['name'];
      }

      state.lastcheck = new Date()
      state.lastresult = output
      self.core.say(output)
    })
  }

  self.core.on("!song", self.cb)
  self.core.on("!music", self.cb)
  self.core.on("!playlist", function(arg, payload) {
    self.core.say("Playlist at last.fm/user/StevenBonnellII");
  });

};

module.exports = {
  init: p,
  config: {
    cooldown: 1000 * 60 * 2, // cache for 2 minutes
    apiurl: 'http://ws.audioscrobbler.com/2.0/',
    apiparams: {
      user: 'StevenBonnellII',
      api_key: '',
      method: 'user.getrecenttracks',
      format: 'json',
      limit: '1'
    }
  },
  state: {
    lastcheck: new Date('2014-01-01'),
    lastresult: null
  }
};
