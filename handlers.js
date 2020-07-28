const Button = require("./button");
const Events = require("events");
const KbmEventProcessor = require("./kbmEventProcessor");
const Robot = require("kbm-robot");

class Handlers
{
    #buttonInstances = {};
    #buttonGroups = {};
    #emitter;
    #globals = {};
    #kbmEP;
    #ws;

    constructor(webSocket)
    {
        this.#ws = webSocket;

        Robot.startJar();

        this.#ws.on("close", () => {
            Robot.stopJar();
        });

        this.#emitter = new Events.EventEmitter();
        this.#emitter.setMaxListeners(128);
        this.#kbmEP = new KbmEventProcessor(Robot, this.#emitter);

        this.#emitter.on("sendEvent", this.sendEvent.bind(this));
    }

    getInstance(contextUUID)
    {
        return this.#buttonInstances[contextUUID];
    }

    sendEvent(event)
    {
        this.#ws.send(JSON.stringify(event));
    }

    addInstanceToGroup(message)
    {
        const groupList = this.#buttonGroups;
        const group = message.payload.settings.group;

        groupList[group] = groupList[group] || [];

        if (groupList[group].indexOf(message.context) === -1)
        {
            groupList[group].push(message.context);
        }
    }

    removeInstanceFromGroup(message)
    {
        const groupList = this.#buttonGroups;
        const group = message.payload.settings.group;

        if (groupList[group])
        {
            groupList[group] = groupList[group].filter(x => x !== message.context);

            if (groupList[group].length === 0)
            {
                delete groupList[group];
            }
        }
    }

    updateSettings(message)
    {
        const instances = this.#buttonInstances;

        if (!(message.context in instances))
        {
            instances[message.context] = new Button(message, this.#emitter, this.#globals);
        }

       instances[message.context].updateSettings(message.settings);
    }

    // Handle incoming PI messages
    sendToPlugin(message)
    {
        const instances = this.#buttonInstances;

        if (!(message.context in instances))
        {
            instances[message.context] = new Button(message, this.#emitter, this.#globals);
        }

        const button = instances[message.context];

        button.updateSettings(message.payload);

        if ("group" in message.payload)
        {
            message.payload.settings = message.payload;
            this.addInstanceToGroup(message);
        }

        // Force redraw
        this.#emitter.emit("imageReload", button.uuid);

        this.sendEvent({
            "event": "setSettings",
            "context": button.uuid,
            "payload": button.settings
        });
    }

    // Get settings for current button
    propertyInspectorDidAppear(message)
    {
        this.sendEvent({
            "event": "getSettings",
            "context": message.context
        });
    }

    // Forward settings to PI - populate settings for button
    didReceiveSettings(message)
    {
        this.updateSettings(message);

        this.sendEvent({
            "action": message.action,
            "event": "sendToPropertyInspector",
            "context": message.context,
            "payload": message.payload.settings
        });
    }

    // Trigger setting update, render, and grouping
    willAppear(message)
    {
        this.updateSettings(message);

        if (message.payload.settings.iconFile)
        {
            this.#emitter.emit("imageReload", message.context);
        }

        if (message.payload.settings.group)
        {
            this.addInstanceToGroup(message);
        }
    }

    willDisappear(message)
    {
        if (message.payload.settings.group)
        {
            this.removeInstanceFromGroup(message);
        }
    }

    // Animate if we got it - and macro if we got it?
    keyUp(message)
    {
        const button = this.#buttonInstances[message.context];

        // Abort loop
        if (button.shouldLoop())
        {
            button.stopLoop();

            return;
        }

        // Bail if we don't have a macro, are in single-run mode, or button is still animating
        if (!button.macro || button.isRunningMacro || button.isAnimating)
        {
            return;
        }

        button.runMacro();
    }
}

module.exports = Handlers;