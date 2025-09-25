/** Stages of progress while downloading VS Code */
export declare enum ProgressReportStage {
    /** Initial fetch of the latest version if not explicitly given */
    FetchingVersion = "fetchingVersion",
    /** Always fired when the version is determined. */
    ResolvedVersion = "resolvedVersion",
    /** Fired before fetching info about the latest Insiders version, when requesting insiders builds */
    FetchingInsidersMetadata = "fetchingInsidersMetadata",
    /** Fired if the current Insiders is out of date */
    ReplacingOldInsiders = "replacingOldInsiders",
    /** Fired when an existing install is found which does not require a download */
    FoundMatchingInstall = "foundMatchingInstall",
    /** Fired before the URL to the download zip or tarball is looked up */
    ResolvingCDNLocation = "resolvingCDNLocation",
    /** Fired continuously while a download happens */
    Downloading = "downloading",
    /** Fired when the command is issued to do a synchronous extraction. May not fire depending on the platform and options. */
    ExtractingSynchonrously = "extractingSynchonrously",
    /** Fired when the download fails and a retry will be attempted */
    Retrying = "retrying",
    /** Fired after folder is downloaded and unzipped */
    NewInstallComplete = "newInstallComplete"
}
export type ProgressReport = {
    stage: ProgressReportStage.FetchingVersion;
} | {
    stage: ProgressReportStage.ResolvedVersion;
    version: string;
} | {
    stage: ProgressReportStage.FetchingInsidersMetadata;
} | {
    stage: ProgressReportStage.ReplacingOldInsiders;
    downloadedPath: string;
    oldHash: string;
    oldDate: Date;
    newHash: string;
    newDate: Date;
} | {
    stage: ProgressReportStage.FoundMatchingInstall;
    downloadedPath: string;
} | {
    stage: ProgressReportStage.ResolvingCDNLocation;
    url: string;
} | {
    stage: ProgressReportStage.Downloading;
    url: string;
    totalBytes: number;
    bytesSoFar: number;
} | {
    stage: ProgressReportStage.Retrying;
    error: Error;
    attempt: number;
    totalAttempts: number;
} | {
    stage: ProgressReportStage.ExtractingSynchonrously;
} | {
    stage: ProgressReportStage.NewInstallComplete;
    downloadedPath: string;
};
export interface ProgressReporter {
    report(report: ProgressReport): void;
    error(err: unknown): void;
}
/** Silent progress reporter */
export declare class SilentReporter implements ProgressReporter {
    report(): void;
    error(): void;
}
/** Default progress reporter that logs VS Code download progress to console */
export declare const makeConsoleReporter: () => Promise<ProgressReporter>;
