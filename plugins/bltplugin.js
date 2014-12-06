var p = function(core, config, state) {
  var self    = this;
  this.core   = core;
  this.config = config;
  this.state  = state;

  self.core.on("!givemeblt", function (arg, payload) {
    self.core.send("MSG", {data: "/me gives a juicy BLT to " + payload.nick});
  });
  // abstraction breaking is possible
  self.core.on("MSG", function (message) {
    var text = message.data
    if(text.indexOf('OverRustle') !== -1 && text.indexOf('BasedGod') !== -1 && text.indexOf('NoTears') !== -1){
      self.core.say("Hhhehhehe")
    }
  });
  // you can use regexes but you should prefer not to
  // because they will be ran against every message data (text)
  self.core.on(/deliver a blt/i, function (arg, message) {
    var text = message.data.toLowerCase();
    var to = text.match(/\bto\s+\S+/i)
    var from = text.match(/\bfrom\s+\S+/i)
    if(to){
      to = to[0].split(' ')[1]    
      if(from){
        from = from[0].split(' ')[1]
        self.core.say("/me delivers "+message.nick+"\'s tastey BLT to "+to+" on "+from+"\'s behalf")
      }else{
        self.core.say("/me delivers "+message.nick+"\'s tastey BLT to "+to)
      }
    }
  })
  // testing with functions works too. 
  // just make sure to return true if you want to actually process the message
  self.core.on(function (message_obj) {
    if (message_obj.data.indexOf("secret password") !== -1 && ((message_obj.nick.indexOf('e') !== -1 && message_obj.nick.indexOf('a') !== -1) || message_obj.data.indexOf('hunter2') !== -1) )  {
      return true;
    }
  }, function (arg, message_obj) {
    self.core.say("/me gives a secret BLT with extra secret sauce to "+message_obj.nick);
  })
};

module.exports = {init: p};
