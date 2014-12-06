var process = require("process");
var core = new(require("./core.js").init);

// handle exceptions by trying to save shit and then exiting out
// just hope that its not the saving that is causing the exception to be thrown
process.on("uncaughtException", function(err) {
  console.log("Exception: ");
  console.log(err.stack)
  core.emit("save");
  process.exit(1);
});

process.on("SIGINT", function() {
  console.log("Caught SIGINT, saving and exiting");
  core.emit("save");
  process.exit(1);
});

// set up auto-saving of plugin state every two minutes
setInterval(function() {
  core.emit("save");
}, 1000 * 60 * 2);

// bail when banned
core.on("BANNED", function() {
  throw "Banned, exiting";
});

// handle auto-reconnections
core.on("disconnected", function() {
  // just connect at once, not even throttling
  process.nextTick(function() {
    core.emit("connect");
  });
});
