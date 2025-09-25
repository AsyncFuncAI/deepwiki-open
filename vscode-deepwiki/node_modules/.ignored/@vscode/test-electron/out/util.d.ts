import { SpawnOptions } from 'child_process';
import * as https from 'https';
import { DownloadOptions, DownloadPlatform } from './download';
import { TestOptions } from './runTest';
import { ProgressReporter } from './progress';
export declare let systemDefaultPlatform: DownloadPlatform;
export declare const isPlatformWindows: (platform: string) => boolean;
export declare const isPlatformDarwin: (platform: string) => boolean;
export declare const isPlatformLinux: (platform: string) => boolean;
export declare const isPlatformServer: (platform: string) => boolean;
export declare const isPlatformCLI: (platform: string) => boolean;
export declare class Version {
    readonly id: string;
    readonly isReleased: boolean;
    static parse(version: string): Version;
    constructor(id: string, isReleased?: boolean);
    get isCommit(): boolean;
    get isInsiders(): boolean;
    get isStable(): boolean;
    toString(): string;
}
export declare function getVSCodeDownloadUrl(version: Version, platform: string): string;
export declare function urlToOptions(url: string): https.RequestOptions;
export declare function downloadDirToExecutablePath(dir: string, platform: DownloadPlatform): string;
export declare function insidersDownloadDirToExecutablePath(dir: string, platform: DownloadPlatform): string;
export declare function insidersDownloadDirMetadata(dir: string, platform: DownloadPlatform, reporter: ProgressReporter): {
    version: any;
    date: Date;
};
export interface IUpdateMetadata {
    url: string;
    name: string;
    version: string;
    productVersion: string;
    hash: string;
    timestamp: number;
    sha256hash: string;
    supportsFastUpdate: boolean;
}
export declare function getInsidersVersionMetadata(platform: string, version: string, released: boolean): Promise<IUpdateMetadata>;
export declare function getLatestInsidersMetadata(platform: string, released: boolean): Promise<IUpdateMetadata>;
/**
 * Resolve the VS Code cli path from executable path returned from `downloadAndUnzipVSCode`.
 * Usually you will want {@link resolveCliArgsFromVSCodeExecutablePath} instead.
 */
export declare function resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath: string, platform?: DownloadPlatform): string;
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
export declare function resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath: string, options?: Pick<TestOptions, 'reuseMachineInstall' | 'platform'>): string[];
export interface RunVSCodeCommandOptions extends Partial<DownloadOptions> {
    /**
     * Additional options to pass to `child_process.spawn`
     */
    spawn?: SpawnOptions;
    /**
     * Whether VS Code should be launched using default settings and extensions
     * installed on this machine. If `false`, then separate directories will be
     * used inside the `.vscode-test` folder within the project.
     *
     * Defaults to `false`.
     */
    reuseMachineInstall?: boolean;
}
/** Adds the extensions and user data dir to the arguments for the VS Code CLI */
export declare function getProfileArguments(args: readonly string[]): string[];
export declare function hasArg(argName: string, argList: readonly string[]): boolean;
export declare class VSCodeCommandError extends Error {
    readonly exitCode: number | null;
    readonly stderr: string;
    stdout: string;
    constructor(args: string[], exitCode: number | null, stderr: string, stdout: string);
}
/**
 * Runs a VS Code command, and returns its output.
 *
 * @throws a {@link VSCodeCommandError} if the command fails
 */
export declare function runVSCodeCommand(_args: readonly string[], options?: RunVSCodeCommandOptions): Promise<{
    stdout: string;
    stderr: string;
}>;
/** Predicates whether arg is undefined or null */
export declare function isDefined<T>(arg: T | undefined | null): arg is T;
/**
 * Validates the stream data matches the given length and checksum, if any.
 *
 * Note: md5 is not ideal, but it's what we get from the CDN, and for the
 * purposes of self-reported content verification is sufficient.
 */
export declare function validateStream(readable: NodeJS.ReadableStream, length: number, sha256?: string): Promise<void>;
/** Gets a Buffer from a Node.js stream */
export declare function streamToBuffer(readable: NodeJS.ReadableStream): Promise<Buffer>;
/** Gets whether child is a subdirectory of the parent */
export declare function isSubdirectory(parent: string, child: string): boolean;
/**
 * Wraps a function so that it's called once, and never again, memoizing
 * the result unless it rejects.
 */
export declare function onceWithoutRejections<T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>): (...args: Args) => Promise<T>;
export declare function killTree(processId: number, force: boolean): Promise<void>;
