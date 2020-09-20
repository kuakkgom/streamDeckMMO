class Button
{
    #data = {};
    #emitter;
    #eventProcessor;
    #globals;
    #settings = {};
    #uuid;

    constructor(message, eventProcessor, emitter, globals)
    {
        this.#emitter = emitter;
        this.#eventProcessor = eventProcessor;
        this.#globals = globals;

        this.#settings = message.payload.settings;
        this.#uuid = message.context;
    }

    setData(key, value)
    {
        this.#data[key] = value;
    }

    getData(key)
    {
        return this.#data[key];
    }

    get emitter()
    {
        return this.#emitter;
    }

    get eventProcessor()
    {
        return this.#eventProcessor;
    }

    get globals()
    {
        return this.#globals;
    }

    get settings()
    {
        return this.#settings;
    }

    set settings(message)
    {
        let mergeSettings;

        if (message.payload.settings)
        {
            mergeSettings = message.payload.settings;
        }
        else
        {
            mergeSettings = message.payload;
        }

        this.#settings = {
            ...this.#settings,
            ...mergeSettings
        };
    }

    get uuid()
    {
        return this.#uuid;
    }
}

module.exports = Button;