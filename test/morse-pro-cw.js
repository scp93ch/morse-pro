import MorseCW from '../src/morse-pro-cw';

var assert = require('assert');

describe('morse-pro-cw', function() {

    describe('constructor()', function() {
        it('should default to 20 wpm', function() {
            var morseCW = new MorseCW();
            assert.equal(morseCW.wpm, 20);
        });
        it('fwpm should default to wpm', function() {
            var morseCW = new MorseCW(true, 30);
            assert.equal(morseCW.fwpm, 30);
        });
    });

    describe('speed controls', function() {
        it('wpm should never be less than fwpm', function() {
            var morseCW = new MorseCW();
            morseCW.wpm = 20;
            morseCW.fwpm = 30;
            assert.equal(morseCW.wpm, 30);
        });
        it('fwpm should never be more than wpm', function() {
            var morseCW = new MorseCW();
            morseCW.fwpm = 20;
            morseCW.wpm = 10;
            assert.equal(morseCW.fwpm, 10);
        });
    });

    describe('getTimings()', function() {
        var tests = [
            {morse: '.- . / .', wpm: 20, fwpm: 20, timings: [60, -60, 180, -180, 60, -420, 60]},
            {morse: '.- . / .', wpm: 20, fwpm: 15, timings: [60, -60, 180, -338, 60, -788, 60]},
            {morse: '.- . / .', wpm: 10, fwpm: 10, timings: [120, -120, 360, -360, 120, -840, 120]}
        ];

        tests.forEach(function(test) {
            it('gives timings for "' + test.morse + '" ' + test.wpm + '/' + test.fwpm + ' as ' + test.timings, function() {
                var morseCW = new MorseCW(true, test.wpm, test.fwpm);
                morseCW.translate(test.morse);
                var t = morseCW.getTimings();
                for (var i = 0; i < t.length; i++) {
                    t[i] = Math.round(t[i]);
                }
                assert.deepEqual(t, test.timings);
            });
        });
    });

    describe('getDuration()', function() {
        var tests = [
            {message: 'PARIS', wpm: 20, fwpm: 20, duration: 2580},
            {message: 'PARIS', wpm: 10, fwpm: 10, duration: 5160},
            {message: 'PARIS', wpm: 20, fwpm: 10, duration: 4475}
        ];

        tests.forEach(function(test) {
            it('gives duration for "' + test.message + '" ' + test.wpm + '/' + test.fwpm + ' as ' + test.duration, function() {
                var morseCW = new MorseCW(true, test.wpm, test.fwpm);
                morseCW.translate(test.message);
                var d = morseCW.getDuration();
                assert.equal(Math.round(d), test.duration);
            });
            it('is the right duration for the wpm', function() {
                var morseCW = new MorseCW(true, test.wpm, test.fwpm);
                morseCW.translate(test.message);
                var d = morseCW.getDuration();
                morseCW.translate('. / .');
                var wordSpace = -morseCW.getTimings()[1];
                assert.equal(d + wordSpace, 60 * 1000 / test.fwpm);
            });
        });
    });
});
