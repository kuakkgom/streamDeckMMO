const Yargs = require("yargs");
const WebSocket = require("ws");
const Handlers = require("./handlers.js");

argv = Yargs.parse(process.argv.slice(2).map(x => x[0] === '-' ? '-' + x : x));

const ws = new WebSocket(`ws://127.0.0.1:${argv.port}`);
const handler = new Handlers(ws);

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
