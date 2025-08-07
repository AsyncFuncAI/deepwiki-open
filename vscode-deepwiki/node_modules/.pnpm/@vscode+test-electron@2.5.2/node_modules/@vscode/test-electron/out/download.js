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
exports.defaultCachePath = exports.fetchInsiderVersions = exports.fetchStableVersions = void 0;
exports.fetchTargetInferredVersion = fetchTargetInferredVersion;
exports.download = download;
exports.downloadAndUnzipVSCode = downloadAndUnzipVSCode;
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const os_1 = require("os");
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const stream_1 = require("stream");
const util_1 = require("util");
const progress_js_1 = require("./progress.js");
const request = __importStar(require("./request"));
const util_2 = require("./util");
const extensionRoot = process.cwd();
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
const vscodeStableReleasesAPI = `https://update.code.visualstudio.com/api/releases/stable`;
const vscodeInsiderReleasesAPI = `https://update.code.visualstudio.com/api/releases/insider`;
const downloadDirNameFormat = /^vscode-(?<platform>[a-z0-9-]+)-(?<version>[0-9.]+)$/;
const makeDownloadDirName = (platform, version) => `vscode-${platform}-${version.id}`;
const DOWNLOAD_ATTEMPTS = 3;
// Turn off Electron's special handling of .asar files, otherwise
// extraction will fail when we try to extract node_modules.asar
// under Electron's Node (i.e. in the test CLI invoked by an extension)
// https://github.com/electron/packager/issues/875
//
// Also, trying to delete a directory with an asar in it will fail.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.noAsar = true;
exports.fetchStableVersions = (0, util_2.onceWithoutRejections)((released, timeout) => request.getJSON(`${vscodeStableReleasesAPI}?released=${released}`, timeout));
exports.fetchInsiderVersions = (0, util_2.onceWithoutRejections)((released, timeout) => request.getJSON(`${vscodeInsiderReleasesAPI}?released=${released}`, timeout));
/**
 * Returns the stable version to run tests against. Attempts to get the latest
 * version from the update sverice, but falls back to local installs if
 * not available (e.g. if the machine is offline).
 */
async function fetchTargetStableVersion({ timeout, cachePath, platform }) {
    try {
        const versions = await (0, exports.fetchStableVersions)(true, timeout);
        return new util_2.Version(versions[0]);
    }
    catch (e) {
        return fallbackToLocalEntries(cachePath, platform, e);
    }
}
async function fetchTargetInferredVersion(options) {
    if (!options.extensionsDevelopmentPath) {
        return fetchTargetStableVersion(options);
    }
    // load all engines versions from all development paths. Then, get the latest
    // stable version (or, latest Insiders version) that satisfies all
    // `engines.vscode` constraints.
    const extPaths = Array.isArray(options.extensionsDevelopmentPath)
        ? options.extensionsDevelopmentPath
        : [options.extensionsDevelopmentPath];
    const maybeExtVersions = await Promise.all(extPaths.map(getEngineVersionFromExtension));
    const extVersions = maybeExtVersions.filter(util_2.isDefined);
    const matches = (v) => !extVersions.some((range) => !semver.satisfies(v, range, { includePrerelease: true }));
    try {
        const stable = await (0, exports.fetchStableVersions)(true, options.timeout);
        const found1 = stable.find(matches);
        if (found1) {
            return new util_2.Version(found1);
        }
        const insiders = await (0, exports.fetchInsiderVersions)(true, options.timeout);
        const found2 = insiders.find(matches);
        if (found2) {
            return new util_2.Version(found2);
        }
        const v = extVersions.join(', ');
        console.warn(`No version of VS Code satisfies all extension engine constraints (${v}). Falling back to stable.`);
        return new util_2.Version(stable[0]); // 🤷
    }
    catch (e) {
        return fallbackToLocalEntries(options.cachePath, options.platform, e);
    }
}
async function getEngineVersionFromExtension(extensionPath) {
    try {
        const packageContents = await fs.promises.readFile(path.join(extensionPath, 'package.json'), 'utf8');
        const packageJson = JSON.parse(packageContents);
        return packageJson?.engines?.vscode;
    }
    catch {
        return undefined;
    }
}
async function fallbackToLocalEntries(cachePath, platform, fromError) {
    const entries = await fs.promises.readdir(cachePath).catch(() => []);
    const [fallbackTo] = entries
        .map((e) => downloadDirNameFormat.exec(e))
        .filter(util_2.isDefined)
        .filter((e) => e.groups.platform === platform)
        .map((e) => e.groups.version)
        .sort((a, b) => semver.compare(b, a));
    if (fallbackTo) {
        console.warn(`Error retrieving VS Code versions, using already-installed version ${fallbackTo}`, fromError);
        return new util_2.Version(fallbackTo);
    }
    throw fromError;
}
async function isValidVersion(version, timeout) {
    if (version.id === 'insiders' || version.id === 'stable' || version.isCommit) {
        return true;
    }
    if (version.isStable) {
        const stableVersionNumbers = await (0, exports.fetchStableVersions)(version.isReleased, timeout);
        if (stableVersionNumbers.includes(version.id)) {
            return true;
        }
    }
    if (version.isInsiders) {
        const insiderVersionNumbers = await (0, exports.fetchInsiderVersions)(version.isReleased, timeout);
        if (insiderVersionNumbers.includes(version.id)) {
            return true;
        }
    }
    return false;
}
function getFilename(contentDisposition) {
    const parts = contentDisposition.split(';').map((s) => s.trim());
    for (const part of parts) {
        const match = /^filename="?([^"]*)"?$/i.exec(part);
        if (match) {
            return match[1];
        }
    }
    return undefined;
}
/**
 * Download a copy of VS Code archive to `.vscode-test`.
 *
 * @param version The version of VS Code to download such as '1.32.0'. You can also use
 * `'stable'` for downloading latest stable release.
 * `'insiders'` for downloading latest Insiders.
 */
async function downloadVSCodeArchive(options) {
    if (!fs.existsSync(options.cachePath)) {
        fs.mkdirSync(options.cachePath);
    }
    const timeout = options.timeout;
    const version = util_2.Version.parse(options.version);
    const downloadUrl = (0, util_2.getVSCodeDownloadUrl)(version, options.platform);
    options.reporter?.report({ stage: progress_js_1.ProgressReportStage.ResolvingCDNLocation, url: downloadUrl });
    const res = await request.getStream(downloadUrl, timeout);
    if (res.statusCode !== 302) {
        throw 'Failed to get VS Code archive location';
    }
    const url = res.headers.location;
    if (!url) {
        throw 'Failed to get VS Code archive location';
    }
    const contentSHA256 = res.headers['x-sha256'];
    res.destroy();
    const download = await request.getStream(url, timeout);
    const totalBytes = Number(download.headers['content-length']);
    const contentDisposition = download.headers['content-disposition'];
    const fileName = contentDisposition ? getFilename(contentDisposition) : undefined;
    const isZip = fileName?.endsWith('zip') ?? url.endsWith('.zip');
    const timeoutCtrl = new request.TimeoutController(timeout);
    options.reporter?.report({
        stage: progress_js_1.ProgressReportStage.Downloading,
        url,
        bytesSoFar: 0,
        totalBytes,
    });
    let bytesSoFar = 0;
    download.on('data', (chunk) => {
        bytesSoFar += chunk.length;
        timeoutCtrl.touch();
        options.reporter?.report({
            stage: progress_js_1.ProgressReportStage.Downloading,
            url,
            bytesSoFar,
            totalBytes,
        });
    });
    download.on('end', () => {
        timeoutCtrl.dispose();
        options.reporter?.report({
            stage: progress_js_1.ProgressReportStage.Downloading,
            url,
            bytesSoFar: totalBytes,
            totalBytes,
        });
    });
    timeoutCtrl.signal.addEventListener('abort', () => {
        download.emit('error', new request.TimeoutError(timeout));
        download.destroy();
    });
    return {
        stream: download,
        format: isZip ? 'zip' : 'tgz',
        sha256: contentSHA256,
        length: totalBytes,
    };
}
/**
 * Unzip a .zip or .tar.gz VS Code archive stream.
 */
async function unzipVSCode(reporter, extractDir, platform, { format, stream, length, sha256 }) {
    const stagingFile = path.join((0, os_1.tmpdir)(), `vscode-test-${Date.now()}.zip`);
    const checksum = (0, util_2.validateStream)(stream, length, sha256);
    if (format === 'zip') {
        const stripComponents = (0, util_2.isPlatformServer)(platform) ? 1 : 0;
        try {
            reporter.report({ stage: progress_js_1.ProgressReportStage.ExtractingSynchonrously });
            // note: this used to use Expand-Archive, but this caused a failure
            // on longer file paths on windows. And we used to use the streaming
            // "unzipper", but the module was very outdated and a bit buggy.
            // Instead, use jszip. It's well-used and actually 8x faster than
            // Expand-Archive on my machine.
            if (process.platform === 'win32') {
                const [buffer, JSZip] = await Promise.all([(0, util_2.streamToBuffer)(stream), import('jszip')]);
                await checksum;
                const content = await JSZip.default.loadAsync(buffer);
                // extract file with jszip
                for (const filename of Object.keys(content.files)) {
                    const file = content.files[filename];
                    if (file.dir) {
                        continue;
                    }
                    const filepath = stripComponents
                        ? path.join(extractDir, filename.split(/[/\\]/g).slice(stripComponents).join(path.sep))
                        : path.join(extractDir, filename);
                    // vscode update zips are trusted, but check for zip slip anyway.
                    if (!(0, util_2.isSubdirectory)(extractDir, filepath)) {
                        throw new Error(`Invalid zip file: ${filename}`);
                    }
                    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
                    await pipelineAsync(file.nodeStream(), fs.createWriteStream(filepath));
                }
            }
            else {
                // darwin or *nix sync
                await pipelineAsync(stream, fs.createWriteStream(stagingFile));
                await checksum;
                // unzip does not create intermediate directories when using -d
                await fs.promises.mkdir(extractDir, { recursive: true });
                await spawnDecompressorChild('unzip', ['-q', stagingFile, '-d', extractDir]);
                // unzip has no --strip-components equivalent
                if (stripComponents) {
                    const files = await fs.promises.readdir(extractDir);
                    for (const file of files) {
                        const dirPath = path.join(extractDir, file);
                        const children = await fs.promises.readdir(dirPath);
                        await Promise.all(children.map((c) => fs.promises.rename(path.join(dirPath, c), path.join(extractDir, c))));
                        await fs.promises.rmdir(dirPath);
                    }
                }
            }
        }
        finally {
            fs.unlink(stagingFile, () => undefined);
        }
    }
    else {
        const stripComponents = (0, util_2.isPlatformCLI)(platform) ? 0 : 1;
        // tar does not create extractDir by default
        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir);
        }
        // The CLI is a singular binary that doesn't have a wrapper component to remove
        await spawnDecompressorChild('tar', ['-xzf', '-', `--strip-components=${stripComponents}`, '-C', extractDir], stream);
        await checksum;
    }
}
function spawnDecompressorChild(command, args, input) {
    return new Promise((resolve, reject) => {
        const child = cp.spawn(command, args, { stdio: 'pipe' });
        if (input) {
            input.on('error', reject);
            input.pipe(child.stdin);
        }
        child.stderr.pipe(process.stderr);
        child.stdout.pipe(process.stdout);
        child.on('error', reject);
        child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Failed to unzip archive, exited with ${code}`)));
    });
}
exports.defaultCachePath = path.resolve(extensionRoot, '.vscode-test');
const COMPLETE_FILE_NAME = 'is-complete';
/**
 * Download and unzip a copy of VS Code.
 * @returns Promise of `vscodeExecutablePath`.
 */
async function download(options = {}) {
    const inputVersion = options?.version ? util_2.Version.parse(options.version) : undefined;
    const { platform = util_2.systemDefaultPlatform, cachePath = exports.defaultCachePath, reporter = await (0, progress_js_1.makeConsoleReporter)(), timeout = 15_000, } = options;
    let version;
    if (inputVersion?.id === 'stable') {
        version = await fetchTargetStableVersion({ timeout, cachePath, platform });
    }
    else if (inputVersion) {
        /**
         * Only validate version against server when no local download that matches version exists
         */
        if (!fs.existsSync(path.resolve(cachePath, makeDownloadDirName(platform, inputVersion)))) {
            if (!(await isValidVersion(inputVersion, timeout))) {
                throw Error(`Invalid version ${inputVersion.id}`);
            }
        }
        version = inputVersion;
    }
    else {
        version = await fetchTargetInferredVersion({
            timeout,
            cachePath,
            platform,
            extensionsDevelopmentPath: options.extensionDevelopmentPath,
        });
    }
    if (platform === 'win32-archive' && semver.satisfies(version.id, '>= 1.85.0', { includePrerelease: true })) {
        throw new Error('Windows 32-bit is no longer supported from v1.85 onwards');
    }
    reporter.report({ stage: progress_js_1.ProgressReportStage.ResolvedVersion, version: version.toString() });
    const downloadedPath = path.resolve(cachePath, makeDownloadDirName(platform, version));
    if (fs.existsSync(path.join(downloadedPath, COMPLETE_FILE_NAME))) {
        if (version.isInsiders) {
            reporter.report({ stage: progress_js_1.ProgressReportStage.FetchingInsidersMetadata });
            const { version: currentHash, date: currentDate } = (0, util_2.insidersDownloadDirMetadata)(downloadedPath, platform, reporter);
            const { version: latestHash, timestamp: latestTimestamp } = version.id === 'insiders' // not qualified with a date
                ? await (0, util_2.getLatestInsidersMetadata)(util_2.systemDefaultPlatform, version.isReleased)
                : await (0, util_2.getInsidersVersionMetadata)(util_2.systemDefaultPlatform, version.id, version.isReleased);
            if (currentHash === latestHash) {
                reporter.report({ stage: progress_js_1.ProgressReportStage.FoundMatchingInstall, downloadedPath });
                return Promise.resolve((0, util_2.insidersDownloadDirToExecutablePath)(downloadedPath, platform));
            }
            else {
                try {
                    reporter.report({
                        stage: progress_js_1.ProgressReportStage.ReplacingOldInsiders,
                        downloadedPath,
                        oldDate: currentDate,
                        oldHash: currentHash,
                        newDate: new Date(latestTimestamp),
                        newHash: latestHash,
                    });
                    await fs.promises.rm(downloadedPath, { force: true, recursive: true });
                }
                catch (err) {
                    reporter.error(err);
                    throw Error(`Failed to remove outdated Insiders at ${downloadedPath}.`);
                }
            }
        }
        else if (version.isStable) {
            reporter.report({ stage: progress_js_1.ProgressReportStage.FoundMatchingInstall, downloadedPath });
            return Promise.resolve((0, util_2.downloadDirToExecutablePath)(downloadedPath, platform));
        }
        else {
            reporter.report({ stage: progress_js_1.ProgressReportStage.FoundMatchingInstall, downloadedPath });
            return Promise.resolve((0, util_2.insidersDownloadDirToExecutablePath)(downloadedPath, platform));
        }
    }
    for (let i = 0;; i++) {
        try {
            await fs.promises.rm(downloadedPath, { recursive: true, force: true });
            const download = await downloadVSCodeArchive({
                version: version.toString(),
                platform,
                cachePath,
                reporter,
                timeout,
            });
            // important! do not put anything async here, since unzipVSCode will need
            // to start consuming the stream immediately.
            await unzipVSCode(reporter, downloadedPath, platform, download);
            await fs.promises.writeFile(path.join(downloadedPath, COMPLETE_FILE_NAME), '');
            reporter.report({ stage: progress_js_1.ProgressReportStage.NewInstallComplete, downloadedPath });
            break;
        }
        catch (error) {
            if (i++ < DOWNLOAD_ATTEMPTS) {
                reporter.report({
                    stage: progress_js_1.ProgressReportStage.Retrying,
                    attempt: i,
                    error: error,
                    totalAttempts: DOWNLOAD_ATTEMPTS,
                });
            }
            else {
                reporter.error(error);
                throw Error(`Failed to download and unzip VS Code ${version}`);
            }
        }
    }
    reporter.report({ stage: progress_js_1.ProgressReportStage.NewInstallComplete, downloadedPath });
    if (version.isStable) {
        return (0, util_2.downloadDirToExecutablePath)(downloadedPath, platform);
    }
    else {
        return (0, util_2.insidersDownloadDirToExecutablePath)(downloadedPath, platform);
    }
}
async function downloadAndUnzipVSCode(versionOrOptions, platform, reporter, extractSync) {
    return await download(typeof versionOrOptions === 'object'
        ? versionOrOptions
        : { version: versionOrOptions, platform, reporter, extractSync });
}
