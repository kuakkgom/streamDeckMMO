const keySequence = require('../core/keySequence');

// Length as bits: FHQE, use hex
// Notation: [octave][key][length]
// S for rest
// v - ^ for -/=/+ octave
class MusicSequencer
{
    #emitter;
    #notesToKeys = {
        'C': 'Q',
        'C#': '2',
        'D': 'W',
        'Eb': '3',
        'E': 'E',
        'F': 'R',
        'F#': '5',
        'G': 'T',
        'G#': '6',
        'A': 'Y',
        'Bb': '7',
        'B': 'U',
        'C+': 'I',
    };

    constructor(emitter)
    {
        this.#emitter = emitter;
    }

    parseSong(song, eigthLengthMS)
    {
        const chunkRE = /(v|=|^)([A-GS#b+]{1,2})([0-9A-F]{1})/g;
        const commands = [];
        const ks = new keySequence();

        eigthLength = eigthLength || 200;
    
        [...song.matchAll(chunkRE)].forEach((item) => {
            switch(item[1])
            {
                case 'v':
                    ks.hold('CTRL');
                    break;
                case '^':
                    ks.hold(['SHIFT');
                    break;
            }
    
            length = parseInt(item[3], 16) * eigthLength;
    
            if ('S' !== item[2])
            {
                ks.hold(notesToKeys[item[2]]);
            }
    
            ks.sleep(length);
    
            if ('S' !== item[2])
            {
                ks.release(notesToKeys[item[2]]);
            }
    
            switch(item[1])
            {
                case 'v':
                    ks.release('CTRL');
                    break;
                case '^':
                    ks.hold('SHIFT');
                    break;
            }
        });
    
        return commands;
    }

    playSequence(sequence)
    {
        this.#emitter.emit('kbmPush', sequence);
    }
}

module.exports = MusicSequencer;