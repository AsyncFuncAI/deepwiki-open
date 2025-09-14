/*!
 * parse-semver <https://github.com/tunnckoCore/parse-semver>
 *
 * Copyright (c) 2015-2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var test = require('assertit')
var parseSemver = require('./index')

test('parse-semver:', function () {
  test('should throw', function () {
    test('TypeError when no arguments', function (done) {
      function fixture () {
        parseSemver()
      }

      test.throws(fixture, TypeError)
      test.throws(fixture, /parse-semver: expect `shorthand` to be string/)
      done()
    })
    test('TypeError when no string given', function (done) {
      function fixture () {
        parseSemver({foo: 'bar'})
      }

      test.throws(fixture, TypeError)
      test.throws(fixture, /parse-semver: expect `shorthand` to be string/)
      done()
    })
    test('Error when invalid version given', function (done) {
      function invalidOne () {
        parseSemver('docks@~~>1.2.3')
      }
      function invalidTwo () {
        parseSemver('docks@invalid')
      }

      test.throws(invalidOne, Error)
      test.throws(invalidTwo, Error)
      test.throws(invalidOne, /parse-semver: not valid semver/)
      test.throws(invalidTwo, /parse-semver: not valid semver/)
      done()
    })
  })
  test('should parse and return object', function () {
    test('with empty `version` property and non-empty `name` property', function (done) {
      var actual = parseSemver('docks')
      var expected = {name: 'docks', range: '*', version: 'latest', original: ''}

      test.deepEqual(actual, expected)
      done()
    })
    test('with non-empty `name` and `version` properties', function (done) {
      var actual = parseSemver('docks@v7.8.9')
      var expected = {name: 'docks', range: '7.8.9', version: '7.8.9', original: 'v7.8.9'}

      test.deepEqual(actual, expected)
      done()
    })
    test('with scoped package name', function (done) {
      var actual = parseSemver('@me/docks@7.8.9')
      var expected = {name: '@me/docks', range: '7.8.9', version: '7.8.9', original: '7.8.9'}

      test.deepEqual(actual, expected)
      done()
    })
    test('with scoped package name and empty `version`', function (done) {
      var actual = parseSemver('@me/docks')
      var expected = {name: '@me/docks', range: '*', version: 'latest', original: ''}

      test.deepEqual(actual, expected)
      done()
    })
  })
  test('should parse, validate and normalize', function () {
    test('given `v1.2.3` version to `1.2.3`', function (done) {
      var actual = parseSemver('docks@v1.2.3')
      var expected = {name: 'docks', original: 'v1.2.3', range: '1.2.3', version: '1.2.3'}

      test.deepEqual(actual, expected)
      done()
    })
    test('given `4.5.6` version to `4.5.6`', function (done) {
      var actual = parseSemver('docks@4.5.6')
      var expected = {name: 'docks', original: '4.5.6', range: '4.5.6', version: '4.5.6'}

      test.deepEqual(actual, expected)
      done()
    })
  })
  test('should work with different semver ranges', function () {
    test('work properly with `^0.5.3`', function (done) {
      var actual = parseSemver('docks@^0.5.3')
      var expected = {name: 'docks', original: '^0.5.3', range: '>=0.5.3 <0.6.0', version: '0.5.3'}

      test.deepEqual(actual, expected)
      done()
    })
    test('work properly with `~3.4.5`', function (done) {
      var actual = parseSemver('docks@~3.4.5')
      var expected = {name: 'docks', original: '~3.4.5', range: '>=3.4.5 <3.5.0', version: '3.4.5'}

      test.deepEqual(actual, expected)
      done()
    })
  })
})
