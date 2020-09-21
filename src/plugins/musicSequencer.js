// Length as bits: FHQE, use hex
// Notation: [octave][key][length]
// S for rest
// v - ^ for -/=/+ octave
class MusicSequencer
{
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

    parsePlaySong(kEvent, song, eigthLengthMS)
    {
        const chunkRE = /(v|=|^)([A-GS#b+]{1,2})([0-9A-F]{1})/g;
        const commands = [];

        eigthLength = eigthLength || 200;
    
        [...song.matchAll(chunkRE)].forEach((item) => {
            switch(item[1])
            {
                case 'v':
                    kEvent.hold('CTRL');
                    break;
                case '^':
                    kEvent.hold(['SHIFT']);
                    break;
            }
    
            length = parseInt(item[3], 16) * eigthLength;
    
            if ('S' !== item[2])
            {
                kEvent.hold(notesToKeys[item[2]]);
            }
    
            kEvent.sleep(length);
    
            if ('S' !== item[2])
            {
                kEvent.release(notesToKeys[item[2]]);
            }
    
            switch(item[1])
            {
                case 'v':
                    kEvent.release('CTRL');
                    break;
                case '^':
                    kEvent.hold('SHIFT');
                    break;
            }
        });
    
        kEvent.emit();
    }
}

module.exports = MusicSequencer;