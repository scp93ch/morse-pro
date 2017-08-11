/*
This code is © Copyright Stephen C. Phillips, 2017.
Email: steve@scphillips.com

Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/

import * as WPM from './morse-pro-wpm';
import MorseMessage from './morse-pro-message';

/**
 * Class to create the on/off timings needed by e.g. sound generators. Timings are in milliseconds; "off" timings are negative.
 *
 * @example
 * import MorseCW from 'morse-pro-cw';
 * var morseCW = new MorseCW();
 * morseCW.translate("abc");
 * var timings = morseCW.getTimings();
 */
export default class MorseCW extends MorseMessage {
    /**
     * @param {number} wpm - the speed in words per minute using PARIS as the standard word
     * @param {number} fwpm - the Farnsworth speed in words per minute (defaults to wpm)
     */
    constructor(useProsigns, wpm = 20, fwpm = wpm) {
        super(useProsigns);
        /** @type {number} */
        this.wpm = wpm;
        /** @type {number} */
        this.fwpm = fwpm;
    }

    /** @type {number} */
    set wpm(wpm) {
        this._wpm = wpm;
        if (wpm < this._fwpm) {
            this._fwpm = wpm;
        }
    }

    /** @type {number} */
    get wpm() {
        return this._wpm;
    }

    /** @type {number} */
    set fwpm(fwpm) {
        this._fwpm = fwpm;
        if (fwpm > this._wpm) {
            this._wpm = fwpm;
        }
    }

    /** @type {number} */
    get fwpm() {
        return this._fwpm;
    }

    /**
     * Convert a morse string into an array of millisecond timings.
     * With the Farnsworth method, the morse characters are played at one
     * speed and the spaces between characters at a slower speed.
     * @return {number[]}
     */
    getTimings() {
        var dit = WPM.ditLength(this._wpm);
        var r = WPM.ratio(this._wpm, this._fwpm);
        // slow down the spaces by this ratio
        return this.getTimingsGeneral(dit, 3 * dit, dit, 3 * dit * r, 7 * dit * r);
    }

    /**
     * Convert a morse string into an array of millisecond timings.
     * @param {number} dit - the length of a dit in milliseconds
     * @param {number} dah - the length of a dah in milliseconds (normally 3 * dit)
     * @param {number} ditSpace - the length of an intra-character space in milliseconds (1 * dit)
     * @param {number} charSpace - the length of an inter-character space in milliseconds (normally 3 * dit)
     * @param {number} wordSpace - the length of an inter-word space in milliseconds (normally 7 * dit)
     * @return {number[]}
     * @TODO make a class method?
     */
    getTimingsGeneral(dit, dah, ditSpace, charSpace, wordSpace) {
        //console.log("Morse: " + this.morse);

        if (this.hasError) {
            console.log("Error in message, cannot compute timings: " + this.morse);
            return [];  // TODO: or throw exception?
        }
        var morse = this.morse.replace(/ \/ /g, '/');  // this means that a space is only used for inter-character
        var times = [];
        var c;
        for (var i = 0; i < morse.length; i++) {
            c = morse[i];
            if (c == "." || c == '-') {
                if (c == '.') {
                    times.push(dit);
                } else  {
                    times.push(dah);
                }
                times.push(-ditSpace);
            } else if (c == " ") {
                times.pop();
                times.push(-charSpace);
            } else if (c == "/") {
                times.pop();
                times.push(-wordSpace);
            }
        }
        if (times[times.length - 1] == -ditSpace) {
            times.pop();  // take off the last ditSpace
        }
        //console.log("Timings: " + times);
        return times;
    }

    /**
     * Get the total duration of the message in ms
     8 @return {number}
     */
    getDuration() {
        var times = this.getTimings();
        var t = 0;
        for (var i = 0; i < times.length; i++) {
            t += Math.abs(times[i]);
        }
        return t;
    }
}
