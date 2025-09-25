import { ProgressReporter } from './progress.js';
import { Version } from './util';
interface IFetchStableOptions {
    timeout: number;
    cachePath: string;
    platform: string;
}
interface IFetchInferredOptions extends IFetchStableOptions {
    extensionsDevelopmentPath?: string | string[];
}
export declare const fetchStableVersions: (released: boolean, timeout: number) => Promise<string[]>;
export declare const fetchInsiderVersions: (released: boolean, timeout: number) => Promise<string[]>;
export declare function fetchTargetInferredVersion(options: IFetchInferredOptions): Promise<Version>;
/**
 * Adapted from https://github.com/microsoft/TypeScript/issues/29729
 * Since `string | 'foo'` doesn't offer auto completion
 */
type StringLiteralUnion<T extends string> = T | (string & {});
export type DownloadVersion = StringLiteralUnion<'insiders' | 'stable'>;
export type DownloadPlatform = StringLiteralUnion<'darwin' | 'darwin-arm64' | 'win32-x64-archive' | 'win32-arm64-archive' | 'linux-x64' | 'linux-arm64' | 'linux-armhf'>;
export interface DownloadOptions {
    /**
     * The VS Code version to download. Valid versions are:
     * - `'stable'`
     * - `'insiders'`
     * - `'1.32.0'`, `'1.31.1'`, etc
     *
     * Defaults to `stable`, which is latest stable version.
     *
     * *If a local copy exists at `.vscode-test/vscode-<VERSION>`, skip download.*
     */
    version: DownloadVersion;
    /**
     * The VS Code platform to download. If not specified, it defaults to the
     * current platform.
     *
     * Possible values are:
     * 	- `win32-x64-archive`
     * 	- `win32-arm64-archive		`
     * 	- `darwin`
     * 	- `darwin-arm64`
     * 	- `linux-x64`
     * 	- `linux-arm64`
     * 	- `linux-armhf`
     */
    platform: DownloadPlatform;
    /**
     * Path where the downloaded VS Code instance is stored.
     * Defaults to `.vscode-test` within your working directory folder.
     */
    cachePath: string;
    /**
     * Absolute path to the extension root. Passed to `--extensionDevelopmentPath`.
     * Must include a `package.json` Extension Manifest.
     */
    extensionDevelopmentPath?: string | string[];
    /**
     * Progress reporter to use while VS Code is downloaded. Defaults to a
     * console reporter. A {@link SilentReporter} is also available, and you
     * may implement your own.
     */
    reporter?: ProgressReporter;
    /**
     * Whether the downloaded zip should be synchronously extracted. Should be
     * omitted unless you're experiencing issues installing VS Code versions.
     */
    extractSync?: boolean;
    /**
     * Number of milliseconds after which to time out if no data is received from
     * the remote when downloading VS Code. Note that this is an 'idle' timeout
     * and does not enforce the total time VS Code may take to download.
     */
    timeout?: number;
}
export declare const defaultCachePath: string;
/**
 * Download and unzip a copy of VS Code.
 * @returns Promise of `vscodeExecutablePath`.
 */
export declare function download(options?: Partial<DownloadOptions>): Promise<string>;
/**
 * Download and unzip a copy of VS Code in `.vscode-test`. The paths are:
 * - `.vscode-test/vscode-<PLATFORM>-<VERSION>`. For example, `./vscode-test/vscode-win32-1.32.0`
 * - `.vscode-test/vscode-win32-insiders`.
 *
 * *If a local copy exists at `.vscode-test/vscode-<PLATFORM>-<VERSION>`, skip download.*
 *
 * @param version The version of VS Code to download such as `1.32.0`. You can also use
 * `'stable'` for downloading latest stable release.
 * `'insiders'` for downloading latest Insiders.
 * When unspecified, download latest stable version.
 *
 * @returns Promise of `vscodeExecutablePath`.
 */
export declare function downloadAndUnzipVSCode(options: Partial<DownloadOptions>): Promise<string>;
export declare function downloadAndUnzipVSCode(version?: DownloadVersion, platform?: DownloadPlatform, reporter?: ProgressReporter, extractSync?: boolean): Promise<string>;
export {};
