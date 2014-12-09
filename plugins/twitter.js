var Twitter = require("node-twitter")
var moment = require("moment")
require("moment-duration-format")
var ent = require("ent")

var default_config = {
  // get oauth keys from:
  // https://apps.twitter.com
  oauth_data: {
    consumer_key: "",
    consumer_secret: "",
    access_token: "",
    access_token_secret: ""
  },
  twitter_handles: ["steven_bonnell"],
  // you also need to use a twitter ID, not a twitter name
  // gettwtitterid.com
  twitter_ids: ["354943567"],
  // 2 minutes
  cooldown: 1000 * 60 * 2,
  ratelimit: 1000 * 30
}

var default_state = {
  lastcheck: 0,
  lasttweet: null
}

var p = function(core, config, state) {
  var self = this
  this.core = core
  this.config = config
  this.state = state

  self.printTweet = function(tweet) {
    // turn t.co urls into real urls
    for (var i = tweet.entities.urls.length - 1; i >= 0; i--) {
      var urlobj = tweet.entities.urls[i]
      if (tweet.text.indexOf(urlobj.url) !== -1) {
        tweet.text = tweet.text.replace(urlobj.url, urlobj.display_url)
      }
    }
    var output = ent.decode(tweet.text) + " | follow at twitter.com/" + tweet.user.screen_name

    var dt = moment().diff(moment(tweet.created_at))
    if (dt < 5000) {
      return "New Tweet: " + output
    } else {
      return "Tweet from " + moment.duration(dt, 'milliseconds').format("d[d]h[h]m[m] ago") + ": " + output
    }
  }

  self.getMostRecent = function(cb) {
    return self.tr.search({
      'q': 'from:' + self.config.twitter_handles.join(', OR from:')
    }, function(e, result) {
      if (e) {
        console.log("Twitter", "REST error: " + (e.code ? e.code + ' ' : '') + e.message)
        return
      }
      self.state.lasttweet = result.statuses[0]
      self.state.lastcheck = new Date()
      if (typeof cb === Function)
        cb(self.state.lasttweet)
    })
  }

  self.cb = function(arg, payload) {
    self.core.say(self.printTweet(self.state.lasttweet))
  }

  // use a RESTful search client to get tweets on demand
  self.tr = new Twitter.SearchClient(
    self.config.oauth_data.consumer_key,
    self.config.oauth_data.consumer_secret,
    self.config.oauth_data.access_token,
    self.config.oauth_data.access_token_secret
  )

  // start a long polling request
  // on the streaming api to get tweets as they're published
  self.ts = new Twitter.StreamClient(
    self.config.oauth_data.consumer_key,
    self.config.oauth_data.consumer_secret,
    self.config.oauth_data.access_token,
    self.config.oauth_data.access_token_secret
  )

  self.ts.on('tweet', function(tweet) {
    // filter out @replies
    if (self.config.twitter_ids.indexOf(tweet.user.id_str) == -1)
      return
    self.state.lasttweet = tweet
    self.core.say(self.printTweet(tweet))
  })
  self.ts.on('close', function() {
    console.log('Twitter', 'Connection closed.')
  })
  self.ts.on('end', function() {
    console.log('Twitter', 'End of stream, no more tweets?')
  })
  self.ts.on('error', function(error) {
      console.log('Twitter', 'Error: ' + (error.code ? error.code + ' ' : '') + error.message)
    })
    // arguments are: keywords, locations, users, count, callback
  self.ts.start(null, null, self.config.twitter_ids)
    // cache the newest tweet on startup:
    // this handles the corner case where we have an 
    // exceptionally old tweet, or no tweet, 
    // because the bot has been off
    // missing updates from the streaming API
  self.getMostRecent()

  self.core.emit("ratelimit.!twitter", self.cb, config.ratelimit)
  self.core.emit("ratelimit.!tweet", self.cb, config.ratelimit)
}

module.exports = {
  init: p,
  config: default_config,
  state: default_state,
}
