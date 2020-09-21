const ActionButton = require("../button/actionButton");
const KbmInfoButton = require("../button/kbmInfoButton");
const KbmStateButton = require("../button/kbmStateButton");

class ButtonFactory
{
    create(message, eventProcessor, emitter, globals, plugins)
    {
        switch (message.action)
        {
            case "io.djewell.mmomacro.action":
                return new ActionButton(message, eventProcessor, emitter, globals, plugins);
            case "io.djewell.mmomacro.info":
                return new KbmInfoButton(message, eventProcessor, emitter, globals, plugins);
            case "io.djewell.mmomacro.kbmstate":
                return new KbmStateButton(message, eventProcessor, emitter, globals, plugins);
            default:
                console.error("Unexpected button type", message);
        }
    }
}

module.exports = new ButtonFactory();