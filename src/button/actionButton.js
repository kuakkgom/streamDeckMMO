const Button = require("./button");
const KBMEventEntity = require("../entity/kbmEventEntity");

class ActionButton extends Button
{
    handleKeyUp()
    {
        const macroFunc = new Function("ctx", "global", "kEvent", "plugins", "repeat", this.settings.macro.trim());
        macroFunc(this, this.globals, new KBMEventEntity(this.emitter), {}, this.settings.runCount);
        // noop
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