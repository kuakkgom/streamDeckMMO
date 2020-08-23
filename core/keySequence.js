/**
 * For pushing to kbm. Allows for interrupts as well
 */
class keySequence
{
    #callback;
    #emitter;
    #held = [];
    #interrupted = false;
    #isToggle = false;
    #running = false;
    #seq = [];
    #shouldResume = false;

    constructor(emitter)
    {
        this.#emitter = emitter;
        this.#emitter.on('buttonInterrupt', this.handleInterrupt.bind(this));
    }

    handleInterrupt()
    {
        if (!this.#running)
        {
            this.#interrupted = true;
        }
    }

    interruptHandled()
    {
        this.#interrupted = false;
        this.#shouldResume = true;
    }

    cleanup(robot)
    {
        this.#held.forEach(x => robot.release(x));
    }

    pause(robot)
    {
        this.cleanup(robot);

        robot.sleep(20);
        robot.go();
    }

    resume(robot)
    {
        this.#held.forEach(x => robot.press(x));

        robot.sleep(20);
        robot.go();
    }

    hold(key)
    {
        this.#seq.push(['press', key]);

        return this;
    }

    setToggle()
    {
        this.#isToggle = true;
    }

    release(key)
    {
        this.#seq.push(['release', key]);

        return this;
    }

    key(key)
    {
        this.#seq.push(['type', new String(key), this.#keyDelay]);

        return this;
    }

    str(string)
    {
        this.#seq.push(['typeString', string, this.#keyDelay, this.#keyDelay]);

        return this;
    }

    sleep(delay)
    {
        this.#seq.push(['sleep', parseInt(delay, 10)]);

        return this;
    }

    setCallback(cb)
    {
        this.#callback = cb;
    }

    step(robot)
    {
        this.#running = true;

        if (this.#interrupted)
        {
            return;
        }
    
        if (this.#shouldResume)
        {
            this.resume(robot);
            this.#shouldResume = false;
        }

        let seqItem = this.#seq.shift();

        robot[seqItem[0]].apply(robot, seqItem.slice(1));

        if ('press' === seqItem[0])
        {
            this.addPress(seqItem[1]);
        }

        if ('release' === seqItem[0])
        {
            this.removePress(seqItem[1]);
        }
    
        if (!this.canStep)
        {
            this.cleanup(robot);
        }
    }

    get canStep()
    {
        return this.#seq.length > 0;
    }

    get interrupted()
    {
        return this.#interrupted;
    }

    get callback()
    {
        return this.#callback;
    }

    get isToggle()
    {
        return this.#isToggle;
    }

    addPress(key)
    {
        if (-1 === this.#held.indexOf(key))
        {
            this.#held.push(key);
        }
    }

    removePress(key)
    {
        if (-1 !== this.#held.indexOf(key))
        {
            this.#held = this.#held.filter(x => x !== key);
        }
    }
}

module.exports = keySequence;