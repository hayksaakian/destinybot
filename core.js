var events = require("events"),
    util   = require("util"),
    fs     = require("fs"),
    jf     = require("jsonfile");

var isJS = /^([a-z]+)\.js$/i;
var c = function() {
  events.EventEmitter.call(this);

  this.plugins = {};
  this.state   = {};

  var files    = fs.readdirSync('plugins');
  for (var i = files.length - 1; i >= 0; i--) {
    var file  = files[i],
        match = file.match(isJS);

    if (!match)
      continue;

    var name   = match[1];
    var plugin = require('./plugins/' + file);

    /*
     * Plugins are expected to export an object with three members:
     *   - init, a function taking three arguments, the first is the core
     *     the second is the config, the third is the state
     *     this is mandatory
     *
     *   - config, an object that represents the default config for the plugin
     *     this is optional
     *
     *   - state, an object represeting the default state for the plugin
     *     this is optional
     *
     */
    var defaultconfig = plugin.config || {};
    var confpath      = './config/' + name + '.json';
    var config        = fs.existsSync(confpath)? jf.readFileSync(confpath): defaultconfig;

    /*
     * Pass the state, plugins should only modify the state, never override it
     * because it is meant to be a reference, the core periodically saves
     * the state it has a reference to
     *
     */
    var defaultstate = plugin.state || {};
    var statepath    = './state/' + name + '.json';
    var state        = fs.existsSync(statepath)? jf.readFileSync(statepath): defaultstate;

    this.plugins[name] = new plugin.init(this, config, state);
    this.state[name]   = state;
  };

  var self = this;
  this.on('save', function(name) {
    if (name && self.plugis[name])
      return saveState(name, this.state[name]);

    for (var name in self.state) {
      if (!self.state.hasOwnProperty(name))
        continue;

      saveState(name, self.state[name]);
    };
  });

  // TODO launch a timer that simply emits a save event every ~1 minute to save
  // the state references
};

var saveState = function(name, state) {
  var statepath = './state/' + name + '.json';
  jf.writeFileSync(statepath, state);
};

util.inherits(c, events.EventEmitter);

module.exports = {init: c};
