"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeConsoleReporter = exports.SilentReporter = exports.ProgressReportStage = void 0;
/** Stages of progress while downloading VS Code */
var ProgressReportStage;
(function (ProgressReportStage) {
    /** Initial fetch of the latest version if not explicitly given */
    ProgressReportStage["FetchingVersion"] = "fetchingVersion";
    /** Always fired when the version is determined. */
    ProgressReportStage["ResolvedVersion"] = "resolvedVersion";
    /** Fired before fetching info about the latest Insiders version, when requesting insiders builds */
    ProgressReportStage["FetchingInsidersMetadata"] = "fetchingInsidersMetadata";
    /** Fired if the current Insiders is out of date */
    ProgressReportStage["ReplacingOldInsiders"] = "replacingOldInsiders";
    /** Fired when an existing install is found which does not require a download */
    ProgressReportStage["FoundMatchingInstall"] = "foundMatchingInstall";
    /** Fired before the URL to the download zip or tarball is looked up */
    ProgressReportStage["ResolvingCDNLocation"] = "resolvingCDNLocation";
    /** Fired continuously while a download happens */
    ProgressReportStage["Downloading"] = "downloading";
    /** Fired when the command is issued to do a synchronous extraction. May not fire depending on the platform and options. */
    ProgressReportStage["ExtractingSynchonrously"] = "extractingSynchonrously";
    /** Fired when the download fails and a retry will be attempted */
    ProgressReportStage["Retrying"] = "retrying";
    /** Fired after folder is downloaded and unzipped */
    ProgressReportStage["NewInstallComplete"] = "newInstallComplete";
})(ProgressReportStage || (exports.ProgressReportStage = ProgressReportStage = {}));
/** Silent progress reporter */
class SilentReporter {
    report() {
        // no-op
    }
    error() {
        // no-op
    }
}
exports.SilentReporter = SilentReporter;
/** Default progress reporter that logs VS Code download progress to console */
const makeConsoleReporter = async () => {
    // needs to be async targeting Node 16 because ora is an es module that cannot be required
    const { default: ora } = await import('ora');
    let version;
    let spinner = ora('Resolving version...').start();
    function toMB(bytes) {
        return (bytes / 1024 / 1024).toFixed(2);
    }
    return {
        error(err) {
            if (spinner) {
                spinner?.fail(`Error: ${err}`);
                spinner = undefined;
            }
            else {
                console.error(err);
            }
        },
        report(report) {
            switch (report.stage) {
                case ProgressReportStage.ResolvedVersion:
                    version = report.version;
                    spinner?.succeed(`Validated version: ${version}`);
                    spinner = undefined;
                    break;
                case ProgressReportStage.ReplacingOldInsiders:
                    spinner?.succeed();
                    spinner = ora(`Updating Insiders ${report.oldHash} (${report.oldDate.toISOString()}) -> ${report.newHash}`).start();
                    break;
                case ProgressReportStage.FoundMatchingInstall:
                    spinner?.succeed();
                    spinner = undefined;
                    ora(`Found existing install in ${report.downloadedPath}`).succeed();
                    break;
                case ProgressReportStage.ResolvingCDNLocation:
                    spinner?.succeed();
                    spinner = ora(`Found at ${report.url}`).start();
                    break;
                case ProgressReportStage.Downloading:
                    if (report.bytesSoFar === 0) {
                        spinner?.succeed();
                        spinner = ora(`Downloading (${toMB(report.totalBytes)} MB)`).start();
                    }
                    else if (spinner) {
                        if (report.bytesSoFar === report.totalBytes) {
                            spinner.text = 'Extracting...';
                        }
                        else {
                            const percent = Math.max(0, Math.min(1, report.bytesSoFar / report.totalBytes));
                            const size = `${toMB(report.bytesSoFar)}/${toMB(report.totalBytes)}MB`;
                            spinner.text = `Downloading VS Code: ${size} (${(percent * 100).toFixed()}%)`;
                        }
                    }
                    break;
                case ProgressReportStage.Retrying:
                    spinner?.fail(`Error downloading, retrying (attempt ${report.attempt} of ${report.totalAttempts}): ${report.error.message}`);
                    spinner = undefined;
                    break;
                case ProgressReportStage.NewInstallComplete:
                    spinner?.succeed(`Downloaded VS Code into ${report.downloadedPath}`);
                    spinner = undefined;
                    break;
            }
        },
    };
};
exports.makeConsoleReporter = makeConsoleReporter;
