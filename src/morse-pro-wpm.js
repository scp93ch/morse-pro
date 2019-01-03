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
 * Useful constants and functions for computing the speed of Morse code.
 */

const DITS_PER_WORD = 50;  /** dits in "PARIS " */
const SPACES_IN_PARIS = 19;  /** 5x 3-dit inter-character spaces + 1x 7-dit space */
const MS_IN_MINUTE = 60000;  /** number of milliseconds in 1 minute */

/** Get the dit length in ms
 * @param {number} wpm - speed in words per minute
 * @return {integer}
 */
export function ditLength(wpm) {
    return Math.round(_ditLength(wpm));
}

function _ditLength(wpm) {
    return (MS_IN_MINUTE / DITS_PER_WORD) / wpm;
}

/**
 * Get the dah length in ms
 * @param {number} wpm - speed in words per minute
 * @return {integer}
 */
export function dahLength(wpm) {
    return Math.round(3 * _ditLength(wpm));
}

/**
 * Get the dit space in ms
 * @param {number} wpm - speed in words per minute
 * @return {integer}
 */
export function ditSpace(wpm) {
    return ditLength(wpm)
}

/**
 * Get the character-space in ms
 * @param {number} wpm - speed in words per minute
 * @param {number} [fwpm = wpm] - Farnsworth speed in words per minute
 * @return {integer}
 */
export function charSpace(wpm, fwpm = wpm) {
    return Math.round(3 * _fditLength(wpm, fwpm));
}

/**
 * Get the word-space in ms
 * @param {number} wpm - speed in words per minute
 * @param {number} [fwpm = wpm] - Farnsworth speed in words per minute
 * @return {integer}
 */
export function wordSpace(wpm, fwpm = wpm) {
    return Math.round(7 * _fditLength(wpm, fwpm));
}

/**
 * Get the WPM for a given dit length in ms
 * @return {number}
 */
export function wpm(ditLen) {
    return (MS_IN_MINUTE / DITS_PER_WORD) / ditLen;
}

/**
 * Get the Farnsworth dit length in ms for a given WPM and Farnsworth WPM. Note, actual dit-spaces should not be slowed down
 * @return {integer}
 */
export function fditLength(wpm, fwpm) {
    return Math.round(_fditLength(wpm, fwpm));
}

function _fditLength(wpm, fwpm) {
    return _ditLength(wpm) * ratio(wpm, fwpm);
}

/**
 * Get the dit length ratio for a given WPM and Farnsworth WPM
 * @param {number} wpm - speed in words per minute
 * @param {number} fwpm - Farnsworth speed in words per minute
 * @return {number}
 */
export function ratio(wpm, fwpm) {
    // "PARIS " is 31 units for the characters and 19 units for the inter-character spaces and inter-word space
    // One unit takes 1 * 60 / (50 * wpm)
    // The 31 units should take 31 * 60 / (50 * wpm) seconds at wpm
    // "PARIS " should take 50 * 60 / (50 * fwpm) to transmit at fwpm, or 60 / fwpm  seconds at fwpm
    // Keeping the time for the characters constant,
    // The spaces need to take: (60 / fwpm) - [31 * 60 / (50 * wpm)] seconds in total
    // The spaces are 4 inter-character spaces of 3 units and 1 inter-word space of 7 units. Their ratio must be maintained.
    // A space unit is: [(60 / fwpm) - [31 * 60 / (50 * wpm)]] / 19 seconds
    // Comparing that to 60 / (50 * wpm) gives a ratio of (50.wpm - 31.fwpm) / 19.fwpm
    return (DITS_PER_WORD * wpm - (DITS_PER_WORD - SPACES_IN_PARIS) * fwpm) / (SPACES_IN_PARIS * fwpm);
}

/** Get the Farnsworth WPM for a given WPM and ratio */
export function fwpm(wpm, r) {
    return DITS_PER_WORD * wpm / (SPACES_IN_PARIS * r + (DITS_PER_WORD - SPACES_IN_PARIS));
}