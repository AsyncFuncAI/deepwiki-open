/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  See LICENSE.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * See https://github.com/nodejs/node-v0.x-archive/issues/3045#issuecomment-4862588
 * mode is a combination of file type and permissions.
 * @param {number} mode
 * @returns {string}
 */
function getPermissions(mode) {
    // Get 3 smallest bytes in octal
    return (mode & 0o777).toString(8);
}

/**
 * @param {string} filePath
 */
function setPermissions(filePath) {
    let stats = fs.statSync(filePath);
    const oldMode = stats.mode;

    console.log(`Existing file permissions:  ${getPermissions(oldMode)} (octal)`);

    // 755 (octal) = -rwxr-xr-x
    const newMode = 0o755;

    fs.chmodSync(filePath, newMode);

    stats = fs.statSync(filePath);

    console.log(`New file permissions:  ${getPermissions(stats.mode)} (octal)`);
}

module.exports = { setPermissions };