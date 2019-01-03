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
 * Web browser sound player using Web Audio API.
 *
 * @example
 * import MorseCWWave from 'morse-pro-cw-wave';
 * import MorsePlayerWAA from 'morse-pro-player-waa';
 * var morseCWWave = new MorseCWWave();
 * morseCWWave.translate("abc");
 * var morsePlayerWAA = new MorsePlayerWAA();
 * morsePlayerWAA.loadCWWave(morseCWWave);
 * morsePlayerWAA.playFromStart();
 */
export default class MorsePlayerWAA {
    /**
     * @param {function()} sequenceStartCallback - function to call each time the sequence starts.
     * @param {function()} sequenceEndingCallback - function to call when the sequence is nearing the end.
     * @param {function()} soundStoppedCallback - function to call when the sequence stops.
     */
    constructor(sequenceStartCallback, sequenceEndingCallback, soundStoppedCallback) {
        if (sequenceStartCallback !== undefined) this.sequenceStartCallback = sequenceStartCallback;
        if (sequenceEndingCallback !== undefined) this.sequenceEndingCallback = sequenceEndingCallback;
        if (soundStoppedCallback !== undefined) this.soundStoppedCallback = soundStoppedCallback;
        this._noAudio = false;
        console.log("Trying Web Audio API (Oscillators)");
        this.audioContextClass = window.AudioContext || window.webkitAudioContext;
        if (this.audioContextClass === undefined) {
            this._noAudio = true;
            throw (new Error("No AudioContext class defined"));
        }

        this.loop = false;
        this.frequency = undefined;
        this.startPadding = 0;  // number of ms to wait before playing first note of initial sequence
        this.endPadding = 0;  // number of ms to wait at the end of a sequence before playing the next one (or looping)

        this._cTimings = [];
        this._isPlaying = false;
        this._isPaused = false;
        this._volume = 1;
        this._lookAheadTime = 0.1;  // seconds
        this._timerInterval = 0.05;  // seconds
        this._timer = undefined;
        this._stopTimer = undefined;
        this._notPlayedANote = true;
    }

    /**
     * Set up the audio graph
     * @access: private
     */
    _initialiseAudioNodes() {
        this.audioContext = new this.audioContextClass();
        this.splitterNode = this.audioContext.createGain();  // this node is here to attach other nodes to in subclass
        this.lowPassNode = this.audioContext.createBiquadFilter();
        this.lowPassNode.type = "lowpass";
        // TODO: remove this magic number and make the filter configurable?
        this.lowPassNode.frequency.setValueAtTime(this.frequency * 1.1, this.audioContext.currentTime);
        this.gainNode = this.audioContext.createGain();  // this node is actually used for volume
        this.volume = this._volume;
        this.splitterNode.connect(this.lowPassNode);
        this.lowPassNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        this._notPlayedANote = true;
    }

    /**
     * Set the volume for the player
     * @param {number} v - the volume, clamped to [0,1]
     */
    set volume(v) {
        this._volume = Math.min(Math.max(v, 0), 1);
        try {
            // multiply by 0.813 to reduce gain added by lowpass filter and avoid clipping
            this.gainNode.gain.setValueAtTime(0.813 * this._volume, this.audioContext.currentTime);
        } catch (ex) {
            // getting here means _initialiseAudioNodes() has not yet been called: that's okay
        }
    }

    /**
     * @returns {number} the current volume [0,1]
     */
    get volume() {
        return this._volume;
    }

    /**
     * Convenience method to help playing directly from a MorseCWWave instance. Uses the CWWave timings and frequency.
     * @param {Object} cwWave - a MorseCWWave instance
     */
    loadCWWave(cwWave) {
        this.load(cwWave.getTimings());
        this.frequency = cwWave.frequency;
    }

    /**
     * Load timing sequence, replacing any existing sequence.
     * If endPadding is non-zero then an appropriate pause is added to the end.
     * @param {number[]} timings - list of millisecond timings; +ve numbers are beeps, -ve numbers are silence
     */
    load(timings) {
        // TODO: undefined behaviour if this is called in the middle of a sequence

        // console.log('Timings: ' + timings);
        /*
            The ith element of the sequence starts at _cTimings[i] and ends at _cTimings[i+1] (in fractional seconds)
            It is a note (i.e. not silence) if isNote[i] === True
        */

        if (this.endPadding > 0) {
            timings.push(-this.endPadding);
        }

        this._cTimings = [0];
        this.isNote = [];
        for (var i = 0; i < timings.length; i++) {
            this._cTimings[i + 1] = this._cTimings[i] + Math.abs(timings[i]) / 1000;  // AudioContext runs in seconds not ms
            this.isNote[i] = timings[i] > 0;
        }
        this.sequenceLength = this.isNote.length;
    }

    /**
     * Convenience method to help playing directly from a MorseCWWave instance. Uses the CWWave timings.
     * @param {Object} cwWave - a MorseCWWave instance
     */
    loadNextCWWave(cwWave) {
        this.loadNext(cwWave.getTimings());
    }

    /**
     * Load timing sequence which will be played when the current sequence is completed (only one sequence is queued).
     * @param {number[]} timings - list of millisecond timings; +ve numbers are beeps, -ve numbers are silence
     */
    loadNext(timings) {
        this.upNext = timings;
    }

    /**
     * Plays the loaded timing sequence from the start, regardless of whether playback is ongoing or paused.
     */
    playFromStart() {
        // TODO: why do we have this method at all? Better just to have play() and if user needs playFromStart, just call stop() first?
        if (this._noAudio || this._cTimings.length === 0) {
            return;
        }
        this.stop();
        this._initialiseAudioNodes();
        this._nextNote = 0;
        this._isPlaying = true;
        this._isPaused = true;  // pretend we were paused so that play() "resumes" playback
        this.play();
    }

    /**
     * Starts or resumes playback of the loaded timing sequence.
     */
    play() {
        if (!this._isPlaying) {
            // if we're not actually playing then play from start
            this.playFromStart();
        }
        // otherwise we are resuming playback after a pause
        if (!this._isPaused) {
            // if we're not actually paused then do nothing
            return;
        }
        // otherwise we really are resuming playback (or pretending we are, and actually playing from start...)
        clearInterval(this._stopTimer);  // if we were going to send a soundStoppedCallback then don't
        clearInterval(this._startTimer);  // ditto
        clearInterval(this._timer);
        this._isPaused = false;
        // basically set the time base to now but 
        //    - to work after a pause: subtract the start time of the next note so that it will play immediately
        //    - to avoid clipping the very first note: add on startPadding if notPlayedANote
        this._tZero = this.audioContext.currentTime - 
            this._cTimings[this._nextNote] + 
            (this._notPlayedANote ? this.startPadding / 1000 : 0);
        // schedule the first note ASAP (directly) and then if there is more to schedule, set up an interval timer
        if (this._scheduleNotes()) {
            this._timer = setInterval(function() {
                this._scheduleNotes();
            }.bind(this), 1000 * this._timerInterval);  // regularly check to see if there are more notes to schedule
        }
    }

    /**
     * Pause playback (resume with play())
     */
    pause() {
        if (!this._isPlaying) {
            // if we're not actually playing then ignore this
            return;
        }
        this._isPaused = true;
        clearInterval(this._timer);

        // ensure that the next note that is scheduled is a beep, not a pause (to help sync with vibration patterns)
        if (!this.isNote[this._nextNote]) {

            this._nextNote++;

            // if we'e got to the end of the sequence, then loop or load next sequence as appropriate
            if (this._nextNote === this.sequenceLength) {
                if (this.loop || this.upNext !== undefined) {
                    this._nextNote = 0;
                    if (this.upNext !== undefined) {
                        this.load(this.upNext);
                        this.upNext = undefined;
                    }
                }
            }
        }
    }

    /**
     * Stop playback (calling play() afterwards will start from the beginning)
     */
    stop() {
        if (this._isPlaying) {
            this._isPlaying = false;
            this._isPaused = false;
            clearInterval(this._timer);
            clearInterval(this._stopTimer);
            clearInterval(this._startTimer);
            this.audioContext.close();
            this.soundStoppedCallback();
        }
    }

    /**
     * Schedule notes that start before now + lookAheadTime.
     * @return {boolean} true if there is more to schedule, false if sequence is complete
     * @access: private
     */
    _scheduleNotes() {
        // console.log('Scheduling:');
        var oscillator, start, end;
        var now = this.audioContext.currentTime;
        while (this._nextNote < this.sequenceLength && 
                (this._cTimings[this._nextNote] < now - this._tZero + this._lookAheadTime)) {
            this._notPlayedANote = false;
            // console.log('T: ' + Math.round(1000 * now)/1000 + ' (+' + Math.round(1000 * (now - this._tZero))/1000 + ')');
            // console.log(this._nextNote + ': ' + 
            //     (this.isNote[this._nextNote] ? 'Note  ' : 'Pause ') + 
            //     Math.round(1000 * this._cTimings[this._nextNote])/1000 + ' - ' + 
            //     Math.round(1000 * this._cTimings[this._nextNote + 1])/1000 + ' (' + 
            //     Math.round(1000 * (this._cTimings[this._nextNote + 1] - this._cTimings[this._nextNote]))/1000 + ')');
            if (this._nextNote === 0 && !this.sequenceStartCallbackFired) {
                // when scheduling the first note, schedule a callback as well
                this._startTimer = setTimeout(function() {
                    this.sequenceStartCallback();
                }.bind(this), 1000 * (this._tZero + this._cTimings[this._nextNote] - now));
                this.sequenceStartCallbackFired = true;
            }
            if (this.isNote[this._nextNote]) {
                start = this._tZero + this._cTimings[this._nextNote];
                end   = this._tZero + this._cTimings[this._nextNote + 1];
                this._soundEndTime = end;  // we need to store this for the stop() callback
                oscillator = this.audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(this.frequency, start);
                oscillator.start(start);
                oscillator.stop(this._soundEndTime);
                oscillator.connect(this.splitterNode);
            }

            this._nextNote++;

            if (this._nextNote === this.sequenceLength) {
                if (this.loop || this.upNext !== undefined) {
                    // increment time base to be the absolute end time of the final element in the sequence
                    this._tZero += this._cTimings[this._nextNote];
                    this._nextNote = 0;
                    if (this.upNext !== undefined) {
                        this.load(this.upNext);
                        this.upNext = undefined;
                    }
                }
            }
        }

        if (this._nextNote === this.sequenceLength) {
            // then all notes have been scheduled and we are not looping
            clearInterval(this._timer);
            // schedule stop() for after when the scheduled sequence ends
            // adding on 3 * lookAheadTime for safety but shouldn't be needed
            this._stopTimer = setTimeout(function() {
                this.stop();
            }.bind(this), 1000 * (this._soundEndTime - now + 3 * this._lookAheadTime));
            return false;  // indicate that sequence is complete
        } else if (now - this._tZero + this._timerInterval + this._lookAheadTime > this._cTimings[this.sequenceLength - 1] && 
                this.sequenceStartCallbackFired) {
            // then we are going to schedule the last note in the sequence next time
            this.sequenceEndingCallback();
            this.sequenceStartCallbackFired = false;
        }
        return true;  // indicate there are more notes to schedule
    }

    /**
     * @returns {boolean} whether there was an error in initialisation
     */
    hasError() {
        return this._noAudio;
    }

    /**
     * @returns {boolean} whether a sequence is being played or not (still true even when paused); becomes false when stop is used
     */
    get isPlaying() {
        return this._isPlaying;
    }

    /**
     * @returns {boolean} whether the playback is paused or not
     */
    get isPaused() {
        return this._isPaused;
    }

    /**
     * Return the index of the next note in the sequence to be scheduled.
     * Useful if the sequence has been paused.
     * @returns {number} note index
     */
    get nextNote() {
        return this._nextNote;
    }

    /**
     * @returns {number} representing this audio player type: 4
     */
    get audioType() {
        return 4;
        // 4: Web Audio API using oscillators
        // 3: Audio element using media stream worker (using PCM audio data)
        // 2: Flash (using PCM audio data)
        // 1: Web Audio API with webkit and native support (using PCM audio data)
        // 0: Audio element using Mozilla Audio Data API (https://wiki.mozilla.org/Audio_Data_API) (using PCM audio data)
        // -1: no audio support
    }

    // empty callbacks in case user does not define any
    sequenceStartCallback() { }
    sequenceEndingCallback() { }
    soundStoppedCallback() { }
}
