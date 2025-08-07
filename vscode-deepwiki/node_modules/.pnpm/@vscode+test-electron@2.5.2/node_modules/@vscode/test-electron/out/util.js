"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeCommandError = exports.Version = exports.isPlatformCLI = exports.isPlatformServer = exports.isPlatformLinux = exports.isPlatformDarwin = exports.isPlatformWindows = exports.systemDefaultPlatform = void 0;
exports.getVSCodeDownloadUrl = getVSCodeDownloadUrl;
exports.urlToOptions = urlToOptions;
exports.downloadDirToExecutablePath = downloadDirToExecutablePath;
exports.insidersDownloadDirToExecutablePath = insidersDownloadDirToExecutablePath;
exports.insidersDownloadDirMetadata = insidersDownloadDirMetadata;
exports.getInsidersVersionMetadata = getInsidersVersionMetadata;
exports.getLatestInsidersMetadata = getLatestInsidersMetadata;
exports.resolveCliPathFromVSCodeExecutablePath = resolveCliPathFromVSCodeExecutablePath;
exports.resolveCliArgsFromVSCodeExecutablePath = resolveCliArgsFromVSCodeExecutablePath;
exports.getProfileArguments = getProfileArguments;
exports.hasArg = hasArg;
exports.runVSCodeCommand = runVSCodeCommand;
exports.isDefined = isDefined;
exports.validateStream = validateStream;
exports.streamToBuffer = streamToBuffer;
exports.isSubdirectory = isSubdirectory;
exports.onceWithoutRejections = onceWithoutRejections;
exports.killTree = killTree;
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const http_proxy_agent_1 = require("http-proxy-agent");
const https_proxy_agent_1 = require("https-proxy-agent");
const path = __importStar(require("path"));
const url_1 = require("url");
const download_1 = require("./download");
const request = __importStar(require("./request"));
const isPlatformWindows = (platform) => platform.includes('win32');
exports.isPlatformWindows = isPlatformWindows;
const isPlatformDarwin = (platform) => platform.includes('darwin');
exports.isPlatformDarwin = isPlatformDarwin;
const isPlatformLinux = (platform) => platform.includes('linux');
exports.isPlatformLinux = isPlatformLinux;
const isPlatformServer = (platform) => platform.includes('server');
exports.isPlatformServer = isPlatformServer;
const isPlatformCLI = (platform) => platform.includes('cli-');
exports.isPlatformCLI = isPlatformCLI;
switch (process.platform) {
    case 'darwin':
        exports.systemDefaultPlatform = process.arch === 'arm64' ? 'darwin-arm64' : 'darwin';
        break;
    case 'win32':
        exports.systemDefaultPlatform = process.arch === 'arm64' ? 'win32-arm64-archive' : 'win32-x64-archive';
        break;
    default:
        exports.systemDefaultPlatform =
            process.arch === 'arm64' ? 'linux-arm64' : process.arch === 'arm' ? 'linux-armhf' : 'linux-x64';
}
const UNRELEASED_SUFFIX = '-unreleased';
class Version {
    static parse(version) {
        const unreleased = version.endsWith(UNRELEASED_SUFFIX);
        if (unreleased) {
            version = version.slice(0, -UNRELEASED_SUFFIX.length);
        }
        return new Version(version, !unreleased);
    }
    constructor(id, isReleased = true) {
        this.id = id;
        this.isReleased = isReleased;
    }
    get isCommit() {
        return /^[0-9a-f]{40}$/.test(this.id);
    }
    get isInsiders() {
        return this.id === 'insiders' || this.id.endsWith('-insider');
    }
    get isStable() {
        return this.id === 'stable' || /^[0-9]+\.[0-9]+\.[0-9]$/.test(this.id);
    }
    toString() {
        return this.id + (this.isReleased ? '' : UNRELEASED_SUFFIX);
    }
}
exports.Version = Version;
function getVSCodeDownloadUrl(version, platform) {
    if (version.id === 'insiders') {
        return `https://update.code.visualstudio.com/latest/${platform}/insider?released=${version.isReleased}`;
    }
    else if (version.isInsiders) {
        return `https://update.code.visualstudio.com/${version.id}/${platform}/insider?released=${version.isReleased}`;
    }
    else if (version.isStable) {
        return `https://update.code.visualstudio.com/${version.id}/${platform}/stable?released=${version.isReleased}`;
    }
    else {
        // insiders commit hash
        return `https://update.code.visualstudio.com/commit:${version.id}/${platform}/insider`;
    }
}
let PROXY_AGENT = undefined;
let HTTPS_PROXY_AGENT = undefined;
if (process.env.npm_config_proxy) {
    PROXY_AGENT = new http_proxy_agent_1.HttpProxyAgent(process.env.npm_config_proxy);
    HTTPS_PROXY_AGENT = new https_proxy_agent_1.HttpsProxyAgent(process.env.npm_config_proxy);
}
if (process.env.npm_config_https_proxy) {
    HTTPS_PROXY_AGENT = new https_proxy_agent_1.HttpsProxyAgent(process.env.npm_config_https_proxy);
}
function urlToOptions(url) {
    const parsed = new url_1.URL(url);
    const options = {};
    if (PROXY_AGENT && parsed.protocol.startsWith('http:')) {
        options.agent = PROXY_AGENT;
    }
    if (HTTPS_PROXY_AGENT && parsed.protocol.startsWith('https:')) {
        options.agent = HTTPS_PROXY_AGENT;
    }
    return options;
}
function downloadDirToExecutablePath(dir, platform) {
    if ((0, exports.isPlatformServer)(platform)) {
        return (0, exports.isPlatformWindows)(platform)
            ? path.resolve(dir, 'bin', 'code-server.cmd')
            : path.resolve(dir, 'bin', 'code-server');
    }
    else if ((0, exports.isPlatformCLI)(platform)) {
        return (0, exports.isPlatformWindows)(platform) ? path.resolve(dir, 'code.exe') : path.resolve(dir, 'code');
    }
    else {
        if ((0, exports.isPlatformWindows)(platform)) {
            return path.resolve(dir, 'Code.exe');
        }
        else if ((0, exports.isPlatformDarwin)(platform)) {
            return path.resolve(dir, 'Visual Studio Code.app/Contents/MacOS/Electron');
        }
        else {
            return path.resolve(dir, 'code');
        }
    }
}
function insidersDownloadDirToExecutablePath(dir, platform) {
    if ((0, exports.isPlatformServer)(platform)) {
        return (0, exports.isPlatformWindows)(platform)
            ? path.resolve(dir, 'bin', 'code-server-insiders.cmd')
            : path.resolve(dir, 'bin', 'code-server-insiders');
    }
    else if ((0, exports.isPlatformCLI)(platform)) {
        return (0, exports.isPlatformWindows)(platform) ? path.resolve(dir, 'code-insiders.exe') : path.resolve(dir, 'code-insiders');
    }
    else {
        if ((0, exports.isPlatformWindows)(platform)) {
            return path.resolve(dir, 'Code - Insiders.exe');
        }
        else if ((0, exports.isPlatformDarwin)(platform)) {
            return path.resolve(dir, 'Visual Studio Code - Insiders.app/Contents/MacOS/Electron');
        }
        else {
            return path.resolve(dir, 'code-insiders');
        }
    }
}
function insidersDownloadDirMetadata(dir, platform, reporter) {
    let productJsonPath;
    if ((0, exports.isPlatformServer)(platform)) {
        productJsonPath = path.resolve(dir, 'product.json');
    }
    else if ((0, exports.isPlatformWindows)(platform)) {
        productJsonPath = path.resolve(dir, 'resources/app/product.json');
    }
    else if ((0, exports.isPlatformDarwin)(platform)) {
        productJsonPath = path.resolve(dir, 'Visual Studio Code - Insiders.app/Contents/Resources/app/product.json');
    }
    else {
        productJsonPath = path.resolve(dir, 'resources/app/product.json');
    }
    try {
        const productJson = JSON.parse((0, fs_1.readFileSync)(productJsonPath, 'utf-8'));
        return {
            version: productJson.commit,
            date: new Date(productJson.date),
        };
    }
    catch (e) {
        reporter.error(`Error reading product.json (${e}) will download again`);
        return {
            version: 'unknown',
            date: new Date(0),
        };
    }
}
async function getInsidersVersionMetadata(platform, version, released) {
    const remoteUrl = `https://update.code.visualstudio.com/api/versions/${version}/${platform}/insider?released=${released}`;
    return await request.getJSON(remoteUrl, 30_000);
}
async function getLatestInsidersMetadata(platform, released) {
    const remoteUrl = `https://update.code.visualstudio.com/api/update/${platform}/insider/latest?released=${released}`;
    return await request.getJSON(remoteUrl, 30_000);
}
/**
 * Resolve the VS Code cli path from executable path returned from `downloadAndUnzipVSCode`.
 * Usually you will want {@link resolveCliArgsFromVSCodeExecutablePath} instead.
 */
function resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath, platform = exports.systemDefaultPlatform) {
    if (platform === 'win32-archive') {
        throw new Error('Windows 32-bit is no longer supported');
    }
    if ((0, exports.isPlatformServer)(platform) || (0, exports.isPlatformCLI)(platform)) {
        // no separate CLI
        return vscodeExecutablePath;
    }
    if ((0, exports.isPlatformWindows)(platform)) {
        if (vscodeExecutablePath.endsWith('Code - Insiders.exe')) {
            return path.resolve(vscodeExecutablePath, '../bin/code-insiders.cmd');
        }
        else {
            return path.resolve(vscodeExecutablePath, '../bin/code.cmd');
        }
    }
    else if ((0, exports.isPlatformDarwin)(platform)) {
        return path.resolve(vscodeExecutablePath, '../../../Contents/Resources/app/bin/code');
    }
    else {
        if (vscodeExecutablePath.endsWith('code-insiders')) {
            return path.resolve(vscodeExecutablePath, '../bin/code-insiders');
        }
        else {
            return path.resolve(vscodeExecutablePath, '../bin/code');
        }
    }
}
/**
 * Resolve the VS Code cli arguments from executable path returned from `downloadAndUnzipVSCode`.
 * You can use this path to spawn processes for extension management. For example:
 *
 * ```ts
 * const cp = require('child_process');
 * const { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath } = require('@vscode/test-electron')
 * const vscodeExecutablePath = await downloadAndUnzipVSCode('1.36.0');
 * const [cli, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
 *
 * cp.spawnSync(cli, [...args, '--install-extension', '<EXTENSION-ID-OR-PATH-TO-VSIX>'], {
 *   encoding: 'utf-8',
 *   stdio: 'inherit'
 *   shell: process.platform === 'win32',
 * });
 * ```
 *
 * @param vscodeExecutablePath The `vscodeExecutablePath` from `downloadAndUnzipVSCode`.
 */
function resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath, options) {
    const args = [
        resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath, options?.platform ?? exports.systemDefaultPlatform),
    ];
    if (!options?.reuseMachineInstall) {
        args.push(...getProfileArguments(args));
    }
    return args;
}
/** Adds the extensions and user data dir to the arguments for the VS Code CLI */
function getProfileArguments(args) {
    const out = [];
    if (!hasArg('extensions-dir', args)) {
        out.push(`--extensions-dir=${path.join(download_1.defaultCachePath, 'extensions')}`);
    }
    if (!hasArg('user-data-dir', args)) {
        out.push(`--user-data-dir=${path.join(download_1.defaultCachePath, 'user-data')}`);
    }
    return out;
}
function hasArg(argName, argList) {
    return argList.some((a) => a === `--${argName}` || a.startsWith(`--${argName}=`));
}
class VSCodeCommandError extends Error {
    constructor(args, exitCode, stderr, stdout) {
        super(`'code ${args.join(' ')}' failed with exit code ${exitCode}:\n\n${stderr}\n\n${stdout}`);
        this.exitCode = exitCode;
        this.stderr = stderr;
        this.stdout = stdout;
    }
}
exports.VSCodeCommandError = VSCodeCommandError;
/**
 * Runs a VS Code command, and returns its output.
 *
 * @throws a {@link VSCodeCommandError} if the command fails
 */
async function runVSCodeCommand(_args, options = {}) {
    const args = _args.slice();
    let executable = await (0, download_1.downloadAndUnzipVSCode)(options);
    let shell = false;
    if (!options.reuseMachineInstall) {
        args.push(...getProfileArguments(args));
    }
    // Unless the user is manually running tests or extension development, then resolve to the CLI script
    if (!hasArg('extensionTestsPath', args) && !hasArg('extensionDevelopmentPath', args)) {
        executable = resolveCliPathFromVSCodeExecutablePath(executable, options?.platform ?? exports.systemDefaultPlatform);
        shell = process.platform === 'win32'; // CVE-2024-27980
    }
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        const child = (0, child_process_1.spawn)(shell ? `"${executable}"` : executable, args, {
            stdio: 'pipe',
            shell,
            windowsHide: true,
            ...options.spawn,
        });
        child.stdout?.setEncoding('utf-8').on('data', (data) => (stdout += data));
        child.stderr?.setEncoding('utf-8').on('data', (data) => (stderr += data));
        child.on('error', reject);
        child.on('exit', (code) => {
            if (code !== 0) {
                reject(new VSCodeCommandError(args, code, stderr, stdout));
            }
            else {
                resolve({ stdout, stderr });
            }
        });
    });
}
/** Predicates whether arg is undefined or null */
function isDefined(arg) {
    return arg != null;
}
/**
 * Validates the stream data matches the given length and checksum, if any.
 *
 * Note: md5 is not ideal, but it's what we get from the CDN, and for the
 * purposes of self-reported content verification is sufficient.
 */
function validateStream(readable, length, sha256) {
    let actualLen = 0;
    const checksum = sha256 ? (0, crypto_1.createHash)('sha256') : undefined;
    return new Promise((resolve, reject) => {
        readable.on('data', (chunk) => {
            checksum?.update(chunk);
            actualLen += chunk.length;
        });
        readable.on('error', reject);
        readable.on('end', () => {
            if (actualLen !== length) {
                return reject(new Error(`Downloaded stream length ${actualLen} does not match expected length ${length}`));
            }
            const digest = checksum?.digest('hex');
            if (digest && digest !== sha256) {
                return reject(new Error(`Downloaded file checksum ${digest} does not match expected checksum ${sha256}`));
            }
            resolve();
        });
    });
}
/** Gets a Buffer from a Node.js stream */
function streamToBuffer(readable) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readable.on('data', (chunk) => chunks.push(chunk));
        readable.on('error', reject);
        readable.on('end', () => resolve(Buffer.concat(chunks)));
    });
}
/** Gets whether child is a subdirectory of the parent */
function isSubdirectory(parent, child) {
    const relative = path.relative(parent, child);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}
/**
 * Wraps a function so that it's called once, and never again, memoizing
 * the result unless it rejects.
 */
function onceWithoutRejections(fn) {
    let value;
    return (...args) => {
        if (!value) {
            value = fn(...args).catch((err) => {
                value = undefined;
                throw err;
            });
        }
        return value;
    };
}
function killTree(processId, force) {
    let cp;
    if (process.platform === 'win32') {
        const windir = process.env['WINDIR'] || 'C:\\Windows';
        // when killing a process in Windows its child processes are *not* killed but become root processes.
        // Therefore we use TASKKILL.EXE
        cp = (0, child_process_1.spawn)(path.join(windir, 'System32', 'taskkill.exe'), [...(force ? ['/F'] : []), '/T', '/PID', processId.toString()], { stdio: 'inherit' });
    }
    else {
        // on linux and OS X we kill all direct and indirect child processes as well
        cp = (0, child_process_1.spawn)('sh', [path.resolve(__dirname, '../killTree.sh'), processId.toString(), force ? '9' : '15'], {
            stdio: 'inherit',
        });
    }
    return new Promise((resolve, reject) => {
        cp.on('error', reject).on('exit', resolve);
    });
}
