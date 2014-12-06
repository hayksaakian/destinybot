var WebSocket = require("ws");

var p = function(core, config, state) {
  var self    = this;
  this.core   = core;
  this.config = config;
  this.state  = state;
  this.ws     = null;

  if (!config.apikey)
    throw "No API key specified in config/protocol.json";

  if (!config.url)
    throw "No chat server url specified in config/protocol.json";

  // provide convenience function to send shit
  core.send = function(action, payload) {
    core.emit("send." + action, payload);
  };

  core.on("send.*", function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.event.substr(5))
    self.marshal.apply(self, args);
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

  // convenience function for !commands
  core.on("MSG", function(payload) {
    if (payload.data.indexOf("!") !== 0)
      return;

    var pos     = payload.data.indexOf(" ");
    var command = null;
    var arg     = null;
    if (pos < 0) // just a single command, no arguments
      command = payload.data;
    else {
      command = payload.data.substr(0, pos);
      // let the user of the command decide how they want to parse the arg
      // they can split it up after de-duplicating the spaces themselves, etc...
      arg     = payload.data.substr(pos + 1);
    }

    core.emit(command, arg, payload);
  });

  self.init.apply(self);
};

p.prototype.init = function() {
  var self = this;
  if (this.ws)
    self.core.emit("disconnect");

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
    if (action === "PING") { // handle it inline, 64bit ints cannot be parsed
      self.ws.send("PONG " + message.substr(pos + 1));
      return;
    }

    payload = JSON.parse(message.substr(pos + 1));
  }

  self.core.emit(action, payload);
};

p.prototype.marshal = function(action, payload) {
  var self = this;
  if (!self.ws)
    return;

  self.ws.send(action + " " + JSON.stringify(payload));
};

module.exports = {
  init: p,
  config: {
    apikey: "",
    url: "ws://destiny.gg:9998/ws"
  }
};
