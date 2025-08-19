# keytar - Node module to manage system keychain

[![Travis Build Status](https://travis-ci.org/atom/node-keytar.svg?branch=master)](https://travis-ci.org/atom/node-keytar)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/atom/node-keytar?svg=true)](https://ci.appveyor.com/project/Atom/node-keytar)
[![Dependency Status](https://david-dm.org/atom/node-keytar.svg)](https://david-dm.org/atom/node-keytar)

A native Node module to get, add, replace, and delete passwords in system's keychain. On macOS the passwords are managed by the Keychain, on Linux they are managed by the Secret Service API/libsecret, and on Windows they are managed by Credential Vault.

## Installing

```sh
npm install keytar
```

### On Linux

Currently this library uses `libsecret` so you may need to install it before running `npm install`.

Depending on your distribution, you will need to run the following command:

* Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
* Red Hat-based: `sudo yum install libsecret-devel`
* Arch Linux: `sudo pacman -S libsecret`

## Building

  * Clone the repository
  * Run `npm install`
  * Run `npm test` to run the tests

## Supported versions

Each release of `keytar` includes prebuilt binaries for the versions of Node and Electron that are actively supported by these projects. Please refer to the release documentation for [Node](https://github.com/nodejs/Release) and [Electron](https://electronjs.org/docs/tutorial/support) to see what is supported currently.

## Bindings from other languages

- [Rust](https://crates.io/crates/keytar)

## Docs

```javascript
const keytar = require('keytar')
```

Every function in keytar is asynchronous and returns a promise. The promise will be rejected with any error that occurs or will be resolved with the function's "yields" value.

### getPassword(service, account)

Get the stored password for the `service` and `account`.

`service` - The string service name.

`account` - The string account name.

Yields the string password or `null` if an entry for the given service and account was not found.

### setPassword(service, account, password)

Save the `password` for the `service` and `account` to the keychain. Adds a new entry if necessary, or updates an existing entry if one exists.

`service` - The string service name.

`account` - The string account name.

`password` - The string password.

Yields nothing.

### deletePassword(service, account)

Delete the stored password for the `service` and `account`.

`service` - The string service name.

`account` - The string account name.

Yields `true` if a password was deleted, or `false` if an entry with the given service and account was not found.

### findCredentials(service)

Find all accounts and password for the `service` in the keychain.

`service` - The string service name.

Yields an array of `{ account: 'foo', password: 'bar' }`.

### findPassword(service)

Find a password for the `service` in the keychain. This is ideal for scenarios where an `account` is not required.

`service` - The string service name.

Yields the string password, or `null` if an entry for the given service was not found.

