/*
* RIFFWAVE adapted from RIFFWAVE.js v0.03 - Audio encoder for HTML5 <audio> elements.
* Copyleft 2011 by Pedro Ladaria <pedro.ladaria at Gmail dot com>
* Public Domain
*/

/*
* Adaptation by Stephen C. Phillips, 2013-2017.
* Email: steve@scphillips.com
* Public Domain
*/

/**
 * Utility to create RIFF WAVE file data.
 *
 * @example
 * import MorseCWWave from 'morse-pro-cw-wave';
 * import * as RiffWave from 'morse-pro-util-riffwave';
 * var morseCWWave = new MorseCWWave();
 * morseCWWave.translate("abc");
 * var wav = RiffWave.getData(morseCWWave);  // returns byte array of WAV file
 */
var u32ToArray = function(i) {
    return [i&0xFF, (i>>8)&0xFF, (i>>16)&0xFF, (i>>24)&0xFF];
};

var u16ToArray = function(i) {
    return [i&0xFF, (i>>8)&0xFF];
};

var split16bitArray = function(data) {
    var r = [];
    var j = 0;
    var len = data.length;
    for (var i=0; i<len; i++) {
        r[j++] = data[i] & 0xFF;
        r[j++] = (data[i]>>8) & 0xFF;
    }
    return r;
};

/**
 * Convert PCM data to WAV file data.
 * @param {Object} morseCWWave - a MorseCWWave instance
 * @param {number} bitsPerSample - number of bits to use per sample (8 or 16), default is 8
 * @return {number[]}
 */
export function getData(morseCWWave, bitsPerSample = 8) {
    var data = morseCWWave.getPCMSample();
    var sampleRate = morseCWWave.sampleRate;

    var header = {                            // OFFS SIZE NOTES
        chunkId      : [0x52,0x49,0x46,0x46], // 0    4    "RIFF" = 0x52494646
        chunkSize    : 0,                     // 4    4    36+SubChunk2Size = 4+(8+SubChunk1Size)+(8+SubChunk2Size)
        format       : [0x57,0x41,0x56,0x45], // 8    4    "WAVE" = 0x57415645
        subChunk1Id  : [0x66,0x6d,0x74,0x20], // 12   4    "fmt " = 0x666d7420
        subChunk1Size: 16,                    // 16   4    16 for PCM
        audioFormat  : 1,                     // 20   2    PCM = 1
        numChannels  : 1,                     // 22   2    Mono = 1, Stereo = 2...
        sampleRate   : sampleRate,            // 24   4    8000, 44100...
        byteRate     : 0,                     // 28   4    SampleRate*NumChannels*BitsPerSample/8
        blockAlign   : 0,                     // 32   2    NumChannels*BitsPerSample/8
        bitsPerSample: bitsPerSample,         // 34   2    8 bits = 8, 16 bits = 16
        subChunk2Id  : [0x64,0x61,0x74,0x61], // 36   4    "data" = 0x64617461
        subChunk2Size: 0                      // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
    };

    header.blockAlign = (header.numChannels * header.bitsPerSample) >> 3;
    header.byteRate = header.blockAlign * header.sampleRate;
    header.subChunk2Size = data.length * (header.bitsPerSample >> 3);
    header.chunkSize = 36 + header.subChunk2Size;

    return header.chunkId.concat(
        u32ToArray(header.chunkSize),
        header.format,
        header.subChunk1Id,
        u32ToArray(header.subChunk1Size),
        u16ToArray(header.audioFormat),
        u16ToArray(header.numChannels),
        u32ToArray(header.sampleRate),
        u32ToArray(header.byteRate),
        u16ToArray(header.blockAlign),
        u16ToArray(header.bitsPerSample),
        header.subChunk2Id,
        u32ToArray(header.subChunk2Size),
        (header.bitsPerSample == 16) ? split16bitArray(data) : data
    );
}

export function getMIMEType() {
    return "audio/wav";
}
