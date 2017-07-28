/*
* FastBase64 adapted from RIFFWAVE.js v0.03 - Audio encoder for HTML5 <audio> elements.
* Copyleft 2011 by Pedro Ladaria <pedro.ladaria at Gmail dot com>
* Public Domain
*/

/*
* Adaptation by Stephen C. Phillips, 2013-2017.
* Email: steve@scphillips.com
* Public Domain
*/

/**
 * Function to create a data URI.
 *
 * @example
 * import MorseCWWave from 'morse-pro-cw-wave';
 * import getDataURI from 'morse-pro-util-datauri';
 * import * as RiffWave from 'morse-pro-util-riffwave';
 * var morseCWWave = new MorseCWWave();
 * morseCWWave.translate("abc");
 * var audio = new Audio(getDataURI(RiffWave.getData(morseCWWave), RiffWave.getMIMEType())); // create an HTML5 audio element
 */
var Base64 = {

    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],

    init: function() {
        for (var i = 0; i < 4096; i++) {
            this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3F];
        }
    },

    encode: function(src) {
        var len = src.length;
        var dst = '';
        var i = 0;
        var n;
        while (len > 2) {
            n = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2];
            dst += this.encLookup[n >> 12] + this.encLookup[n & 0xFFF];
            len -= 3;
            i += 3;
        }
        if (len > 0) {
            var n1 = (src[i] & 0xFC) >> 2;
            var n2 = (src[i] & 0x03) << 4;
            if (len > 1) n2 |= (src[++i] & 0xF0) >> 4;
            dst += this.chars[n1];
            dst += this.chars[n2];
            if (len == 2) {
                var n3 = (src[i++] & 0x0F) << 2;
                n3 |= (src[i] & 0xC0) >> 6;
                dst += this.chars[n3];
            }
            if (len == 1) dst += '=';
            dst += '=';
        }
        return dst;
    }
};
Base64.init();

/**
 * @param {number[]} data - list of bytes to encode
 * @param {string} type - MIME-type of the data
 * @return {string}
 */
export default function getDataURI(data, type) {
    return 'data:' + type + ';base64,' + Base64.encode(data);
}
