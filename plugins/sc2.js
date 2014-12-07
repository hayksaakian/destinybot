var request = require("request")
var moment = require("moment")

var default_config = {
  endpoint: "http://us.battle.net/api/sc2/profile/310150/1/Destiny/matches",
  human_endpoint: "http://us.battle.net/sc2/en/profile/310150/1/Destiny/",
  cooldown: 1000 * 60 * 2 // 2 minutes
}

var default_state = {
  lastcheck: 0,
  lastresult: ''
}

var p = function(core, config, state) {
  var self = this
  this.core = core
  this.config = config
  this.state = state

  self.cb = function(arg, payload) {
    var now = Date.now()
    if (state.lastresult && now - state.lastcheck < config.cooldown) {
      self.core.say(state.lastresult)
      return
    }

    request.get({
      url: config.endpoint,
      json: true
    }, function(error, response, data) {
      if (error || response.statusCode !== 200) {
        self.core.log("HTTP error in SC2 Plugin SoSad ", error)
        return
      }

      var result = data['matches'][0]
      var winorloss = result['decision'].toLowerCase()
      if (winorloss == "loss")
        winorloss = "lost"
      if (winorloss == "win")
        winorloss = "won"
      var solomulti = result['type'].toLowerCase()
      var map = result["map"]
      var when = moment.unix(result['date']).fromNow()
      var output = "Destiny " + winorloss + " a " + solomulti + " game on " + map + " " + when + ". " + config.human_endpoint
      state.lastcheck = now
      state.lastresult = output
      self.core.say(output)
    })
  }

  self.core.on("!sc2", self.cb)
  self.core.on("!sc", self.cb)
  self.core.on("!starcraft", self.cb)
  self.core.on("!starcraft2", self.cb)
  self.core.on("!infestiny", self.cb)
  self.core.on("!abathur", self.cb)
}

module.exports = {
  init: p,
  config: default_config,
  state: default_state,
}
