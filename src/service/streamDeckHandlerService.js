const ButtonFactory = require("../factory/buttonFactory");
const glob = require("glob");
const path = require("path");

class StreamDeckHandlerService
{
    #buttonInstances = {};
    #emitter;
    #globals = {};
    #kbmEP;
    #plugins = {};
    #ws;

    constructor(webSocket, emitter, kbmEventProcessor)
    {
        this.#ws = webSocket;
        this.#emitter = emitter;
        this.#kbmEP = kbmEventProcessor;

        this.loadPlugins();

        this.#emitter.on("sendEvent", this.sendEvent.bind(this));
    }

    loadPlugins()
    {
        glob.sync("./src/plugins/*.js").forEach((file) => {
            let key = file.split('/').pop().split('.')[0];

            this.#plugins[key] = require(path.resolve(file));
        });
    }

    getInstance(contextUUID)
    {
        return this.#buttonInstances[contextUUID];
    }

    sendEvent(event)
    {
        this.#ws.send(JSON.stringify(event));
    }

    updateSettings(message)
    {
        const instances = this.#buttonInstances;

        if (!(message.context in instances))
        {
            instances[message.context] = ButtonFactory.create(message, this.#kbmEP, this.#emitter, this.#globals, this.#plugins);
        }
        else
        {
            instances[message.context].settings = message;
        }
    }

    // Handle incoming PI messages
    sendToPlugin(message)
    {
        const instances = this.#buttonInstances;

        if (message.context in instances)
        {
            instances[message.context].settings = message;
        }
        else
        {
            instances[message.context] = ButtonFactory.create(message, this.#kbmEP, this.#emitter, this.#globals, this.#plugins);
        }

        const button = instances[message.context];
    
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

    willAppear(message)
    {
        this.updateSettings(message);

        const button = this.getInstance(message.context);

        button.handleWillAppear(message);
    }

    willDisappear(message)
    {
        const button = this.getInstance(message.context);

        if (button)
        {
            button.handleWillDisappear(message);

            delete this.#buttonInstances[message.context];
        }
    }

    keyUp(message)
    {
        const button = this.getInstance(message.context);

        button.handleKeyUp(message);
    }
}

module.exports = StreamDeckHandlerService;