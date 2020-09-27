class Button
{
    #data = {};
    #emitter;
    #eventProcessor;
    #globals;
    #id;
    #plugins;
    #settings = {};
    #uuid;

    constructor(message, eventProcessor, emitter, globals, plugins)
    {
        this.#emitter = emitter;
        this.#eventProcessor = eventProcessor;
        this.#globals = globals;
        this.#plugins = plugins;

        this.#settings = message.payload.settings;
        this.#uuid = message.context;
        this.#id = Math.random();
    }

    setData(key, value)
    {
        this.#data[key] = value;
    }

    getData(key)
    {
        return this.#data[key];
    }

    clearData()
    {
        this.#data = {};
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

    get id()
    {
        return this.#id;
    }

    get plugins()
    {
        return this.#plugins;
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

        if (this.updateButtonRender)
        {
            this.updateButtonRender();
        }
    }

    get uuid()
    {
        return this.#uuid;
    }
}

module.exports = Button;