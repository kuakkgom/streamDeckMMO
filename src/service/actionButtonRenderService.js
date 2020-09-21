const { createCanvas, loadImage } = require("canvas");

class AnimationButtonRenderService
{
    #animating = false;
    #button;
    #canvas;
    #context;
    #delay;
    #emitter;
    #fps = 24;
    #frames = [];

    constructor(emitter, button)
    {
        this.#emitter = emitter;
        this.#button = button;
        this.#canvas = createCanvas(72, 72);
        this.#context = this.#canvas.getContext("2d");
        this.#delay = (1000 / 24) << 0;

        if (this.hasImage)
        {
            this.renderButton();
        }
    }

    renderButton(skipFrameRebuild)
    {
        const url = unescape(this.#button.settings.iconFile.replace(/^C:\\fakepath\\/, ""));

        this.safeCtx(this.clearImage);

        loadImage(url).then(image => {
            this.#context.drawImage(image, 0, 0, 72, 72);
        }).then(this.overlayData.bind(this, skipFrameRebuild));
    }

    buildCooldownFrames()
    {
        const frameCount = ((this.#button.settings.cooldown / 1000) << 0) * this.#fps;

        this.#frames = [];

        for (let currentFrame = 0; frameCount > currentFrame; currentFrame++)
        {
            let angle = Math.floor((currentFrame / frameCount) * 360);
            let adjustedRadians = (Math.PI/180) * (angle - 90);   
            let canvas = createCanvas(72, 72);
            let context = canvas.getContext("2d");

            context.drawImage(this.#canvas, 0, 0, 72, 72);
            context.globalCompositeOperation = "multiply";
            context.fillStyle = "rgba(40, 40, 40, 0.7)";
            context.arc(36, 36, 100, (Math.PI/180) * -90, adjustedRadians, true);
            context.lineTo(36, 36);
            context.closePath();
            context.fill();
    
            this.#frames.push(canvas.toDataURL("image/png"));
        }
    }

    coolDownAnimation(finishedCallback, frame)
    {
        frame = frame || 0;

        if (typeof this.#frames[frame] === "undefined")
        {
            this.#animating = false;
            this.renderButton(true);

            if (finishedCallback)
            {
                finishedCallback();
            }
        }
        else
        {
            this.#animating = true;

            this.#emitter.emit("sendEvent", {
                "event": "setImage",
                "context": this.#button.uuid,
                "payload": {
                    "image": this.#frames[frame]
                }
            });

            setTimeout(this.coolDownAnimation.bind(this, finishedCallback, frame + 1), this.#delay);
        }
    }

    safeCtx(callback)
    {
        this.#context.save();
        callback.call(this);
        this.#context.restore();
    }

    clearImage()
    {
        this.#context.fillStyle = "#000";
        this.#context.fillRect(0, 0, 72, 72);
    }

    overlayData(skipFrameRebuild)
    {
        let value;

        for (let key in this.#button.settings)
        {
            value = this.#button.settings[key];

            switch (key)
            {
                case 'resourceCost':
                    this.safeCtx(this.drawResourceCost.bind(this, parseInt(value, 10)));
                    break;
                case 'effectivePosition':
                    this.safeCtx(this.drawEffectivePosition.bind(this, value));
                    break;
                default:
                    break;
            }
        }

        this.#emitter.emit("sendEvent", {
            "event": "setImage",
            "context": this.#button.uuid,
            "payload": {
                "image": this.#canvas.toDataURL("image/png")
            }
        });

        if (this.canAnimate && !skipFrameRebuild)
        {
            this.buildCooldownFrames();
        }
    }

    drawResourceCost(cost)
    {
        if (isNaN(cost))
        {
            return;
        }

        const costStr = new String(cost);

        this.baseSettings();
        this.#context.textAlign = "center";
        this.#context.font = "14px Arial";
        this.#context.strokeText(costStr, 36, 12);
        this.#context.fillText(costStr, 36, 12);
    }

    drawEffectivePosition(value)
    {
        this.baseSettings();

        switch(value)
        {
            case "flank":
                this.drawFlankArrows();
                break;
            case "front":
                this.drawFrontArrow();
                break;
            case "rear":
                this.drawRearArrow();
                break;
            default:
                break;
        }
    }

    drawFlankArrows()
    {
        this.#context.beginPath();
        this.#context.moveTo(10, 36);
        this.#context.lineTo(0, 26);
        this.#context.lineTo(0, 46);
        this.#context.closePath();
        this.#context.stroke();
        this.#context.fill();
        this.#context.beginPath();
        this.#context.moveTo(62, 36);
        this.#context.lineTo(72, 26);
        this.#context.lineTo(72, 46);
        this.#context.closePath();
        this.#context.stroke();
        this.#context.fill();
    }

    drawFrontArrow()
    {
        this.#context.beginPath();
        this.#context.moveTo(36, 62);
        this.#context.lineTo(26, 72);
        this.#context.lineTo(46, 72);
        this.#context.closePath();
        this.#context.stroke();
        this.#context.fill();
    }

    drawRearArrow()
    {
        this.#context.beginPath();
        this.#context.moveTo(36, 10);
        this.#context.lineTo(26, 0);
        this.#context.lineTo(46, 0);
        this.#context.closePath();
        this.#context.stroke();
        this.#context.fill();
    }

    baseSettings()
    {
        this.#context.lineWidth = 3;
        this.#context.fillStyle = "#fff";
        this.#context.strokeStyle = "#000";
        this.#context.shadowColor = "#000";
        this.#context.shadowOffsetY = 2;
        this.#context.shadowBlur = 4;
    }

    get hasImage()
    {
        return !!this.#button.settings.iconFile;
    }

    get canAnimate()
    {
        return this.hasImage && !isNaN(parseInt(this.#button.settings.cooldown, 10));
    }

    get isAnimating()
    {
        return this.#animating;
    }
}

module.exports = AnimationButtonRenderService;