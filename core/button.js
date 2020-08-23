/**
 * Should be bare bones - to be extended by other button types
 */
module.exports = Base => class extends Base
{
    #name;
    #uuid;
    #data = {};

    constructor(name, uuid, initialData)
    {
        this.#name = name;
        this.#uuid = uuid;

        this.#data = {
            ...this.#data,
            ...initialData
        }
    }

    setData(key, value)
    {
        this.#data[key] = value;
    }

    getData(key)
    {
        return this.#data[key];
    }

    get name()
    {
        return this.#name;
    }

    get uuid()
    {
        return this.#uuid;
    }
};