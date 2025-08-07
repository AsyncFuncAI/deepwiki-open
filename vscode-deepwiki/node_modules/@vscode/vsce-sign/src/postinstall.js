/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  See LICENSE.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ts-check
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const cp = require("child_process");
const zlib = require("zlib");
const { setPermissions } = require('./permissions');
const { getTarget } = require('./target');

const IS_WINDOWS = process.platform === 'win32';

async function main() {
    const architecture = process.env['npm_config_arch'] ?? process.arch;
    const target = getTarget(process.platform, architecture);

    if (!target) {
        throw new Error(`The current platform (${process.platform}) and architecture (${architecture}) is not supported.`);
    }

    const binDir = path.join(__dirname, '..', 'bin');
    if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir);
    }

    const exeName = IS_WINDOWS ? 'vsce-sign.exe' : 'vsce-sign';
    const subPath = `bin/${exeName}`;
    const binPath = path.join(binDir, exeName);
    const pkgName = `@vscode/vsce-sign-${target}`;

    try {
        setup(pkgName, subPath, binPath);
    } catch (err) {
        const version = require(path.join(__dirname, '..', 'package.json')).optionalDependencies[pkgName];
        if (!version) {
            throw new Error(`Failed to find version of "${pkgName}" in the optionalDependencies of "@vscode/vsce-sign"`);
        }
        await fallbackSetup(pkgName, subPath, binPath, version);
    }
}

/**
 * @param {string} pkgName 
 * @param {string} subPath 
 * @param {string} binPath 
 */
function setup(pkgName, subPath, binPath) {
    const targetBinPath = require.resolve(`${pkgName}/${subPath}`);
    fs.copyFileSync(targetBinPath, binPath);
}

/**
 * @param {string} pkgName 
 * @param {string} subPath 
 * @param {string} binPath 
 * @param {string} version 
 */
async function fallbackSetup(pkgName, subPath, binPath, version) {
    console.error(`[@vscode/vsce-sign] Failed to find package "${pkgName}" on the file system

This can happen if you use the "--no-optional" flag. The "optionalDependencies"
package.json feature is used to install the correct binary executable
for your current platform. This install script will now attempt to work around
this. If that fails, you need to remove the "--no-optional" flag to use @vscode/vsce-sign.
`);

    try {
        console.error(`[@vscode/vsce-sign] Trying to install package "${pkgName}" using npm`);
        installUsingNPM(pkgName, subPath, binPath, version);
        return;
    } catch (err2) {
        console.error(`[@vscode/vsce-sign] Failed to install package "${pkgName}" using npm: ${err2 && err2.message || err2}`);
    }

    try {
        await downloadDirectlyFromNPM(pkgName, subPath, binPath, version);
        return;
    } catch (e3) {
        throw new Error(`Failed to install package "${pkgName}"`);
    }
}

/**
 * @param {string} pkgName 
 * @param {string} subpath 
 * @param {string} binPath 
 * @param {string} version 
 */
function installUsingNPM(pkgName, subpath, binPath, version) {
    const env = { ...process.env, npm_config_global: void 0 };
    const vsceSignLibDir = path.dirname(require.resolve('@vscode/vsce-sign'));
    const installDir = path.join(vsceSignLibDir, "npm-install");
    fs.mkdirSync(installDir);
    try {
        fs.writeFileSync(path.join(installDir, "package.json"), "{}");
        cp.execSync(
            `npm install --loglevel=error --prefer-offline --no-audit --progress=false ${pkgName}@${version}`,
            { cwd: installDir, stdio: "pipe", env }
        );
        const installedBinPath = path.join(installDir, "node_modules", pkgName, subpath);
        fs.renameSync(installedBinPath, binPath);
    } finally {
        try {
            fs.rmSync(installDir, { recursive: true, force: true, maxRetries: 3 });
        } catch {
        }
    }
}

/**
 * 
 * @param {string} pkgName 
 * @param {string} subpath 
 * @param {string} binPath
 * @param {string} version
 */
async function downloadDirectlyFromNPM(pkgName, subpath, binPath, version) {
    const url = `https://registry.npmjs.org/${pkgName}/-/${pkgName.replace("@vscode/", "")}-${version}.tgz`;
    console.error(`[@vscode/vsce-sign] Trying to download ${JSON.stringify(url)}`);

    let buffer;
    try {
        buffer = await fetch(url);
    } catch (e) {
        console.error(`[@vscode/vsce-sign] Failed to download ${JSON.stringify(url)}: ${e && e.message || e}`);
        throw e;
    }

    fs.writeFileSync(binPath, extractFileFromTarGzip(buffer, subpath));
    if (!IS_WINDOWS) {
        setPermissions(binPath);
    }
}

/**
 * @param {string} url 
 * @returns {Promise<Buffer>} 
 */
function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
                return fetch(res.headers.location).then(resolve, reject);
            }
            if (res.statusCode !== 200) {
                console.error(`[@vscode/vsce-sign] Failed to download ${JSON.stringify(url)}: Server responded with ${res.statusCode}`);
                return reject(new Error(`Server responded with ${res.statusCode}`));
            }
            let chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", reject);
    });
}

/**
 * @param {Buffer} buffer 
 * @param {string} subpath 
 * @returns 
 */
function extractFileFromTarGzip(buffer, subpath) {
    try {
        buffer = zlib.unzipSync(buffer);
    } catch (err) {
        const message = `[@vscode/vsce-sign] Invalid gzip data in archive: ${err && err.message || err}`;
        console.error(message);
        throw new Error(message);
    }
    let str = (/** @type {number} */ i, /** @type {number} */ n) => String.fromCharCode(...buffer.subarray(i, i + n)).replace(/\0.*$/, "");
    let offset = 0;
    subpath = `package/${subpath}`;
    while (offset < buffer.length) {
        let name = str(offset, 100);
        let size = parseInt(str(offset + 124, 12), 8);
        offset += 512;
        if (!isNaN(size)) {
            if (name === subpath)
                return buffer.subarray(offset, offset + size);
            offset += size + 511 & ~511;
        }
    }

    const message = `Could not find ${JSON.stringify(subpath)} in archive`;
    console.error(message);
    throw new Error(message);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err && err.message || err);
        process.exit(1);
    });