/*
This code is © Copyright Stephen C. Phillips, 2018.
Email: steve@scphillips.com

Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/

import * as Morse from './morse-pro';
import * as WPM from './morse-pro-wpm';

/**
 * Class to convert from timings to Morse code.
 *
 * @example
 * // The messageCallback is called when a character or more is decoded
 * // It receives a dictionary of the timings, morse, and the message
 * var messageCallback = function(data) {
 *     console.log("Decoded: {\n  timings: " + data.timings + "\n  morse: " + data.morse + "\n  message: " + data.message + "\n}");
 * }
 * var decoder = new MorseDecoder(10);
 * decoder.messageCallback = messageCallback;
 * var t;
 * while (decoder_is_operating) {
 *     // get some timing "t" from a sensor, make it +ve for noise and -ve for silence
 *     decoder.addTiming(t);
 * }
 * decoder.flush();  // make sure all the data is pushed through the decoder
 */
export default class MorseDecoder {
    /**
     * @param {number} [wpm=20] - The speed of the Morse in words per minute.
     * @param {number} [fwpm=wpm] - The Farnsworth speed of the Morse in words per minute.
     * @param {function()} messageCallback - Callback executed with {message: string, timings: number[], morse: string} when decoder buffer is flushed (every character).
     * @param {function()} speedCallback - Callback executed with {wpm: number, fwpm: number} if the wpm or fwpm speed changes. The speed in this class doesn't change by itself, but e.g. the fwpm can change if wpm is changed. Returned dictionary has keys 'fwpm' and 'wpm'.
    */
    constructor(wpm = 20, fwpm = wpm, messageCallback = undefined, speedCallback = undefined) {
        this._wpm = undefined;
        this._fwpm = undefined;  // farnsworth speed
        this._ditLen = undefined;
        this._fditLen = undefined;
        this.defaults = {
            wpm: 20,
            fwpm: 20
        };
        this.wpm = wpm;
        this.fwpm = fwpm;
        if (messageCallback !== undefined) this.messageCallback = messageCallback;
        if (speedCallback !== undefined) this.speedCallback = speedCallback;  // function receives dictionary with wpm and fwpm set when the speed changes
        this.timings = [];  // all the ms timings received, all +ve
        this.characters = [];  // all the decoded characters ('.', '-', etc)
        this.unusedTimes = [];
        this.noiseThreshold = 1;  // a duration <= noiseThreshold is assumed to be an error
        this.morse = "";  // string of morse
        this.message = "";  // string of decoded message
    }

    /**
     * @access private
     */
    updateThresholds() {
        this._ditDahThreshold = ((1 * this._ditLen) + (3 * this._ditLen)) / 2;
        this._dahSpaceThreshold = ((3 * this._fditLen) + (7 * this._fditLen)) / 2;
    }

    /**
     * Should be set to the WPM speed of the input sound.
     * The input data is validated and this.defaults.wpm will be used if there is an error in input.
     * The private _fwpm, _ditLen and _fditLen variables are also updated and the speedCallback is executed.
     * @param {number} wpm - Speed in words per minute.
     */
    set wpm(wpm) {
        if (isNaN(wpm)) wpm = this.defaults.wpm;
        wpm = Math.max(wpm, 1);
        this._wpm = wpm;
        if (this._fwpm === undefined || this._fwpm > wpm) {
            this._fwpm = this._wpm;
        }
        this._ditLen = WPM.ditLength(this._wpm);
        this._fditLen = WPM.fditLength(this._wpm, this._fwpm);
        this.updateThresholds();
        this.speedCallback({wpm: this.wpm, fwpm: this.fwpm});
    }

    get wpm() {
        return this._wpm;
    }

    /**
     * Should be set to the Farnsworth WPM speed of the input sound.
     * The input data is validated and this.defaults.fwpm will be used if there is an error in input.
     * The private _wpm, _ditLen and _fditLen variables are also updated and the speedCallback is executed.
     * @param {number} fwpm - Speed in words per minute.
     */
    set fwpm(fwpm) {
        if (isNaN(fwpm)) fwpm = this.defaults.fwpm;
        fwpm = Math.max(fwpm, 1);
        this._fwpm = fwpm;
        if (this._wpm === undefined || this._wpm < fwpm) {
            this.wpm = fwpm;
        }
        this._ditLen = WPM.ditLength(this._wpm);
        this._fditLen = WPM.fditLength(this._wpm, this._fwpm);
        this.updateThresholds();
        this.speedCallback({wpm: this.wpm, fwpm: this.fwpm});
    }

    get fwpm() {
        return this._fwpm;
    }

    /**
     * Set the length of a dit the decoder will look for.
     * The private _wpm, _fwpm, and _fditLen variables are also updated.
     * @param {number} dit - Length of a dit in ms.
     */
    set ditLen(dit) {
        this._ditLen = dit;
        if (this._fditLen === undefined || this._fditLen < this._ditLen) {
            this._fditLen = this._ditLen;
        }
        this._wpm = WPM.wpm(this._ditLen);
        this._fwpm = WPM.fwpm(this._wpm, this._fditLen / this._ditLen);
        this.updateThresholds();
    }

    get ditLen() {
        return this._ditLen;
    }

    /**
     * Set the length of a Farnsworth dit the decoder will look for.
     * The private _wpm, _fwpm, and _ditLen variables are also updated.
     * @param {number} dit - Length of a Farnsworth dit in ms.
     */
    set fditLen(fdit) {
        this._fditLen = fdit;
        if (this._ditLen === undefined || this._ditLen > this._fditLen) {
            this._ditLen = this._fditLen;
        }
        this._wpm = WPM.wpm(this._ditLen);
        this._fwpm = WPM.fwpm(this._wpm, this._fditLen / this._ditLen);
        this.updateThresholds();
    }

    get fditLen() {
        return this._fditLen;
    }

    /**
     * Add a timing in ms to the list of recorded timings.
     * The duration should be positive for a dit or dah and negative for a space.
     * If the duration is <= noiseThreshold it is assumed to be noise and is added to the previous duration.
     * If a duration is the same sign as the previous one then they are combined.
     * @param {number} duration - millisecond duration to add, positive for a dit or dah, negative for a space
     */
    addTiming(duration) {
        // console.log("Received: " + duration);
        if (duration === 0) {
            return;
        }
        if (this.unusedTimes.length > 0) {
            var last = this.unusedTimes[this.unusedTimes.length - 1];
            if (duration * last > 0) {
                // if the sign of the duration is the same as the previous one then add it on
                this.unusedTimes.pop();
                duration = last + duration;
            } else if (Math.abs(duration) <= this.noiseThreshold) {
                // if the duration is very short, assume it is a mistake and add it to the previous one
                this.unusedTimes.pop();
                duration = last - duration;  // take care of the sign change
            }
        }

        this.unusedTimes.push(duration);

        // If we have just received a character space or longer then flush the timings
        if (-duration >= this._ditDahThreshold) {
            // TODO: if fwpm != wpm then the ditDahThreshold only applies to sound, not spaces so this is slightly wrong (need another threshold)
            this.flush();
        }
    }

    /**
     * Process the buffer of unused timings, converting them into Morse and converting the generated Morse into a message.
     * Should be called only when a character space has been reached (or the message is at an end).
     * Will call the messageCallback with the latest timings, morse (dots and dashes) and message.
     */
    flush() {
        // Then we've reached the end of a character or word or a flush has been forced

        // If the last character decoded was a space then just ignore additional quiet
        if (this.message[this.message.length - 1] === ' ') {
            if (this.unusedTimes[0] < 0) {
                this.unusedTimes.shift();
            }
        }

        // Make sure there is (still) something to decode
        if (this.unusedTimes.length === 0) {
            return;
        }

        // If last element is quiet but it is not enough for a space character then pop it off and replace afterwards
        var last = this.unusedTimes[this.unusedTimes.length - 1];
        if ((last < 0) && (-last < this._dahSpaceThreshold)) {
            this.unusedTimes.pop();
        }

        var u = this.unusedTimes;
        var m = this.timings2morse(this.unusedTimes);
        var t = Morse.morse2text(m).message;  // will be '#' if there's an error
        this.morse += m;
        this.message += t;
        if (last < 0) {
            this.unusedTimes = [last];  // put the space back on the end in case there is more quiet to come
        } else {
            this.unusedTimes = [];
        }
        this.messageCallback({
            timings: u,
            morse: m,
            message: t
        });
    }

    /**
     * Convert from millisecond timings to dots and dashes.
     * @param {number[]} times - array of millisecond timings, +ve numbers representing a signal, -ve representing a space.
     * @return {string} - the dots and dashes as a string.
     * @access private
     */
    timings2morse(times) {
        var ditdah = "";
        var c;
        var d;

        for (var i = 0; i < times.length; i++) {
            d = times[i];
            if (d > 0) {
                if (d < this._ditDahThreshold) {
                    c = ".";
                } else {
                    c = "-";
                }
            } else {
                d = -d;
                if (d < this._ditDahThreshold) {
                    c = "";
                } else if (d < this._dahSpaceThreshold) {
                    c = " ";
                } else {
                    c = "/";
                }
            }
            this.addDecode(d, c);
            ditdah = ditdah + c;
        }
        return ditdah;
    }

    /**
     * Store the timing and the corresponding decoded character element.
     * @param {number} duration - the millisecond duration (always +ve).
     * @param {string} character - the corresponding character element [.-/ ].
     * @access private
     */
    addDecode(duration, character) {
        this.timings.push(duration);
        this.characters.push(character);
    }

    /**
     * @access private
     */
    getTimings(character) {
        var ret = [];
        for (var i = 0; i < this.timings.length; i++) {
            if (this.characters[i] === character) {
                ret.push(this.timings[i]);
            }
        }
        return ret;
    }

    /**
     * Get the millisecond timings of all durations determined to be dits
     * @return {number[]}
     */
    get dits() {
        return this.getTimings('.');
    }

    /**
     * Get the millisecond timings of all durations determined to be dahs
     * @return {number[]}
     */
    get dahs() {
        return this.getTimings('-');
    }

    /**
     * Get the millisecond timings of all durations determined to be dit-spaces
     * @return {number[]}
     */
    get ditSpaces() {
        return this.getTimings('');
    }

    /**
     * Get the millisecond timings of all durations determined to be dah-spaces
     * @return {number[]}
     */
    get dahSpaces() {
        return this.getTimings(' ');
    }

    /**
     * Get the millisecond timings of all durations determined to be spaces
     * @return {number[]}
     */
    get spaces() {
        return this.getTimings('/');
    }

    messageCallback(jsonData) { }
    speedCallback(jsonData) { }
}
