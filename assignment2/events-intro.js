const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("tell", (message) => {
  console.log("Listener 1 got a tell message:", message);
});

emitter.on("tell", (message) => {
  console.log("Listener 2 got a tell message:", message);
});

emitter.on("error", (error) => {
  console.log("The emitter reported an error.", error.message);
});

emitter.emit("tell", "Hi there!");
emitter.emit('tell',"second message");
emitter.emit("tell", "all done");
