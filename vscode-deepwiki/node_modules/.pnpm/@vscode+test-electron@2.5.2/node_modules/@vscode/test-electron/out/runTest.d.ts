import { DownloadOptions } from './download';
export interface TestOptions extends Partial<DownloadOptions> {
    /**
     * The VS Code executable path used for testing.
     *
     * If not passed, will use `options.version` to download a copy of VS Code for testing.
     * If `version` is not specified either, will download and use latest stable release.
     */
    vscodeExecutablePath?: string;
    /**
     * Whether VS Code should be launched using default settings and extensions
     * installed on this machine. If `false`, then separate directories will be
     * used inside the `.vscode-test` folder within the project.
     *
     * Defaults to `false`.
     */
    reuseMachineInstall?: boolean;
    /**
     * Absolute path to the extension root. Passed to `--extensionDevelopmentPath`.
     * Must include a `package.json` Extension Manifest.
     */
    extensionDevelopmentPath: string | string[];
    /**
     * Absolute path to the extension tests runner. Passed to `--extensionTestsPath`.
     * Can be either a file path or a directory path that contains an `index.js`.
     * Must export a `run` function of the following signature:
     *
     * ```ts
     * function run(): Promise<void>;
     * ```
     *
     * When running the extension test, the Extension Development Host will call this function
     * that runs the test suite. This function should throws an error if any test fails.
     *
     * The first argument is the path to the file specified in `extensionTestsPath`.
     *
     */
    extensionTestsPath: string;
    /**
     * Environment variables being passed to the extension test script.
     */
    extensionTestsEnv?: {
        [key: string]: string | undefined;
    };
    /**
     * A list of launch arguments passed to VS Code executable, in addition to `--extensionDevelopmentPath`
     * and `--extensionTestsPath` which are provided by `extensionDevelopmentPath` and `extensionTestsPath`
     * options.
     *
     * If the first argument is a path to a file/folder/workspace, the launched VS Code instance
     * will open it.
     *
     * See `code --help` for possible arguments.
     */
    launchArgs?: string[];
}
/**
 * Run VS Code extension test
 *
 * @returns The exit code of the command to launch VS Code extension test
 */
export declare function runTests(options: TestOptions): Promise<number>;
export declare class TestRunFailedError extends Error {
    readonly code: number | undefined;
    readonly signal: string | undefined;
    constructor(code: number | undefined, signal: string | undefined);
}
