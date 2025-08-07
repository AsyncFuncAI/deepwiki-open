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
exports.TestRunFailedError = void 0;
exports.runTests = runTests;
const cp = __importStar(require("child_process"));
const download_1 = require("./download");
const util_1 = require("./util");
/**
 * Run VS Code extension test
 *
 * @returns The exit code of the command to launch VS Code extension test
 */
async function runTests(options) {
    if (!options.vscodeExecutablePath) {
        options.vscodeExecutablePath = await (0, download_1.downloadAndUnzipVSCode)(options);
    }
    let args = [
        // https://github.com/microsoft/vscode/issues/84238
        '--no-sandbox',
        // https://github.com/microsoft/vscode-test/issues/221
        '--disable-gpu-sandbox',
        // https://github.com/microsoft/vscode-test/issues/120
        '--disable-updates',
        '--skip-welcome',
        '--skip-release-notes',
        '--disable-workspace-trust',
        '--extensionTestsPath=' + options.extensionTestsPath,
    ];
    if (Array.isArray(options.extensionDevelopmentPath)) {
        args.push(...options.extensionDevelopmentPath.map((devPath) => `--extensionDevelopmentPath=${devPath}`));
    }
    else {
        args.push(`--extensionDevelopmentPath=${options.extensionDevelopmentPath}`);
    }
    if (options.launchArgs) {
        args = options.launchArgs.concat(args);
    }
    if (!options.reuseMachineInstall) {
        args.push(...(0, util_1.getProfileArguments)(args));
    }
    return innerRunTests(options.vscodeExecutablePath, args, options.extensionTestsEnv);
}
const SIGINT = 'SIGINT';
async function innerRunTests(executable, args, testRunnerEnv) {
    const fullEnv = Object.assign({}, process.env, testRunnerEnv);
    const shell = process.platform === 'win32';
    const cmd = cp.spawn(shell ? `"${executable}"` : executable, args, { env: fullEnv, shell });
    let exitRequested = false;
    const ctrlc1 = () => {
        process.removeListener(SIGINT, ctrlc1);
        process.on(SIGINT, ctrlc2);
        console.log('Closing VS Code gracefully. Press Ctrl+C to force close.');
        exitRequested = true;
        cmd.kill(SIGINT); // this should cause the returned promise to resolve
    };
    const ctrlc2 = () => {
        console.log('Closing VS Code forcefully.');
        process.removeListener(SIGINT, ctrlc2);
        exitRequested = true;
        (0, util_1.killTree)(cmd.pid, true);
    };
    const prom = new Promise((resolve, reject) => {
        if (cmd.pid) {
            process.on(SIGINT, ctrlc1);
        }
        cmd.stdout.on('data', (d) => process.stdout.write(d));
        cmd.stderr.on('data', (d) => process.stderr.write(d));
        cmd.on('error', function (data) {
            console.log('Test error: ' + data.toString());
        });
        let finished = false;
        function onProcessClosed(code, signal) {
            if (finished) {
                return;
            }
            finished = true;
            console.log(`Exit code:   ${code ?? signal}`);
            // fix: on windows, it seems like these descriptors can linger for an
            // indeterminate amount of time, causing the process to hang.
            cmd.stdout.destroy();
            cmd.stderr.destroy();
            if (code !== 0) {
                reject(new TestRunFailedError(code ?? undefined, signal ?? undefined));
            }
            else {
                resolve(0);
            }
        }
        cmd.on('close', onProcessClosed);
        cmd.on('exit', onProcessClosed);
    });
    let code;
    try {
        code = await prom;
    }
    finally {
        process.removeListener(SIGINT, ctrlc1);
        process.removeListener(SIGINT, ctrlc2);
    }
    // exit immediately if we handled a SIGINT and no one else did
    if (exitRequested && process.listenerCount(SIGINT) === 0) {
        process.exit(1);
    }
    return code;
}
class TestRunFailedError extends Error {
    constructor(code, signal) {
        super(signal ? `Test run terminated with signal ${signal}` : `Test run failed with code ${code}`);
        this.code = code;
        this.signal = signal;
    }
}
exports.TestRunFailedError = TestRunFailedError;
