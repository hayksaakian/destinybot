var request = require("request")
var qs = require("querystring")
var moment = require("moment")

var default_config = {
  endpoint: "https://www.googleapis.com/youtube/v3/activities",
  queryparams: {
    // sign up for google apis
    // enable the youtube api
    // get a 'public api key' from the google developer console
    // this key is not specific to youtube, in case you were confused
    part: "snippet,contentDetails",
    key: "",
    channelId: "UC554eY5jNUfDq3yDOJYirOQ"
  },
  human_endpoint: "http://youtube.com/destiny",
  cooldown: 1000 * 60 * 2, // 2 minutes
  checktime: 1000 ** 60 * 4,
  ratelimit: 1000 * 30
}

var default_state = {
  lastcheck: 0,
  lastvideo: null,
  lastresult: ''
}

var p = function(core, config, state) {
  var self = this
  this.core = core
  this.config = config
  this.state = state

  self.url = self.config.endpoint + '?' + qs.stringify(self.config.queryparams)

  self.update = function(manual) {
    request.get({
      url: self.url,
      json: true
    }, function(error, response, data) {
      if (error || response.statusCode !== 200) {
        self.core.log("HTTP error in Youtube Plugin SoSad ", error)
        return
      }
      var video = null
      for (var i = 0; i < data.items.length; i++) {
        video = data.items[i];
        if (video.snippet.type !== "upload")
          continue
        if (!self.state.lastvideo || self.state.lastvideo.id !== video.id) {
          self.state.lastvideo = video
          video = null
        }
        // break after the newest genuine video
        break
      }
      // don't do anything we got the same video with an automatic check
      if (video && !manual)
        return;

      video = self.state.lastvideo

      var output = '"' + video.snippet.title + '"' + " posted " + moment(video.snippet.publishedAt).fromNow() + " youtube.com/watch/" + video.contentDetails.upload.videoId
      self.state.lastcheck = now
      self.state.lastresult = output
      self.core.say(output)
    })
  }

  self.cb = function(arg, payload) {
    var now = Date.now()
    if (state.lastresult && now - state.lastcheck < config.cooldown) {
      self.core.say(state.lastresult)
      return
    }

    self.update(true)
  }

  self.core.emit("ratelimit.!youtube", self.cb, config.ratelimit)
  self.core.emit("ratelimit.!yt", self.cb, config.ratelimit)
  self.core.emit("ratelimit.!video", self.cb, config.ratelimit)

  setInterval(self.update, self.config.checktime)
}

module.exports = {
  init: p,
  config: default_config,
  state: default_state,
}
