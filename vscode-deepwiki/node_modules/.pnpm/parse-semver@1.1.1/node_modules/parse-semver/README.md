# [parse-semver][author-www-url] [![npmjs.com][npmjs-img]][npmjs-url] [![The MIT License][license-img]][license-url] 

> Parse, normalize and validate given semver shorthand (e.g. gulp@v3.8.10) to object.

[![code climate][codeclimate-img]][codeclimate-url] [![standard code style][standard-img]][standard-url] [![travis build status][travis-img]][travis-url] [![coverage status][coveralls-img]][coveralls-url] [![dependency status][david-img]][david-url]


## Install
```
npm i parse-semver --save
npm test
```


## API
> For more use-cases see the [tests](./test.js)

### [parseSemver](./index.js#L40)
> It returns object with `original` version given, expanded semver `range`, and `version`
which is valid [semver](http://npm.im/semver) version.

- `<shorthand>` **{String}** the shorthand to parse, like `docks@v2.2.0`
- `return` **{Object}** object with few properties

**Example**

```js
var parseSemver = require('parse-semver')

parseSemver('docks@~3.4.5')
//=> {name: 'docks', original: '~3.4.5', range: '>=3.4.5 <3.5.0', version: '3.4.5'}

parseSemver('docks@v1.2.3')
//=> {name: 'docks', original: 'v1.2.3', range: '1.2.3', version: '1.2.3'}

parseSemver('docks@^2.2.2')
//=> {name: 'docks', original: '^2.2.2', range: '>=2.2.2 <3.0.0', version: '2.2.2'}

parseSemver('docks')
//=> {name: 'docks', original: '', range: '*', version: 'latest'}
```


## Related
- [benz](https://github.com/tunnckocore/benz): Compose your control flow with absolute elegance. Support async/await, callbacks, thunks, generators,… [more](https://github.com/tunnckocore/benz)
- [parse-git-log](https://github.com/tunnckoCore/parse-git-log): Parse default `git log` style to array of objects from git repository… [more](https://github.com/tunnckoCore/parse-git-log)
- [parse-github-url](https://github.com/jonschlinkert/parse-github-url): Parse a github URL into an object.
- [parse-git-config](https://github.com/jonschlinkert/parse-git-config): Parse `.git/config` into a JavaScript object. sync or async.
- [vez](https://github.com/tunnckocore/vez): Middleware composition at new level. Ultimate alternative to `ware`, `plugins`, `koa-compose` and… [more](https://github.com/tunnckocore/vez)


## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/tunnckoCore/parse-semver/issues/new).  
But before doing anything, please read the [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines.


## [Charlike Make Reagent](http://j.mp/1stW47C) [![new message to charlike][new-message-img]][new-message-url] [![freenode #charlike][freenode-img]][freenode-url]

[![tunnckocore.tk][author-www-img]][author-www-url] [![keybase tunnckocore][keybase-img]][keybase-url] [![tunnckoCore npm][author-npm-img]][author-npm-url] [![tunnckoCore twitter][author-twitter-img]][author-twitter-url] [![tunnckoCore github][author-github-img]][author-github-url]


[npmjs-url]: https://www.npmjs.com/package/parse-semver
[npmjs-img]: https://img.shields.io/npm/v/parse-semver.svg?label=parse-semver

[license-url]: https://github.com/tunnckoCore/parse-semver/blob/master/LICENSE.md
[license-img]: https://img.shields.io/badge/license-MIT-blue.svg


[codeclimate-url]: https://codeclimate.com/github/tunnckoCore/parse-semver
[codeclimate-img]: https://img.shields.io/codeclimate/github/tunnckoCore/parse-semver.svg

[travis-url]: https://travis-ci.org/tunnckoCore/parse-semver
[travis-img]: https://img.shields.io/travis/tunnckoCore/parse-semver.svg

[coveralls-url]: https://coveralls.io/r/tunnckoCore/parse-semver
[coveralls-img]: https://img.shields.io/coveralls/tunnckoCore/parse-semver.svg

[david-url]: https://david-dm.org/tunnckoCore/parse-semver
[david-img]: https://img.shields.io/david/tunnckoCore/parse-semver.svg

[standard-url]: https://github.com/feross/standard
[standard-img]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg


[author-www-url]: http://www.tunnckocore.tk
[author-www-img]: https://img.shields.io/badge/www-tunnckocore.tk-fe7d37.svg

[keybase-url]: https://keybase.io/tunnckocore
[keybase-img]: https://img.shields.io/badge/keybase-tunnckocore-8a7967.svg

[author-npm-url]: https://www.npmjs.com/~tunnckocore
[author-npm-img]: https://img.shields.io/badge/npm-~tunnckocore-cb3837.svg

[author-twitter-url]: https://twitter.com/tunnckoCore
[author-twitter-img]: https://img.shields.io/badge/twitter-@tunnckoCore-55acee.svg

[author-github-url]: https://github.com/tunnckoCore
[author-github-img]: https://img.shields.io/badge/github-@tunnckoCore-4183c4.svg

[freenode-url]: http://webchat.freenode.net/?channels=charlike
[freenode-img]: https://img.shields.io/badge/freenode-%23charlike-5654a4.svg

[new-message-url]: https://github.com/tunnckoCore/messages
[new-message-img]: https://img.shields.io/badge/send%20me-message-green.svg
