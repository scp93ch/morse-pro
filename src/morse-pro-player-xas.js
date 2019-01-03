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

/**
 * Web browser sound player for older browsers, using XAudioJS by Grant Galitz (https://github.com/taisel/XAudioJS).
 *
 * @example
 * import MorseCWWave from 'morse-pro-cw-wave';
 * import MorsePlayerXAS from 'morse-pro-player-xas';
 * // make sure XAudioJS is loaded
 * var morseCWWave = new MorseCWWave();
 * morseCWWave.translate("abc");
 * var morsePlayerXAS = new MorsePlayerXAS(XAudioServer);
 * morsePlayerXAS.load(morseCWWave);
 * morsePlayerXAS.playFromStart();
 */
export default class MorsePlayerXAS {
    /**
     * @param {Object} xaudioServerClass - the XAudioServer class
     */
    constructor(xaudioServerClass) {
        this.xaudioServerClass = xaudioServerClass;
        this._isPlaying = false;
        this.sample = [];
        this._volume = 1;
        this.samplePos = undefined;
        this.noAudio = false;
        this.audioServer = undefined;
        this.sampleRate = undefined;
        this.sample = undefined;

        var that = this;  // needed so that the 3 closures defined here keep a reference to this object

        // XAudioJS callback to get more samples for buffer
        this.audioGenerator = function(samplesToGenerate) {
            if (samplesToGenerate === 0) {
                return [];
            }
            var ret;
            samplesToGenerate = Math.min(samplesToGenerate, that.sample.length - that.samplePos);
            if (samplesToGenerate > 0) {
                ret = that.sample.slice(that.samplePos, that.samplePos + samplesToGenerate);
                that.samplePos += samplesToGenerate;
                return ret;
            } else {
                that._isPlaying = false;
                return [];
            }
        };

        // XAudioJS failure callback
        this.failureCallback = function() {
            that.noAudio = true;
        };

        setInterval(
            function () {
                // Runs the check to see if we need to give more audio data to the lib
                if (that._isPlaying) {
                    that.audioServer.executeCallback();
                }
            }, 20
        );

        this.load();  // create an xAudioServer so that we know if it works at all and what type it is
    }

    /**
     * Set the volume for the player
     * @param {number} v - the volume, clamped to [0,1]
     */
    set volume(v) {
        this._volume = Math.min(Math.max(v, 0), 1);
    }

    /**
     * @returns {number} the current volume [0,1]
     */
    get volume() {
        return this._volume;
    }

    stop() {
        this._isPlaying = false;
        this.audioServer.changeVolume(0);
    }

    /**
     * Convenience method to help playing directly from a MorseCWWave instance.
     * @param {Object} cwWave - a MorseCWWave instance
     */
    loadCWWave(cwWave) {
        this.load(cwWave.getSample(), cwWave.sampleRate);
    }

    load(sample, sampleRate) {
        this.sampleRate = sampleRate || 8000;
        this.sample = (sample || []);

        var silence = [];
        for (var i = 0; i < this.sampleRate; i += 1) {
            silence.push(0.0);
        }
        this.sample = this.sample.concat(silence);  // add on a second of silence to the end to keep IE quiet

        console.log("Trying XAudioServer");

        this.audioServer = new this.xaudioServerClass(
            1,                      // number of channels
            this.sampleRate,        // sample rate
            this.sampleRate >> 2,   // buffer low point for underrun callback triggering
            this.sampleRate << 1,   // internal ring buffer size
            this.audioGenerator,    // audio refill callback triggered when samples remaining < buffer low point
            0,                      // volume
            this.failureCallback    // callback triggered when the browser is found to not support any audio API
        );
    }

    playFromStart() {
        this.stop();
        this._isPlaying = true;
        this.samplePos = 0;
        this.audioServer.changeVolume(this._volume);
    }

    hasError() {
        return this.noAudio;
    }

    get isPlaying() {
        return this._isPlaying;
    }

    get audioType() {
        return this.audioServer.audioType;
        // 3: Audio element using media stream worker
        // 2: Flash
        // 1: Web Audio API with webkit and native support
        // 0: Audio element using Mozilla Audio Data API (https://wiki.mozilla.org/Audio_Data_API)
        // -1: no audio support
    }
}
