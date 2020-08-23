/**
 * Bind up functions for events - and make cleanup less stupid
 */
module.exports = Base => class extends Base
{
    #eventFuncMap = {};

    setEventFunction(eventName, eventFunc, ...bindings)
    {
        const boundFunction = eventFunc.bind(this, bindings);

        if (!Array.isArray(this.#eventFuncMap[eventName]))
        {
            this.#eventFuncMap[eventName] = [];
        }

        this.#eventFuncMap[eventName].push(boundFunction);

        return boundFunction;
    }

    getEventFunctions(eventName)
    {
        return this.#eventFuncMap[eventName];
    }

    unbind()
    {
        for (let key in this.#eventFuncMap)
        {
            this.#eventFuncMap[key].forEach((x) => {
                this.#emitter.removeListener(key, x);
            });

            delete this.#eventFuncMap[key];
        }
    }
};