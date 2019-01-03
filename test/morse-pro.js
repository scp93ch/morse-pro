import * as Morse from '../src/morse-pro';

var assert = require('assert');

describe('morse-pro', function() {
    describe('text2morse()', function() {
        var tests = [
            {args: [''], expected: {morse: '', message: '', hasError: false}},
            {args: ['S'], expected: {morse: '...', message: 'S', hasError: false}},
            {args: ['s'], expected: {morse: '...', message: 'S', hasError: false}},
            {args: [' S'], expected: {morse: '...', message: 'S', hasError: false}},
            {args: ['S '], expected: {morse: '...', message: 'S', hasError: false}},
            {args: ['s s'], expected: {morse: '... / ...', message: 'S S', hasError: false}},
            {args: ['s  s'], expected: {morse: '... / ...', message: 'S S', hasError: false}},
            {args: ['<AA>'], expected: {morse: '.-.-', message: '<AA>', hasError: false}},
            {args: ['<AA>', true], expected: {morse: '.-.-', message: '<AA>', hasError: false}},
            {args: ['<AA>', false], expected: {morse: '# .- .- #', message: '#<#AA#>#', hasError: true}},
            {args: ['<AAA>', true], expected: {morse: '#', message: '#<AAA>#', hasError: true}},
        ];

        tests.forEach(function(test) {
            it('correctly translates "' + test.args + '" to "' + test.expected.morse + '"', function() {
                var res = Morse.text2morse.apply(null, test.args);
                for (var key in test.expected) {
                    assert.equal(res[key], test.expected[key]);
                }
            });
        });
    });

    describe('text2ditdah()', function() {
        // TODO: add failing tests
        var tests = [
            {args: [''], expected: ''},
            {args: ['S'], expected: 'Di-di-dit.'},
            {args: ['C'], expected: 'Dah-di-dah-dit.'},
            {args: ['SS'], expected: 'Di-di-dit di-di-dit.'},
            {args: ['S S'], expected: 'Di-di-dit, di-di-dit.'},
        ];

        tests.forEach(function(test) {
            it('correctly translates "' + test.args + '" to "' + test.expected + '"', function() {
                var res = Morse.text2ditdah.apply(null, test.args);
                assert.equal(res, test.expected);
            });
        });
    });

    describe('morse2text()', function() {
        var tests = [
            {args: [''], expected: {morse: '', message: '', hasError: false}},
            {args: ['.'], expected: {morse: '.', message: 'E', hasError: false}},
            {args: ['-'], expected: {morse: '-', message: 'T', hasError: false}},
            {args: ['_'], expected: {morse: '-', message: 'T', hasError: false}},
            {args: [' '], expected: {morse: '', message: '', hasError: false}},
            {args: ['/'], expected: {morse: '/', message: ' ', hasError: false}},
            {args: ['|'], expected: {morse: '/', message: ' ', hasError: false}},
            {args: ['//'], expected: {morse: '/', message: ' ', hasError: false}},
            {args: ['...'], expected: {morse: '...', message: 'S', hasError: false}},
            {args: ['.-.-.-.-.-.-'], expected: {morse: '#.-.-.-.-.-.-#', message: '#', hasError: true}},
            {args: [' ...'], expected: {morse: '...', message: 'S', hasError: false}},
            {args: ['... '], expected: {morse: '...', message: 'S', hasError: false}},
            {args: ['/ ...'], expected: {morse: '/ ...', message: ' S', hasError: false}},
            {args: ['... /'], expected: {morse: '... /', message: 'S ', hasError: false}},
            {args: ['... ...'], expected: {morse: '... ...', message: 'SS', hasError: false}},
            {args: ['...  ...'], expected: {morse: '... ...', message: 'SS', hasError: false}},
            {args: ['... / ...'], expected: {morse: '... / ...', message: 'S S', hasError: false}},
            {args: ['...  /  ...'], expected: {morse: '... / ...', message: 'S S', hasError: false}},
            {args: ['.../...'], expected: {morse: '... / ...', message: 'S S', hasError: false}},
            {args: ['... // ...'], expected: {morse: '... / ...', message: 'S S', hasError: false}},
            {args: ['.-.-'], expected: {morse: '.-.-', message: '<AA>', hasError: false}},
            {args: ['.-.-', true], expected: {morse: '.-.-', message: '<AA>', hasError: false}},
            {args: ['.-.-', false], expected: {morse: '#.-.-#', message: '#', hasError: true}},
        ];

        tests.forEach(function(test) {
            it('correctly translates "' + test.args + '" to "' + test.expected.message + '"', function() {
                var res = Morse.morse2text.apply(null, test.args);
                for (var key in test.expected) {
                    assert.equal(res[key], test.expected[key]);
                }
            });
        });
    });

    describe('looksLikeMorse()', function() {
        var tests = [
            {args: [''], expected: false},
            {args: ['.'], expected: true},
            {args: ['-/ |.'], expected: true},
            {args: ['a'], expected: false},
        ];

        tests.forEach(function(test) {
            it('correctly indentifies "' + test.args + '" as "' + test.expected + '"', function() {
                var res = Morse.looksLikeMorse.apply(null, test.args);
                assert.equal(res, test.expected);
            });
        });
    });
});
