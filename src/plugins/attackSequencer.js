class AttackSequencer
{
    #buttonCtx;
    #cooldown = 2500; // Skill CD
    #cooldownModifier; // For skills that reduce cooldown, ex: Greased lightning
    #cooldownTimerId;
    #cycleSet = []; // see @about:cycleset
    #lagCompensation = 700; // Too much and skills won't fire due to GCD. Good tuning has skill getting hit at 1/8th GCD left
    #level = 80; // current character level - to be used for adaptive movesets
    #moveSet = {}; // See @about:moveset

    /**
     * @about:cycleset

        {
            "loop": true, // indicates if the current set should loop. If true, should be last cycle
            "moves": ["moveA", "moveB", ...] // moves listed here must be in moveSet
        }
     */

    /**
     * @about:moveset
        "kaiten": { // skill name
            "cooldownModifier": { // not required
                "amount": 10, // a percentage.
                "limit": 10, // when skill repeats, reapply amount until this value
                "duration": 16000 // how long a single modifier lasts in microseconds, this example is 16s
            },
            "instant": true, // not required, assumed not to trigger GCD
            "keys": [["hold", "CTRL"],["push", "8"],["release", "CTRL"]], // required
            "level": 55 // level skill acquired, to be used in future for synced dungeons/etc
        },
     */

    constructor(buttonCtx, cooldown, lagCompensation, level)
    {
        this.#buttonCtx = buttonCtx;
        this.#cooldown = cooldown || this.#cooldown;
        this.#lagCompensation = lagCompensation || this.#lagCompensation;
        this.#level = level || this.#level;

        this.#cooldownModifier = this.#buttonCtx.getData('cooldownModifier') || 100;
        this.#cooldownTimerId = this.#buttonCtx.getData('cooldownTimerId');
    }

    addSet(set)
    {
        if (set.hasOwnProperty("loop") && set.hasOwnProperty("moves"))
        {
            this.#cycleSet.push(set);
        }

        return this;
    }

    addMove(name, properties)
    {
        if (properties.hasOwnProperty("keys"))
        {
            this.#moveSet[name] = properties;
        }

        return this;
    }

    run(kEvent)
    {
        let index = this.#buttonCtx.getData('index') || 0;
        let step = this.#buttonCtx.getData('step') || 0;
    
        let sequence = this.#moveSet[this.#cycleSet[index]["moves"][step]];
    
        sequence.keys.forEach(command => {
            kEvent[command[0]](command[1]);
        });
    
        step++;
    
        if (step === this.#cycleSet[index]["moves"].length)
        {
            step = 0;
    
            if (false === this.#cycleSet[index].loop)
            {
                index++;
            }
        }
    
        this.#buttonCtx.setData('index', index);
        this.#buttonCtx.setData('step', step);
    
        if (sequence.instant)
        {
            this.run.call(this, kEvent);
        }
        else
        {
            kEvent.sleep(((this.#cooldown * (this.#cooldownModifier / 100)) - this.#lagCompensation) << 0);
            kEvent.emit();
        }
    
        if (sequence.cooldownModifier)
        {
            this.updateCooldownModifier(sequence.cooldownModifier);
        }
    }

    updateCooldownModifier(cooldownModifier)
    {
        if (cooldownModifier.limit > (100 - this.#cooldownModifier))
        {
            this.#cooldownModifier -= cooldownModifier.amount;
            this.#buttonCtx.setData('cooldownModifier', this.#cooldownModifier);
        }
        
        if (this.#cooldownTimerId)
        {
            clearTimeout(this.#cooldownTimerId);
        }

        this.#cooldownTimerId = setTimeout(this.resetCooldownModifier.bind(this), cooldownModifier.duration);
        this.#buttonCtx.setData('cooldownTimerId', this.#cooldownTimerId);
    }

    resetCooldownModifier()
    {
        this.#cooldownModifier = 100;
        this.#buttonCtx.setData('cooldownModifier', this.#cooldownModifier);
    }
}

module.exports = AttackSequencer;