/*
This code is © Copyright Stephen C. Phillips, 2017.
Email: steve@scphillips.com

Licensed under the EUPL, Version 1.2 or – as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at: https://joinup.ec.europa.eu/community/eupl/
Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and limitations under the Licence.
*/

/**
 * Basic methods to translate Morse code.
 */
if (typeof(String.prototype.trim) === "undefined") {
    String.prototype.trim = function() {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

var text2morseH = {
    'A': ".-",
    'B': "-...",
    'C': "-.-.",
    'D': "-..",
    'E': ".",
    'F': "..-.",
    'G': "--.",
    'H': "....",
    'I': "..",
    'J': ".---",
    'K': "-.-",
    'L': ".-..",
    'M': "--",
    'N': "-.",
    'O': "---",
    'P': ".--.",
    'Q': "--.-",
    'R': ".-.",
    'S': "...",
    'T': "-",
    'U': "..-",
    'V': "...-",
    'W': ".--",
    'X': "-..-",
    'Y': "-.--",
    'Z': "--..",
    '1': ".----",
    '2': "..---",
    '3': "...--",
    '4': "....-",
    '5': ".....",
    '6': "-....",
    '7': "--...",
    '8': "---..",
    '9': "----.",
    '0': "-----",
    '.': ".-.-.-",
    ',': "--..--",
    ':': "---...",
    '?': "..--..",
    '\'': ".----.",
    '-': "-....-",
    '/': "-..-.",
    '(': "-.--.-",
    ')': "-.--.-",
    '"': ".-..-.",
    '@': ".--.-.",
    '=': "-...-",
    ' ': "/" //Not morse but helps translation
};
var morse2textH = {};
var prosign2morseH = {
    '<AA>': '.-.-',
    '<AR>': '.-.-.',
    '<AS>': '.-...',
    '<BK>': '-...-.-',
    '<BT>': '-...-', // also <TV>
    '<CL>': '-.-..-..',
    '<CT>': '-.-.-',
    '<DO>': '-..---',
    '<KN>': '-.--.',
    '<SK>': '...-.-', // also <VA>
    '<VA>': '...-.-',
    '<SN>': '...-.', // also <VE>
    '<VE>': '...-.',
    '<SOS>': '...---...'
};
var morsepro2textH = {};
var text2morseproH = {};
for (var text in text2morseH) {
    text2morseproH[text] = text2morseH[text];
    morse2textH[text2morseH[text]] = text;
    morsepro2textH[text2morseH[text]] = text;
}
for (var sign in prosign2morseH) {
    text2morseproH[sign] = prosign2morseH[sign];
    morsepro2textH[prosign2morseH[sign]] = sign;
}

var tidyText = function(text) {
    text = text.toUpperCase();
    text = text.trim();
    text = text.replace(/\s+/g, ' ');
    return text;
};

/**
 * Translate text to morse in '..- .. / --' form.
 * If something in the text is untranslatable then it is surrounded by hash-signs ('#') and a hash is placed in the morse.
 * @param {string} text - alphanumeric message
 * @param {Boolean} useProsigns - true if prosigns are to be used (default is true)
 * @return {{message: string, morse: string, hasError: boolean}}
 */
export function text2morse(text, useProsigns = true) {
    text = tidyText(text);
    var ret = {
        morse: "",
        message: "",
        hasError: false
    };
    if (text === "") {
        return ret;
    }

    var tokens = [];
    var prosign;
    var token_length;
    while (text.length > 0) {
        token_length = 1;
        if (useProsigns) {
            prosign = text.match(/^<...?>/); // array of matches
            if (prosign) {
                token_length = prosign[0].length;
            }
        }
        tokens.push(text.slice(0, token_length));
        text = text.slice(token_length, text.length);
    }
    var dict;
    if (useProsigns) {
        dict = text2morseproH;
    } else {
        dict = text2morseH;
    }
    var i, c, t;
    for (i = 0; i < tokens.length; i++) {
        t = tokens[i];
        c = dict[t];
        if (c === undefined) {
            ret.message += "#" + t + "#";
            ret.morse += "# ";
            ret.hasError = true;
        } else {
            ret.message += t;
            ret.morse += c + " ";
        }
    }
    ret.morse = ret.morse.slice(0, ret.morse.length - 1);
    return ret;
}

/**
 * Translate text to morse in 'Dit-dit-dah dah' form.
 * @param {string} text - alphanumeric message
 * @param {Boolean} useProsigns - true if prosigns are to be used (default is true)
 * @return {string}
 */
export function text2ditdah(text, useProsigns) {
    var ditdah = text2morse(text, useProsigns).morse; // get the dots and dashes
    ditdah = ditdah.replace(/ \/ /g, '#').replace(/ /g, '~'); // put in placeholders
    ditdah = ditdah.replace(/\./g, 'dit ').replace(/\-/g, 'dah '); // do the basic job
    ditdah = ditdah.replace(/ #/g, '. ').replace(/ ~/g, ', ').replace(/ $/, '.'); // do punctuation
    ditdah = ditdah.replace(/^d/, 'D').replace(/\. d/, '. D'); // do capitalisation
    return ditdah;
}

var tidyMorse = function(morse) {
    morse = morse.trim();
    morse = morse.replace(/\|/g, "/"); // unify the word separator
    morse = morse.replace(/\//g, " / "); // make sure word separators are spaced out
    morse = morse.replace(/\s+/g, " "); // squash multiple spaces into single spaces
    morse = morse.replace(/(\/ )+\//g, "/"); // squash multiple word separators
    //morse = morse.replace(/^ \/ /, "");  // remove initial word separators
    //morse = morse.replace(/ \/ $/, "");  // remove trailing word separators
    morse = morse.replace(/^\s+/, "");
    morse = morse.replace(/\s+$/, "");
    morse = morse.replace(/_/g, "-"); // unify the dash character
    return morse;
};

/**
 * Translate morse to text.
 * If something in the morse is untranslatable then it is surrounded by hash-signs ('#') and a hash is placed in the text.
 * @param {string} morse - morse message using [.-_/|] characters
 * @param {Boolean} useProsigns - true if prosigns are to be used (default is true)
 * @return {{message: string, morse: string, hasError: boolean}}
 */
export function morse2text(morse, useProsigns = true) {
    morse = tidyMorse(morse);
    var ret = {
        morse: "",
        message: "",
        hasError: false
    };
    if (morse === "") {
        return ret;
    }

    var tokens = morse.split(" ");
    var dict;
    if (useProsigns) {
        dict = morsepro2textH;
    } else {
        dict = morse2textH;
    }
    var c, t;
    for (var i = 0; i < tokens.length; i++) {
        t = tokens[i];
        c = dict[t];
        if (c === undefined) {
            ret.morse += "#" + t + "# ";
            ret.message += "#";
            ret.hasError = true;
        } else {
            ret.morse += t + " ";
            ret.message += c;
        }
    }
    ret.morse = ret.morse.slice(0, ret.morse.length - 1);
    return ret;
}

/**
 * Determine whether a string is most likely morse code.
 * @param {string} input - the text
 * @return {boolean} - true if the string only contains [.-_|/]
 */
export function looksLikeMorse(input) {
    input = tidyMorse(input);
    if (input.match(/^[ /.-]*$/)) {
        return true;
    } else {
        return false;
    }
}
