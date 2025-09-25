/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 *
 * ---------------------------------------------------------
 * Generated file, DO NOT EDIT
 * ---------------------------------------------------------
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SystemData = require("../interfaces/common/SystemDataInterfaces");
const TfsCoreInterfaces = require("../interfaces/CoreInterfaces");
/**
 * The types of test attachments.
 */
var AttachmentType;
(function (AttachmentType) {
    /**
     * Attachment type GeneralAttachment , use this as default type unless you have other type.
     */
    AttachmentType[AttachmentType["GeneralAttachment"] = 0] = "GeneralAttachment";
    AttachmentType[AttachmentType["AfnStrip"] = 1] = "AfnStrip";
    AttachmentType[AttachmentType["BugFilingData"] = 2] = "BugFilingData";
    /**
     * Attachment type CodeCoverage.
     */
    AttachmentType[AttachmentType["CodeCoverage"] = 3] = "CodeCoverage";
    AttachmentType[AttachmentType["IntermediateCollectorData"] = 4] = "IntermediateCollectorData";
    AttachmentType[AttachmentType["RunConfig"] = 5] = "RunConfig";
    AttachmentType[AttachmentType["TestImpactDetails"] = 6] = "TestImpactDetails";
    AttachmentType[AttachmentType["TmiTestRunDeploymentFiles"] = 7] = "TmiTestRunDeploymentFiles";
    AttachmentType[AttachmentType["TmiTestRunReverseDeploymentFiles"] = 8] = "TmiTestRunReverseDeploymentFiles";
    AttachmentType[AttachmentType["TmiTestResultDetail"] = 9] = "TmiTestResultDetail";
    AttachmentType[AttachmentType["TmiTestRunSummary"] = 10] = "TmiTestRunSummary";
    /**
     * Attachment type ConsoleLog.
     */
    AttachmentType[AttachmentType["ConsoleLog"] = 11] = "ConsoleLog";
})(AttachmentType = exports.AttachmentType || (exports.AttachmentType = {}));
/**
 * Enum of type Clone Operation Type.
 */
var CloneOperationState;
(function (CloneOperationState) {
    /**
     * value for Failed State
     */
    CloneOperationState[CloneOperationState["Failed"] = 2] = "Failed";
    /**
     * value for Inprogress state
     */
    CloneOperationState[CloneOperationState["InProgress"] = 1] = "InProgress";
    /**
     * Value for Queued State
     */
    CloneOperationState[CloneOperationState["Queued"] = 0] = "Queued";
    /**
     * value for Success state
     */
    CloneOperationState[CloneOperationState["Succeeded"] = 3] = "Succeeded";
})(CloneOperationState = exports.CloneOperationState || (exports.CloneOperationState = {}));
/**
 * Represents status of code coverage summary for a build
 */
var CoverageDetailedSummaryStatus;
(function (CoverageDetailedSummaryStatus) {
    /**
     * No coverage status
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["None"] = 0] = "None";
    /**
     * The summary evaluation is in progress
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["InProgress"] = 1] = "InProgress";
    /**
     * The summary evaluation is finalized and won't change
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["Finalized"] = 2] = "Finalized";
    /**
     * The summary evaluation is pending
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["Pending"] = 3] = "Pending";
    /**
     * Summary evaluation may be ongoing but another merge has been requested.
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["UpdateRequestQueued"] = 4] = "UpdateRequestQueued";
    /**
     * No coverage modules found
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["NoModulesFound"] = 5] = "NoModulesFound";
    /**
     * Number of Files exceeded
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["NumberOfFilesExceeded"] = 6] = "NumberOfFilesExceeded";
    /**
     * TNo Input Files
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["NoInputFiles"] = 7] = "NoInputFiles";
    /**
     * Build got cancelled by user
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["BuildCancelled"] = 8] = "BuildCancelled";
    /**
     * Coverage Jobs failed
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["FailedJobs"] = 9] = "FailedJobs";
    /**
     * Module merge Timeout
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["ModuleMergeJobTimeout"] = 10] = "ModuleMergeJobTimeout";
    /**
     * Coverage successfully completed
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["CodeCoverageSuccess"] = 11] = "CodeCoverageSuccess";
    /**
     * Invalid Build Configuration
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["InvalidBuildConfiguration"] = 12] = "InvalidBuildConfiguration";
    /**
     * Coverage Analyzer Build not found
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["CoverageAnalyzerBuildNotFound"] = 13] = "CoverageAnalyzerBuildNotFound";
    /**
     * Failed to requeue the build
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["FailedToRequeue"] = 14] = "FailedToRequeue";
    /**
     * Build got Bailed out
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["BuildBailedOut"] = 15] = "BuildBailedOut";
    /**
     * No Code coverage configured
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["NoCodeCoverageTask"] = 16] = "NoCodeCoverageTask";
    /**
     * CoverageMerge Job failed
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["MergeJobFailed"] = 17] = "MergeJobFailed";
    /**
     * CoverageMergeInvoker Job failed
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["MergeInvokerJobFailed"] = 18] = "MergeInvokerJobFailed";
    /**
     * CoverageMonitor Job failed
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["MonitorJobFailed"] = 19] = "MonitorJobFailed";
    /**
     * CoverageMergeInvoker Job timeout
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["ModuleMergeInvokerJobTimeout"] = 20] = "ModuleMergeInvokerJobTimeout";
    /**
     * CoverageMonitor Job timeout
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["MonitorJobTimeout"] = 21] = "MonitorJobTimeout";
    /**
     * Invalid Coverage Input file
     */
    CoverageDetailedSummaryStatus[CoverageDetailedSummaryStatus["InvalidCoverageInput"] = 22] = "InvalidCoverageInput";
})(CoverageDetailedSummaryStatus = exports.CoverageDetailedSummaryStatus || (exports.CoverageDetailedSummaryStatus = {}));
/**
 * Used to choose which coverage data is returned by a QueryXXXCoverage() call.
 */
var CoverageQueryFlags;
(function (CoverageQueryFlags) {
    /**
     * If set, the Coverage.Modules property will be populated.
     */
    CoverageQueryFlags[CoverageQueryFlags["Modules"] = 1] = "Modules";
    /**
     * If set, the ModuleCoverage.Functions properties will be populated.
     */
    CoverageQueryFlags[CoverageQueryFlags["Functions"] = 2] = "Functions";
    /**
     * If set, the ModuleCoverage.CoverageData field will be populated.
     */
    CoverageQueryFlags[CoverageQueryFlags["BlockData"] = 4] = "BlockData";
})(CoverageQueryFlags = exports.CoverageQueryFlags || (exports.CoverageQueryFlags = {}));
var CoverageStatus;
(function (CoverageStatus) {
    CoverageStatus[CoverageStatus["Covered"] = 0] = "Covered";
    CoverageStatus[CoverageStatus["NotCovered"] = 1] = "NotCovered";
    CoverageStatus[CoverageStatus["PartiallyCovered"] = 2] = "PartiallyCovered";
})(CoverageStatus = exports.CoverageStatus || (exports.CoverageStatus = {}));
/**
 * Represents status of code coverage summary for a build
 */
var CoverageSummaryStatus;
(function (CoverageSummaryStatus) {
    /**
     * No coverage status
     */
    CoverageSummaryStatus[CoverageSummaryStatus["None"] = 0] = "None";
    /**
     * The summary evaluation is in progress
     */
    CoverageSummaryStatus[CoverageSummaryStatus["InProgress"] = 1] = "InProgress";
    /**
     * The summary evaluation for the previous request is completed. Summary can change in future
     */
    CoverageSummaryStatus[CoverageSummaryStatus["Completed"] = 2] = "Completed";
    /**
     * The summary evaluation is finalized and won't change
     */
    CoverageSummaryStatus[CoverageSummaryStatus["Finalized"] = 3] = "Finalized";
    /**
     * The summary evaluation is pending
     */
    CoverageSummaryStatus[CoverageSummaryStatus["Pending"] = 4] = "Pending";
    /**
     * Summary evaluation may be ongoing but another merge has been requested.
     */
    CoverageSummaryStatus[CoverageSummaryStatus["UpdateRequestQueued"] = 5] = "UpdateRequestQueued";
})(CoverageSummaryStatus = exports.CoverageSummaryStatus || (exports.CoverageSummaryStatus = {}));
var CustomTestFieldScope;
(function (CustomTestFieldScope) {
    CustomTestFieldScope[CustomTestFieldScope["None"] = 0] = "None";
    CustomTestFieldScope[CustomTestFieldScope["TestRun"] = 1] = "TestRun";
    CustomTestFieldScope[CustomTestFieldScope["TestResult"] = 2] = "TestResult";
    CustomTestFieldScope[CustomTestFieldScope["System"] = 4] = "System";
    CustomTestFieldScope[CustomTestFieldScope["All"] = 7] = "All";
})(CustomTestFieldScope = exports.CustomTestFieldScope || (exports.CustomTestFieldScope = {}));
var CustomTestFieldType;
(function (CustomTestFieldType) {
    CustomTestFieldType[CustomTestFieldType["Bit"] = 2] = "Bit";
    CustomTestFieldType[CustomTestFieldType["DateTime"] = 4] = "DateTime";
    CustomTestFieldType[CustomTestFieldType["Int"] = 8] = "Int";
    CustomTestFieldType[CustomTestFieldType["Float"] = 6] = "Float";
    CustomTestFieldType[CustomTestFieldType["String"] = 12] = "String";
    CustomTestFieldType[CustomTestFieldType["Guid"] = 14] = "Guid";
})(CustomTestFieldType = exports.CustomTestFieldType || (exports.CustomTestFieldType = {}));
var FlakyDetectionType;
(function (FlakyDetectionType) {
    /**
     * Custom defines manual detection type.
     */
    FlakyDetectionType[FlakyDetectionType["Custom"] = 1] = "Custom";
    /**
     * Defines System detection type.
     */
    FlakyDetectionType[FlakyDetectionType["System"] = 2] = "System";
})(FlakyDetectionType = exports.FlakyDetectionType || (exports.FlakyDetectionType = {}));
/**
 * Test summary metrics.
 */
var Metrics;
(function (Metrics) {
    /**
     * To get results of all matrix.
     */
    Metrics[Metrics["All"] = 1] = "All";
    /**
     * Get results summary by results outcome
     */
    Metrics[Metrics["ResultSummary"] = 2] = "ResultSummary";
    /**
     * Get results analysis which include failure analysis, increase/decrease in results count analysis.
     */
    Metrics[Metrics["ResultsAnalysis"] = 3] = "ResultsAnalysis";
    /**
     * Get runs summary
     */
    Metrics[Metrics["RunSummary"] = 4] = "RunSummary";
})(Metrics = exports.Metrics || (exports.Metrics = {}));
var OneMRXSessionState;
(function (OneMRXSessionState) {
    /**
     * Default
     */
    OneMRXSessionState[OneMRXSessionState["None"] = 0] = "None";
    /**
     * Session state with Running
     */
    OneMRXSessionState[OneMRXSessionState["Running"] = 1] = "Running";
    /**
     * Session state with Completed
     */
    OneMRXSessionState[OneMRXSessionState["Completed"] = 2] = "Completed";
    /**
     * Session state with Waiting
     */
    OneMRXSessionState[OneMRXSessionState["Waiting"] = 3] = "Waiting";
    /**
     * Session state with Cancelled
     */
    OneMRXSessionState[OneMRXSessionState["Cancelled"] = 4] = "Cancelled";
})(OneMRXSessionState = exports.OneMRXSessionState || (exports.OneMRXSessionState = {}));
var OperationType;
(function (OperationType) {
    OperationType[OperationType["Add"] = 1] = "Add";
    OperationType[OperationType["Delete"] = 2] = "Delete";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
/**
 * Additional details with test result
 */
var ResultDetails;
(function (ResultDetails) {
    /**
     * Core fields of test result. Core fields includes State, Outcome, Priority, AutomatedTestName, AutomatedTestStorage, Comments, ErrorMessage etc.
     */
    ResultDetails[ResultDetails["None"] = 0] = "None";
    /**
     * Test iteration details in a test result.
     */
    ResultDetails[ResultDetails["Iterations"] = 1] = "Iterations";
    /**
     * Workitems associated with a test result.
     */
    ResultDetails[ResultDetails["WorkItems"] = 2] = "WorkItems";
    /**
     * Subresults in a test result.
     */
    ResultDetails[ResultDetails["SubResults"] = 4] = "SubResults";
    /**
     * Point and plan detail in a test result.
     */
    ResultDetails[ResultDetails["Point"] = 8] = "Point";
})(ResultDetails = exports.ResultDetails || (exports.ResultDetails = {}));
/**
 * Hierarchy type of the result/subresults.
 */
var ResultGroupType;
(function (ResultGroupType) {
    /**
     * Leaf node of test result.
     */
    ResultGroupType[ResultGroupType["None"] = 0] = "None";
    /**
     * Hierarchy type of test result.
     */
    ResultGroupType[ResultGroupType["Rerun"] = 1] = "Rerun";
    /**
     * Hierarchy type of test result.
     */
    ResultGroupType[ResultGroupType["DataDriven"] = 2] = "DataDriven";
    /**
     * Hierarchy type of test result.
     */
    ResultGroupType[ResultGroupType["OrderedTest"] = 3] = "OrderedTest";
    /**
     * Unknown hierarchy type.
     */
    ResultGroupType[ResultGroupType["Generic"] = 4] = "Generic";
})(ResultGroupType = exports.ResultGroupType || (exports.ResultGroupType = {}));
var ResultMetadata;
(function (ResultMetadata) {
    /**
     * Rerun metadata
     */
    ResultMetadata[ResultMetadata["Rerun"] = 1] = "Rerun";
    /**
     * Flaky metadata
     */
    ResultMetadata[ResultMetadata["Flaky"] = 2] = "Flaky";
})(ResultMetadata = exports.ResultMetadata || (exports.ResultMetadata = {}));
/**
 * Additional details with test result metadata
 */
var ResultMetaDataDetails;
(function (ResultMetaDataDetails) {
    /**
     * Core fields of test result metadata.
     */
    ResultMetaDataDetails[ResultMetaDataDetails["None"] = 0] = "None";
    /**
     * Test FlakyIdentifiers details in test result metadata.
     */
    ResultMetaDataDetails[ResultMetaDataDetails["FlakyIdentifiers"] = 1] = "FlakyIdentifiers";
})(ResultMetaDataDetails = exports.ResultMetaDataDetails || (exports.ResultMetaDataDetails = {}));
/**
 * The top level entity that is being cloned as part of a Clone operation
 */
var ResultObjectType;
(function (ResultObjectType) {
    /**
     * Suite Clone
     */
    ResultObjectType[ResultObjectType["TestSuite"] = 0] = "TestSuite";
    /**
     * Plan Clone
     */
    ResultObjectType[ResultObjectType["TestPlan"] = 1] = "TestPlan";
})(ResultObjectType = exports.ResultObjectType || (exports.ResultObjectType = {}));
var RunType;
(function (RunType) {
    /**
     * Only used during an update to preserve the existing value.
     */
    RunType[RunType["Unspecified"] = 0] = "Unspecified";
    /**
     * Normal test run.
     */
    RunType[RunType["Normal"] = 1] = "Normal";
    /**
     * Test run created for the blocked result when a test point is blocked.
     */
    RunType[RunType["Blocking"] = 2] = "Blocking";
    /**
     * Test run created from Web.
     */
    RunType[RunType["Web"] = 4] = "Web";
    /**
     * Run initiated from web through MTR
     */
    RunType[RunType["MtrRunInitiatedFromWeb"] = 8] = "MtrRunInitiatedFromWeb";
    /**
     * These test run would require DTL environment. These could be either of automated or manual test run.
     */
    RunType[RunType["RunWithDtlEnv"] = 16] = "RunWithDtlEnv";
    /**
     * These test run may or may not have published test results but it will have summary like total test, passed test, failed test etc. These are automated tests.
     */
    RunType[RunType["NoConfigRun"] = 32] = "NoConfigRun";
})(RunType = exports.RunType || (exports.RunType = {}));
var Service;
(function (Service) {
    Service[Service["Any"] = 0] = "Any";
    Service[Service["Tcm"] = 1] = "Tcm";
    Service[Service["Tfs"] = 2] = "Tfs";
})(Service = exports.Service || (exports.Service = {}));
var SessionLinkType;
(function (SessionLinkType) {
    /**
     * Default
     */
    SessionLinkType[SessionLinkType["None"] = 0] = "None";
    /**
     * Link type for Session information
     */
    SessionLinkType[SessionLinkType["SessionInfo"] = 1] = "SessionInfo";
})(SessionLinkType = exports.SessionLinkType || (exports.SessionLinkType = {}));
var SessionResult;
(function (SessionResult) {
    /**
     * Default
     */
    SessionResult[SessionResult["None"] = 0] = "None";
    /**
     * Session result with Passed
     */
    SessionResult[SessionResult["Passed"] = 1] = "Passed";
    /**
     * Session result with Failed
     */
    SessionResult[SessionResult["Failed"] = 2] = "Failed";
})(SessionResult = exports.SessionResult || (exports.SessionResult = {}));
var SessionTimelineType;
(function (SessionTimelineType) {
    /**
     * Default
     */
    SessionTimelineType[SessionTimelineType["None"] = 0] = "None";
    /**
     * Timeline type for Queued status
     */
    SessionTimelineType[SessionTimelineType["Queued"] = 1] = "Queued";
    /**
     * Timeline type for Completed status
     */
    SessionTimelineType[SessionTimelineType["Completed"] = 2] = "Completed";
    /**
     * Timeline type for Started status
     */
    SessionTimelineType[SessionTimelineType["Started"] = 3] = "Started";
})(SessionTimelineType = exports.SessionTimelineType || (exports.SessionTimelineType = {}));
/**
 * Option to get details in response
 */
var SuiteExpand;
(function (SuiteExpand) {
    /**
     * Include children in response.
     */
    SuiteExpand[SuiteExpand["Children"] = 1] = "Children";
    /**
     * Include default testers in response.
     */
    SuiteExpand[SuiteExpand["DefaultTesters"] = 2] = "DefaultTesters";
})(SuiteExpand = exports.SuiteExpand || (exports.SuiteExpand = {}));
var TCMServiceDataMigrationStatus;
(function (TCMServiceDataMigrationStatus) {
    /**
     * Migration Not Started
     */
    TCMServiceDataMigrationStatus[TCMServiceDataMigrationStatus["NotStarted"] = 0] = "NotStarted";
    /**
     * Migration InProgress
     */
    TCMServiceDataMigrationStatus[TCMServiceDataMigrationStatus["InProgress"] = 1] = "InProgress";
    /**
     * Migration Completed
     */
    TCMServiceDataMigrationStatus[TCMServiceDataMigrationStatus["Completed"] = 2] = "Completed";
    /**
     * Migration Failed
     */
    TCMServiceDataMigrationStatus[TCMServiceDataMigrationStatus["Failed"] = 3] = "Failed";
})(TCMServiceDataMigrationStatus = exports.TCMServiceDataMigrationStatus || (exports.TCMServiceDataMigrationStatus = {}));
/**
 * Represents the state of an ITestConfiguration object.
 */
var TestConfigurationState;
(function (TestConfigurationState) {
    /**
     * The configuration can be used for new test runs.
     */
    TestConfigurationState[TestConfigurationState["Active"] = 1] = "Active";
    /**
     * The configuration has been retired and should not be used for new test runs.
     */
    TestConfigurationState[TestConfigurationState["Inactive"] = 2] = "Inactive";
})(TestConfigurationState = exports.TestConfigurationState || (exports.TestConfigurationState = {}));
/**
 * Test Log Context
 */
var TestLogScope;
(function (TestLogScope) {
    /**
     * Log file is associated with Run, result, subresult
     */
    TestLogScope[TestLogScope["Run"] = 0] = "Run";
    /**
     * Log File associated with Build
     */
    TestLogScope[TestLogScope["Build"] = 1] = "Build";
    /**
     * Log File associated with Release
     */
    TestLogScope[TestLogScope["Release"] = 2] = "Release";
})(TestLogScope = exports.TestLogScope || (exports.TestLogScope = {}));
/**
 * Test Log Status codes.
 */
var TestLogStatusCode;
(function (TestLogStatusCode) {
    /**
     * Operation is successful
     */
    TestLogStatusCode[TestLogStatusCode["Success"] = 0] = "Success";
    /**
     * Operation failed
     */
    TestLogStatusCode[TestLogStatusCode["Failed"] = 1] = "Failed";
    /**
     * Operation failed due to file already exist
     */
    TestLogStatusCode[TestLogStatusCode["FileAlreadyExists"] = 2] = "FileAlreadyExists";
    /**
     * Invalid input provided by user
     */
    TestLogStatusCode[TestLogStatusCode["InvalidInput"] = 3] = "InvalidInput";
    /**
     * Invalid file name provided by user
     */
    TestLogStatusCode[TestLogStatusCode["InvalidFileName"] = 4] = "InvalidFileName";
    /**
     * Error occurred while operating on container
     */
    TestLogStatusCode[TestLogStatusCode["InvalidContainer"] = 5] = "InvalidContainer";
    /**
     * Blob Transfer Error
     */
    TestLogStatusCode[TestLogStatusCode["TransferFailed"] = 6] = "TransferFailed";
    /**
     * TestLogStore feature is not enabled
     */
    TestLogStatusCode[TestLogStatusCode["FeatureDisabled"] = 7] = "FeatureDisabled";
    /**
     * Build for which operation is requested does not exist
     */
    TestLogStatusCode[TestLogStatusCode["BuildDoesNotExist"] = 8] = "BuildDoesNotExist";
    /**
     * Run for which operation is requested does not exist
     */
    TestLogStatusCode[TestLogStatusCode["RunDoesNotExist"] = 9] = "RunDoesNotExist";
    /**
     * Container cannot be created
     */
    TestLogStatusCode[TestLogStatusCode["ContainerNotCreated"] = 10] = "ContainerNotCreated";
    /**
     * Api is not supported
     */
    TestLogStatusCode[TestLogStatusCode["APINotSupported"] = 11] = "APINotSupported";
    /**
     * File size is greater than the limitation
     */
    TestLogStatusCode[TestLogStatusCode["FileSizeExceeds"] = 12] = "FileSizeExceeds";
    /**
     * Container is not found for which operation is requested
     */
    TestLogStatusCode[TestLogStatusCode["ContainerNotFound"] = 13] = "ContainerNotFound";
    /**
     * File cannot be found
     */
    TestLogStatusCode[TestLogStatusCode["FileNotFound"] = 14] = "FileNotFound";
    /**
     * Directory cannot be found
     */
    TestLogStatusCode[TestLogStatusCode["DirectoryNotFound"] = 15] = "DirectoryNotFound";
    /**
     * Storage capacity exceeded
     */
    TestLogStatusCode[TestLogStatusCode["StorageCapacityExceeded"] = 16] = "StorageCapacityExceeded";
})(TestLogStatusCode = exports.TestLogStatusCode || (exports.TestLogStatusCode = {}));
/**
 * Specifies set of possible log store endpoint type.
 */
var TestLogStoreEndpointType;
(function (TestLogStoreEndpointType) {
    /**
     * Endpoint type is scoped to root
     */
    TestLogStoreEndpointType[TestLogStoreEndpointType["Root"] = 1] = "Root";
    /**
     * Endpoint type is scoped to file
     */
    TestLogStoreEndpointType[TestLogStoreEndpointType["File"] = 2] = "File";
})(TestLogStoreEndpointType = exports.TestLogStoreEndpointType || (exports.TestLogStoreEndpointType = {}));
/**
 * Specifies set of possible operation type on log store.
 */
var TestLogStoreOperationType;
(function (TestLogStoreOperationType) {
    /**
     * Operation is scoped to read data only.
     */
    TestLogStoreOperationType[TestLogStoreOperationType["Read"] = 1] = "Read";
    /**
     * Operation is scoped to create data only.
     */
    TestLogStoreOperationType[TestLogStoreOperationType["Create"] = 2] = "Create";
    /**
     * Operation is scoped to read and create data.
     */
    TestLogStoreOperationType[TestLogStoreOperationType["ReadAndCreate"] = 3] = "ReadAndCreate";
})(TestLogStoreOperationType = exports.TestLogStoreOperationType || (exports.TestLogStoreOperationType = {}));
/**
 * Test Log Types
 */
var TestLogType;
(function (TestLogType) {
    /**
     * Any gereric attachment.
     */
    TestLogType[TestLogType["GeneralAttachment"] = 1] = "GeneralAttachment";
    /**
     * Code Coverage files
     */
    TestLogType[TestLogType["CodeCoverage"] = 2] = "CodeCoverage";
    /**
     * Test Impact details.
     */
    TestLogType[TestLogType["TestImpact"] = 3] = "TestImpact";
    /**
     * Temporary files
     */
    TestLogType[TestLogType["Intermediate"] = 4] = "Intermediate";
    /**
     * Subresult Attachment
     */
    TestLogType[TestLogType["System"] = 5] = "System";
    /**
     * merged Coverage file
     */
    TestLogType[TestLogType["MergedCoverageFile"] = 6] = "MergedCoverageFile";
})(TestLogType = exports.TestLogType || (exports.TestLogType = {}));
/**
 * Valid TestOutcome values.
 */
var TestOutcome;
(function (TestOutcome) {
    /**
     * Only used during an update to preserve the existing value.
     */
    TestOutcome[TestOutcome["Unspecified"] = 0] = "Unspecified";
    /**
     * Test has not been completed, or the test type does not report pass/failure.
     */
    TestOutcome[TestOutcome["None"] = 1] = "None";
    /**
     * Test was executed w/o any issues.
     */
    TestOutcome[TestOutcome["Passed"] = 2] = "Passed";
    /**
     * Test was executed, but there were issues. Issues may involve exceptions or failed assertions.
     */
    TestOutcome[TestOutcome["Failed"] = 3] = "Failed";
    /**
     * Test has completed, but we can't say if it passed or failed. May be used for aborted tests...
     */
    TestOutcome[TestOutcome["Inconclusive"] = 4] = "Inconclusive";
    /**
     * The test timed out
     */
    TestOutcome[TestOutcome["Timeout"] = 5] = "Timeout";
    /**
     * Test was aborted. This was not caused by a user gesture, but rather by a framework decision.
     */
    TestOutcome[TestOutcome["Aborted"] = 6] = "Aborted";
    /**
     * Test had it chance for been executed but was not, as ITestElement.IsRunnable == false.
     */
    TestOutcome[TestOutcome["Blocked"] = 7] = "Blocked";
    /**
     * Test was not executed. This was caused by a user gesture - e.g. user hit stop button.
     */
    TestOutcome[TestOutcome["NotExecuted"] = 8] = "NotExecuted";
    /**
     * To be used by Run level results. This is not a failure.
     */
    TestOutcome[TestOutcome["Warning"] = 9] = "Warning";
    /**
     * There was a system error while we were trying to execute a test.
     */
    TestOutcome[TestOutcome["Error"] = 10] = "Error";
    /**
     * Test is Not Applicable for execution.
     */
    TestOutcome[TestOutcome["NotApplicable"] = 11] = "NotApplicable";
    /**
     * Test is paused.
     */
    TestOutcome[TestOutcome["Paused"] = 12] = "Paused";
    /**
     * Test is currently executing. Added this for TCM charts
     */
    TestOutcome[TestOutcome["InProgress"] = 13] = "InProgress";
    /**
     * Test is not impacted. Added fot TIA.
     */
    TestOutcome[TestOutcome["NotImpacted"] = 14] = "NotImpacted";
    TestOutcome[TestOutcome["MaxValue"] = 14] = "MaxValue";
})(TestOutcome = exports.TestOutcome || (exports.TestOutcome = {}));
var TestPointState;
(function (TestPointState) {
    /**
     * Default
     */
    TestPointState[TestPointState["None"] = 0] = "None";
    /**
     * The test point needs to be executed in order for the test pass to be considered complete.  Either the test has not been run before or the previous run failed.
     */
    TestPointState[TestPointState["Ready"] = 1] = "Ready";
    /**
     * The test has passed successfully and does not need to be re-run for the test pass to be considered complete.
     */
    TestPointState[TestPointState["Completed"] = 2] = "Completed";
    /**
     * The test point needs to be executed but is not able to.
     */
    TestPointState[TestPointState["NotReady"] = 3] = "NotReady";
    /**
     * The test is being executed.
     */
    TestPointState[TestPointState["InProgress"] = 4] = "InProgress";
    TestPointState[TestPointState["MaxValue"] = 4] = "MaxValue";
})(TestPointState = exports.TestPointState || (exports.TestPointState = {}));
/**
 * Group by for results
 */
var TestResultGroupBy;
(function (TestResultGroupBy) {
    /**
     * Group the results by branches
     */
    TestResultGroupBy[TestResultGroupBy["Branch"] = 1] = "Branch";
    /**
     * Group the results by environment
     */
    TestResultGroupBy[TestResultGroupBy["Environment"] = 2] = "Environment";
})(TestResultGroupBy = exports.TestResultGroupBy || (exports.TestResultGroupBy = {}));
var TestResultsContextType;
(function (TestResultsContextType) {
    TestResultsContextType[TestResultsContextType["Build"] = 1] = "Build";
    TestResultsContextType[TestResultsContextType["Release"] = 2] = "Release";
    TestResultsContextType[TestResultsContextType["Pipeline"] = 3] = "Pipeline";
})(TestResultsContextType = exports.TestResultsContextType || (exports.TestResultsContextType = {}));
var TestResultsSessionState;
(function (TestResultsSessionState) {
    /**
     * Default
     */
    TestResultsSessionState[TestResultsSessionState["None"] = 0] = "None";
    /**
     * Session state with Running
     */
    TestResultsSessionState[TestResultsSessionState["Running"] = 1] = "Running";
    /**
     * Session state with Completed
     */
    TestResultsSessionState[TestResultsSessionState["Completed"] = 2] = "Completed";
    /**
     * Session state with Waiting
     */
    TestResultsSessionState[TestResultsSessionState["Waiting"] = 3] = "Waiting";
    /**
     * Session state with Cancelled
     */
    TestResultsSessionState[TestResultsSessionState["Cancelled"] = 4] = "Cancelled";
})(TestResultsSessionState = exports.TestResultsSessionState || (exports.TestResultsSessionState = {}));
var TestResultsSettingsType;
(function (TestResultsSettingsType) {
    /**
     * Returns All Test Settings.
     */
    TestResultsSettingsType[TestResultsSettingsType["All"] = 1] = "All";
    /**
     * Returns Flaky Test Settings.
     */
    TestResultsSettingsType[TestResultsSettingsType["Flaky"] = 2] = "Flaky";
    /**
     * Returns whether to log new tests or not
     */
    TestResultsSettingsType[TestResultsSettingsType["NewTestLogging"] = 3] = "NewTestLogging";
})(TestResultsSettingsType = exports.TestResultsSettingsType || (exports.TestResultsSettingsType = {}));
/**
 * The types of outcomes for test run.
 */
var TestRunOutcome;
(function (TestRunOutcome) {
    /**
     * Run with zero failed tests and has at least one impacted test
     */
    TestRunOutcome[TestRunOutcome["Passed"] = 0] = "Passed";
    /**
     * Run with at-least one failed test.
     */
    TestRunOutcome[TestRunOutcome["Failed"] = 1] = "Failed";
    /**
     * Run with no impacted tests.
     */
    TestRunOutcome[TestRunOutcome["NotImpacted"] = 2] = "NotImpacted";
    /**
     * Runs with All tests in other category.
     */
    TestRunOutcome[TestRunOutcome["Others"] = 3] = "Others";
})(TestRunOutcome = exports.TestRunOutcome || (exports.TestRunOutcome = {}));
/**
 * The types of publish context for run.
 */
var TestRunPublishContext;
(function (TestRunPublishContext) {
    /**
     * Run is published for Build Context.
     */
    TestRunPublishContext[TestRunPublishContext["Build"] = 1] = "Build";
    /**
     * Run is published for Release Context.
     */
    TestRunPublishContext[TestRunPublishContext["Release"] = 2] = "Release";
    /**
     * Run is published for any Context.
     */
    TestRunPublishContext[TestRunPublishContext["All"] = 3] = "All";
})(TestRunPublishContext = exports.TestRunPublishContext || (exports.TestRunPublishContext = {}));
/**
 * The types of states for test run.
 */
var TestRunState;
(function (TestRunState) {
    /**
     * Only used during an update to preserve the existing value.
     */
    TestRunState[TestRunState["Unspecified"] = 0] = "Unspecified";
    /**
     * The run is still being created.  No tests have started yet.
     */
    TestRunState[TestRunState["NotStarted"] = 1] = "NotStarted";
    /**
     * Tests are running.
     */
    TestRunState[TestRunState["InProgress"] = 2] = "InProgress";
    /**
     * All tests have completed or been skipped.
     */
    TestRunState[TestRunState["Completed"] = 3] = "Completed";
    /**
     * Run is stopped and remaining tests have been aborted
     */
    TestRunState[TestRunState["Aborted"] = 4] = "Aborted";
    /**
     * Run is currently initializing This is a legacy state and should not be used any more
     */
    TestRunState[TestRunState["Waiting"] = 5] = "Waiting";
    /**
     * Run requires investigation because of a test point failure This is a legacy state and should not be used any more
     */
    TestRunState[TestRunState["NeedsInvestigation"] = 6] = "NeedsInvestigation";
})(TestRunState = exports.TestRunState || (exports.TestRunState = {}));
/**
 * The types of sub states for test run. It gives the user more info about the test run beyond the high level test run state
 */
var TestRunSubstate;
(function (TestRunSubstate) {
    /**
     * Run with noState.
     */
    TestRunSubstate[TestRunSubstate["None"] = 0] = "None";
    /**
     * Run state while Creating Environment.
     */
    TestRunSubstate[TestRunSubstate["CreatingEnvironment"] = 1] = "CreatingEnvironment";
    /**
     * Run state while Running Tests.
     */
    TestRunSubstate[TestRunSubstate["RunningTests"] = 2] = "RunningTests";
    /**
     * Run state while Creating Environment.
     */
    TestRunSubstate[TestRunSubstate["CanceledByUser"] = 3] = "CanceledByUser";
    /**
     * Run state when it is Aborted By the System.
     */
    TestRunSubstate[TestRunSubstate["AbortedBySystem"] = 4] = "AbortedBySystem";
    /**
     * Run state when run has timedOut.
     */
    TestRunSubstate[TestRunSubstate["TimedOut"] = 5] = "TimedOut";
    /**
     * Run state while Pending Analysis.
     */
    TestRunSubstate[TestRunSubstate["PendingAnalysis"] = 6] = "PendingAnalysis";
    /**
     * Run state after being Analysed.
     */
    TestRunSubstate[TestRunSubstate["Analyzed"] = 7] = "Analyzed";
    /**
     * Run state when cancellation is in Progress.
     */
    TestRunSubstate[TestRunSubstate["CancellationInProgress"] = 8] = "CancellationInProgress";
})(TestRunSubstate = exports.TestRunSubstate || (exports.TestRunSubstate = {}));
/**
 * Represents the source from which the test session was created
 */
var TestSessionSource;
(function (TestSessionSource) {
    /**
     * Source of test session uncertain as it is stale
     */
    TestSessionSource[TestSessionSource["Unknown"] = 0] = "Unknown";
    /**
     * The session was created from Microsoft Test Manager exploratory desktop tool.
     */
    TestSessionSource[TestSessionSource["XTDesktop"] = 1] = "XTDesktop";
    /**
     * The session was created from feedback client.
     */
    TestSessionSource[TestSessionSource["FeedbackDesktop"] = 2] = "FeedbackDesktop";
    /**
     * The session was created from browser extension.
     */
    TestSessionSource[TestSessionSource["XTWeb"] = 3] = "XTWeb";
    /**
     * The session was created from browser extension.
     */
    TestSessionSource[TestSessionSource["FeedbackWeb"] = 4] = "FeedbackWeb";
    /**
     * The session was created from web access using Microsoft Test Manager exploratory desktop tool.
     */
    TestSessionSource[TestSessionSource["XTDesktop2"] = 5] = "XTDesktop2";
    /**
     * To show sessions from all supported sources.
     */
    TestSessionSource[TestSessionSource["SessionInsightsForAll"] = 6] = "SessionInsightsForAll";
})(TestSessionSource = exports.TestSessionSource || (exports.TestSessionSource = {}));
/**
 * Represents the state of the test session.
 */
var TestSessionState;
(function (TestSessionState) {
    /**
     * Only used during an update to preserve the existing value.
     */
    TestSessionState[TestSessionState["Unspecified"] = 0] = "Unspecified";
    /**
     * The session is still being created.
     */
    TestSessionState[TestSessionState["NotStarted"] = 1] = "NotStarted";
    /**
     * The session is running.
     */
    TestSessionState[TestSessionState["InProgress"] = 2] = "InProgress";
    /**
     * The session has paused.
     */
    TestSessionState[TestSessionState["Paused"] = 3] = "Paused";
    /**
     * The session has completed.
     */
    TestSessionState[TestSessionState["Completed"] = 4] = "Completed";
    /**
     * This is required for Feedback session which are declined
     */
    TestSessionState[TestSessionState["Declined"] = 5] = "Declined";
})(TestSessionState = exports.TestSessionState || (exports.TestSessionState = {}));
exports.TypeInfo = {
    AfnStrip: {},
    AggregatedDataForResultTrend: {},
    AggregatedResultDetailsByOutcome: {},
    AggregatedResultsAnalysis: {},
    AggregatedResultsByOutcome: {},
    AggregatedRunsByOutcome: {},
    AggregatedRunsByState: {},
    AttachmentType: {
        enumValues: {
            "generalAttachment": 0,
            "afnStrip": 1,
            "bugFilingData": 2,
            "codeCoverage": 3,
            "intermediateCollectorData": 4,
            "runConfig": 5,
            "testImpactDetails": 6,
            "tmiTestRunDeploymentFiles": 7,
            "tmiTestRunReverseDeploymentFiles": 8,
            "tmiTestResultDetail": 9,
            "tmiTestRunSummary": 10,
            "consoleLog": 11
        }
    },
    BatchResponse: {},
    BuildConfiguration: {},
    BuildCoverage: {},
    BuildReference2: {},
    BulkResultUpdateRequest: {},
    CloneOperationInformation: {},
    CloneOperationState: {
        enumValues: {
            "failed": 2,
            "inProgress": 1,
            "queued": 0,
            "succeeded": 3
        }
    },
    CodeCoverageSummary: {},
    Coverage2: {},
    CoverageDetailedSummaryStatus: {
        enumValues: {
            "none": 0,
            "inProgress": 1,
            "finalized": 2,
            "pending": 3,
            "updateRequestQueued": 4,
            "noModulesFound": 5,
            "numberOfFilesExceeded": 6,
            "noInputFiles": 7,
            "buildCancelled": 8,
            "failedJobs": 9,
            "moduleMergeJobTimeout": 10,
            "codeCoverageSuccess": 11,
            "invalidBuildConfiguration": 12,
            "coverageAnalyzerBuildNotFound": 13,
            "failedToRequeue": 14,
            "buildBailedOut": 15,
            "noCodeCoverageTask": 16,
            "mergeJobFailed": 17,
            "mergeInvokerJobFailed": 18,
            "monitorJobFailed": 19,
            "moduleMergeInvokerJobTimeout": 20,
            "monitorJobTimeout": 21,
            "invalidCoverageInput": 22
        }
    },
    CoverageQueryFlags: {
        enumValues: {
            "modules": 1,
            "functions": 2,
            "blockData": 4
        }
    },
    CoverageStatus: {
        enumValues: {
            "covered": 0,
            "notCovered": 1,
            "partiallyCovered": 2
        }
    },
    CoverageSummaryStatus: {
        enumValues: {
            "none": 0,
            "inProgress": 1,
            "completed": 2,
            "finalized": 3,
            "pending": 4,
            "updateRequestQueued": 5
        }
    },
    CreateTestMessageLogEntryRequest: {},
    CreateTestResultsRequest: {},
    CreateTestRunRequest: {},
    CustomTestFieldDefinition: {},
    CustomTestFieldScope: {
        enumValues: {
            "none": 0,
            "testRun": 1,
            "testResult": 2,
            "system": 4,
            "all": 7
        }
    },
    CustomTestFieldType: {
        enumValues: {
            "bit": 2,
            "dateTime": 4,
            "int": 8,
            "float": 6,
            "string": 12,
            "guid": 14
        }
    },
    DatedTestFieldData: {},
    FailingSince: {},
    FetchTestResultsResponse: {},
    FlakyDetection: {},
    FlakyDetectionType: {
        enumValues: {
            "custom": 1,
            "system": 2
        }
    },
    FlakySettings: {},
    LastResultDetails: {},
    LegacyBuildConfiguration: {},
    LegacyReleaseReference: {},
    LegacyTestCaseResult: {},
    LegacyTestRun: {},
    LegacyTestSettings: {},
    Metrics: {
        enumValues: {
            "all": 1,
            "resultSummary": 2,
            "resultsAnalysis": 3,
            "runSummary": 4
        }
    },
    OneMRXSessionState: {
        enumValues: {
            "none": 0,
            "running": 1,
            "completed": 2,
            "waiting": 3,
            "cancelled": 4
        }
    },
    OperationType: {
        enumValues: {
            "add": 1,
            "delete": 2
        }
    },
    PipelineTestMetrics: {},
    PointLastResult: {},
    PointsResults2: {},
    QueryTestActionResultResponse: {},
    ReleaseReference: {},
    ReleaseReference2: {},
    RequirementsToTestsMapping2: {},
    Response: {},
    ResultDetails: {
        enumValues: {
            "none": 0,
            "iterations": 1,
            "workItems": 2,
            "subResults": 4,
            "point": 8
        }
    },
    ResultGroupType: {
        enumValues: {
            "none": 0,
            "rerun": 1,
            "dataDriven": 2,
            "orderedTest": 3,
            "generic": 4
        }
    },
    ResultMetadata: {
        enumValues: {
            "rerun": 1,
            "flaky": 2
        }
    },
    ResultMetaDataDetails: {
        enumValues: {
            "none": 0,
            "flakyIdentifiers": 1
        }
    },
    ResultObjectType: {
        enumValues: {
            "testSuite": 0,
            "testPlan": 1
        }
    },
    ResultRetentionSettings: {},
    ResultsByQueryResponse: {},
    ResultsFilter: {},
    ResultsSummaryByOutcome: {},
    ResultSummary: {},
    ResultUpdateRequest: {},
    ResultUpdateRequestModel: {},
    ResultUpdateResponse: {},
    RunCreateModel: {},
    RunStatistic: {},
    RunSummary: {},
    RunSummaryModel: {},
    RunType: {
        enumValues: {
            "unspecified": 0,
            "normal": 1,
            "blocking": 2,
            "web": 4,
            "mtrRunInitiatedFromWeb": 8,
            "runWithDtlEnv": 16,
            "noConfigRun": 32
        }
    },
    RunUpdateModel: {},
    Service: {
        enumValues: {
            "any": 0,
            "tcm": 1,
            "tfs": 2
        }
    },
    Session: {},
    SessionLinkType: {
        enumValues: {
            "none": 0,
            "sessionInfo": 1
        }
    },
    SessionResult: {
        enumValues: {
            "none": 0,
            "passed": 1,
            "failed": 2
        }
    },
    SessionTimelineType: {
        enumValues: {
            "none": 0,
            "queued": 1,
            "completed": 2,
            "started": 3
        }
    },
    SourceViewBuildCoverage: {},
    SuiteExpand: {
        enumValues: {
            "children": 1,
            "defaultTesters": 2
        }
    },
    TCMServiceDataMigrationStatus: {
        enumValues: {
            "notStarted": 0,
            "inProgress": 1,
            "completed": 2,
            "failed": 3
        }
    },
    TestActionResult: {},
    TestActionResult2: {},
    TestActionResultModel: {},
    TestAttachment: {},
    TestAuthoringDetails: {},
    TestCaseReference2: {},
    TestCaseResult: {},
    TestConfiguration: {},
    TestConfigurationState: {
        enumValues: {
            "active": 1,
            "inactive": 2
        }
    },
    TestExecutionReportData: {},
    TestExtensionField: {},
    TestExtensionFieldDetails: {},
    TestFailuresAnalysis: {},
    TestHistoryQuery: {},
    TestIterationDetailsModel: {},
    TestLog: {},
    TestLogReference: {},
    TestLogScope: {
        enumValues: {
            "run": 0,
            "build": 1,
            "release": 2
        }
    },
    TestLogStatus: {},
    TestLogStatusCode: {
        enumValues: {
            "success": 0,
            "failed": 1,
            "fileAlreadyExists": 2,
            "invalidInput": 3,
            "invalidFileName": 4,
            "invalidContainer": 5,
            "transferFailed": 6,
            "featureDisabled": 7,
            "buildDoesNotExist": 8,
            "runDoesNotExist": 9,
            "containerNotCreated": 10,
            "apiNotSupported": 11,
            "fileSizeExceeds": 12,
            "containerNotFound": 13,
            "fileNotFound": 14,
            "directoryNotFound": 15,
            "storageCapacityExceeded": 16
        }
    },
    TestLogStoreAttachment: {},
    TestLogStoreEndpointDetails: {},
    TestLogStoreEndpointType: {
        enumValues: {
            "root": 1,
            "file": 2
        }
    },
    TestLogStoreOperationType: {
        enumValues: {
            "read": 1,
            "create": 2,
            "readAndCreate": 3
        }
    },
    TestLogType: {
        enumValues: {
            "generalAttachment": 1,
            "codeCoverage": 2,
            "testImpact": 3,
            "intermediate": 4,
            "system": 5,
            "mergedCoverageFile": 6
        }
    },
    TestMessageLogDetails: {},
    TestMessageLogEntry: {},
    TestMessageLogEntry2: {},
    TestOutcome: {
        enumValues: {
            "unspecified": 0,
            "none": 1,
            "passed": 2,
            "failed": 3,
            "inconclusive": 4,
            "timeout": 5,
            "aborted": 6,
            "blocked": 7,
            "notExecuted": 8,
            "warning": 9,
            "error": 10,
            "notApplicable": 11,
            "paused": 12,
            "inProgress": 13,
            "notImpacted": 14,
            "maxValue": 14
        }
    },
    TestParameter2: {},
    TestPlan: {},
    TestPlanCloneRequest: {},
    TestPlanHubData: {},
    TestPlansWithSelection: {},
    TestPoint: {},
    TestPointReference: {},
    TestPointsEvent: {},
    TestPointsQuery: {},
    TestPointState: {
        enumValues: {
            "none": 0,
            "ready": 1,
            "completed": 2,
            "notReady": 3,
            "inProgress": 4,
            "maxValue": 4
        }
    },
    TestPointsUpdatedEvent: {},
    TestResult2: {},
    TestResultAcrossProjectResponse: {},
    TestResultAttachment: {},
    TestResultGroupBy: {
        enumValues: {
            "branch": 1,
            "environment": 2
        }
    },
    TestResultHistory: {},
    TestResultHistoryDetailsForGroup: {},
    TestResultHistoryForGroup: {},
    TestResultModelBase: {},
    TestResultReset2: {},
    TestResultsContext: {},
    TestResultsContextType: {
        enumValues: {
            "build": 1,
            "release": 2,
            "pipeline": 3
        }
    },
    TestResultsDetails: {},
    TestResultsDetailsForGroup: {},
    TestResultsEx2: {},
    TestResultsQuery: {},
    TestResultsSession: {},
    TestResultsSessionState: {
        enumValues: {
            "none": 0,
            "running": 1,
            "completed": 2,
            "waiting": 3,
            "cancelled": 4
        }
    },
    TestResultsSettings: {},
    TestResultsSettingsType: {
        enumValues: {
            "all": 1,
            "flaky": 2,
            "newTestLogging": 3
        }
    },
    TestResultSummary: {},
    TestResultsUpdateSettings: {},
    TestResultsWithWatermark: {},
    TestResultTrendFilter: {},
    TestRun: {},
    TestRun2: {},
    TestRunCanceledEvent: {},
    TestRunCreatedEvent: {},
    TestRunEvent: {},
    TestRunEx2: {},
    TestRunOutcome: {
        enumValues: {
            "passed": 0,
            "failed": 1,
            "notImpacted": 2,
            "others": 3
        }
    },
    TestRunPublishContext: {
        enumValues: {
            "build": 1,
            "release": 2,
            "all": 3
        }
    },
    TestRunStartedEvent: {},
    TestRunState: {
        enumValues: {
            "unspecified": 0,
            "notStarted": 1,
            "inProgress": 2,
            "completed": 3,
            "aborted": 4,
            "waiting": 5,
            "needsInvestigation": 6
        }
    },
    TestRunStatistic: {},
    TestRunSubstate: {
        enumValues: {
            "none": 0,
            "creatingEnvironment": 1,
            "runningTests": 2,
            "canceledByUser": 3,
            "abortedBySystem": 4,
            "timedOut": 5,
            "pendingAnalysis": 6,
            "analyzed": 7,
            "cancellationInProgress": 8
        }
    },
    TestRunSummary2: {},
    TestRunWithDtlEnvEvent: {},
    TestSession: {},
    TestSessionExploredWorkItemReference: {},
    TestSessionSource: {
        enumValues: {
            "unknown": 0,
            "xtDesktop": 1,
            "feedbackDesktop": 2,
            "xtWeb": 3,
            "feedbackWeb": 4,
            "xtDesktop2": 5,
            "sessionInsightsForAll": 6
        }
    },
    TestSessionState: {
        enumValues: {
            "unspecified": 0,
            "notStarted": 1,
            "inProgress": 2,
            "paused": 3,
            "completed": 4,
            "declined": 5
        }
    },
    TestSettings2: {},
    TestSubResult: {},
    TestSuite: {},
    TestSummaryForWorkItem: {},
    Timeline: {},
    UpdatedProperties: {},
    UpdateTestRunRequest: {},
    UpdateTestRunResponse: {},
    WorkItemToTestLinks: {},
};
exports.TypeInfo.AfnStrip.fields = {
    creationDate: {
        isDate: true,
    }
};
exports.TypeInfo.AggregatedDataForResultTrend.fields = {
    resultsByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestOutcome,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedResultsByOutcome
    },
    runSummaryByState: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestRunState,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedRunsByState
    },
    testResultsContext: {
        typeInfo: exports.TypeInfo.TestResultsContext
    }
};
exports.TypeInfo.AggregatedResultDetailsByOutcome.fields = {
    outcome: {
        enumType: exports.TypeInfo.TestOutcome
    }
};
exports.TypeInfo.AggregatedResultsAnalysis.fields = {
    notReportedResultsByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestOutcome,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedResultsByOutcome
    },
    previousContext: {
        typeInfo: exports.TypeInfo.TestResultsContext
    },
    resultsByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestOutcome,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedResultsByOutcome
    },
    runSummaryByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestRunOutcome,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedRunsByOutcome
    },
    runSummaryByState: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestRunState,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedRunsByState
    }
};
exports.TypeInfo.AggregatedResultsByOutcome.fields = {
    outcome: {
        enumType: exports.TypeInfo.TestOutcome
    }
};
exports.TypeInfo.AggregatedRunsByOutcome.fields = {
    outcome: {
        enumType: exports.TypeInfo.TestRunOutcome
    }
};
exports.TypeInfo.AggregatedRunsByState.fields = {
    resultsByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestOutcome,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedResultsByOutcome
    },
    state: {
        enumType: exports.TypeInfo.TestRunState
    }
};
exports.TypeInfo.BatchResponse.fields = {
    responses: {
        isArray: true,
        typeInfo: exports.TypeInfo.Response
    },
};
exports.TypeInfo.BuildConfiguration.fields = {
    creationDate: {
        isDate: true,
    }
};
exports.TypeInfo.BuildCoverage.fields = {
    configuration: {
        typeInfo: exports.TypeInfo.BuildConfiguration
    }
};
exports.TypeInfo.BuildReference2.fields = {
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.BulkResultUpdateRequest.fields = {
    requests: {
        isArray: true,
        typeInfo: exports.TypeInfo.ResultUpdateRequest
    }
};
exports.TypeInfo.CloneOperationInformation.fields = {
    completionDate: {
        isDate: true,
    },
    creationDate: {
        isDate: true,
    },
    resultObjectType: {
        enumType: exports.TypeInfo.ResultObjectType
    },
    state: {
        enumType: exports.TypeInfo.CloneOperationState
    }
};
exports.TypeInfo.CodeCoverageSummary.fields = {
    coverageDetailedSummaryStatus: {
        enumType: exports.TypeInfo.CoverageDetailedSummaryStatus
    },
    status: {
        enumType: exports.TypeInfo.CoverageSummaryStatus
    }
};
exports.TypeInfo.Coverage2.fields = {
    dateCreated: {
        isDate: true,
    },
    dateModified: {
        isDate: true,
    }
};
exports.TypeInfo.CreateTestMessageLogEntryRequest.fields = {
    testMessageLogEntry: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestMessageLogEntry
    }
};
exports.TypeInfo.CreateTestResultsRequest.fields = {
    results: {
        isArray: true,
        typeInfo: exports.TypeInfo.LegacyTestCaseResult
    }
};
exports.TypeInfo.CreateTestRunRequest.fields = {
    results: {
        isArray: true,
        typeInfo: exports.TypeInfo.LegacyTestCaseResult
    },
    testRun: {
        typeInfo: exports.TypeInfo.LegacyTestRun
    },
    testSettings: {
        typeInfo: exports.TypeInfo.LegacyTestSettings
    }
};
exports.TypeInfo.CustomTestFieldDefinition.fields = {
    fieldType: {
        enumType: exports.TypeInfo.CustomTestFieldType
    },
    scope: {
        enumType: exports.TypeInfo.CustomTestFieldScope
    }
};
exports.TypeInfo.DatedTestFieldData.fields = {
    date: {
        isDate: true,
    }
};
exports.TypeInfo.FailingSince.fields = {
    date: {
        isDate: true,
    },
    release: {
        typeInfo: exports.TypeInfo.ReleaseReference
    }
};
exports.TypeInfo.FetchTestResultsResponse.fields = {
    actionResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestActionResult
    },
    attachments: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestResultAttachment
    },
    results: {
        isArray: true,
        typeInfo: exports.TypeInfo.LegacyTestCaseResult
    }
};
exports.TypeInfo.FlakyDetection.fields = {
    flakyDetectionType: {
        enumType: exports.TypeInfo.FlakyDetectionType
    }
};
exports.TypeInfo.FlakySettings.fields = {
    flakyDetection: {
        typeInfo: exports.TypeInfo.FlakyDetection
    }
};
exports.TypeInfo.LastResultDetails.fields = {
    dateCompleted: {
        isDate: true,
    }
};
exports.TypeInfo.LegacyBuildConfiguration.fields = {
    completedDate: {
        isDate: true,
    },
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.LegacyReleaseReference.fields = {
    environmentCreationDate: {
        isDate: true,
    },
    releaseCreationDate: {
        isDate: true,
    }
};
exports.TypeInfo.LegacyTestCaseResult.fields = {
    buildReference: {
        typeInfo: exports.TypeInfo.LegacyBuildConfiguration
    },
    creationDate: {
        isDate: true,
    },
    customFields: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestExtensionField
    },
    dateCompleted: {
        isDate: true,
    },
    dateStarted: {
        isDate: true,
    },
    failingSince: {
        typeInfo: exports.TypeInfo.FailingSince
    },
    lastUpdated: {
        isDate: true,
    },
    releaseReference: {
        typeInfo: exports.TypeInfo.LegacyReleaseReference
    },
    resultGroupType: {
        enumType: exports.TypeInfo.ResultGroupType
    },
    stackTrace: {
        typeInfo: exports.TypeInfo.TestExtensionField
    }
};
exports.TypeInfo.LegacyTestRun.fields = {
    buildReference: {
        typeInfo: exports.TypeInfo.LegacyBuildConfiguration
    },
    completeDate: {
        isDate: true,
    },
    creationDate: {
        isDate: true,
    },
    customFields: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestExtensionField
    },
    dueDate: {
        isDate: true,
    },
    lastUpdated: {
        isDate: true,
    },
    releaseReference: {
        typeInfo: exports.TypeInfo.LegacyReleaseReference
    },
    startDate: {
        isDate: true,
    },
    testMessageLogEntries: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestMessageLogDetails
    }
};
exports.TypeInfo.LegacyTestSettings.fields = {
    createdDate: {
        isDate: true,
    },
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.PipelineTestMetrics.fields = {
    resultSummary: {
        typeInfo: exports.TypeInfo.ResultSummary
    },
    runSummary: {
        typeInfo: exports.TypeInfo.RunSummary
    },
    summaryAtChild: {
        isArray: true,
        typeInfo: exports.TypeInfo.PipelineTestMetrics
    }
};
exports.TypeInfo.PointLastResult.fields = {
    lastUpdatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.PointsResults2.fields = {
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.QueryTestActionResultResponse.fields = {
    testActionResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestActionResult
    },
    testAttachments: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestResultAttachment
    }
};
exports.TypeInfo.ReleaseReference.fields = {
    creationDate: {
        isDate: true,
    },
    environmentCreationDate: {
        isDate: true,
    }
};
exports.TypeInfo.ReleaseReference2.fields = {
    environmentCreationDate: {
        isDate: true,
    },
    releaseCreationDate: {
        isDate: true,
    }
};
exports.TypeInfo.RequirementsToTestsMapping2.fields = {
    creationDate: {
        isDate: true,
    },
    deletionDate: {
        isDate: true,
    }
};
exports.TypeInfo.Response.fields = {};
exports.TypeInfo.ResultRetentionSettings.fields = {
    lastUpdatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.ResultsByQueryResponse.fields = {
    testResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.LegacyTestCaseResult
    }
};
exports.TypeInfo.ResultsFilter.fields = {
    executedIn: {
        enumType: exports.TypeInfo.Service
    },
    maxCompleteDate: {
        isDate: true,
    },
    testResultsContext: {
        typeInfo: exports.TypeInfo.TestResultsContext
    }
};
exports.TypeInfo.ResultsSummaryByOutcome.fields = {
    aggregatedResultDetailsByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestOutcome,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedResultDetailsByOutcome
    }
};
exports.TypeInfo.ResultSummary.fields = {
    resultSummaryByRunState: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestRunState,
        dictionaryValueTypeInfo: exports.TypeInfo.ResultsSummaryByOutcome
    }
};
exports.TypeInfo.ResultUpdateRequest.fields = {
    actionResultDeletes: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestActionResult
    },
    actionResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestActionResult
    },
    attachments: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestResultAttachment
    },
    testCaseResult: {
        typeInfo: exports.TypeInfo.LegacyTestCaseResult
    }
};
exports.TypeInfo.ResultUpdateRequestModel.fields = {
    actionResultDeletes: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestActionResultModel
    },
    actionResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestActionResultModel
    }
};
exports.TypeInfo.ResultUpdateResponse.fields = {
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.RunCreateModel.fields = {
    buildReference: {
        typeInfo: exports.TypeInfo.BuildConfiguration
    },
    releaseReference: {
        typeInfo: exports.TypeInfo.ReleaseReference
    },
    runSummary: {
        isArray: true,
        typeInfo: exports.TypeInfo.RunSummaryModel
    }
};
exports.TypeInfo.RunStatistic.fields = {
    resultMetadata: {
        enumType: exports.TypeInfo.ResultMetadata
    }
};
exports.TypeInfo.RunSummary.fields = {
    runSummaryByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestRunOutcome,
    },
    runSummaryByState: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestRunState,
    }
};
exports.TypeInfo.RunSummaryModel.fields = {
    testOutcome: {
        enumType: exports.TypeInfo.TestOutcome
    }
};
exports.TypeInfo.RunUpdateModel.fields = {
    logEntries: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestMessageLogDetails
    },
    runSummary: {
        isArray: true,
        typeInfo: exports.TypeInfo.RunSummaryModel
    },
    substate: {
        enumType: exports.TypeInfo.TestRunSubstate
    }
};
exports.TypeInfo.Session.fields = {
    endTimeUTC: {
        isDate: true,
    },
    result: {
        enumType: exports.TypeInfo.SessionResult
    },
    startTimeUTC: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.OneMRXSessionState
    },
};
exports.TypeInfo.SourceViewBuildCoverage.fields = {
    configuration: {
        typeInfo: exports.TypeInfo.BuildConfiguration
    }
};
exports.TypeInfo.TestActionResult.fields = {
    creationDate: {
        isDate: true,
    },
    dateCompleted: {
        isDate: true,
    },
    dateStarted: {
        isDate: true,
    },
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.TestActionResult2.fields = {
    creationDate: {
        isDate: true,
    },
    dateCompleted: {
        isDate: true,
    },
    dateStarted: {
        isDate: true,
    },
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.TestActionResultModel.fields = {
    completedDate: {
        isDate: true,
    },
    startedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestAttachment.fields = {
    attachmentType: {
        enumType: exports.TypeInfo.AttachmentType
    },
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestAuthoringDetails.fields = {
    lastUpdated: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.TestPointState
    }
};
exports.TypeInfo.TestCaseReference2.fields = {
    creationDate: {
        isDate: true,
    },
    lastRefTestRunDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestCaseResult.fields = {
    completedDate: {
        isDate: true,
    },
    createdDate: {
        isDate: true,
    },
    failingSince: {
        typeInfo: exports.TypeInfo.FailingSince
    },
    iterationDetails: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestIterationDetailsModel
    },
    lastUpdatedDate: {
        isDate: true,
    },
    releaseReference: {
        typeInfo: exports.TypeInfo.ReleaseReference
    },
    resultGroupType: {
        enumType: exports.TypeInfo.ResultGroupType
    },
    startedDate: {
        isDate: true,
    },
    subResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestSubResult
    }
};
exports.TypeInfo.TestConfiguration.fields = {
    lastUpdatedDate: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.TestConfigurationState
    }
};
exports.TypeInfo.TestExecutionReportData.fields = {
    reportData: {
        isArray: true,
        typeInfo: exports.TypeInfo.DatedTestFieldData
    }
};
exports.TypeInfo.TestExtensionField.fields = {
    field: {
        typeInfo: exports.TypeInfo.TestExtensionFieldDetails
    }
};
exports.TypeInfo.TestExtensionFieldDetails.fields = {
    type: {
        enumType: SystemData.TypeInfo.SqlDbType
    }
};
exports.TypeInfo.TestFailuresAnalysis.fields = {
    previousContext: {
        typeInfo: exports.TypeInfo.TestResultsContext
    }
};
exports.TypeInfo.TestHistoryQuery.fields = {
    groupBy: {
        enumType: exports.TypeInfo.TestResultGroupBy
    },
    maxCompleteDate: {
        isDate: true,
    },
    resultsForGroup: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestResultHistoryForGroup
    }
};
exports.TypeInfo.TestIterationDetailsModel.fields = {
    actionResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestActionResultModel
    },
    completedDate: {
        isDate: true,
    },
    startedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestLog.fields = {
    logReference: {
        typeInfo: exports.TypeInfo.TestLogReference
    },
    modifiedOn: {
        isDate: true,
    }
};
exports.TypeInfo.TestLogReference.fields = {
    scope: {
        enumType: exports.TypeInfo.TestLogScope
    },
    type: {
        enumType: exports.TypeInfo.TestLogType
    }
};
exports.TypeInfo.TestLogStatus.fields = {
    status: {
        enumType: exports.TypeInfo.TestLogStatusCode
    }
};
exports.TypeInfo.TestLogStoreAttachment.fields = {
    attachmentType: {
        enumType: exports.TypeInfo.AttachmentType
    },
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestLogStoreEndpointDetails.fields = {
    endpointType: {
        enumType: exports.TypeInfo.TestLogStoreEndpointType
    },
    status: {
        enumType: exports.TypeInfo.TestLogStatusCode
    }
};
exports.TypeInfo.TestMessageLogDetails.fields = {
    dateCreated: {
        isDate: true,
    }
};
exports.TypeInfo.TestMessageLogEntry.fields = {
    dateCreated: {
        isDate: true,
    }
};
exports.TypeInfo.TestMessageLogEntry2.fields = {
    dateCreated: {
        isDate: true,
    }
};
exports.TypeInfo.TestParameter2.fields = {
    creationDate: {
        isDate: true,
    },
    dateModified: {
        isDate: true,
    }
};
exports.TypeInfo.TestPlan.fields = {
    endDate: {
        isDate: true,
    },
    startDate: {
        isDate: true,
    },
    updatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestPlanCloneRequest.fields = {
    destinationTestPlan: {
        typeInfo: exports.TypeInfo.TestPlan
    }
};
exports.TypeInfo.TestPlanHubData.fields = {
    testPlan: {
        typeInfo: exports.TypeInfo.TestPlan
    },
    testPoints: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestPoint
    },
    testSuites: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestSuite
    }
};
exports.TypeInfo.TestPlansWithSelection.fields = {
    plans: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestPlan
    }
};
exports.TypeInfo.TestPoint.fields = {
    lastResetToActive: {
        isDate: true,
    },
    lastResultDetails: {
        typeInfo: exports.TypeInfo.LastResultDetails
    },
    lastUpdatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestPointReference.fields = {
    state: {
        enumType: exports.TypeInfo.TestPointState
    }
};
exports.TypeInfo.TestPointsEvent.fields = {
    testPoints: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestPointReference
    }
};
exports.TypeInfo.TestPointsQuery.fields = {
    points: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestPoint
    }
};
exports.TypeInfo.TestPointsUpdatedEvent.fields = {
    testPoints: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestPointReference
    }
};
exports.TypeInfo.TestResult2.fields = {
    creationDate: {
        isDate: true,
    },
    dateCompleted: {
        isDate: true,
    },
    dateStarted: {
        isDate: true,
    },
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.TestResultAcrossProjectResponse.fields = {
    testResult: {
        typeInfo: exports.TypeInfo.LegacyTestCaseResult
    }
};
exports.TypeInfo.TestResultAttachment.fields = {
    attachmentType: {
        enumType: exports.TypeInfo.AttachmentType
    },
    creationDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestResultHistory.fields = {
    resultsForGroup: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestResultHistoryDetailsForGroup
    }
};
exports.TypeInfo.TestResultHistoryDetailsForGroup.fields = {
    latestResult: {
        typeInfo: exports.TypeInfo.TestCaseResult
    }
};
exports.TypeInfo.TestResultHistoryForGroup.fields = {
    results: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestCaseResult
    }
};
exports.TypeInfo.TestResultModelBase.fields = {
    completedDate: {
        isDate: true,
    },
    startedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestResultReset2.fields = {
    dateModified: {
        isDate: true,
    }
};
exports.TypeInfo.TestResultsContext.fields = {
    contextType: {
        enumType: exports.TypeInfo.TestResultsContextType
    },
    release: {
        typeInfo: exports.TypeInfo.ReleaseReference
    }
};
exports.TypeInfo.TestResultsDetails.fields = {
    resultsForGroup: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestResultsDetailsForGroup
    }
};
exports.TypeInfo.TestResultsDetailsForGroup.fields = {
    results: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestCaseResult
    },
    resultsCountByOutcome: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.TestOutcome,
        dictionaryValueTypeInfo: exports.TypeInfo.AggregatedResultsByOutcome
    }
};
exports.TypeInfo.TestResultsEx2.fields = {
    creationDate: {
        isDate: true,
    },
    dateTimeValue: {
        isDate: true,
    }
};
exports.TypeInfo.TestResultsQuery.fields = {
    results: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestCaseResult
    },
    resultsFilter: {
        typeInfo: exports.TypeInfo.ResultsFilter
    }
};
exports.TypeInfo.TestResultsSession.fields = {
    endTimeUTC: {
        isDate: true,
    },
    result: {
        enumType: exports.TypeInfo.SessionResult
    },
    startTimeUTC: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.TestResultsSessionState
    },
};
exports.TypeInfo.TestResultsSettings.fields = {
    flakySettings: {
        typeInfo: exports.TypeInfo.FlakySettings
    }
};
exports.TypeInfo.TestResultSummary.fields = {
    aggregatedResultsAnalysis: {
        typeInfo: exports.TypeInfo.AggregatedResultsAnalysis
    },
    teamProject: {
        typeInfo: TfsCoreInterfaces.TypeInfo.TeamProjectReference
    },
    testFailures: {
        typeInfo: exports.TypeInfo.TestFailuresAnalysis
    },
    testResultsContext: {
        typeInfo: exports.TypeInfo.TestResultsContext
    }
};
exports.TypeInfo.TestResultsUpdateSettings.fields = {
    flakySettings: {
        typeInfo: exports.TypeInfo.FlakySettings
    }
};
exports.TypeInfo.TestResultsWithWatermark.fields = {
    changedDate: {
        isDate: true,
    },
    pointsResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.PointsResults2
    }
};
exports.TypeInfo.TestResultTrendFilter.fields = {
    maxCompleteDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestRun.fields = {
    buildConfiguration: {
        typeInfo: exports.TypeInfo.BuildConfiguration
    },
    completedDate: {
        isDate: true,
    },
    createdDate: {
        isDate: true,
    },
    dueDate: {
        isDate: true,
    },
    lastUpdatedDate: {
        isDate: true,
    },
    release: {
        typeInfo: exports.TypeInfo.ReleaseReference
    },
    runStatistics: {
        isArray: true,
        typeInfo: exports.TypeInfo.RunStatistic
    },
    startedDate: {
        isDate: true,
    },
    substate: {
        enumType: exports.TypeInfo.TestRunSubstate
    }
};
exports.TypeInfo.TestRun2.fields = {
    completeDate: {
        isDate: true,
    },
    creationDate: {
        isDate: true,
    },
    deletedOn: {
        isDate: true,
    },
    dueDate: {
        isDate: true,
    },
    lastUpdated: {
        isDate: true,
    },
    startDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestRunCanceledEvent.fields = {
    testRun: {
        typeInfo: exports.TypeInfo.TestRun
    }
};
exports.TypeInfo.TestRunCreatedEvent.fields = {
    testRun: {
        typeInfo: exports.TypeInfo.TestRun
    }
};
exports.TypeInfo.TestRunEvent.fields = {
    testRun: {
        typeInfo: exports.TypeInfo.TestRun
    }
};
exports.TypeInfo.TestRunEx2.fields = {
    createdDate: {
        isDate: true,
    },
    dateTimeValue: {
        isDate: true,
    }
};
exports.TypeInfo.TestRunStartedEvent.fields = {
    testRun: {
        typeInfo: exports.TypeInfo.TestRun
    }
};
exports.TypeInfo.TestRunStatistic.fields = {
    runStatistics: {
        isArray: true,
        typeInfo: exports.TypeInfo.RunStatistic
    }
};
exports.TypeInfo.TestRunSummary2.fields = {
    testRunCompletedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestRunWithDtlEnvEvent.fields = {
    testRun: {
        typeInfo: exports.TypeInfo.TestRun
    }
};
exports.TypeInfo.TestSession.fields = {
    endDate: {
        isDate: true,
    },
    lastUpdatedDate: {
        isDate: true,
    },
    source: {
        enumType: exports.TypeInfo.TestSessionSource
    },
    startDate: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.TestSessionState
    }
};
exports.TypeInfo.TestSessionExploredWorkItemReference.fields = {
    endTime: {
        isDate: true,
    },
    startTime: {
        isDate: true,
    }
};
exports.TypeInfo.TestSettings2.fields = {
    createdDate: {
        isDate: true,
    },
    lastUpdatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestSubResult.fields = {
    completedDate: {
        isDate: true,
    },
    lastUpdatedDate: {
        isDate: true,
    },
    resultGroupType: {
        enumType: exports.TypeInfo.ResultGroupType
    },
    startedDate: {
        isDate: true,
    },
    subResults: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestSubResult
    }
};
exports.TypeInfo.TestSuite.fields = {
    children: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestSuite
    },
    lastPopulatedDate: {
        isDate: true,
    },
    lastUpdatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TestSummaryForWorkItem.fields = {
    summary: {
        typeInfo: exports.TypeInfo.AggregatedDataForResultTrend
    }
};
exports.TypeInfo.Timeline.fields = {
    timestampUTC: {
        isDate: true,
    }
};
exports.TypeInfo.UpdatedProperties.fields = {
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.UpdateTestRunRequest.fields = {
    attachmentsToAdd: {
        isArray: true,
        typeInfo: exports.TypeInfo.TestResultAttachment
    },
    testRun: {
        typeInfo: exports.TypeInfo.LegacyTestRun
    }
};
exports.TypeInfo.UpdateTestRunResponse.fields = {
    updatedProperties: {
        typeInfo: exports.TypeInfo.UpdatedProperties
    }
};
exports.TypeInfo.WorkItemToTestLinks.fields = {
    executedIn: {
        enumType: exports.TypeInfo.Service
    }
};
