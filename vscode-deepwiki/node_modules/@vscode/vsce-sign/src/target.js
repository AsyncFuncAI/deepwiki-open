/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  See LICENSE.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ts-check
'use strict';

const fs = require('fs');

/**
 * @typedef {Function} BooleanFunction
 * @returns {boolean}
 */

/**
 * @param {string} platform
 * @param {string} architecture
 * @param {BooleanFunction=} isAlpineLinuxFunc
 * @returns {string | null}
 */
function getTarget(platform, architecture, isAlpineLinuxFunc = isAlpineLinux) {
    switch (platform) {
        case 'darwin':
            return getMacOsRuntimeIdentifier(architecture);

        case 'linux':
            if (isAlpineLinuxFunc()) {
                return getAlpineLinuxRuntimeIdentifier(architecture);
            }

            return getLinuxRuntimeIdentifier(architecture);

        case 'win32':
            return getWindowsRuntimeIdentifier(architecture);

        default:
            return null;
    }
}

/**
 * @param {string} architecture
 * @returns {string | null}
 */
function getAlpineLinuxRuntimeIdentifier(architecture) {
    switch (architecture) {
        case 'arm64':
        case 'x64':
            return `alpine-${architecture}`;

        default:
            return null;
    }
}

/**
 * @param {string} architecture
 * @returns {string | null}
 */
function getLinuxRuntimeIdentifier(architecture) {
    switch (architecture) {
        case 'arm':
        case 'arm64':
        case 'x64':
            return `linux-${architecture}`;

        default:
            return null;
    }
}

/**
 * @param {string} architecture
 * @returns {string | null}
 */
function getMacOsRuntimeIdentifier(architecture) {
    switch (architecture) {
        case 'arm64':
        case 'x64':
            return `darwin-${architecture}`;

        default:
            return null;
    }
}

/**
 * @param {string} architecture
 * @returns {string | null}
 */
function getWindowsRuntimeIdentifier(architecture) {
    switch (architecture) {
        case 'arm':
        case 'arm64':
        case 'x64':
            return `win32-${architecture}`;

        case 'ia32':
            return `win32-x86`;

        default:
            return null;
    }
}

/**
 * Borrowed from {@link https://github.com/microsoft/vscode/blob/49e696c011a868b283f7bc7f208378a5d450b5d8/src/vs/platform/extensionManagement/common/extensionManagementUtil.ts#L171-L189}
 * @returns {boolean}
 */
function isAlpineLinux() {
    let content;

    try {
        const fileContent = fs.readFileSync('/etc/os-release');
        content = fileContent.toString();
    } catch (error) {
        try {
            const fileContent = fs.readFileSync('/usr/lib/os-release');
            content = fileContent.toString();
        } catch (error) {
        }
    }

    return !!content && (content.match(/^ID=([^\u001b\r\n]*)/m) || [])[1] === 'alpine';
}

module.exports = { getTarget };