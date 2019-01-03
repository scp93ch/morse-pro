/*!
This code is © Copyright Stephen C. Phillips, 2018.
Email: steve@scphillips.com
*/
/*
Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/

import * as WPM from './morse-pro-wpm';
import MorseDecoder from './morse-pro-decoder';
import MorsePlayerWAA from './morse-pro-player-waa';

/**
 * The Morse keyer tests for input on a timer, plays the appropriate tone and passes the data to a decoder.
 *
 * @example
 * var ditKey = 90;  // Z
 * var dahKey = 88;  // X
 * window.onkeyup = function(e) {
 *     if (e.keyCode === ditKey) { dit = false; }
 *     if (e.keyCode === dahKey) { dah = false; }
 * };
 * window.onkeydown = function(e) {
 *     var wasMiddle = !dit & !dah;
 *     if (e.keyCode === ditKey) { dit = true; }
 *     if (e.keyCode === dahKey) { dah = true; }
 *     if (wasMiddle & (dit | dah)) { keyer.start(); }
 * };
 * var keyCallback = function() {
 *     return ((dit === true) * 1) + ((dah === true) * 2);
 * };
 * var messageCallback = function(d) {
 *     console.log(d.message);
 * };
 * keyer = new MorseKeyer(keyCallback, 20, 20, 550, messageCallback);
 */
export default class MorseKeyer {
    /**
     * @param {function(): number} keyCallback - A function which should return 0, 1, 2, or 3 from the vitual "paddle" depending if nothing, a dit, a dah or both is detected. This implementation will play dits if both keys are detected.
     * @param {number} [wpm=20] - Speed of the keyer.
     * @param {number} [fwpm=wpm] - Farnsworth speed of the keyer.
     * @param {number} [frequency=550] - The frequency in Hz for the sidetone.
     * @param {function()} messageCallback - A function called with {message: string, timings: number[], morse: string} for each decoded part (see MorseDecoder). Its use here will result in a single character being returned each time.
     */
    constructor(keyCallback, wpm = 20, fwpm = wpm, frequency = 550, messageCallback = undefined) {
        this.keyCallback = keyCallback;
        this.wpm = wpm;
        this.fwpm = fwpm;

        this.player = new MorsePlayerWAA();
        this.player.frequency = frequency;
        this.decoder = new MorseDecoder(this.wpm, this.fwpm, messageCallback);
        this.decoder.noiseThreshold = 0;

        this.ditLen = WPM.ditLength(wpm);  // duration of dit in ms
        this.fditLen = WPM.fditLength(wpm, fwpm);  // TODO: finish fwpm bit
        this._state = { playing: false };
    }

    /**
     * @access: private
     */
    _check() {
        var key = this.keyCallback();
        var ditOrDah = this._ditOrDah(key);
        var beepLen;  // length of beep
        var silenceLen;  // length of silence
        var now = (new Date()).getTime();

        if (this._state.lastTime !== undefined) {
            this.decoder.addTiming(this._state.lastTime - now);  // add how long since we've last been here as silence
        }
        if (ditOrDah === undefined) {
            // If no keypress is detected then continue pushing chunks of silence to the decoder to complete the character and add a space
            beepLen = 0;
            this._state.playing = false;  // make it interupterable: means that a new char can start whenever
            switch (this._state.spaceCounter) {
                case 0:
                    // we've already waited 1 ditLen, need to make it 1 fditLen plus 2 more
                    silenceLen = (this.fditLen - this.ditLen) + (2 * this.fditLen);
                    break;
                case 1:
                    silenceLen = (4 * this.fditLen);
                    break;
                case 2:
                    silenceLen = 0;
                    this.stop();
                    break;
            }
            this._state.spaceCounter++;
        } else {
            this._state.spaceCounter = 0;
            beepLen = (ditOrDah ? 1 : 3) * this.ditLen;
            this._playTone(beepLen);
            this.decoder.addTiming(beepLen);
            silenceLen = this.ditLen;  // while playing, assume we are inside a char and so wait 1 ditLen
        }
        this._state.lastTime = now + beepLen;
        if (beepLen + silenceLen) this.timer = setTimeout(this._check.bind(this), beepLen + silenceLen);  // check key state again after the dit or dah and after a dit-space
    }

    /**
     * Translate key input into whether to play nothing, dit, or dah
     * @returns undefined, true or false for nothing, dit or dah
     * @access: private
     */
    _ditOrDah(input) {
        if (input & 1) {
            return true;
        } else if (input === 2) {
            return false;
        } else {
            return undefined;
        }
    }

    /**
     * Call this method when an initial key-press (or equivalent) is detected.
     */
    start() {
        if (this._state.playing) {
            // If the keyer is already playing then ignore a new start.
            return;
        } else {
            this._state.playing = true;
            this._state.spaceCounter = 0;
            this._state.lastTime = undefined;  // removes extended pauses
            clearTimeout(this.timer);
            this._check();
        }
    }

    /**
     * This method can be called externally to stop the keyer but is also used internally when no key-press is detected.
     */
    stop() {
        this._state.playing = false;
        clearTimeout(this.timer);
    }

    /**
     * Play a dit or dah sidetone.
     * @param {number} duration - number of milliseconds to play
     * @access: private
     */
    _playTone(duration) {
        this.player.load([duration]);
        this.player.playFromStart();
    }
}
