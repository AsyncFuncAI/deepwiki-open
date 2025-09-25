/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { spawnSync } from 'child_process';
import { existsSync, promises as fs } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { downloadAndUnzipVSCode, fetchInsiderVersions, fetchStableVersions, fetchTargetInferredVersion, } from './download.js';
import { SilentReporter } from './progress.js';
import { isPlatformDarwin, isPlatformLinux, isPlatformWindows, resolveCliPathFromVSCodeExecutablePath } from './util.js';
const platforms = [
    'darwin',
    'darwin-arm64',
    'win32-x64-archive',
    'win32-arm64-archive',
    'linux-x64',
    'linux-arm64',
    'linux-armhf',
    'cli-linux-x64',
    'cli-win32-x64',
    'cli-darwin-x64',
    'server-win32-x64',
    'server-darwin',
    'server-linux-x64',
];
describe('sane downloads', () => {
    const testTempDir = join(tmpdir(), 'vscode-test-download');
    beforeAll(async () => {
        await fs.mkdir(testTempDir, { recursive: true });
    });
    const isRunnableOnThisPlatform = process.platform === 'win32'
        ? isPlatformWindows
        : process.platform === 'darwin'
            ? isPlatformDarwin
            : isPlatformLinux;
    for (const quality of ['insiders', 'stable']) {
        for (const platform of platforms) {
            test.concurrent(`${quality}/${platform}`, async () => {
                const location = await downloadAndUnzipVSCode({
                    platform,
                    version: quality,
                    cachePath: testTempDir,
                    reporter: new SilentReporter(),
                });
                if (!existsSync(location)) {
                    throw new Error(`expected ${location} to exist for ${platform}`);
                }
                const exePath = resolveCliPathFromVSCodeExecutablePath(location, platform);
                if (!existsSync(exePath)) {
                    throw new Error(`expected ${exePath} to from ${location}`);
                }
                if (platform.includes(process.arch) && isRunnableOnThisPlatform(platform)) {
                    const shell = process.platform === 'win32';
                    const version = spawnSync(shell ? `"${exePath}"` : exePath, ['--version'], { shell });
                    expect(version.status).to.equal(0);
                    expect(version.stdout.toString().trim()).to.not.be.empty;
                }
            });
        }
    }
    afterAll(async () => {
        try {
            await fs.rmdir(testTempDir, { recursive: true });
        }
        catch {
            // ignored
        }
    });
});
describe('fetchTargetInferredVersion', () => {
    let stable;
    let insiders;
    const extensionsDevelopmentPath = join(tmpdir(), 'vscode-test-tmp-workspace');
    beforeAll(async () => {
        [stable, insiders] = await Promise.all([fetchStableVersions(true, 5000), fetchInsiderVersions(true, 5000)]);
    });
    afterEach(async () => {
        await fs.rm(extensionsDevelopmentPath, { recursive: true, force: true });
    });
    const writeJSON = async (path, contents) => {
        const target = join(extensionsDevelopmentPath, path);
        await fs.mkdir(dirname(target), { recursive: true });
        await fs.writeFile(target, JSON.stringify(contents));
    };
    const doFetch = (paths = ['./']) => fetchTargetInferredVersion({
        cachePath: join(extensionsDevelopmentPath, '.cache'),
        platform: 'win32-x64-archive',
        timeout: 5000,
        extensionsDevelopmentPath: paths.map((p) => join(extensionsDevelopmentPath, p)),
    });
    test('matches stable if no workspace', async () => {
        const version = await doFetch();
        expect(version.id).to.equal(stable[0]);
    });
    test('matches stable by default', async () => {
        await writeJSON('package.json', {});
        const version = await doFetch();
        expect(version.id).to.equal(stable[0]);
    });
    test('matches if stable is defined', async () => {
        await writeJSON('package.json', { engines: { vscode: '^1.50.0' } });
        const version = await doFetch();
        expect(version.id).to.equal(stable[0]);
    });
    test('matches best', async () => {
        await writeJSON('package.json', { engines: { vscode: '<=1.60.5' } });
        const version = await doFetch();
        expect(version.id).to.equal('1.60.2');
    });
    test('matches multiple workspaces', async () => {
        await writeJSON('a/package.json', { engines: { vscode: '<=1.60.5' } });
        await writeJSON('b/package.json', { engines: { vscode: '<=1.55.5' } });
        const version = await doFetch(['a', 'b']);
        expect(version.id).to.equal('1.55.2');
    });
    test('matches insiders to better stable if there is one', async () => {
        await writeJSON('package.json', { engines: { vscode: '^1.60.0-insider' } });
        const version = await doFetch();
        expect(version.id).to.equal(stable[0]);
    });
    test('matches current insiders', async () => {
        await writeJSON('package.json', { engines: { vscode: `^${insiders[0]}` } });
        const version = await doFetch();
        expect(version.id).to.equal(insiders[0]);
    });
    test('matches insiders to exact', async () => {
        await writeJSON('package.json', { engines: { vscode: '1.60.0-insider' } });
        const version = await doFetch();
        expect(version.id).to.equal('1.60.0-insider');
    });
});
