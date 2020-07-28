(function ()
{
    const fieldBindings = {
        "input[type='number']": {
            "event": "blur",
            "valueProcessor": x => parseInt(x, 10),
        },
        "select": {
            "event": "change",
        },
        "textarea": {
            "event": "blur",
        },
        "input[type='file']": {
            "event": "change",
        },
        "input[type='text']": {
            "event": "blur",
            "valueProcessor": x => x.trim(),
        }
    };

    const scope = {};

    function processElm(valueKey, valueProcessor)
    {
        let value = this[valueKey];
        const payload = {};

        if (typeof valueProcessor !== 'undefined')
        {
            value = valueProcessor(value);
        }

        payload[this.name] = value;

        sendToPlugin(payload);
    }

    function doBindings()
    {
        for (let selector in fieldBindings)
        {
            let elements = document.querySelectorAll(selector);

            Array.from(elements).forEach((element) => {
                element.addEventListener(
                    fieldBindings[selector].event,
                    processElm.bind(element, fieldBindings[selector].keyValue || "value", fieldBindings[selector].valueProcessor)
                );
            });
        }
    }

    function sendEvent(event)
    {
        scope.ws.send(JSON.stringify(event));
    }

    // Send field value to plugin
    function sendToPlugin(payload)
    {
        sendEvent({
            "action": scope.actionInfo.action,
            "event": "sendToPlugin",
            "context": scope.uuid,
            "payload": payload
        });
    }

    // Repopulate fields
    function sendToPropertyInspector(message)
    {
        Object.keys(message.payload).forEach((name) => {
            let elm = document.querySelector(`*[name="${name}"]`);

            if (elm !== null && elm.type !== "file")
            {
                switch(elm.tagName)
                {
                    default:
                        elm.value = message.payload[name];
                        break;
                }
            }
        });
    }

    function handleMessage(message)
    {
        message = JSON.parse(message.data);

        switch (message.event)
        {
            case "sendToPropertyInspector":
                sendToPropertyInspector(message);
                break;
            default:
                break;
        }
        console.log(message.event, message);
    }

    function register(registerEvent)
    {
        sendEvent({
            "event": registerEvent,
            "uuid": scope.uuid
        });

        doBindings();
    }

    function init(port, uuid, registerEvent, info, actionInfo)
    {
        scope.uuid = uuid;
        scope.info = JSON.parse(info);
        scope.actionInfo = JSON.parse(actionInfo);
        scope.ws = new WebSocket(`ws://127.0.0.1:${port}`);

        scope.ws.onmessage = handleMessage;
        scope.ws.onerror = console.log;
        scope.ws.onopen = register.bind(null, registerEvent);
    }

    window.connectElgatoStreamDeckSocket = init;
}());

