var WebSocket = require("ws");

var p = function(core, config, state) {
  var self    = this;
  this.core   = core;
  this.config = config;
  this.state  = state;
  this.ws     = null;
  this.patterns = [];

  if (!config.apikey)
    throw "No API key specified, dying";

  if (!config.url)
    throw "No chat server url specified, dying";

  // provide convenience function to send shit
  core.send = function(action, payload) {
    core.emit("send." + action, payload);
  };
  // support DANKMEMES
  core.original_on = core.on;
  // converting regex -> string -> same regex:
  // var x = /regex/gim; 
  // y = new RegExp(x.source,x.toString().split('/').pop());
  // y.toString() == x.toString()

  core.on = function (pattern, callback) {
    if(pattern instanceof RegExp){
      // regex is slow
      // regex.text(message.data) must be true
      // to get the callback
      self.patterns.push([pattern, callback])
      core.original_on(pattern.toString(), callback)
    }else if(pattern instanceof Function){
      // function calls are even slower
      // pattern(message) must be true 
      // to get the callback
      pattern.uid = Math.random().toString()
      pattern.uid = pattern.uid.substr(2, pattern.uid.length)
      self.patterns.push([pattern, callback])
      core.original_on(pattern.uid, callback)
    }else{
      // strings are fast!
      core.original_on.apply(core, arguments)
    }
  }

  core.say = function (text) {
    core.send("MSG", {data: text})
  };

  core.on("send.*", function() {
    var _args = []
    for(var key in arguments){
      _args.push(arguments[key]);
    }
    var trueevent = this.event.substr(5)
    _args.unshift(trueevent)
    arguments = {}
    for (var i = 0; i < _args.length; i++) {
      arguments[i.toString()] = _args[i]
    };
    self.marshal.apply(self, _args);
  });
  core.on("connect", function() {
    self.init.apply(self);
  });
  core.on("disconnect", function() {
    if (!self.ws)
      return;

    self.ws.terminate();
    self.ws = null;
  });

  // default ping handler
  core.on("PING", function(payload) {
    self.core.emit("send.PING", payload);
  });
  core.on("ERR", function(payload) {
    console.log("CHAT ERROR", payload)
  });

  // convenience function for !commands
  core.on("MSG", function(payload) {
    var command = null;
    var arg     = null;
    if (payload.data.indexOf('!') === 0){
      var pos     = payload.data.indexOf(' ');
      if (pos < 0) // just a single command, no arguments
        command = payload.data;
      else {
        command = payload.data.substr(0, pos);
        // let the user of the command decide how they want to parse the arg
        // they can split it up after de-duplicating the spaces themselves, etc...
        arg     = payload.data.substr(pos + 1);
      }

      core.emit(command, arg, payload);
    }else{
      for (var i = self.patterns.length - 1; i >= 0; i--) {
        var pattern = self.patterns[i][0];
        var cb = self.patterns[i][1];
        if (pattern instanceof RegExp) {
          if(pattern.test(payload.data)){
            core.emit(pattern.toString(), arg, payload)
          }
        }else if(pattern instanceof Function){
          if(pattern(payload)){
            core.emit(pattern.uid, arg, payload)
          }
        }
      };
    }
  });

  self.init.apply(self);
};

p.prototype.init = function() {
  var self = this;
  if (this.ws)
    self.core.emit("disconnect");

  this.patterns = []
  this.ws = new WebSocket(this.config.url, {
    origin: "*",
    headers: {
      "Cookie": "authtoken=" + this.config.apikey + ";"
    }
  });

  this.ws.on("open", function() {
    self.core.log("Protocol: Connected");
    self.core.emit("connected");
  });
  this.ws.on("close", function(code, message) {
    self.core.log("Protocol: Disconnected with code: ", code, " msg: ", message);
    self.core.emit("disconnected");
  });
  this.ws.on("error", function(e) {
    self.core.log("Protocol: Error received: ", e);
  });
  this.ws.on("message", function() {
    self.route.apply(self, arguments);
  });
};

p.prototype.route = function(message, flags) {
  console.log(message)
  // console.log(flags)
  if (flags.binary)
    throw "Binary messages are not supported";

  var self    = this;
  var action  = null;
  var payload = null;
  var pos     = message.indexOf(" ");

  if (pos < 0) // no space => the whole message is an action
    action = message;
  else {
    action = message.substr(0, pos);
    if (action === 'PING') { // handle it inline, 64bit ints cannot be parsed
      console.log("PONG " + message.substr(pos + 1))
      self.ws.send("PONG " + message.substr(pos + 1));
      return;
    }

    payload = JSON.parse(message.substr(pos + 1));
  }

  self.core.emit(action, payload);
};

p.prototype.marshal = function(e) {
  var self = this;
  // TODO: fix this to do whatever sztanpet actually intended
  // this is just a temporary hack that makes the bot work:
  self.core.log(arguments);
  self.ws.send(arguments['0'] +' '+ JSON.stringify(arguments['1']));
};

module.exports = {
  init: p,
  config: {
    apikey: "",
    url: "ws://destiny.gg:9998/ws"
  }
};
