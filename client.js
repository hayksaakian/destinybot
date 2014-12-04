var async = require('async')
var tools = require('./tools.js')

var client = {
  // these should always be the same length
  PLUGINS:{},
  patterns: {}, // plugin_name : pattern array 
  callbacks: {}, // plugin_name : callback array
  'loadPlugin':function (name, plugin) {
    client.loading = name
    var main_client = client;
    // We expose a more limited client API

    // fuck that
    var c = {
      'on': function (pattern, callback) {
        console.log('registering',name, ' for ',name)
        main_client.register(name, pattern, callback)
      },
      'say': function(text){
        main_client.say(text);
      },
      'send': function(chat_event, message_obj){
        main_client.say(evnt, message_obj);
      },
      'help': function (pattern, docs) {
        if (tools.isString(docs)) {
          main_client.register(name, "!help "+pattern, function (mo) {
            main_client.say(mo.nick+', '+pattern+' '+docs)
          });
        }else{
          // assuming docs is actually a callback
          main_client.register(name, "!help "+pattern, docs)
        }
      },
      // in case the plugin needs to break abstractions
      'main_client':main_client
    }
    client.PLUGINS[name] = plugin
    client.PLUGINS[name].init(c, {})
  },
  'unloadPlugin': function (name) {
    client.unregister(name);
    delete PLUGINS[name]
  },
  'on': function (pattern_or_message_obj, callback) {
    if(!callback){
      client.dispatch(pattern_or_message_obj);
    }else if (tools.isString(pattern_or_message_obj) || tools.isRegExp(pattern_or_message_obj)) {
      client.register(pattern_or_message_obj, callback)
    }
  },
  'dispatch': function(message_obj){
    var potential_cmd = message_obj.data;
    var callback_queue = []
    console.log('on dispatch!')
    for(var plugin_name in client.patterns){
      var plugin_patterns = client.patterns[plugin_name]

      plugin_patterns.forEach(function(pp, index){
        if(tools.isString(pp) && potential_cmd.indexOf(pp) === 0){
          // strings test against the start
          callback_queue.push(client.callbacks[plugin_name][index])
        }else if(tools.isRegExp(pp) && potential_cmd.search(pp) !== -1){
          // regex can be anywhere
          callback_queue.push(client.callbacks[plugin_name][index])
        }
      })
    }
    // SoDoge such async. worry about this stuff is slow
    // async.each(callback_queue, function (cb) {
    //   cb(message_obj)
    // })
    callback_queue.forEach(function (cb) {
      console.log('working through callback')
      cb(message_obj)
    })
  },
  'register':function (plugin_name, pattern, callback) {
    if (!client.patterns.hasOwnProperty(plugin_name)) {
      client.patterns[plugin_name] = [];
      client.callbacks[plugin_name] = [];
    }
    client.patterns[plugin_name].push(pattern);
    client.callbacks[plugin_name].push(callback);
  },
  'unregister': function (plugin_name){
    // NOTE pattern must be EXACTLY the same object reference
    // /regex/ != /regex/
    delete client.patterns[plugin_name];
    delete client.callbacks[plugin_name];
  },
  'say': function (text) {
    client.send('MSG', {data: text});
  },
  'send': function (chat_event, json_msg) {
    client.ws.send(chat_event+' '+JSON.stringify(json_msg))
  },
  'init': function (ws_client) {
    client.ws = ws_client
  }
}

module.exports = client