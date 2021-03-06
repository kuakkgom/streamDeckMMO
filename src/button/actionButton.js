const ActionButtonRenderService = require("../service/actionButtonRenderService");
const Button = require("./button");
const KBMEventEntity = require("../entity/kbmEventEntity");

class ActionButton extends Button
{
    #macro;
    #macroRunning = false;
    #renderer;

    constructor(message, eventProcessor, emitter, globals, plugins)
    {
        super(message, eventProcessor, emitter, globals, plugins);

        this.#renderer = new ActionButtonRenderService(emitter, this);
        this.emitter.on("stopButtonMacro", this.stopMacro.bind(this));
    }

    stopMacro()
    {
        this.#macroRunning = false;
    }

    runMacro(callback, count)
    {
        console.log("Running " + this.constructor.name + " id: " + this.id);
        const kEvent = new KBMEventEntity(this.emitter);

        if (!this.#macroRunning)
        {
            this.updateButtonRender();
            this.clearData();
            this.#macro = false;

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
            this.updateButtonRender();
            this.clearData();
            this.#macro = false;
            this.#macroRunning = false;
        }
    }

    updateButtonRender()
    {
        if (this.#renderer.hasImage)
        {
            this.#renderer.renderButton();
        }
    }

    handleKeyUp()
    {
        if (this.#renderer.canAnimate && this.#renderer.isAnimating)
        {
            return;
        }

        if (this.#macroRunning)
        {
            this.#macroRunning = false;
        }
        else
        {
            this.#macroRunning = true;
            let macroText = "console.log('fId: ' + fID);" + this.settings.macro.trim();
            this.#macro = new Function("global", "plugins", "fID", "kEvent", macroText);

            if (this.#renderer.canAnimate)
            {
                this.#renderer.coolDownAnimation();
            }

            this.runMacro(this.#macro.bind(
                this,
                this.globals,
                this.plugins,
                Math.random()
            ), this.settings.runCount);
        }
    }

    handleWillAppear()
    {
        // noop
    }

    handleWillDisappear()
    {
        this.emitter.removeListener("stopButtonMacro", this.stopMacro.bind(this));
    }
}

module.exports = ActionButton;