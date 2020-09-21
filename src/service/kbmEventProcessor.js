const { command } = require("yargs/build/lib/command");

/**
 * Async is a biiiiiitch, just saying
 */
class KBMEventProcessor
{
    #emitter = false;
    #enabled = true;
    #kbm = false;
    #processing = false;
    #queue = [];

    constructor(robot, emitter)
    {
        this.#kbm = robot;
        this.#emitter = emitter;
        this.#emitter.on("kbmPush", this.push.bind(this));
        this.#emitter.on("kbmInterrupted", this.realPush.bind(this));
    }

    enable()
    {
        this.#enabled = true;

        if (this.isProcessing)
        {
            if (this.#processing.isRunning)
            {
                this.#processing.startRun();
            }
            this.step();
        }
        else
        {
            this.process();
        }
    }

    disable()
    {
        this.#enabled = false;
        this.#processing = false;
        this.#emitter.emit("kbmInterruptProcessing", this.#kbm);
    }

    push(event)
    {
        this.#emitter.emit("kbmInterruptProcessing", this.#kbm);
        this.#queue.unshift(event);

        if (!this.isProcessing)
        {
            this.process();
        }
    }

    realPush(event)
    {
        this.#processing = false;
        this.#queue.push(event);
    }

    emptyQueue()
    {
        this.#queue = [];
    }

    process()
    {
        if (!this.isProcessing && this.queueSize > 0)
        {
            this.#processing = this.#queue.shift();
            this.#processing.startRun();
            this.step();
        }
    }

    step()
    {
        if (!this.#enabled || !this.#processing || !this.#processing.isRunning)
        {
            return;
        }
    
        const cmd = this.#processing.command();
        const iteratorObj = cmd.next();

        if (true === iteratorObj.done)
        {
            if (this.#processing.callback)
            {
                this.#processing.callback();
            }

            this.#processing = false;
            this.process();
        }
        else
        {
            let kbm = this.#kbm.sleep(this.#processing.keyDelay);

            kbm = this.#processing.applyHolds(kbm);
            kbm[iteratorObj.value[0]].apply(kbm, iteratorObj.value.slice(1));
            kbm = this.#processing.removeHolds(kbm);
            kbm.go(this.step.bind(this));
        }
    }

    get isProcessing()
    {
        return !!this.#processing;
    }

    get enabled()
    {
        return this.#enabled;
    }

    get queueSize()
    {
        return this.#queue.length;
    }
}

module.exports = KBMEventProcessor;