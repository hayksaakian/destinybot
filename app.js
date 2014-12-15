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
  throw new Error("Banned, exiting");
});

// handle auto-reconnections, if the connection failed for the first time,
// reconnect more quickly
var failedconnecting = false;
core.on("connected", function() {
  failedconnecting = false;
});
core.on("disconnected", function() {
  var cooldown = failedconnecting ? (Math.random() * 200) + 100 : (Math.random() * 200) + 500;
  setTimeout(function() {
    core.emit("connect");
  }, cooldown);
});
