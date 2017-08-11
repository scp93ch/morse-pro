/*
This code is © Copyright Stephen C. Phillips, 2017.
Email: steve@scphillips.com

Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/

import MorsePlayerWAA from './morse-pro-player-waa';

/**
 * Web browser sound player using Web Audio API.
 * Extends MorsePlayerWAA to provide callbacks when the sound goes on or off and when the sound ends.
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
     * @param {function()} soundOnCallback - function to call when a beep starts.
     * @param {function()} soundOffCallback - function to call when a beep stops.
     * @param {function()} soundStoppedCallback - function to call when the sequence stops.
     */
    constructor(soundOnCallback, soundOffCallback, soundStoppedCallback) {
        super();
        if (soundOnCallback !== undefined) this.soundOnCallback = soundOnCallback;
        if (soundOffCallback !== undefined) this.soundOffCallback = soundOffCallback;
        if (soundStoppedCallback !== undefined) this.soundStoppedCallback = soundStoppedCallback;
        this.wasOn = false;
        this.offCount = 0;
    }

    /**
     * @access: private
     * @override
     */
    initialiseAudioNodes() {
        super.initialiseAudioNodes();
        this.jsNode = this.audioContext.createScriptProcessor(256, 1, 1);
        this.jsNode.connect(this.audioContext.destination);  // otherwise Chrome ignores it
        this.jsNode.onaudioprocess = this.processSound.bind(this);
        this.splitterNode.connect(this.jsNode);
    }

    /**
     * @override
     */
    playFromStart() {
        this.offCount = 0;
        super.playFromStart();
    }

    /**
     * @access: private
     */
    processSound(event) {
        var input = event.inputBuffer.getChannelData(0);
        var sum = 0;
        for (var i = 0; i < input.length; i++) {
            sum += Math.abs(input[i]) > 0;
        }
        var on = (sum > 128);  // is more than half the buffer non-zero?
        if (on && !this.wasOn) {
            this.soundOnCallback();
        } else if (!on && this.wasOn) {
            this.off();
        }
        this.wasOn = on;
    }

    /**
     * @access: private
     * @override
     */
    off() {
        this.offCount++;
        this.soundOffCallback();
        if (this.offCount * 2 === this.timings.length + 1) {
            this.soundStoppedCallback();
        }
    }

    // empty callbacks in case user does not define any
    soundOnCallback() { }
    soundOffCallback() { }
    soundStoppedCallback() { }
}
