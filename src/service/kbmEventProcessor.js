const { command } = require("yargs/build/lib/command");

/**
 * A wrapper around Robot - adjusted into a serial queue
 * 
 * Accepts Event: kbmPush
 */
class KBMEventProcessor
{
    #emitter = false;
    #enabled = true;
    #id;
    #kbm = false;
    #processing = false;
    #queue = [];

    constructor(robot, emitter)
    {
        this.#kbm = robot;
        this.#emitter = emitter;
        this.#emitter.on("kbmPush", this.push.bind(this));
        this.#emitter.on("kbmInterrupted", this.realPush.bind(this));

        this.#id = Math.random();
    }

    enable()
    {
        this.#enabled = true;
        this.processQueue();
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

        if (!this.#processing)
        {
            this.processQueue();
        }
    }

    realPush(event)
    {
        this.#queue.push(event);
    }

    emptyQueue()
    {
        this.#queue = [];
    }

    processQueue()
    {
        if (!this.#enabled)
        {
            return;
        }

        let command;
        let commandGenerator;
        let kbm;
        let queueItem;

        this.#processing = true;
        console.info('pq',this.#processing);

        while (queueItem = this.#queue.shift())
        {
            queueItem.startRun();
            commandGenerator = queueItem.command();

            kbm = this.#kbm.sleep(queueItem.keyDelay);
            kbm = queueItem.applyHolds(kbm);

            for (command = commandGenerator.next(); !command.done; command = commandGenerator.next())
            {
                console.log(command);
                if (!queueItem.isRunning)
                {
                    console.info('BREAK');
                    break;
                }

                kbm = kbm[command.value[0]].apply(kbm, command.value.slice(1));
                kbm = kbm.sleep(queueItem.keyDelay);
            }
console.log('outside loop');
            kbm = queueItem.removeHolds(kbm);

            queueItem.clearInterrupt();

            if (queueItem.callback)
            {
                kbm.go(queueItem.callback);
            }
            else
            {
                kbm.go();
            }

            kbm = this.#kbm;
        }

        this.#processing = false;
    }

    get runState()
    {
        console.info('rs',this.#processing);
        return this.#processing;
    }

    get enabled()
    {
        return this.#enabled;
    }

    get queueSize()
    {
        console.log(this.#queue);
        return this.#queue.length;
    }

    get id()
    {
        return this.#id;
    }
}

module.exports = KBMEventProcessor;