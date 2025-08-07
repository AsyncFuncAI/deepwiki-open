/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import Contracts = require("./interfaces/TestInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface ITestResultsApi extends basem.ClientApiBase {
    createTestIterationResultAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, iterationId: number, actionPath?: string): Promise<Contracts.TestAttachmentReference>;
    createTestResultAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number): Promise<Contracts.TestAttachmentReference>;
    createTestSubResultAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<Contracts.TestAttachmentReference>;
    deleteTestResultAttachment(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<void>;
    getTestIterationAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number, iterationId: number): Promise<NodeJS.ReadableStream>;
    getTestIterationAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number, iterationId: number): Promise<NodeJS.ReadableStream>;
    getTestResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getTestResultAttachments(project: string, runId: number, testCaseResultId: number): Promise<Contracts.TestAttachment[]>;
    getTestResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getTestSubResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    getTestSubResultAttachments(project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<Contracts.TestAttachment[]>;
    getTestSubResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    createTestRunAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number): Promise<Contracts.TestAttachmentReference>;
    deleteTestRunAttachment(project: string, runId: number, attachmentId: number): Promise<void>;
    getTestRunAttachmentContent(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getTestRunAttachments(project: string, runId: number): Promise<Contracts.TestAttachment[]>;
    getTestRunAttachmentZip(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getBugsLinkedToTestResult(project: string, runId: number, testCaseResultId: number): Promise<Contracts.WorkItemReference[]>;
    fetchSourceCodeCoverageReport(project: string, buildId: number): Promise<Contracts.SourceViewBuildCoverage[]>;
    getBuildCodeCoverage(project: string, buildId: number, flags: number): Promise<Contracts.BuildCoverage[]>;
    getCodeCoverageSummary(project: string, buildId: number, deltaBuildId?: number): Promise<Contracts.CodeCoverageSummary>;
    updateCodeCoverageSummary(project: string, buildId: number, coverageData?: Contracts.CodeCoverageData): Promise<void>;
    getTestRunCodeCoverage(project: string, runId: number, flags: number): Promise<Contracts.TestRunCoverage[]>;
    getFileLevelCodeCoverage(fileCoverageRequest: Contracts.FileCoverageRequest, project: string): Promise<NodeJS.ReadableStream>;
    queryTestResultHistory(filter: Contracts.ResultsFilter, project: string): Promise<Contracts.TestResultHistory>;
    getTestRunMessageLogs(project: string, runId: number): Promise<Contracts.TestMessageLogDetails[]>;
    getTestPipelineMetrics(project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, metricNames?: Contracts.Metrics[], groupByNode?: boolean): Promise<Contracts.PipelineTestMetrics>;
    getTestResultDetailsForBuild(project: string, buildId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<Contracts.TestResultsDetails>;
    getTestResultDetailsForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<Contracts.TestResultsDetails>;
    publishTestResultDocument(document: Contracts.TestResultDocument, project: string, runId: number): Promise<Contracts.TestResultDocument>;
    getResultGroupsByBuild(project: string, buildId: number, publishContext: string, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.FieldDetailsForTestResults>>;
    getResultGroupsByRelease(project: string, releaseId: number, publishContext: string, releaseEnvId?: number, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.FieldDetailsForTestResults>>;
    queryTestResultsMetaData(testCaseReferenceIds: string[], project: string, detailsToInclude?: Contracts.ResultMetaDataDetails): Promise<Contracts.TestResultMetaData[]>;
    updateTestResultsMetaData(testResultMetaDataUpdateInput: Contracts.TestResultMetaDataUpdateInput, project: string, testCaseReferenceId: number): Promise<Contracts.TestResultMetaData>;
    getTestResultsByQuery(query: Contracts.TestResultsQuery, project: string): Promise<Contracts.TestResultsQuery>;
    getTestResultsByQueryWiql(queryModel: Contracts.QueryModel, project: string, includeResultDetails?: boolean, includeIterationDetails?: boolean, skip?: number, top?: number): Promise<Contracts.TestCaseResult[]>;
    addTestResultsToTestRun(results: Contracts.TestCaseResult[], project: string, runId: number): Promise<Contracts.TestCaseResult[]>;
    getTestResultById(project: string, runId: number, testResultId: number, detailsToInclude?: Contracts.ResultDetails): Promise<Contracts.TestCaseResult>;
    getTestResults(project: string, runId: number, detailsToInclude?: Contracts.ResultDetails, skip?: number, top?: number, outcomes?: Contracts.TestOutcome[], newTestsOnly?: boolean): Promise<Contracts.TestCaseResult[]>;
    updateTestResults(results: Contracts.TestCaseResult[], project: string, runId: number): Promise<Contracts.TestCaseResult[]>;
    getTestResultsByBuild(project: string, buildId: number, publishContext?: string, outcomes?: Contracts.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.ShallowTestCaseResult>>;
    getTestResultsByPipeline(customHeaders: any, project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, outcomes?: Contracts.TestOutcome[], top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.ShallowTestCaseResult>>;
    getTestResultsByRelease(project: string, releaseId: number, releaseEnvid?: number, publishContext?: string, outcomes?: Contracts.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.ShallowTestCaseResult>>;
    testResultsGroupDetails(project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, shouldIncludeFailedAndAbortedResults?: boolean, queryGroupSummaryForInProgress?: boolean): Promise<Contracts.TestResultsDetails>;
    queryTestResultsReportForBuild(project: string, buildId: number, publishContext?: string, includeFailureDetails?: boolean, buildToCompare?: Contracts.BuildReference): Promise<Contracts.TestResultSummary>;
    queryTestResultsReportForPipeline(project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, includeFailureDetails?: boolean): Promise<Contracts.TestResultSummary>;
    queryTestResultsReportForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, includeFailureDetails?: boolean, releaseToCompare?: Contracts.ReleaseReference): Promise<Contracts.TestResultSummary>;
    queryTestResultsSummaryForReleases(releases: Contracts.ReleaseReference[], project: string): Promise<Contracts.TestResultSummary[]>;
    queryTestSummaryByRequirement(resultsContext: Contracts.TestResultsContext, project: string, workItemIds?: number[]): Promise<Contracts.TestSummaryForWorkItem[]>;
    queryResultTrendForBuild(filter: Contracts.TestResultTrendFilter, project: string): Promise<Contracts.AggregatedDataForResultTrend[]>;
    queryResultTrendForRelease(filter: Contracts.TestResultTrendFilter, project: string): Promise<Contracts.AggregatedDataForResultTrend[]>;
    createTestRun(testRun: Contracts.RunCreateModel, project: string): Promise<Contracts.TestRun>;
    deleteTestRun(project: string, runId: number): Promise<void>;
    getTestRunById(project: string, runId: number, includeDetails?: boolean, includeTags?: boolean): Promise<Contracts.TestRun>;
    getTestRuns(project: string, buildUri?: string, owner?: string, tmiRunId?: string, planId?: number, includeRunDetails?: boolean, automated?: boolean, skip?: number, top?: number): Promise<Contracts.TestRun[]>;
    queryTestRuns(project: string, minLastUpdatedDate: Date, maxLastUpdatedDate: Date, state?: Contracts.TestRunState, planIds?: number[], isAutomated?: boolean, publishContext?: Contracts.TestRunPublishContext, buildIds?: number[], buildDefIds?: number[], branchName?: string, releaseIds?: number[], releaseDefIds?: number[], releaseEnvIds?: number[], releaseEnvDefIds?: number[], runTitle?: string, top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.TestRun>>;
    updateTestRun(runUpdateModel: Contracts.RunUpdateModel, project: string, runId: number): Promise<Contracts.TestRun>;
    getTestRunSummaryByOutcome(project: string, runId: number): Promise<Contracts.TestRunStatistic>;
    getTestResultsSettings(project: string, settingsType?: Contracts.TestResultsSettingsType): Promise<Contracts.TestResultsSettings>;
    updatePipelinesTestSettings(testResultsUpdateSettings: Contracts.TestResultsUpdateSettings, project: string): Promise<Contracts.TestResultsSettings>;
    getSimilarTestResults(customHeaders: any, project: string, runId: number, testResultId: number, testSubResultId: number, top?: number, continuationToken?: String): Promise<Contracts.TestCaseResult[]>;
    getTestRunStatistics(project: string, runId: number): Promise<Contracts.TestRunStatistic>;
    getCoverageStatusBadge(project: string, definition: string, branchName?: string, label?: string): Promise<string>;
    getTestTagsForBuild(project: string, buildId: number): Promise<Contracts.TestTag[]>;
    getTestTagsForRelease(project: string, releaseId: number, releaseEnvId: number): Promise<Contracts.TestTag[]>;
    updateTestRunTags(testTagsUpdateModel: Contracts.TestTagsUpdateModel, project: string, runId: number): Promise<Contracts.TestTag[]>;
    getTestTagSummaryForBuild(project: string, buildId: number): Promise<Contracts.TestTagSummary>;
    getTestTagSummaryForRelease(project: string, releaseId: number, releaseEnvId: number): Promise<Contracts.TestTagSummary>;
    createBuildAttachmentInLogStore(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, buildId: number): Promise<void>;
    createTestRunLogStoreAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number): Promise<Contracts.TestLogStoreAttachmentReference>;
    deleteTestRunLogStoreAttachment(project: string, runId: number, filename: string): Promise<void>;
    getTestRunLogStoreAttachmentContent(project: string, runId: number, filename: string): Promise<NodeJS.ReadableStream>;
    getTestRunLogStoreAttachments(project: string, runId: number): Promise<Contracts.TestLogStoreAttachment[]>;
    getTestRunLogStoreAttachmentZip(project: string, runId: number, filename: string): Promise<NodeJS.ReadableStream>;
    createFailureType(testResultFailureType: Contracts.TestResultFailureTypeRequestModel, project: string): Promise<Contracts.TestResultFailureType>;
    deleteFailureType(project: string, failureTypeId: number): Promise<void>;
    getFailureTypes(project: string): Promise<Contracts.TestResultFailureType[]>;
    queryTestHistory(filter: Contracts.TestHistoryQuery, project: string): Promise<Contracts.TestHistoryQuery>;
    getTestLogsForBuild(customHeaders: any, project: string, buildId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    getTestResultLogs(customHeaders: any, project: string, runId: number, resultId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    getTestSubResultLogs(customHeaders: any, project: string, runId: number, resultId: number, subResultId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    getTestRunLogs(customHeaders: any, project: string, runId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    getTestLogStoreEndpointDetailsForBuildLog(project: string, build: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    testLogStoreEndpointDetailsForBuild(project: string, buildId: number, testLogStoreOperationType: Contracts.TestLogStoreOperationType): Promise<Contracts.TestLogStoreEndpointDetails>;
    getTestLogStoreEndpointDetailsForResultLog(project: string, runId: number, resultId: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    getTestLogStoreEndpointDetailsForSubResultLog(project: string, runId: number, resultId: number, subResultId: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    testLogStoreEndpointDetailsForResult(project: string, runId: number, resultId: number, subResultId: number, filePath: string, type: Contracts.TestLogType): Promise<Contracts.TestLogStoreEndpointDetails>;
    getTestLogStoreEndpointDetailsForRunLog(project: string, runId: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    testLogStoreEndpointDetailsForRun(project: string, runId: number, testLogStoreOperationType: Contracts.TestLogStoreOperationType, filePath?: string, type?: Contracts.TestLogType): Promise<Contracts.TestLogStoreEndpointDetails>;
    createTestSession(session: Contracts.TestResultsSession, project: string): Promise<number>;
    getTestSession(project: string, buildId: number): Promise<Contracts.TestResultsSession[]>;
    getTestSessionLayout(project: string, sessionId: string): Promise<any[]>;
    createEnvironment(environments: Contracts.TestSessionEnvironment[], project: string): Promise<void>;
    createTestSettings(testSettings: Contracts.TestSettings, project: string): Promise<number>;
    deleteTestSettings(project: string, testSettingsId: number): Promise<void>;
    getTestSettingsById(project: string, testSettingsId: number): Promise<Contracts.TestSettings>;
    addWorkItemToTestLinks(workItemToTestLinks: Contracts.WorkItemToTestLinks, project: string): Promise<Contracts.WorkItemToTestLinks>;
    deleteTestMethodToWorkItemLink(project: string, testName: string, workItemId: number): Promise<boolean>;
    queryTestMethodLinkedWorkItems(project: string, testName: string): Promise<Contracts.TestToWorkItemLinks>;
    getTestResultWorkItemsById(project: string, runId: number, testCaseResultId: number): Promise<Contracts.WorkItemReference[]>;
    queryTestResultWorkItems(project: string, workItemCategory: string, automatedTestName?: string, testCaseId?: number, maxCompleteDate?: Date, days?: number, workItemCount?: number): Promise<Contracts.WorkItemReference[]>;
}
export declare class TestResultsApi extends basem.ClientApiBase implements ITestResultsApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "c83eaf52-edf3-4034-ae11-17d38f25404c";
    /**
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} iterationId
     * @param {string} actionPath
     */
    createTestIterationResultAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, iterationId: number, actionPath?: string): Promise<Contracts.TestAttachmentReference>;
    /**
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     */
    createTestResultAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number): Promise<Contracts.TestAttachmentReference>;
    /**
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} testSubResultId
     */
    createTestSubResultAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<Contracts.TestAttachmentReference>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     */
    deleteTestResultAttachment(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<void>;
    /**
     * Returns a test iteration attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} iterationId
     */
    getTestIterationAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number, iterationId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Returns a test iteration attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} iterationId
     */
    getTestIterationAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number, iterationId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Returns a test result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     */
    getTestResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     */
    getTestResultAttachments(project: string, runId: number, testCaseResultId: number): Promise<Contracts.TestAttachment[]>;
    /**
     * Returns a test result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     */
    getTestResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Returns a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} testSubResultId
     */
    getTestSubResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Returns attachment references for test sub result.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} testSubResultId
     */
    getTestSubResultAttachments(project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<Contracts.TestAttachment[]>;
    /**
     * Returns a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} testSubResultId
     */
    getTestSubResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    /**
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    createTestRunAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number): Promise<Contracts.TestAttachmentReference>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} attachmentId
     */
    deleteTestRunAttachment(project: string, runId: number, attachmentId: number): Promise<void>;
    /**
     * Returns a test run attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} attachmentId
     */
    getTestRunAttachmentContent(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    getTestRunAttachments(project: string, runId: number): Promise<Contracts.TestAttachment[]>;
    /**
     * Returns a test run attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} attachmentId
     */
    getTestRunAttachmentZip(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     */
    getBugsLinkedToTestResult(project: string, runId: number, testCaseResultId: number): Promise<Contracts.WorkItemReference[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     */
    fetchSourceCodeCoverageReport(project: string, buildId: number): Promise<Contracts.SourceViewBuildCoverage[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {number} flags
     */
    getBuildCodeCoverage(project: string, buildId: number, flags: number): Promise<Contracts.BuildCoverage[]>;
    /**
     * http://(tfsserver):8080/tfs/DefaultCollection/_apis/test/CodeCoverage?buildId=10&deltaBuildId=9 Request: build id and delta build id (optional)
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {number} deltaBuildId
     */
    getCodeCoverageSummary(project: string, buildId: number, deltaBuildId?: number): Promise<Contracts.CodeCoverageSummary>;
    /**
     * http://(tfsserver):8080/tfs/DefaultCollection/_apis/test/CodeCoverage?buildId=10 Request: Json of code coverage summary
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {Contracts.CodeCoverageData} coverageData
     */
    updateCodeCoverageSummary(project: string, buildId: number, coverageData?: Contracts.CodeCoverageData): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} flags
     */
    getTestRunCodeCoverage(project: string, runId: number, flags: number): Promise<Contracts.TestRunCoverage[]>;
    /**
     * Get file coverage for the specified file
     *
     * @param {Contracts.FileCoverageRequest} fileCoverageRequest - File details with pull request iteration context
     * @param {string} project - Project ID or project name
     */
    getFileLevelCodeCoverage(fileCoverageRequest: Contracts.FileCoverageRequest, project: string): Promise<NodeJS.ReadableStream>;
    /**
     * @param {Contracts.ResultsFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryTestResultHistory(filter: Contracts.ResultsFilter, project: string): Promise<Contracts.TestResultHistory>;
    /**
     * Get test run message logs
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunMessageLogs(project: string, runId: number): Promise<Contracts.TestMessageLogDetails[]>;
    /**
     * Get summary of test results.
     *
     * @param {string} project - Project ID or project name
     * @param {number} pipelineId - Pipeline Id. This is same as build Id.
     * @param {string} stageName - Name of the stage. Maximum supported length for name is 256 character.
     * @param {string} phaseName - Name of the phase. Maximum supported length for name is 256 character.
     * @param {string} jobName - Matrixing in YAML generates copies of a job with different inputs in matrix. JobName is the name of those input. Maximum supported length for name is 256 character.
     * @param {Contracts.Metrics[]} metricNames
     * @param {boolean} groupByNode - Group summary for each node of the pipleine heirarchy
     */
    getTestPipelineMetrics(project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, metricNames?: Contracts.Metrics[], groupByNode?: boolean): Promise<Contracts.PipelineTestMetrics>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {string} groupBy
     * @param {string} filter
     * @param {string} orderby
     * @param {boolean} shouldIncludeResults
     * @param {boolean} queryRunSummaryForInProgress
     */
    getTestResultDetailsForBuild(project: string, buildId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<Contracts.TestResultsDetails>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {number} releaseEnvId
     * @param {string} publishContext
     * @param {string} groupBy
     * @param {string} filter
     * @param {string} orderby
     * @param {boolean} shouldIncludeResults
     * @param {boolean} queryRunSummaryForInProgress
     */
    getTestResultDetailsForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<Contracts.TestResultsDetails>;
    /**
     * @param {Contracts.TestResultDocument} document
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    publishTestResultDocument(document: Contracts.TestResultDocument, project: string, runId: number): Promise<Contracts.TestResultDocument>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {string[]} fields
     * @param {string} continuationToken
     */
    getResultGroupsByBuild(project: string, buildId: number, publishContext: string, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.FieldDetailsForTestResults>>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {string} publishContext
     * @param {number} releaseEnvId
     * @param {string[]} fields
     * @param {string} continuationToken
     */
    getResultGroupsByRelease(project: string, releaseId: number, publishContext: string, releaseEnvId?: number, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.FieldDetailsForTestResults>>;
    /**
     * Get list of test Result meta data details for corresponding testcasereferenceId
     *
     * @param {string[]} testCaseReferenceIds - TestCaseReference Ids of the test Result to be queried, comma separated list of valid ids (limit no. of ids 200).
     * @param {string} project - Project ID or project name
     * @param {Contracts.ResultMetaDataDetails} detailsToInclude - Details to include with test results metadata. Default is None. Other values are FlakyIdentifiers.
     */
    queryTestResultsMetaData(testCaseReferenceIds: string[], project: string, detailsToInclude?: Contracts.ResultMetaDataDetails): Promise<Contracts.TestResultMetaData[]>;
    /**
     * Update properties of test result meta data
     *
     * @param {Contracts.TestResultMetaDataUpdateInput} testResultMetaDataUpdateInput - TestResultMetaData update input TestResultMetaDataUpdateInput
     * @param {string} project - Project ID or project name
     * @param {number} testCaseReferenceId - TestCaseReference Id of Test Result to be updated.
     */
    updateTestResultsMetaData(testResultMetaDataUpdateInput: Contracts.TestResultMetaDataUpdateInput, project: string, testCaseReferenceId: number): Promise<Contracts.TestResultMetaData>;
    /**
     * @param {Contracts.TestResultsQuery} query
     * @param {string} project - Project ID or project name
     */
    getTestResultsByQuery(query: Contracts.TestResultsQuery, project: string): Promise<Contracts.TestResultsQuery>;
    /**
     * @param {Contracts.QueryModel} queryModel
     * @param {string} project - Project ID or project name
     * @param {boolean} includeResultDetails
     * @param {boolean} includeIterationDetails
     * @param {number} skip
     * @param {number} top
     */
    getTestResultsByQueryWiql(queryModel: Contracts.QueryModel, project: string, includeResultDetails?: boolean, includeIterationDetails?: boolean, skip?: number, top?: number): Promise<Contracts.TestCaseResult[]>;
    /**
     * @param {Contracts.TestCaseResult[]} results
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    addTestResultsToTestRun(results: Contracts.TestCaseResult[], project: string, runId: number): Promise<Contracts.TestCaseResult[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testResultId
     * @param {Contracts.ResultDetails} detailsToInclude
     */
    getTestResultById(project: string, runId: number, testResultId: number, detailsToInclude?: Contracts.ResultDetails): Promise<Contracts.TestCaseResult>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {Contracts.ResultDetails} detailsToInclude
     * @param {number} skip
     * @param {number} top
     * @param {Contracts.TestOutcome[]} outcomes
     * @param {boolean} newTestsOnly
     */
    getTestResults(project: string, runId: number, detailsToInclude?: Contracts.ResultDetails, skip?: number, top?: number, outcomes?: Contracts.TestOutcome[], newTestsOnly?: boolean): Promise<Contracts.TestCaseResult[]>;
    /**
     * @param {Contracts.TestCaseResult[]} results
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    updateTestResults(results: Contracts.TestCaseResult[], project: string, runId: number): Promise<Contracts.TestCaseResult[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {Contracts.TestOutcome[]} outcomes
     * @param {number} top
     * @param {string} continuationToken
     */
    getTestResultsByBuild(project: string, buildId: number, publishContext?: string, outcomes?: Contracts.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.ShallowTestCaseResult>>;
    /**
     * Get a list of results.
     *
     * @param {string} project - Project ID or project name
     * @param {number} pipelineId - Pipeline Id. This is same as build Id.
     * @param {string} stageName - Name of the stage. Maximum supported length for name is 256 character.
     * @param {string} phaseName - Name of the phase. Maximum supported length for name is 256 character.
     * @param {string} jobName - Matrixing in YAML generates copies of a job with different inputs in matrix. JobName is the name of those input. Maximum supported length for name is 256 character.
     * @param {Contracts.TestOutcome[]} outcomes - List of outcome of results
     * @param {number} top - Maximum number of results to return
     * @param {String} continuationToken - Header to pass the continuationToken
     */
    getTestResultsByPipeline(customHeaders: any, project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, outcomes?: Contracts.TestOutcome[], top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.ShallowTestCaseResult>>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {number} releaseEnvid
     * @param {string} publishContext
     * @param {Contracts.TestOutcome[]} outcomes
     * @param {number} top
     * @param {string} continuationToken
     */
    getTestResultsByRelease(project: string, releaseId: number, releaseEnvid?: number, publishContext?: string, outcomes?: Contracts.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.ShallowTestCaseResult>>;
    /**
     * Get all the available groups details and for these groups get failed and aborted results.
     *
     * @param {string} project - Project ID or project name
     * @param {number} pipelineId - Pipeline Id. This is same as build Id.
     * @param {string} stageName - Name of the stage. Maximum supported length for name is 256 character.
     * @param {string} phaseName - Name of the phase. Maximum supported length for name is 256 character.
     * @param {string} jobName - Matrixing in YAML generates copies of a job with different inputs in matrix. JobName is the name of those input. Maximum supported length for name is 256 character.
     * @param {boolean} shouldIncludeFailedAndAbortedResults - If true, it will return Ids of failed and aborted results for each test group
     * @param {boolean} queryGroupSummaryForInProgress - If true, it will calculate summary for InProgress runs as well.
     */
    testResultsGroupDetails(project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, shouldIncludeFailedAndAbortedResults?: boolean, queryGroupSummaryForInProgress?: boolean): Promise<Contracts.TestResultsDetails>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {boolean} includeFailureDetails
     * @param {Contracts.BuildReference} buildToCompare
     */
    queryTestResultsReportForBuild(project: string, buildId: number, publishContext?: string, includeFailureDetails?: boolean, buildToCompare?: Contracts.BuildReference): Promise<Contracts.TestResultSummary>;
    /**
     * Get summary of test results.
     *
     * @param {string} project - Project ID or project name
     * @param {number} pipelineId - Pipeline Id. This is same as build Id.
     * @param {string} stageName - Name of the stage. Maximum supported length for name is 256 character.
     * @param {string} phaseName - Name of the phase. Maximum supported length for name is 256 character.
     * @param {string} jobName - Matrixing in YAML generates copies of a job with different inputs in matrix. JobName is the name of those input. Maximum supported length for name is 256 character.
     * @param {boolean} includeFailureDetails - If true returns failure insights
     */
    queryTestResultsReportForPipeline(project: string, pipelineId: number, stageName?: string, phaseName?: string, jobName?: string, includeFailureDetails?: boolean): Promise<Contracts.TestResultSummary>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {number} releaseEnvId
     * @param {string} publishContext
     * @param {boolean} includeFailureDetails
     * @param {Contracts.ReleaseReference} releaseToCompare
     */
    queryTestResultsReportForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, includeFailureDetails?: boolean, releaseToCompare?: Contracts.ReleaseReference): Promise<Contracts.TestResultSummary>;
    /**
     * @param {Contracts.ReleaseReference[]} releases
     * @param {string} project - Project ID or project name
     */
    queryTestResultsSummaryForReleases(releases: Contracts.ReleaseReference[], project: string): Promise<Contracts.TestResultSummary[]>;
    /**
     * @param {Contracts.TestResultsContext} resultsContext
     * @param {string} project - Project ID or project name
     * @param {number[]} workItemIds
     */
    queryTestSummaryByRequirement(resultsContext: Contracts.TestResultsContext, project: string, workItemIds?: number[]): Promise<Contracts.TestSummaryForWorkItem[]>;
    /**
     * @param {Contracts.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForBuild(filter: Contracts.TestResultTrendFilter, project: string): Promise<Contracts.AggregatedDataForResultTrend[]>;
    /**
     * @param {Contracts.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForRelease(filter: Contracts.TestResultTrendFilter, project: string): Promise<Contracts.AggregatedDataForResultTrend[]>;
    /**
     * @param {Contracts.RunCreateModel} testRun
     * @param {string} project - Project ID or project name
     */
    createTestRun(testRun: Contracts.RunCreateModel, project: string): Promise<Contracts.TestRun>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    deleteTestRun(project: string, runId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {boolean} includeDetails
     * @param {boolean} includeTags
     */
    getTestRunById(project: string, runId: number, includeDetails?: boolean, includeTags?: boolean): Promise<Contracts.TestRun>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} buildUri
     * @param {string} owner
     * @param {string} tmiRunId
     * @param {number} planId
     * @param {boolean} includeRunDetails
     * @param {boolean} automated
     * @param {number} skip
     * @param {number} top
     */
    getTestRuns(project: string, buildUri?: string, owner?: string, tmiRunId?: string, planId?: number, includeRunDetails?: boolean, automated?: boolean, skip?: number, top?: number): Promise<Contracts.TestRun[]>;
    /**
     * Query Test Runs based on filters. Mandatory fields are minLastUpdatedDate and maxLastUpdatedDate.
     *
     * @param {string} project - Project ID or project name
     * @param {Date} minLastUpdatedDate - Minimum Last Modified Date of run to be queried (Mandatory).
     * @param {Date} maxLastUpdatedDate - Maximum Last Modified Date of run to be queried (Mandatory, difference between min and max date can be atmost 7 days).
     * @param {Contracts.TestRunState} state - Current state of the Runs to be queried.
     * @param {number[]} planIds - Plan Ids of the Runs to be queried, comma separated list of valid ids.
     * @param {boolean} isAutomated - Automation type of the Runs to be queried.
     * @param {Contracts.TestRunPublishContext} publishContext - PublishContext of the Runs to be queried.
     * @param {number[]} buildIds - Build Ids of the Runs to be queried, comma separated list of valid ids.
     * @param {number[]} buildDefIds - Build Definition Ids of the Runs to be queried, comma separated list of valid ids.
     * @param {string} branchName - Source Branch name of the Runs to be queried.
     * @param {number[]} releaseIds - Release Ids of the Runs to be queried, comma separated list of valid ids.
     * @param {number[]} releaseDefIds - Release Definition Ids of the Runs to be queried, comma separated list of valid ids.
     * @param {number[]} releaseEnvIds - Release Environment Ids of the Runs to be queried, comma separated list of valid ids.
     * @param {number[]} releaseEnvDefIds - Release Environment Definition Ids of the Runs to be queried, comma separated list of valid ids.
     * @param {string} runTitle - Run Title of the Runs to be queried.
     * @param {number} top - Number of runs to be queried. Limit is 100
     * @param {string} continuationToken - continuationToken received from previous batch or null for first batch. It is not supposed to be created (or altered, if received from last batch) by user.
     */
    queryTestRuns(project: string, minLastUpdatedDate: Date, maxLastUpdatedDate: Date, state?: Contracts.TestRunState, planIds?: number[], isAutomated?: boolean, publishContext?: Contracts.TestRunPublishContext, buildIds?: number[], buildDefIds?: number[], branchName?: string, releaseIds?: number[], releaseDefIds?: number[], releaseEnvIds?: number[], releaseEnvDefIds?: number[], runTitle?: string, top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<Contracts.TestRun>>;
    /**
     * @param {Contracts.RunUpdateModel} runUpdateModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    updateTestRun(runUpdateModel: Contracts.RunUpdateModel, project: string, runId: number): Promise<Contracts.TestRun>;
    /**
     * Get test run summary, used when we want to get summary of a run by outcome. Test run should be in completed state.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunSummaryByOutcome(project: string, runId: number): Promise<Contracts.TestRunStatistic>;
    /**
     * Get TestResultsSettings data
     *
     * @param {string} project - Project ID or project name
     * @param {Contracts.TestResultsSettingsType} settingsType
     */
    getTestResultsSettings(project: string, settingsType?: Contracts.TestResultsSettingsType): Promise<Contracts.TestResultsSettings>;
    /**
     * Update project settings of test results
     *
     * @param {Contracts.TestResultsUpdateSettings} testResultsUpdateSettings
     * @param {string} project - Project ID or project name
     */
    updatePipelinesTestSettings(testResultsUpdateSettings: Contracts.TestResultsUpdateSettings, project: string): Promise<Contracts.TestResultsSettings>;
    /**
     * Gets the list of results whose failure matches with the provided one.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - id of test run
     * @param {number} testResultId - id of test result inside a test run
     * @param {number} testSubResultId - id of subresult inside a test result
     * @param {number} top - Maximum number of results to return
     * @param {String} continuationToken - Header to pass the continuationToken
     */
    getSimilarTestResults(customHeaders: any, project: string, runId: number, testResultId: number, testSubResultId: number, top?: number, continuationToken?: String): Promise<Contracts.TestCaseResult[]>;
    /**
     * Get test run statistics , used when we want to get summary of a run by outcome.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunStatistics(project: string, runId: number): Promise<Contracts.TestRunStatistic>;
    /**
     * <p>Gets the coverage status for the last successful build of a definition, optionally scoped to a specific branch</p>
     *
     * @param {string} project - Project ID or project name
     * @param {string} definition - The ID or name of the definition.
     * @param {string} branchName - The branch name.
     * @param {string} label - The String to replace the default text on the left side of the badge.
     */
    getCoverageStatusBadge(project: string, definition: string, branchName?: string, label?: string): Promise<string>;
    /**
     * Get all the tags in a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - Build ID
     */
    getTestTagsForBuild(project: string, buildId: number): Promise<Contracts.TestTag[]>;
    /**
     * Get all the tags in a release.
     *
     * @param {string} project - Project ID or project name
     * @param {number} releaseId - Release ID
     * @param {number} releaseEnvId - Release environment ID
     */
    getTestTagsForRelease(project: string, releaseId: number, releaseEnvId: number): Promise<Contracts.TestTag[]>;
    /**
     * Update tags of a run, Tags can be Added and Deleted
     *
     * @param {Contracts.TestTagsUpdateModel} testTagsUpdateModel - TestTagsUpdateModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - RunId of the run
     */
    updateTestRunTags(testTagsUpdateModel: Contracts.TestTagsUpdateModel, project: string, runId: number): Promise<Contracts.TestTag[]>;
    /**
     * Get all the tags in a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - Build ID
     */
    getTestTagSummaryForBuild(project: string, buildId: number): Promise<Contracts.TestTagSummary>;
    /**
     * Get all the tags in a release.
     *
     * @param {string} project - Project ID or project name
     * @param {number} releaseId - Release ID
     * @param {number} releaseEnvId - Release environment ID
     */
    getTestTagSummaryForRelease(project: string, releaseId: number, releaseEnvId: number): Promise<Contracts.TestTagSummary>;
    /**
     * Creates an attachment in the LogStore for the specified buildId.
     *
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel - Contains attachment info like stream, filename, comment, attachmentType
     * @param {string} project - Project ID or project name
     * @param {number} buildId - BuildId
     */
    createBuildAttachmentInLogStore(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, buildId: number): Promise<void>;
    /**
     * Creates an attachment in the LogStore for the specified runId.
     *
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel - Contains attachment info like stream, filename, comment, attachmentType
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     */
    createTestRunLogStoreAttachment(attachmentRequestModel: Contracts.TestAttachmentRequestModel, project: string, runId: number): Promise<Contracts.TestLogStoreAttachmentReference>;
    /**
     * Deletes the attachment with the specified filename for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     * @param {string} filename - Attachment FileName
     */
    deleteTestRunLogStoreAttachment(project: string, runId: number, filename: string): Promise<void>;
    /**
     * Returns the attachment with the specified filename for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     * @param {string} filename - Attachment FileName
     */
    getTestRunLogStoreAttachmentContent(project: string, runId: number, filename: string): Promise<NodeJS.ReadableStream>;
    /**
     * Returns a list of attachments for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     */
    getTestRunLogStoreAttachments(project: string, runId: number): Promise<Contracts.TestLogStoreAttachment[]>;
    /**
     * Returns the attachment with the specified filename for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     * @param {string} filename - Attachment FileName
     */
    getTestRunLogStoreAttachmentZip(project: string, runId: number, filename: string): Promise<NodeJS.ReadableStream>;
    /**
     * Creates a new test failure type
     *
     * @param {Contracts.TestResultFailureTypeRequestModel} testResultFailureType
     * @param {string} project - Project ID or project name
     */
    createFailureType(testResultFailureType: Contracts.TestResultFailureTypeRequestModel, project: string): Promise<Contracts.TestResultFailureType>;
    /**
     * Deletes a test failure type with specified failureTypeId
     *
     * @param {string} project - Project ID or project name
     * @param {number} failureTypeId
     */
    deleteFailureType(project: string, failureTypeId: number): Promise<void>;
    /**
     * Returns the list of test failure types.
     *
     * @param {string} project - Project ID or project name
     */
    getFailureTypes(project: string): Promise<Contracts.TestResultFailureType[]>;
    /**
     * Get history of a test method using TestHistoryQuery
     *
     * @param {Contracts.TestHistoryQuery} filter - TestHistoryQuery to get history
     * @param {string} project - Project ID or project name
     */
    queryTestHistory(filter: Contracts.TestHistoryQuery, project: string): Promise<Contracts.TestHistoryQuery>;
    /**
     * Get list of build attachments reference
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - Id of the build to get
     * @param {Contracts.TestLogType} type - type of the attachment to get
     * @param {string} directoryPath - directory path for which attachments are needed
     * @param {string} fileNamePrefix - file name prefix to filter the list of attachment
     * @param {boolean} fetchMetaData - Default is false, set if metadata is needed
     * @param {number} top - Number of test attachments reference to return
     * @param {String} continuationToken - Header to pass the continuationToken
     */
    getTestLogsForBuild(customHeaders: any, project: string, buildId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    /**
     * Get list of test result attachments reference
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run that contains the result
     * @param {number} resultId - Id of the test result
     * @param {Contracts.TestLogType} type - type of attachments to get
     * @param {string} directoryPath - directory path of attachments to get
     * @param {string} fileNamePrefix - file name prefix to filter the list of attachment
     * @param {boolean} fetchMetaData - Default is false, set if metadata is needed
     * @param {number} top - Numbe of attachments reference to return
     * @param {String} continuationToken - Header to pass the continuationToken
     */
    getTestResultLogs(customHeaders: any, project: string, runId: number, resultId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    /**
     * Get list of test subresult attachments reference
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run that contains the results
     * @param {number} resultId - Id of the test result that contains subresult
     * @param {number} subResultId - Id of the test subresult
     * @param {Contracts.TestLogType} type - type of the attachments to get
     * @param {string} directoryPath - directory path of the attachment to get
     * @param {string} fileNamePrefix - file name prefix to filter the list of attachments
     * @param {boolean} fetchMetaData - Default is false, set if metadata is needed
     * @param {number} top - Number of attachments reference to return
     * @param {String} continuationToken - Header to pass the continuationToken
     */
    getTestSubResultLogs(customHeaders: any, project: string, runId: number, resultId: number, subResultId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    /**
     * Get list of test run attachments reference
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run
     * @param {Contracts.TestLogType} type - type of the attachments to get
     * @param {string} directoryPath - directory path for which attachments are needed
     * @param {string} fileNamePrefix - file name prefix to filter the list of attachment
     * @param {boolean} fetchMetaData - Default is false, set if metadata is needed
     * @param {number} top - Number of attachments reference to return
     * @param {String} continuationToken - Header to pass the continuationToken
     */
    getTestRunLogs(customHeaders: any, project: string, runId: number, type: Contracts.TestLogType, directoryPath?: string, fileNamePrefix?: string, fetchMetaData?: boolean, top?: number, continuationToken?: String): Promise<VSSInterfaces.PagedList<Contracts.TestLog>>;
    /**
     * Get SAS Uri of a build attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} build - Id of the build to get
     * @param {Contracts.TestLogType} type - type of the file
     * @param {string} filePath - filePath for which sas uri is needed
     */
    getTestLogStoreEndpointDetailsForBuildLog(project: string, build: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    /**
     * Create and Get sas uri of the build container
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - Id of the build to get
     * @param {Contracts.TestLogStoreOperationType} testLogStoreOperationType - Type of operation to perform using sas uri
     */
    testLogStoreEndpointDetailsForBuild(project: string, buildId: number, testLogStoreOperationType: Contracts.TestLogStoreOperationType): Promise<Contracts.TestLogStoreEndpointDetails>;
    /**
     * Get SAS Uri of a test results attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run that contains result
     * @param {number} resultId - Id of the test result whose files need to be downloaded
     * @param {Contracts.TestLogType} type - type of the file
     * @param {string} filePath - filePath for which sas uri is needed
     */
    getTestLogStoreEndpointDetailsForResultLog(project: string, runId: number, resultId: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    /**
     * Get SAS Uri of a test subresults attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run that contains result
     * @param {number} resultId - Id of the test result that contains subresult
     * @param {number} subResultId - Id of the test subresult whose file sas uri is needed
     * @param {Contracts.TestLogType} type - type of the file
     * @param {string} filePath - filePath for which sas uri is needed
     */
    getTestLogStoreEndpointDetailsForSubResultLog(project: string, runId: number, resultId: number, subResultId: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    /**
     * Create empty file for a result and Get Sas uri for the file
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run that contains the result
     * @param {number} resultId - Id of the test results that contains sub result
     * @param {number} subResultId - Id of the test sub result whose file sas uri is needed
     * @param {string} filePath - file path inside the sub result for which sas uri is needed
     * @param {Contracts.TestLogType} type - Type of the file for download
     */
    testLogStoreEndpointDetailsForResult(project: string, runId: number, resultId: number, subResultId: number, filePath: string, type: Contracts.TestLogType): Promise<Contracts.TestLogStoreEndpointDetails>;
    /**
     * Get SAS Uri of a test run attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run whose file has to be downloaded
     * @param {Contracts.TestLogType} type - type of the file
     * @param {string} filePath - filePath for which sas uri is needed
     */
    getTestLogStoreEndpointDetailsForRunLog(project: string, runId: number, type: Contracts.TestLogType, filePath: string): Promise<Contracts.TestLogStoreEndpointDetails>;
    /**
     * Create empty file for a run and Get Sas uri for the file
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the run to get endpoint details
     * @param {Contracts.TestLogStoreOperationType} testLogStoreOperationType - Type of operation to perform using sas uri
     * @param {string} filePath - file path to create an empty file
     * @param {Contracts.TestLogType} type - Default is GeneralAttachment, type of empty file to be created
     */
    testLogStoreEndpointDetailsForRun(project: string, runId: number, testLogStoreOperationType: Contracts.TestLogStoreOperationType, filePath?: string, type?: Contracts.TestLogType): Promise<Contracts.TestLogStoreEndpointDetails>;
    /**
     * Creates TestResultsSession object in TCM data store
     *
     * @param {Contracts.TestResultsSession} session - Received session object.
     * @param {string} project - Project ID or project name
     */
    createTestSession(session: Contracts.TestResultsSession, project: string): Promise<number>;
    /**
     * Retrieves TestResultsSession metadata object in TCM data store
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     */
    getTestSession(project: string, buildId: number): Promise<Contracts.TestResultsSession[]>;
    /**
     * Retrieves TestResultsSession Layout object in TCM data store
     *
     * @param {string} project - Project ID or project name
     * @param {string} sessionId
     */
    getTestSessionLayout(project: string, sessionId: string): Promise<any[]>;
    /**
     * Creates Environment object in TCM data store
     *
     * @param {Contracts.TestSessionEnvironment[]} environments - Received Environment object.
     * @param {string} project - Project ID or project name
     */
    createEnvironment(environments: Contracts.TestSessionEnvironment[], project: string): Promise<void>;
    /**
     * @param {Contracts.TestSettings} testSettings
     * @param {string} project - Project ID or project name
     */
    createTestSettings(testSettings: Contracts.TestSettings, project: string): Promise<number>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} testSettingsId
     */
    deleteTestSettings(project: string, testSettingsId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} testSettingsId
     */
    getTestSettingsById(project: string, testSettingsId: number): Promise<Contracts.TestSettings>;
    /**
     * @param {Contracts.WorkItemToTestLinks} workItemToTestLinks
     * @param {string} project - Project ID or project name
     */
    addWorkItemToTestLinks(workItemToTestLinks: Contracts.WorkItemToTestLinks, project: string): Promise<Contracts.WorkItemToTestLinks>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} testName
     * @param {number} workItemId
     */
    deleteTestMethodToWorkItemLink(project: string, testName: string, workItemId: number): Promise<boolean>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} testName
     */
    queryTestMethodLinkedWorkItems(project: string, testName: string): Promise<Contracts.TestToWorkItemLinks>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     */
    getTestResultWorkItemsById(project: string, runId: number, testCaseResultId: number): Promise<Contracts.WorkItemReference[]>;
    /**
     * Query Test Result WorkItems based on filter
     *
     * @param {string} project - Project ID or project name
     * @param {string} workItemCategory - can take values Microsoft.BugCategory or all(for getting all workitems)
     * @param {string} automatedTestName
     * @param {number} testCaseId
     * @param {Date} maxCompleteDate
     * @param {number} days
     * @param {number} workItemCount
     */
    queryTestResultWorkItems(project: string, workItemCategory: string, automatedTestName?: string, testCaseId?: number, maxCompleteDate?: Date, days?: number, workItemCount?: number): Promise<Contracts.WorkItemReference[]>;
}
