const CanvasOperations = require("./canvasOperations");

/**
 * Responsible for state of button and loop tracking
 */
class Button
{
    #boundLoopFunc;
    #canvasOperations = false;
    #emitter = false;
    #globalVariables = {};
    #groupFunction;
    #iterationsLeft = -1;
    #macroFunction = false;
    #running = false;
    #settings = {};
    #uuid = false;
    #variables = {};

    constructor(message, emitter, globalVariables)
    {
        this.#emitter = emitter;
        this.#uuid = message.context;
        this.#globalVariables = globalVariables;

        if (message.payload.settings)
        {
            this.updateSettings(message.payload.settings);
        }

        this.#canvasOperations = new CanvasOperations(this, emitter);
    }

    cleanup()
    {
        this.#canvasOperations.cleanup();

        this.stopAnimating();
        this.stopRunning();

        if (this.#groupFunction)
        {
            this.#emitter.removeListener(`group:${this.group}`, this.#groupFunction);
        }

        if (this.#boundLoopFunc)
        {
            this.#emitter.removeListener("cooldownComplete", this.#boundLoopFunc)
        }
    }

    updateSettings(settings)
    {
        if (this.group && this.#groupFunction)
        {
            this.#emitter.removeListener(`group:${this.group}`, this.#groupFunction);
        }

        this.#settings = {
            ...this.#settings,
            ...settings
        };

        if (this.group)
        {
            this.#groupFunction = this.groupFunction.bind(this);

            this.#emitter.on(`group:${this.group}`, this.#groupFunction);
        }
    }

    groupFunction(event)
    {
        if (this.uuid !== event.uuid)
        {
            this.#canvasOperations.doAnimation(event.cooldown);
        }
    }

    canBeAnimated()
    {
        return this.#settings.iconFile && this.#settings.cooldown;
    }

    canCompositeLoopOverlay()
    {
        return this.#settings.iconFile && (0 === this.#settings.runCount || 1 < this.#settings.runCount);
    }

    canRenderImage()
    {
        return !!this.#settings.iconFile;
    }

    resetIterationCount()
    {
        this.#iterationsLeft = this.#settings.runCount;
    }

    isSingleRun()
    {
        return 1 === this.#settings.runCount || typeof this.#settings.runCount === "undefined";
    }

    isInfiniteLoop()
    {
        return 0 === this.#settings.runCount;
    }

    shouldLoop()
    {
        return this.#iterationsLeft > 0 || (this.isInfiniteLoop() && -1 !== this.#iterationsLeft);
    }

    stopLoop()
    {
        this.#iterationsLeft = -1;
    }

    decrementLoop()
    {
        --this.#iterationsLeft;
    }

    startRunning()
    {
        this.#running = true;
    }

    stopRunning()
    {
        this.#running = false;
    }

    groupAnimationEmit()
    {
        if (this.group)
        {
            this.#emitter.emit(`group:${this.group}`, {
                "uuid": this.uuid,
                "cooldown": this.cooldown
            });
        }
    }

    runMacro()
    {
        this.#macroFunction = new Function("shared", "button", "loopFunc", this.macro);

        this.startRunning();

        if (this.isSingleRun())
        {
            if (this.canBeAnimated())
            {
                this.#boundLoopFunc = this.stopSingleRun.bind(this);
                this.#emitter.on("cooldownComplete", this.#boundLoopFunc);
                this.#canvasOperations.doAnimation();
            }

            this.groupAnimationEmit();
            this.#macroFunction(this.global, this);

            if (!this.canBeAnimated())
            {
                this.stopRunning();
            }
        }
        else
        {
            this.resetIterationCount();
            this.#boundLoopFunc = this.runLoop.bind(this);

            if (this.canBeAnimated())
            {
                this.#emitter.on("cooldownComplete", this.#boundLoopFunc);
            }

            this.#emitter.emit("imageReload", this.uuid);
            this.#boundLoopFunc();
        }
    }

    stopSingleRun()
    {
        this.#emitter.removeListener("cooldownComplete", this.#boundLoopFunc);
        this.stopRunning();
    }

    runLoop(animationFinishedButtonUUID)
    {
        if (animationFinishedButtonUUID && animationFinishedButtonUUID !== this.uuid)
        {
            return;
        }

        if (this.shouldLoop())
        {
            this.groupAnimationEmit();
            this.#canvasOperations.doAnimation();
            this.#macroFunction(this.global, this, this.#boundLoopFunc);

            if (!this.isInfiniteLoop())
            {
                this.decrementLoop();
            }
        }
        else
        {
            if (this.canBeAnimated())
            {
                this.#emitter.removeListener("cooldownComplete", this.#boundLoopFunc);
            }

            if (this.#variables.postLoopCall)
            {
                this.#variables.postLoopCall();
            }

            this.#variables = {};
            this.#emitter.emit("imageReload", this.uuid);
            this.stopRunning();
        }
    }

    stopAnimating()
    {
        this.#canvasOperations.stopAnimating();
    }

    get cooldown()
    {
        return this.#settings.cooldown;
    }

    get uuid()
    {
        return this.#uuid;
    }

    get var()
    {
        return this.#variables;
    }

    get global()
    {
        return this.#globalVariables;
    }

    get settings()
    {
        return this.#settings;
    }

    get macro()
    {
        return this.#settings.macro.trim();
    }

    get iconFile()
    {
        return this.#settings.iconFile;
    }

    get resourceCost()
    {
        return this.#settings.resourceCost;
    }

    get effectivePosition()
    {
        return this.#settings.effectivePosition;
    }

    get isRunningMacro()
    {
        return this.#running;
    }

    get isAnimating()
    {
        return this.#canvasOperations.isAnimating;
    }

    get emitter()
    {
        return this.#emitter;
    }

    get group()
    {
        return this.#settings.group;
    }

    get runsLeft()
    {
        return this.#iterationsLeft;
    }
}

module.exports = Button;