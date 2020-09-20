const Button = require("./button");
const { createCanvas } = require("canvas");

class KBMInfoButton extends Button
{
    #canvas;
    #context;
    #intervalId;

    constructor(message, eventProcessor, emitter, globals)
    {
        super(message, eventProcessor, emitter, globals);   

        this.#canvas = createCanvas(72, 72);
        this.#context = this.#canvas.getContext("2d");
        this.#intervalId = setInterval(this.updateData.bind(this), 1000);

        this.updateData();
    }

    updateData()
    {
        const data = [
            "KBM Status",
            "Enabled: " + (this.eventProcessor.enabled ? "Yes" : "No"),
            "Running: " + (this.eventProcessor.runState ? "Yes" : "No"),
            `Q Len: ${this.eventProcessor.queueSize}`,
            `ID: ${this.eventProcessor.id}`
        ];

        this.#context.fillStyle = "#000";
        this.#context.fillRect(0, 0, 72, 72);
        this.#context.textAlign = "left";
        this.#context.font = "10px Arial";
        this.#context.fillStyle = "#fff";
        this.#context.fillText(data.join("\n"), 4, 10);

        this.emitter.emit("sendEvent", {
            "event": "setImage",
            "context": this.uuid,
            "payload": {
                "image": this.#canvas.toDataURL("image/png")
            }
        });
    }

    handleKeyUp()
    {
        if (!this.eventProcessor.enabled)
        {
            this.eventProcessor.emptyQueue();
        }
    }

    handleWillAppear()
    {
        // noop
    }

    handleWillDisappear()
    {
        clearInterval(this.#intervalId);
    }
}

module.exports = KBMInfoButton;