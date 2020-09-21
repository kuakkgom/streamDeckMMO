const Button = require("./button");
const KBMEventEntity = require("../entity/kbmEventEntity");

class ActionButton extends Button
{
    #macro;
    #macroRunning = false;

    constructor(message, eventProcessor, emitter, globals, plugins)
    {
        console.log('aconst', plugins);
        super(message, eventProcessor, emitter, globals, plugins);
    }

    runMacro(callback, count)
    {
        const kEvent = new KBMEventEntity(this.emitter);

        if (!this.#macroRunning)
        {
            return;
        }

        if (count > 0)
        {
            kEvent.callback = this.runMacro.bind(this, callback, count - 1);
            callback(kEvent);
        }
        else if (0 === count && this.settings.runCount === 0)
        {
            kEvent.callback = this.runMacro.bind(this, callback, 0);
            callback(kEvent);
        }
        else
        {
            this.#macroRunning = false;
        }
    }

    handleKeyUp()
    {
        if (this.#macroRunning)
        {
            this.#macroRunning = false;
        }
        else
        {
            this.#macroRunning = true;
            this.#macro = new Function("global", "plugins", "kEvent", this.settings.macro.trim());
    
            this.runMacro(this.#macro.bind(
                this,
                this.globals,
                this.plugins
            ), this.settings.runCount);
        }
    }

    handleWillAppear()
    {
        // noop
    }

    handleWillDisappear()
    {
        // noop
    }

}

module.exports = ActionButton;