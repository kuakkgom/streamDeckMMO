const Button = require("./button");
const { createCanvas } = require("canvas");

class KBMStateButton extends Button
{
    #canvas;
    #context;

    constructor(message, eventProcessor, emitter, globals)
    {
        super(message, eventProcessor, emitter, globals);   

        this.#canvas = createCanvas(72, 72);
        this.#context = this.#canvas.getContext("2d");
    }

    toggleState()
    {
        this.eventProcessor.enabled ? this.eventProcessor.disable() : this.eventProcessor.enable();
        this.renderState();
    }

    renderState()
    {
        this.#context.fillStyle = "#000";
        this.#context.fillRect(0, 0, 72, 72);
        this.#context.fillStyle = "#fff";

        this.eventProcessor.enabled ? this.drawStop() : this.drawStart();

        this.emitter.emit("sendEvent", {
            "event": "setImage",
            "context": this.uuid,
            "payload": {
                "image": this.#canvas.toDataURL("image/png")
            }
        });
    }

    drawStop()
    {
        this.#context.fillRect(10, 10, 52, 52);
        this.#context.fillStyle = "#000";
        this.#context.textAlign = "center";
        this.#context.font = "10px Arial";
        this.#context.fillText("Halt KBM", 36, 40);
    }

    drawStart()
    {
        this.#context.beginPath();
        this.#context.moveTo(62, 36);
        this.#context.lineTo(10, 10);
        this.#context.lineTo(10, 62);
        this.#context.fill();
        this.#context.fillStyle = "#000";
        this.#context.strokeStyle = "#fff";
        this.#context.textAlign = "center";
        this.#context.font = "10px Arial";
        this.#context.strokeText("Resume KBM", 36, 40);
        this.#context.fillText("Resume KBM", 36, 40);
    }

    handleKeyUp()
    {
        this.toggleState();
    }

    handleWillAppear()
    {
        this.renderState();
    }

    handleWillDisappear()
    {
        // noop
    }
}

module.exports = KBMStateButton;