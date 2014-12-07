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
    var now = Date.now()
    if (state.lastresult && now - state.lastcheck < config.cooldown) {
      self.core.say(state.lastresult)
      return
    }

    request({
      url: endpointurl,
      json: true
    }, function(error, response, data) {
      if (error || response.statusCode !== 200) {
        self.core.log('Song API timed out. DaFeels');
        return
      }

      if (!data.recenttracks.track['@attr']) {
        var lastPlayed = moment.unix(data.recenttracks.track['date']['uts']).fromNow();
        var output = 'No song played/scrobbled. ' + lastPlayed + ': ' + data.recenttracks.track['artist']['#text'] + ' - ' + data.recenttracks.track['name'];
      } else {
        var output = data.recenttracks.track['artist']['#text'] + ' - ' + data.recenttracks.track['name'];
      }

      state.lastcheck = now
      state.lastresult = output
      self.core.say(output)
    })
  }

  self.core.on("ratelimit.!song", self.cb, config.ratelimit)
  self.core.on("ratelimit.!music", self.cb, config.ratelimit)
  self.core.on("ratelimit.!playlist", function(arg, payload) {
    self.core.say("Playlist at last.fm/user/StevenBonnellII");
  }, config.ratelimit);

};

module.exports = {
  init: p,
  config: {
    cooldown: 1000 * 60 * 2, // cache for 2 minutes
    ratelimit: 1000 * 30,
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
    lastcheck: 0,
    lastresult: null
  }
};
