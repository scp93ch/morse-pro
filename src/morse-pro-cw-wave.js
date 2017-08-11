/*
This code is © Copyright Stephen C. Phillips, 2017.
Email: steve@scphillips.com

Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/

import MorseCW from './morse-pro-cw';

/**
 * Class to create sine-wave samples of standard CW Morse.
 *
 * @example
 * import MorseCWWave from 'morse-pro-cw-wave';
 * var morseCWWave = new MorseCWWave();
 * morseCWWave.translate("abc");
 * var sample = morseCWWave.getSample();
 */
export default class MorseCWWave extends MorseCW {
    /**
     * @param {number} [frequency=550] - frequency of wave in Hz
     * @param {number} [sampleRate=8000] - sample rate for the waveform in Hz
     */
    constructor(useProsigns, wpm, fwpm, frequency = 550, sampleRate = 8000) {
        super(useProsigns, wpm, fwpm);
        /** @type {number} */
        this.frequency = frequency;  // frequency of wave in Hz
        /** @type {number} */
        this.sampleRate = sampleRate;  // sample rate for the waveform in Hz
    }

    /**
     * @return {number[]} an array of floats in range is [-1, 1] representing the wave-form, suitable for XAudioJS.
     */
    getSample() {
        var sample = [];
        var timings = this.getTimings();
        if (timings.length === 0) {
            return [];
        }
        var counterIncrementAmount = Math.PI * 2 * this.frequency / this.sampleRate;
        var on = timings[0] > 0 ? 1 : 0;
        for (var t = 0; t < timings.length; t += 1) {
            var duration = this.sampleRate * Math.abs(timings[t]) / 1000;
            for (var i = 0; i < duration; i += 1) {
                sample.push(on * Math.sin(i * counterIncrementAmount));
            }
            on = 1 - on;
        }
        console.log("Sample length: " + sample.length);
        return sample;
    }

    /**
     * @return {number[]} an array of integers in range [0, 256] representing the wave-form. 8-bit unsigned PCM format.
     */
    getPCMSample() {
        var pcmSample = [];
        var sample = this.getSample();
        for (var i = 0; i < sample.length; i += 1) {
            pcmSample.push(128 + Math.round(127 * sample[i]));
        }
        return pcmSample;
    }
}
