/**
 * Hopefully this will resolve issues that exist in previous version like:
 * - meta keys still being held down when "interrupting" a loop
 * 
 * Listens for "kbmPush" event
 */
class kbm
{
    #emitter;
    #stack = [];
    #robot;
    #working = false;

    constructor(robot, emitter)
    {
        this.#emitter = emitter;
        this.#robot = robot;
        this.#emitter.on('kbmPush', this.push.bind(this));
    }

    push(keySequence)
    {
        this.#stack.unshift(keySequence);

        if (!this.#working)
        {
            this.process();
        }
    }

    process()
    {
        this.#working = true;

        let keySequence;

        while (keySequence = this.#stack.shift())
        {
            if (keySequence.isToggle)
            {
                this.#working = false;

                return;
            }
            else if (keySequence.interrupted)
            {
                keySequence.pause(this.#robot);

                this.#stack.push(keySequence);

                keySequence.interruptHandled();
            }
            else if (keySequence.canStep)
            {
                keySequence.step(this.#robot);

                if (keySequence.canStep)
                {
                    this.push(keySequence);
                }

                this.#robot.go(keySequence.callback);
            }
        }

        this.#working = false;
    }
}

module.exports = kbm;