[![Build](https://img.shields.io/travis/scp93ch/morse-pro.svg)](https://travis-ci.org/scp93ch/morse-pro)
[![Coverage](https://img.shields.io/coveralls/scp93ch/morse-pro.svg)](https://coveralls.io/github/scp93ch/morse-pro?branch=master)
[![Version](https://img.shields.io/npm/v/morse-pro.svg)](https://www.npmjs.com/package/morse-pro)
[![Downloads](https://img.shields.io/npm/dm/morse-pro.svg)](https://www.npmjs.com/package/morse-pro)
[![License](https://img.shields.io/npm/l/morse-pro.svg)](https://joinup.ec.europa.eu/community/eupl/home)
[![Documentation](https://doc.esdoc.org/github.com/scp93ch/morse-pro/badge.svg)](https://doc.esdoc.org/github.com/scp93ch/morse-pro/)

# Introduction

This Javascript (ES6) library is for manipulating Morse code text and sound. It is the library used in the tools on [Stephen C Phillips's Morse code website](https://morsecode.scphillips.com).

The library can:
* Translate to and from text and Morse code (in the form of '-- --- .-. ... . / -.-. --- -.. .').
* Understand Morse code prosigns.
* Generate downloadable RIFF WAVE ('.wav') files of Morse code at given frequency and speed.
* Make use of the "Farnsworth speed" concept of extending the gaps between characters and words.
* Generate in-browser sounds using the Web Audio API and falling back to other methods such as Flash for older browsers.
* Take Morse code input from a web-based keyer or iambic keyer.
* Decode to text given 'on' and 'off' timings and a fixed speed.
* Adaptively decode to text, adjusting to the most likely speed and Farnsworth speed.
* Decode from listening to the microphone or an audio file, adapting to the most prominent frequency.

It has been written using ES6 (ECMA Script 6) with no module boilerplate. If you need it to execute in a web page then use something like webpack and babel to transpile it to an earlier version of Javascript.

# Copyright and Licence

Two files ([morse-pro-util-riffwave.js](./src/morse-pro-util-riffwave.js) and [morse-pro-util-datauri.js](./src/morse-pro-util-datauri.js)) are Public Domain. The others are:

Copyright: Stephen C Phillips, 2013-2017; Licensed under the EUPL v1.2, with extension of article 5 (compatibility clause) to any licence for distributing derivative works that have been produced by the normal use of the Work as a library.

*Please note, this is different to the Expat (MIT) licence often found in Javascript projects and places restrictions and obligations on the user of the software.*

The full text of the licence can be found in the [LICENSE file](./LICENSE) in this folder. Comments below do not constitute the licence, they are just my comments on the licence.

The EUPL is an 'open source' licence: one of many options and one in the 'weak-copyleft' category. My intention in using EUPL v1.2 is primarily to ensure that any modifications to this library are made available to the community as source code. In contrast to many open source licences, the EUPL v1.2 licence makes it clear that modifications must be made available even in the case of the library being used as part of a web service and not distributed to the user, covering the 'Application Service Provider loophole' (in this case it is similar to the AGPL licence). My intention is also that this library can be used as a library by other pieces of software but that the EUPL v1.2 licence does not have to be applied to the software that links to it (this is similar to the LGPL licence). Of course, if you want to open source software that links to this library then you are free to do so.

So basically, if you use the library as-is in some piece of software then that's just fine (though an acknowledgement would be nice) and you can even keep the software closed-source should you wish to. If you *modify the library* **and** *use it in some software that you provide to others*, even if the library is not distributed to the users, then you must provide your modifications to the library back to the community so that everyone can benefit.

More information on the EUPL v1.2:
* [EUPL information](https://joinup.ec.europa.eu/community/eupl/home)
* [EUPL and Proprietary / Commercial use](https://joinup.ec.europa.eu/community/eupl/news/eupl-and-proprietary/commercial-use)
* [Compatibility with other licences](https://joinup.ec.europa.eu/community/eupl/og_page/eupl-compatible-open-source-licences)
* [Summary of the similar EUPL v1.1 from TL;DR Legal](https://tldrlegal.com/license/european-union-public-licence)

If you would like to access this software under a different licence then please get in touch and ask.

# Documentation

Documentation on how to use the library is embedded in the source code and can be found [at the ESDoc site](https://doc.esdoc.org/github.com/scp93ch/morse-pro/).

Library overview:
* [morse-pro.js](./src/morse-pro.js): Basic functions to translate Morse code. Includes mapping of characters and prosigns to dots and dashes.
* [morse-pro-message.js](./src/morse-pro-message.js): MorseMessage class, for conveniently translating to and from Morse code and dealing with errors.
* [morse-pro-cw.js](./src/morse-pro-cw.js): MorseCW class, to create the on/off timings needed by e.g. sound generators. Understands speed and Farnsworth speed concepts. Extends MorseMessage class.
* [morse-pro-cw-wave.js](./src/morse-pro-cw-wave.js): MorseCWWave class, to create sine-wave samples of standard CW Morse. Extends MorseCW.
* [morse-player-xas.js](./src/morse-player-xas.js): MorsePlayerXAS class, to play sounds in older web browsers (e.g. IE) using XAudioJS. Can play MorseCWWave instances.
* [morse-player-waa.js](./src/morse-player-waa.js): MorsePlayerWAA class, to play sounds in a web browser using the Web Audio API. Can play MorseCWWave instances.
* [morse-player-waa-light.js](./src/morse-player-waa-light.js): MorsePlayerWAALight class. Extends MorsePlayerWAA to provide callbacks when the sound goes on or off and when the sound ends.Can be used to turn a light on or off in time with the Morse sound.
* [morse-pro-decoder.js](./src/morse-pro-decoder.js): MorseDecoder class which converts from timings to Morse code.
* [morse-pro-decoder-adaptive.js](./src/morse-pro-decoder-adaptive.js): MorseDecoderAdaptive class, converts from timings to Morse code and adapts to changing speed.
* [morse-pro-keyer.js](./src/morse-pro-keyer.js): MorseKeyer class, tests for input (e.g. from the keyboard) using a timer, plays the appropriate tone and passes the data to a MorseDecoder instance.
* [morse-pro-keyer-iambic.js](./src/morse-pro-keyer-iambic.js): MorseKeyerIambic class extends MorseKeyer, will alternate between dit and dah if both keys are pressed together.
* [morse-pro-listener.js](./src/morse-pro-listener.js): MorseListener class, analyses audio from the microphone or a sound file to pick out Morse code timings which are passed into a MorseDecoder instance.
* [morse-pro-listener-adaptive.js](./src/morse-pro-listener-adaptive.js): MorseListenerAdaptive class extends MorseListener, adapts to changing frequency.
* [morse-pro-util-datauri.js](./src/morse-pro-util-datauri.js): Function to create a data URI.
* [morse-pro-util-riffwave.js](./src/morse-pro-util-riffwave.js): Function to create a RIFF WAVE (.wav) file from a MorseCWWave instance.
* [morse-pro-wpm.js](./src/morse-pro-wpm.js): Useful constants and functions for computing the speed (and Farnsworth speed) of Morse code.

# Tests

None yet! This library is used for the software on https://morsecode.scphillips.com and is tested there.

# Contact

Please email me at steve@scphillips.com with any questions or ideas.
