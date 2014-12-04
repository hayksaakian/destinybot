var dotenv = require('dotenv');
var jf = require('jsonfile');
var fs = require('fs')
var WebSocket = require('ws');
// plugin caller
var client = require('./client.js')
var tools = require('./tools.js')

// load secret variables from .env, unless you don't like it for some reason
if(fs.existsSync('./.env') && process.env['NODOTENV'] !== 'TRUE'){
  dotenv.load();
}else if(process.env['NODOTENV'] !== 'TRUE' && fs.existsSync('example.env')){
  fs.createReadStream('example.env').pipe(fs.createWriteStream('.env'));
}

// set globals
var DESTINYGG_API_KEY = process.env['DESTINYGG_API_KEY']
var WS_ENDPOINT = process.env.hasOwnProperty('WS_ENDPOINT') ? process.env['WS_ENDPOINT'] : 'destiny.gg:9998/ws'

// list every config file we need
var CONFIG_FILES = [
  'plugins'
]
var config = {}

// load config files
CONFIG_FILES.forEach(function (p) {
  var path = './config/'+p+'.json'
  if (fs.existsSync(path)) {
    config[p] = jf.readFileSync(path)
  }else{
    config[p] = {}
    // load defaults/examples otherwise
    if (fs.existsSync('./config/examples/'+p+'.json')) {
      config[p] = jf.readFileSync('./config/examples/'+p+'.json')
    }
    jf.writeFileSync(path, config[p])
  }
})

// load plugins
config['plugins']['list'].forEach(function (p) {
  client.loadPlugin(p, require('./plugins/'+p+'.js'))
})


// TODO: websocket setup could be modularized

// connect to the websocket server with api key
var ws = new WebSocket('ws://'+WS_ENDPOINT, {
  origin: '*',
  headers: {
    'Cookie':'authtoken='+DESTINYGG_API_KEY+';'
  }
});

ws.on('open', function open() {
  client.init(ws)
  console.log('open', 'connected at '+Date.now().toString());
});

ws.on('close', function close(code, message) {
  console.log('close', 'disconnected at '+Date.now().toString());
  console.log('code:', code, 'message:', message)
  // TODO: reconnect if code == 1006
  // or 1000 (1000 is generic but you should never be disconnecting)
});

var CHATEVENTS = {
  'PING': function (ws, data) {
    ws.send("PONG "+JSON.stringify(data))
  },
  'ERR': function (ws, data) {
    // TODO: handle 'throttled' or other errors
  },
  'MSG': function (ws, message) {
    // TODO: this has a lot of room for optimization
    // for example, maybe we want to have a regex : callback
    // thing instead of just strings. i dunno
    client.on(message);
  },
  // TODO: handle this for moderation purposes
  'NAMES': function (ws, data) {
  },
  'JOIN': function (ws, data) {
  },
  'QUIT': function (ws, data) {
  },
}

ws.on('message', function message(str, flags) {
  console.log(str)
  var kind = str.substr(0,str.indexOf(' '));
  var data = JSON.parse(str.substr(str.indexOf(' ')+1));
  CHATEVENTS[kind](ws, data);
});

ws.on('event', function event (e) {
  console.log('event', e)
  // body...
})

ws.on('error', function event (e) {
  console.log('error', e)
  // body...
})

// TODO: handle reconnecting if there's an error
// TOOD: handle ctrl+c to kill without trying to reconnect