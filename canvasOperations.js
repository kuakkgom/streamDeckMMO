const { createCanvas, loadImage } = require("canvas");

/**
 * Responsible for appearance of buttons.
 * 
 * Accepts event: imageReload
 * Emits event: cooldownComplete
 */
class CanvasOperations
{
    #animating = false;
    #animationTimestamp;
    #animationIntervalId;
    #button;
    #canvas;
    #context;
    #emitter;

    constructor(button, emitter)
    {
        this.#button = button;
        this.#canvas = createCanvas(72, 72);
        this.#context = this.#canvas.getContext("2d");
        this.#emitter = emitter;

        this.loadStaticImage();

        this.#emitter.on("imageReload", this.loadStaticImage.bind(this));
    }

    wrapContextCall(callBack, args)
    {
        const ctx = this.#context;

        ctx.save();
        callBack.apply(this, [ctx, args]);
        ctx.restore();
    }

    clearImage(ctx)
    {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 72, 72);
    }

    loadStaticImage(uuid)
    {
        const button = this.#button;
        
        if (!button.canRenderImage() || (uuid && uuid !== this.#button.uuid))
        {
            return false;
        }

        const url = unescape(button.iconFile.replace(/^C:\\fakepath\\/, ""));
        const ctx = this.#context;

        this.wrapContextCall(this.clearImage);

        loadImage(url).then(image => {
            ctx.save();
            ctx.drawImage(image, 0, 0, 72, 72);
            ctx.restore();
        }).then(this.drawExtras.bind(this));
    }

    drawExtras()
    {
        const button = this.#button;

        if (button.resourceCost)
        {
            this.wrapContextCall(this.drawResourceCost, button.resourceCost);
        }

        this.drawEffectiveDirection();

        if (button.shouldLoop())
        {
            this.wrapContextCall(this.drawLoopIcon);
        }

        this.#emitter.emit("sendEvent", {
            "event": "setImage",
            "context": button.uuid,
            "payload": {
                "image": this.dataUrl
            }
        });
    }

    drawEffectiveDirection()
    {
        const button = this.#button;

        switch(button.effectivePosition)
        {
            case "flank":
                this.wrapContextCall(this.drawFlankArrows);
                break;
            case "front":
                this.wrapContextCall(this.drawFrontArrow);
                break;
            case "rear":
                this.wrapContextCall(this.drawRearArrow);
                break;
        }
    }

    drawFlankArrows(ctx)
    {
        this.standardShadowAndFill(ctx);
        ctx.beginPath();
        ctx.moveTo(10, 36);
        ctx.lineTo(0, 26);
        ctx.lineTo(0, 46);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(62, 36);
        ctx.lineTo(72, 26);
        ctx.lineTo(72, 46);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }

    drawFrontArrow(ctx)
    {
        this.standardShadowAndFill(ctx);
        ctx.beginPath();
        ctx.moveTo(36, 62);
        ctx.lineTo(26, 72);
        ctx.lineTo(46, 72);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }

    drawRearArrow(ctx)
    {
        this.standardShadowAndFill(ctx);
        ctx.beginPath();
        ctx.moveTo(36, 10);
        ctx.lineTo(26, 0);
        ctx.lineTo(46, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }

    drawResourceCost(ctx, resourceCost)
    {
        this.standardShadowAndFill(ctx);
        ctx.textAlign = "center";
        ctx.font = "14px Arial";
        ctx.strokeText(resourceCost, 36, 12);
        ctx.fillText(resourceCost, 36, 12);
    }

    drawLoopIcon(ctx)
    {
        this.standardShadowAndFill(ctx);
        ctx.strokeStyle = "#fff";
        ctx.beginPath()
        ctx.moveTo(46, 36);
        ctx.arc(36, 36, 12, 0, 5);
        ctx.moveTo(46, 36);
        ctx.lineTo(48, 32);
        ctx.lineTo(50, 36);
        ctx.closePath();
        ctx.stroke();
    }

    standardShadowAndFill(ctx)
    {
        ctx.lineWidth = 3;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.shadowColor = "#000";
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
    }

    doAnimation(alternateCooldown)
    {
        if (this.#button.canBeAnimated())
        {
            if (this.#animationIntervalId)
            {
                clearInterval(this.#animationIntervalId);
            }

            this.#animationTimestamp = Date.now();
            this.#animationIntervalId = setInterval(this.animateCooldown.bind(this, alternateCooldown), 50);
        }
    }

    // Basic sweep cooldown animation -- move
    animateCooldown(alternateCooldown)
    {
        const canvas = createCanvas(72, 72);
        const context = canvas.getContext("2d");
        const button = this.#button;
        const actualCooldown = alternateCooldown || button.cooldown;

        context.drawImage(this.#canvas, 0, 0);

        const msElapsed = Date.now() - this.#animationTimestamp;
        const angle = Math.floor((msElapsed / actualCooldown) * 360);
        const adjustedRadians = (Math.PI/180) * (angle - 90);

        if (msElapsed >= actualCooldown)
        {
            this.#animating = false;

            clearInterval(this.#animationIntervalId);

            if (!this.#animationIntervalId.hasRef())
            {
                this.#animationIntervalId = null;
            }

            this.#emitter.emit({
                "event": "setImage",
                "context": button.uuid,
                "payload": {
                    "image": canvas.toDataURL("image/png")
                }
            });

            this.#emitter.emit("cooldownComplete", button.uuid);
            this.#emitter.emit("imageReload", button.uuid);

            return;
        }

        this.#animating = true;

        context.globalCompositeOperation = "multiply";
        context.fillStyle = "rgba(40, 40, 40, 0.7)";
        context.arc(36, 36, 100, (Math.PI/180) * -90, adjustedRadians, true);
        context.lineTo(36, 36);
        context.closePath();
        context.fill();

        this.#emitter.emit("sendEvent", {
            "event": "setImage",
            "context": button.uuid,
            "payload": {
                "image": canvas.toDataURL("image/png")
            }
        });
    }

    get dataUrl()
    {
        return this.#canvas.toDataURL("image/png");
    }

    get isAnimating()
    {
        return this.#animating;
    }
}

module.exports = CanvasOperations;