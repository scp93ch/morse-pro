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

import MorsePlayerWAA from './morse-pro-player-waa';

/**
 * Web browser sound player using Web Audio API.
 * Extends MorsePlayerWAA to provide callbacks when the sound goes on or off.
 * Can be used to turn a light on or off in time with the Morse sound.
 * The callbacks have an error of +/- 2.6ms
 *
 * @example
 * import MorseCWWave from 'morse-pro-cw-wave';
 * import MorsePlayerWAALight from 'morse-pro-player-waa-light';
 * var morseCWWave = new MorseCWWave();
 * morseCWWave.translate("abc");
 * var morsePlayerWAALight = new MorsePlayerWAALight();
 * morsePlayerWAALight.soundOnCallback = lightOn;
 * morsePlayerWAALight.soundOffCallback = lightOff;
 * morsePlayerWAALight.soundStoppedCallback = soundStopped;
 * morsePlayerWAALight.volume = 0;
 * morsePlayerWAALight.loadCWWave(morseCWWave);
 * morsePlayerWAA.playFromStart();
 */
export default class MorsePlayerWAALight extends MorsePlayerWAA {
    /**
     * @param {function()} sequenceStartCallback - function to call each time the sequence starts.
     * @param {function()} sequenceEndingCallback - function to call when the sequence is nearing the end.
     * @param {function()} soundStoppedCallback - function to call when the sequence stops.
     * @param {function()} soundOnCallback - function to call wth the note number as the argument when a beep starts.
     * @param {function()} soundOffCallback - function to call with the note number as the argument when a beep stops.
     */
    constructor(sequenceStartCallback, sequenceEndingCallback, soundStoppedCallback, soundOnCallback, soundOffCallback) {
        super(sequenceStartCallback, sequenceEndingCallback, soundStoppedCallback);
        if (soundOnCallback !== undefined) this.soundOnCallback = soundOnCallback;
        if (soundOffCallback !== undefined) this.soundOffCallback = soundOffCallback;
        this._wasOn = false;
        this._count = 0;
    }

    /**
     * Set up the audio graph, connecting the splitter node to a JSNode in order to analyse the waveform
     * @access: private
     * @override
     */
    _initialiseAudioNodes() {
        super._initialiseAudioNodes();
        this.jsNode = this.audioContext.createScriptProcessor(256, 1, 1);
        this.jsNode.connect(this.audioContext.destination);  // otherwise Chrome ignores it
        this.jsNode.onaudioprocess = this._processSound.bind(this);
        this.splitterNode.connect(this.jsNode);
    }

    /**
     * @override
     */
    load(timings) {
        this._timings = timings;
        super.load(timings);
    }

    /**
     * @access: private
     */
    _processSound(event) {
        var input = event.inputBuffer.getChannelData(0);
        var sum = 0;
        for (var i = 0; i < input.length; i++) {
            sum += Math.abs(input[i]) > 0;
        }
        var on = (sum > 128);  // is more than half the buffer non-zero?
        if (on && !this._wasOn) {
            this._on();
        } else if (!on && this._wasOn) {
            this._off();
        }
        this._wasOn = on;
    }

    /**
     * @access: private
     * @override
     */
    _on() {
        this.soundOnCallback(this._timings[this._count]);
        this._count = (this._count + 1) % this._timings.length;
    }

    /**
     * @access: private
     * @override
     */
    _off() {
        this.soundOffCallback(this._timings[this._count]);
        this._count = (this._count + 1) % this._timings.length;
    }

    /**
     * @returns {number} representing this audio player type: 5
     * @override
     */
    get audioType() {
        return 5;
        // 5: Web Audio API using oscillators and light control
        // 4: Web Audio API using oscillators
        // 3: Audio element using media stream worker (using PCM audio data)
        // 2: Flash (using PCM audio data)
        // 1: Web Audio API with webkit and native support (using PCM audio data)
        // 0: Audio element using Mozilla Audio Data API (https://wiki.mozilla.org/Audio_Data_API) (using PCM audio data)
        // -1: no audio support
    }

    // empty callbacks in case user does not define any
    soundOnCallback(noteNumber) { }
    soundOffCallback(noteNumber) { }
}
