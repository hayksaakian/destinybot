var WebSocket = require("ws");

var p = function(core, config, state) {
  var self = this;
  this.core = core;
  this.config = config;
  this.state = state;
  this.ws = null;

  if (!config.apikey)
    throw "No API key specified in config/protocol.json";

  if (!config.url)
    throw "No chat server url specified in config/protocol.json";

  // the "standard", generic way we handle the sending of anything
  core.on("send.*", function() {
    // have to convert arguments into a proper array, so that .unshift works on it
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.event.substr(5));
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

  var self = this;
  var action = null;
  var payload = null;
  var pos = message.indexOf(" ");

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
