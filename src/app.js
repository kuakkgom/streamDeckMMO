const Events = require("events");
const HandlerService = require("./service/streamDeckHandlerService");
const KbmEventProcessor = require("./service/kbmEventProcessor");
const Robot = require("kbm-robot");
const WebSocket = require("ws");
const Yargs = require("yargs");

argv = Yargs.parse(process.argv.slice(2).map(x => x[0] === '-' ? '-' + x : x));

Robot.startJar();

const emitter = new Events.EventEmitter();

emitter.setMaxListeners(128);

const eventProcessor = new KbmEventProcessor(Robot, emitter);
const ws = new WebSocket(`ws://127.0.0.1:${argv.port}`);
const handler = new HandlerService(ws, emitter, eventProcessor);

// Have a little chat with the Stream Deck App
ws.on("open", () => {
    ws.send(JSON.stringify({
        "event": argv.registerEvent,
        "uuid": argv.pluginUUID,
    }));
});

ws.on("message", (message) => {
    message = JSON.parse(message);

    if (typeof handler[message.event] !== "undefined")
    {
        handler[message.event](message);
    }
});

ws.on("close", () => {
    Robot.stopJar();
});