/*!
 * parse-semver <https://github.com/tunnckoCore/parse-semver>
 *
 * Copyright (c) 2015-2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

'use strict'

var semver = require('semver')

/**
 * It returns object with `original` version given, expanded semver `range`,
 * and `version` which is valid [semver] version.
 *
 * **Example**
 *
 * ```js
 * var parseSemver = require('parse-semver')
 *
 * parseSemver('docks@~3.4.5')
 * //=> {name: 'docks', original: '~3.4.5', range: '>=3.4.5 <3.5.0', version: '3.4.5'}
 *
 * parseSemver('docks@v1.2.3')
 * //=> {name: 'docks', original: 'v1.2.3', range: '1.2.3', version: '1.2.3'}
 *
 * parseSemver('docks@^2.2.2')
 * //=> {name: 'docks', original: '^2.2.2', range: '>=2.2.2 <3.0.0', version: '2.2.2'}
 *
 * parseSemver('docks')
 * //=> {name: 'docks', original: '', range: '*', version: 'latest'}
 * ```
 *
 * @name   parseSemver
 * @param  {String} `<shorthand>` the shorthand to parse, like `mocha@v2.2.0`
 * @return {Object} object with `name` and `version` properties
 * @api public
 */

module.exports = function parseSemver (shorthand) {
  if (typeof shorthand !== 'string') {
    throw new TypeError('parse-semver: expect `shorthand` to be string')
  }

  shorthand = shorthand.split('@')

  if (shorthand[0] === '') {
    shorthand.shift()
    shorthand[0] = '@' + shorthand[0]
  }

  var name = shorthand[0]
  var version = shorthand[1] || ''
  var range = semver.validRange(version) || ''

  if (version.length && range.length === 0) {
    throw new Error('parse-semver: not valid semver range/version given')
  }

  var ver = version.replace(/^[^0-9]+/, '')
  return {
    name: name,
    range: range,
    version: ver.length === 0 ? 'latest' : ver,
    original: version
  }
}
