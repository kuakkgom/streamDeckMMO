/**
 * A wrapper around Robot - adjusted into a serial queue
 * 
 * Serial queue is necessary to allow button presses while infinite loops run
 * 
 * Accepts Event: kbmPush
 */
class kbmEventProcessor
{
    #emitter = false;
    #queue = [];
    #processing = false;
    #robotInstance = false;

    constructor(robot, emitter)
    {
        this.#robotInstance = robot;
        this.#emitter = emitter;
        this.#emitter.on("kbmPush", this.queuePush.bind(this));
    }

    queuePush(event)
    {
        this.#queue.push(event);

        if (!this.#processing)
        {
            this.processQueue();
        }
    }

    processQueue()
    {
        this.#processing = true;

        let queueItem;
        let kbm = this.#robotInstance;

        while (queueItem = this.#queue.shift())
        {
            let releaseButtons = [];

            kbm = kbm.sleep(40);

            queueItem.kbm.forEach((x) => {
                if ("press" === x[0])
                {
                    releaseButtons.push(x[1]);
                }

                kbm = kbm[x[0]].apply(kbm, x.slice(1));
                kbm = kbm.sleep(40);
            });

            releaseButtons.forEach((x) => {
                kbm = kbm.release(x);
                kbm = kbm.sleep(40);
            });

            // May increase reliability of out-of-loop commands
            kbm = kbm.sleep(40);

            if (queueItem.cb)
            {
                kbm.go(queueItem.cb);
            }
            else
            {
                kbm.go();
            }

            kbm = this.#robotInstance;
        }

        this.#processing = false;
    }
}

module.exports = kbmEventProcessor;