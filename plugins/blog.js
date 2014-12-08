var FeedParser = require('feedparser')
var request = require('request');
var moment = require("moment");

var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.config = config;
  this.state = state;

  self.cb = function(arg, payload) {
    var now = Date.now();
    if (state.lastresult && now - state.lastcheck < config.cooldown) {
      self.core.say(state.lastresult);
      return;
    }
    self.update(true);
  }

  self.update = function(userrequest) {
    var req = request(config.feedurl);
    var feedparser = new FeedParser();
    var announcement = null;
    var guid = null

    req.on('error', function(error) {
      if (state.lastresult && userrequest)
        self.core.say(state.lastresult);

      self.core.log("blog.js: " + error);
    });

    req.on('response', function(res) {
      var stream = this;
      if (res.statusCode != 200)
        return this.emit('error', new Error('Bad status code'));

      stream.pipe(feedparser);
    });

    feedparser.on('error', function(error) {
      self.core.log("blog.js error: ", error);
    });

    feedparser.on('readable', function() {
      if (announcement) // only interested in the first post
        return;

      var item = this.read();
      announcement = '"' + item.title + '" posted ' + moment(item.date).fromNow() + " " + item.link;
      guid = item.guid;
    });

    feedparser.on('end', function() {
      if (!blogpost || (!userrequest && guid === state.lastguid))
        return;

      state.lastresult = announcement;
      state.lastcheck = Date.now();
      state.lastguid = guid;
      //for new blogposts always answer
      if (guid !== state.lastguid)
        self.core.say("New blogpost: " + state.lastresult);
      else
        self.core.say(state.lastresult);
    });
  }

  self.core.emit("ratelimit.!blog", self.cb, self.config.ratelimit);
  self.core.emit("ratelimit.!bloggerino", self.cb, self.config.ratelimit);

  setInterval(function() {
    self.update(false);
  }, config.checktime);

};

module.exports = {
  init: p,
  config: {
    feedurl: 'http://blog.destiny.gg/feed/',
    cooldown: 1000 * 60 * 2, // cache for 2 minutes
    ratelimit: 1000 * 30,
    checktime: 1000 * 60 // check for new blogposts every minute
  },
  state: {
    lastcheck: 0,
    lastresult: '',
    lastguid: ''
  }
};
