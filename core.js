var events = require("eventemitter2"),
    util   = require("util"),
    fs     = require("fs"),
    jf     = require("jsonfile"),
    extend = require("extend");

var isJS = /^([a-z0-9]+)\.js$/i;
var c = function() {
  events.EventEmitter2.call(this, {
    wildcard: true,
    delimeter: ".",
    newListener: false,
    maxListeners: 48
  });

  var self     = this;
  // object, keyed by the name of the plugin, value is the instantiated plugin
  this.plugins = {};

  // object, keyed by the name of the plugin, value is the state of the plugin
  this.state   = {};

  var files    = fs.readdirSync("plugins");
  for (var i = files.length - 1; i >= 0; i--) {
    var file  = files[i],
        match = file.match(isJS);

    if (!match)
      continue;

    var name   = match[1];
    var plugin = require("./plugins/" + file);

    /*
     * Plugins are expected to export an object with three members:
     *   - init, a function taking three arguments, the first is the core
     *     the second is the config, the third is the state
     *     this is mandatory
     *
     *   - config, an object that represents the default config for the plugin
     *     this is optional, if the plugin needs an API key to function for example
     *     this is where we copy the file into the config/nameofplugin.json file
     *     and that is where the user should customize it
     *
     *   - state, an object representing the default state for the plugin
     *     this is optional, used for example storing banned links, anything
     *     that needs to be persisted
     *
     */
    var defaultconfig = plugin.config || {};
    var confpath      = "./config/" + name + ".json";
    var config        = fs.existsSync(confpath) ? jf.readFileSync(confpath) : defaultconfig;
    config            = extend(defaultconfig, config);

    /*
     * Pass the state, plugins should only modify the state, never override it
     * because it is meant to be a reference, the core periodically saves
     * the state it has a reference to
     * TLDR; no state = {}, but yes state.justmodifying = ['foo']
     *       AKA only ever just using the state that we pass
     *
     */
    var defaultstate = plugin.state || {};
    var statepath    = "./.state/" + name + ".json";
    var state        = fs.existsSync(statepath) ? jf.readFileSync(statepath) : defaultstate;
    state            = extend(defaultstate, state);

    this.plugins[name] = new plugin.init(this, config, state);
    this.state[name]   = state;
  };

  this.on("save", function(name) {
    if (name && self.plugins[name])
      return saveState(name, this.state[name]);

    for (var name in self.state) {
      if (!self.state.hasOwnProperty(name))
        continue;

      saveState(name, self.state[name]);
    };
  });

  // expose a logging function
  this.log = util.log; // TODO make it "better"
  // expose a convenience function for the most used action
  this.say = function(text) {
    self.send("MSG", {data: text})
  };
  // decouple how the protocol expects its events with this function
  // any new protocol needs to handle sending of messages this way
  this.send = function(action, payload) {
    self.emit("send." + action, payload);
  };
};

var saveState = function(name, state) {
  // do not save the state if the state is empty or falsey
  if (!state || !Object.keys(state).length)
    return;

  var statepath = "./.state/" + name + ".json";
  var temppath  = statepath + '.temp';
  jf.writeFileSync(temppath, state);
  fs.renameSync(temppath, statepath);
};

util.inherits(c, events.EventEmitter2);

module.exports = {init: c};
