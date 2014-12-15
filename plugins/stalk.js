// !stalk x nick 
// to get the last x messages said by nick
var request = require("request")
var moment = require("moment")
require("moment-duration-format")

var default_config = {
  ratelimit: 1000 * 30,
  maxmessages: 3
}

var default_state = {
  lastused: 0,
  messages: {}
}

var p = function(core, config, state) {
  var self = this
  this.core = core
  this.config = config
  this.state = state

  self.cb = function(arg, payload) {
    var now = moment().utc().valueOf()
    if (now - state.lastused < config.ratelimit)
      return;

    var match = payload.data.match(/^!stalk[^\d]*?(\d?)\W+?([a-z0-9]+)$/i)
    if (!match) {
      self.core.say("Invalid usage of !stalk, example: !stalk 3 Destiny or just !stalk Destiny")
      return
    }

    // clamp the number of lines between 1 and maxmessages
    var numlines = Math.min(Math.max(parseInt(match[1], 10) || 1, 1), config.maxmessages)
    var nick = match[2].toLowerCase()
    if (!self.state.messages[nick]) {
      self.core.say("No logs found for " + nick)
      return
    }

    var lines = self.state.messages[nick]
    lines = lines.slice(lines.length - numlines, lines.length)

    for (var i = 0; i < lines.length; i++) {
      if (i === 0)
        var when = "[" + moment.duration(now - lines[i].timestamp, "milliseconds").format("d[d]h[h]m[m] ago] ")
      else
        var when = "[+" + moment.duration(lines[i].timestamp - lines[i - 1].timestamp, "milliseconds").format("d[d]h[h]m[m]s[s]] ")

      self.core.say(when + nick + ": " + lines[i].data)
    }

    state.lastused = now;
  }

  self.core.emit("cmd.stalk", self.cb)

  // log all messages
  self.core.on("MSG", function(payload) {
    var nick = payload.nick.toLowerCase()
    var msgs = self.state.messages

    if (!msgs[nick])
      msgs[nick] = []

    // a new object with only select data to cut down on the amount of data we
    // need to store
    msgs[nick].push({
      timestamp: payload.timestamp,
      data: payload.data
    })

    while (msgs[nick].length > self.config.maxmessages)
      msgs[nick].shift(0)

  })
}

module.exports = {
  init: p,
  config: default_config,
  state: default_state,
}
