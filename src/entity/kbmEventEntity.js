class KBMEventEntity
{
    #boundInterruptHandler;
    #emitter;
    #holds = [];
    #id;
    #keyDelay = (60000 / (5 * 100)) << 0; // or 50 wpm
    #payload = {
        "callback": false,
        "commands": []
    };
    #running = false;

    constructor(emitter)
    {
        this.#emitter = emitter;
        this.#id = Math.random();
    }

    hold(key)
    {
        this.#payload.commands.push(["press", key]);

        return this;
    }

    push(key)
    {
        this.#payload.commands.push(["type", key, this.#keyDelay]);

        return this;
    }

    release(key)
    {
        this.#payload.commands.push(["release", key]);

        return this;
    }

    sleep(delay)
    {
        this.#payload.commands.push(["sleep", parseInt(delay, 10)]);

        return this;
    }

    type(str)
    {
        this.#payload.commands.push(["typeString", str, (this.#keyDelay / 2 << 0), (this.#keyDelay / 2 << 0)]);

        return this;
    }

    emit()
    {
        this.#emitter.emit("kbmPush", this);
    }

    handleInterrupt(kbm)
    {
        console.info('interrupt', this.#id);
        this.#running = false;
        this.#emitter.removeListener("kbmInterruptProcessing", this.#boundInterruptHandler);

        this.removeHolds(kbm).go();

        this.#emitter.emit("kbmInterrupted", this);
    }

    clearInterrupt()
    {
        if (this.#running)
        {
            this.#emitter.removeListener("kbmInterruptProcessing", this.#boundInterruptHandler);
        }
    }

    startRun()
    {
        console.info('start', this.#id);
        this.#running = true;
        this.#boundInterruptHandler = this.handleInterrupt.bind(this);
        this.#emitter.on("kbmInterruptProcessing", this.#boundInterruptHandler);
    }

    applyHolds(kbm)
    {
        this.#holds.forEach((key) => {
            kbm = kbm.press(key);
        })
    
        return kbm;
    }

    removeHolds(kbm)
    {
        this.#holds.forEach((key) => {
            kbm = kbm.release(key);
        })
    
        return kbm;
    }

    *command()
    {
        while (true)
        {
            if (!this.#running)
            {
                return;
            }

            if (this.#payload.commands.length)
            {
                const command = this.#payload.commands.shift();
    
                if ("press" === command[0] && -1 === this.#holds.indexOf(command[1]))
                {
                    this.#holds.push(command[1]);
                }
                else if ("release" === command[0] && -1 !== this.#holds.indexOf(command[1]))
                {
                    this.#holds = this.#holds.filter((x) => {
                        return command[1] !== x;
                    });
                }
        
                yield command;
            }
            else
            {
                this.#emitter.removeListener("kbmInterruptProcessing", this.#boundInterruptHandler);

                return;
            }
        }
    }

    get callback()
    {
        return this.#payload.callback;
    }

    set callback(func)
    {
        if (typeof func === "Function")
        {
            this.#payload.callback = func;
        }
    }

    get keyDelay()
    {
        return this.#keyDelay;
    }

    set keyDelay(delay)
    {
        this.#keyDelay = parseInt(delay, 10);
    }

    get isRunning()
    {
        return this.#running;
    }
}

module.exports = KBMEventEntity;