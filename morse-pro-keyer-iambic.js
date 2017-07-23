/*
This code is © Copyright Stephen C. Phillips, 2017.
Email: steve@scphillips.com

Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/

import * as WPM from 'morse-pro-wpm';
import MorseDecoder from 'morse-pro-decoder';
import MorseKeyer from 'morse-pro-keyer';
import MorsePlayerWAA from 'morse-pro-player-waa';

/*
    The Morse iambic keyer tests for input on a timer, plays the appropriate tone and passes the data to a decoder.
    If both keys are detected at once then this class alternates between dit and dah.
    Set 'ditGoesFirst' to define whether to play dit or dah first.
    Arguments: see MorseKeyer
*/

export default class MorseIambicKeyer extends MorseKeyer {
    constructor(keyCallback, wpm, frequency, messageCallback) {
        super(keyCallback, wpm, frequency, messageCallback);
        this.ditGoesFirst = true;  // if the initial signal is 3 then alternate but play a dit first
    }

    check() {
        var input = super.check();
        if (input === 0) {
            this.lastWasDit = undefined;
        }
    }

    ditOrDah(input) {
        var dit;
        if (input === 1) {
            dit = true;
        } else if (input === 2) {
            dit = false;
        } else if (input === 3) {
            if (this.lastWasDit === true) {
                dit = false;
            } else if (this.lastWasDit === false) {
                dit = true;
            } else {
                dit = this.ditGoesFirst;
            }
        }
        this.lastWasDit = dit;
        return dit;
    }

    /*
        Call this method when a key-press (or equivalent) is detected
    */
    start() {
        if (!this.playing) {
            this.lastWasDit = undefined;
        }
        super.start();
    }
}
