/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import TestInterfaces = require("./interfaces/TestInterfaces");
import TfsCoreInterfaces = require("./interfaces/CoreInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface ITestApi extends basem.ClientApiBase {
    createTestIterationResultAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, iterationId: number, actionPath?: string): Promise<TestInterfaces.TestAttachmentReference>;
    createTestResultAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number): Promise<TestInterfaces.TestAttachmentReference>;
    createTestSubResultAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<TestInterfaces.TestAttachmentReference>;
    getTestResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getTestResultAttachments(project: string, runId: number, testCaseResultId: number): Promise<TestInterfaces.TestAttachment[]>;
    getTestResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getTestSubResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    getTestSubResultAttachments(project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<TestInterfaces.TestAttachment[]>;
    getTestSubResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    createTestRunAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number): Promise<TestInterfaces.TestAttachmentReference>;
    getTestRunAttachmentContent(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getTestRunAttachments(project: string, runId: number): Promise<TestInterfaces.TestAttachment[]>;
    getTestRunAttachmentZip(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    getBugsLinkedToTestResult(project: string, runId: number, testCaseResultId: number): Promise<TestInterfaces.WorkItemReference[]>;
    getBuildCodeCoverage(project: string, buildId: number, flags: number): Promise<TestInterfaces.BuildCoverage[]>;
    getCodeCoverageSummary(project: string, buildId: number, deltaBuildId?: number): Promise<TestInterfaces.CodeCoverageSummary>;
    updateCodeCoverageSummary(coverageData: TestInterfaces.CodeCoverageData, project: string, buildId: number): Promise<void>;
    getTestRunCodeCoverage(project: string, runId: number, flags: number): Promise<TestInterfaces.TestRunCoverage[]>;
    addCustomFields(newFields: TestInterfaces.CustomTestFieldDefinition[], project: string): Promise<TestInterfaces.CustomTestFieldDefinition[]>;
    queryCustomFields(project: string, scopeFilter: TestInterfaces.CustomTestFieldScope): Promise<TestInterfaces.CustomTestFieldDefinition[]>;
    queryTestResultHistory(filter: TestInterfaces.ResultsFilter, project: string): Promise<TestInterfaces.TestResultHistory>;
    getTestIteration(project: string, runId: number, testCaseResultId: number, iterationId: number, includeActionResults?: boolean): Promise<TestInterfaces.TestIterationDetailsModel>;
    getTestIterations(project: string, runId: number, testCaseResultId: number, includeActionResults?: boolean): Promise<TestInterfaces.TestIterationDetailsModel[]>;
    getLinkedWorkItemsByQuery(workItemQuery: TestInterfaces.LinkedWorkItemsQuery, project: string): Promise<TestInterfaces.LinkedWorkItemsQueryResult[]>;
    getTestRunLogs(project: string, runId: number): Promise<TestInterfaces.TestMessageLogDetails[]>;
    getPoint(project: string, planId: number, suiteId: number, pointIds: number, witFields?: string): Promise<TestInterfaces.TestPoint>;
    getPoints(project: string, planId: number, suiteId: number, witFields?: string, configurationId?: string, testCaseId?: string, testPointIds?: string, includePointDetails?: boolean, skip?: number, top?: number): Promise<TestInterfaces.TestPoint[]>;
    updateTestPoints(pointUpdateModel: TestInterfaces.PointUpdateModel, project: string, planId: number, suiteId: number, pointIds: string): Promise<TestInterfaces.TestPoint[]>;
    getPointsByQuery(query: TestInterfaces.TestPointsQuery, project: string, skip?: number, top?: number): Promise<TestInterfaces.TestPointsQuery>;
    getTestResultDetailsForBuild(project: string, buildId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<TestInterfaces.TestResultsDetails>;
    getTestResultDetailsForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<TestInterfaces.TestResultsDetails>;
    publishTestResultDocument(document: TestInterfaces.TestResultDocument, project: string, runId: number): Promise<TestInterfaces.TestResultDocument>;
    getResultGroupsByBuild(project: string, buildId: number, publishContext: string, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.FieldDetailsForTestResults>>;
    getResultGroupsByRelease(project: string, releaseId: number, publishContext: string, releaseEnvId?: number, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.FieldDetailsForTestResults>>;
    queryTestResultsMetaData(testReferenceIds: string[], project: string): Promise<TestInterfaces.TestResultMetaData[]>;
    getResultRetentionSettings(project: string): Promise<TestInterfaces.ResultRetentionSettings>;
    updateResultRetentionSettings(retentionSettings: TestInterfaces.ResultRetentionSettings, project: string): Promise<TestInterfaces.ResultRetentionSettings>;
    addTestResultsToTestRun(results: TestInterfaces.TestCaseResult[], project: string, runId: number): Promise<TestInterfaces.TestCaseResult[]>;
    getTestResultById(project: string, runId: number, testCaseResultId: number, detailsToInclude?: TestInterfaces.ResultDetails): Promise<TestInterfaces.TestCaseResult>;
    getTestResults(project: string, runId: number, detailsToInclude?: TestInterfaces.ResultDetails, skip?: number, top?: number, outcomes?: TestInterfaces.TestOutcome[]): Promise<TestInterfaces.TestCaseResult[]>;
    updateTestResults(results: TestInterfaces.TestCaseResult[], project: string, runId: number): Promise<TestInterfaces.TestCaseResult[]>;
    getTestResultsByQuery(query: TestInterfaces.TestResultsQuery, project: string): Promise<TestInterfaces.TestResultsQuery>;
    getTestResultsByBuild(project: string, buildId: number, publishContext?: string, outcomes?: TestInterfaces.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.ShallowTestCaseResult>>;
    getTestResultsByRelease(project: string, releaseId: number, releaseEnvid?: number, publishContext?: string, outcomes?: TestInterfaces.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.ShallowTestCaseResult>>;
    queryTestResultsReportForBuild(project: string, buildId: number, publishContext?: string, includeFailureDetails?: boolean, buildToCompare?: TestInterfaces.BuildReference): Promise<TestInterfaces.TestResultSummary>;
    queryTestResultsReportForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, includeFailureDetails?: boolean, releaseToCompare?: TestInterfaces.ReleaseReference): Promise<TestInterfaces.TestResultSummary>;
    queryTestResultsSummaryForReleases(releases: TestInterfaces.ReleaseReference[], project: string): Promise<TestInterfaces.TestResultSummary[]>;
    queryTestSummaryByRequirement(resultsContext: TestInterfaces.TestResultsContext, project: string, workItemIds?: number[]): Promise<TestInterfaces.TestSummaryForWorkItem[]>;
    queryResultTrendForBuild(filter: TestInterfaces.TestResultTrendFilter, project: string): Promise<TestInterfaces.AggregatedDataForResultTrend[]>;
    queryResultTrendForRelease(filter: TestInterfaces.TestResultTrendFilter, project: string): Promise<TestInterfaces.AggregatedDataForResultTrend[]>;
    getTestRunStatistics(project: string, runId: number): Promise<TestInterfaces.TestRunStatistic>;
    createTestRun(testRun: TestInterfaces.RunCreateModel, project: string): Promise<TestInterfaces.TestRun>;
    deleteTestRun(project: string, runId: number): Promise<void>;
    getTestRunById(project: string, runId: number, includeDetails?: boolean): Promise<TestInterfaces.TestRun>;
    getTestRuns(project: string, buildUri?: string, owner?: string, tmiRunId?: string, planId?: number, includeRunDetails?: boolean, automated?: boolean, skip?: number, top?: number): Promise<TestInterfaces.TestRun[]>;
    queryTestRuns(project: string, minLastUpdatedDate: Date, maxLastUpdatedDate: Date, state?: TestInterfaces.TestRunState, planIds?: number[], isAutomated?: boolean, publishContext?: TestInterfaces.TestRunPublishContext, buildIds?: number[], buildDefIds?: number[], branchName?: string, releaseIds?: number[], releaseDefIds?: number[], releaseEnvIds?: number[], releaseEnvDefIds?: number[], runTitle?: string, top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.TestRun>>;
    updateTestRun(runUpdateModel: TestInterfaces.RunUpdateModel, project: string, runId: number): Promise<TestInterfaces.TestRun>;
    createTestSession(testSession: TestInterfaces.TestSession, teamContext: TfsCoreInterfaces.TeamContext): Promise<TestInterfaces.TestSession>;
    getTestSessions(teamContext: TfsCoreInterfaces.TeamContext, period?: number, allSessions?: boolean, includeAllProperties?: boolean, source?: TestInterfaces.TestSessionSource, includeOnlyCompletedSessions?: boolean): Promise<TestInterfaces.TestSession[]>;
    updateTestSession(testSession: TestInterfaces.TestSession, teamContext: TfsCoreInterfaces.TeamContext): Promise<TestInterfaces.TestSession>;
    deleteSharedParameter(project: string, sharedParameterId: number): Promise<void>;
    deleteSharedStep(project: string, sharedStepId: number): Promise<void>;
    addTestCasesToSuite(project: string, planId: number, suiteId: number, testCaseIds: string): Promise<TestInterfaces.SuiteTestCase[]>;
    getTestCaseById(project: string, planId: number, suiteId: number, testCaseIds: number): Promise<TestInterfaces.SuiteTestCase>;
    getTestCases(project: string, planId: number, suiteId: number): Promise<TestInterfaces.SuiteTestCase[]>;
    removeTestCasesFromSuiteUrl(project: string, planId: number, suiteId: number, testCaseIds: string): Promise<void>;
    updateSuiteTestCases(suiteTestCaseUpdateModel: TestInterfaces.SuiteTestCaseUpdateModel, project: string, planId: number, suiteId: number, testCaseIds: string): Promise<TestInterfaces.SuiteTestCase[]>;
    deleteTestCase(project: string, testCaseId: number): Promise<void>;
    queryTestHistory(filter: TestInterfaces.TestHistoryQuery, project: string): Promise<TestInterfaces.TestHistoryQuery>;
    createTestSettings(testSettings: TestInterfaces.TestSettings, project: string): Promise<number>;
    deleteTestSettings(project: string, testSettingsId: number): Promise<void>;
    getTestSettingsById(project: string, testSettingsId: number): Promise<TestInterfaces.TestSettings>;
    addWorkItemToTestLinks(workItemToTestLinks: TestInterfaces.WorkItemToTestLinks, project: string): Promise<TestInterfaces.WorkItemToTestLinks>;
    deleteTestMethodToWorkItemLink(project: string, testName: string, workItemId: number): Promise<boolean>;
    queryTestMethodLinkedWorkItems(project: string, testName: string): Promise<TestInterfaces.TestToWorkItemLinks>;
    queryTestResultWorkItems(project: string, workItemCategory: string, automatedTestName?: string, testCaseId?: number, maxCompleteDate?: Date, days?: number, workItemCount?: number): Promise<TestInterfaces.WorkItemReference[]>;
}
export declare class TestApi extends basem.ClientApiBase implements ITestApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "c2aa639c-3ccc-4740-b3b6-ce2a1e1d984e";
    /**
     * Attach a file to test step result
     *
     * @param {TestInterfaces.TestAttachmentRequestModel} attachmentRequestModel - Attachment details TestAttachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result that contains the iteration
     * @param {number} iterationId - ID of the test result iteration.
     * @param {string} actionPath - Hex value of test result action path.
     */
    createTestIterationResultAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, iterationId: number, actionPath?: string): Promise<TestInterfaces.TestAttachmentReference>;
    /**
     * Attach a file to a test result.
     *
     * @param {TestInterfaces.TestAttachmentRequestModel} attachmentRequestModel - Attachment details TestAttachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result against which attachment has to be uploaded.
     */
    createTestResultAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number): Promise<TestInterfaces.TestAttachmentReference>;
    /**
     * Attach a file to a test result
     *
     * @param {TestInterfaces.TestAttachmentRequestModel} attachmentRequestModel - Attachment Request Model.
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} testSubResultId - ID of the test sub results against which attachment has to be uploaded.
     */
    createTestSubResultAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<TestInterfaces.TestAttachmentReference>;
    /**
     * Download a test result attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the testCaseResultId.
     * @param {number} testCaseResultId - ID of the test result whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded.
     */
    getTestResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Get list of test result attachments reference.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result.
     */
    getTestResultAttachments(project: string, runId: number, testCaseResultId: number): Promise<TestInterfaces.TestAttachment[]>;
    /**
     * Download a test result attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the testCaseResultId.
     * @param {number} testCaseResultId - ID of the test result whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded.
     */
    getTestResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Download a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded
     * @param {number} testSubResultId - ID of the test sub result whose attachment has to be downloaded
     */
    getTestSubResultAttachmentContent(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Get list of test sub result attachments
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} testSubResultId - ID of the test sub result whose attachment has to be downloaded
     */
    getTestSubResultAttachments(project: string, runId: number, testCaseResultId: number, testSubResultId: number): Promise<TestInterfaces.TestAttachment[]>;
    /**
     * Download a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded
     * @param {number} testSubResultId - ID of the test sub result whose attachment has to be downloaded
     */
    getTestSubResultAttachmentZip(project: string, runId: number, testCaseResultId: number, attachmentId: number, testSubResultId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Attach a file to a test run.
     *
     * @param {TestInterfaces.TestAttachmentRequestModel} attachmentRequestModel - Attachment details TestAttachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run against which attachment has to be uploaded.
     */
    createTestRunAttachment(attachmentRequestModel: TestInterfaces.TestAttachmentRequestModel, project: string, runId: number): Promise<TestInterfaces.TestAttachmentReference>;
    /**
     * Download a test run attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test run attachment to be downloaded.
     */
    getTestRunAttachmentContent(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * Get list of test run attachments reference.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run.
     */
    getTestRunAttachments(project: string, runId: number): Promise<TestInterfaces.TestAttachment[]>;
    /**
     * Download a test run attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test run attachment to be downloaded.
     */
    getTestRunAttachmentZip(project: string, runId: number, attachmentId: number): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     */
    getBugsLinkedToTestResult(project: string, runId: number, testCaseResultId: number): Promise<TestInterfaces.WorkItemReference[]>;
    /**
     * Get code coverage data for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - ID of the build for which code coverage data needs to be fetched.
     * @param {number} flags - Value of flags determine the level of code coverage details to be fetched. Flags are additive. Expected Values are 1 for Modules, 2 for Functions, 4 for BlockData.
     */
    getBuildCodeCoverage(project: string, buildId: number, flags: number): Promise<TestInterfaces.BuildCoverage[]>;
    /**
     * Get Code Coverage Summary for Build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - ID of the build for which code coverage data needs to be fetched.
     * @param {number} deltaBuildId - Delta Build id (optional)
     */
    getCodeCoverageSummary(project: string, buildId: number, deltaBuildId?: number): Promise<TestInterfaces.CodeCoverageSummary>;
    /**
     * http://(tfsserver):8080/tfs/DefaultCollection/_apis/test/CodeCoverage?buildId=10 Request: Json of code coverage summary
     *
     * @param {TestInterfaces.CodeCoverageData} coverageData
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     */
    updateCodeCoverageSummary(coverageData: TestInterfaces.CodeCoverageData, project: string, buildId: number): Promise<void>;
    /**
     * Get code coverage data for a test run
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run for which code coverage data needs to be fetched.
     * @param {number} flags - Value of flags determine the level of code coverage details to be fetched. Flags are additive. Expected Values are 1 for Modules, 2 for Functions, 4 for BlockData.
     */
    getTestRunCodeCoverage(project: string, runId: number, flags: number): Promise<TestInterfaces.TestRunCoverage[]>;
    /**
     * @param {TestInterfaces.CustomTestFieldDefinition[]} newFields
     * @param {string} project - Project ID or project name
     */
    addCustomFields(newFields: TestInterfaces.CustomTestFieldDefinition[], project: string): Promise<TestInterfaces.CustomTestFieldDefinition[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {TestInterfaces.CustomTestFieldScope} scopeFilter
     */
    queryCustomFields(project: string, scopeFilter: TestInterfaces.CustomTestFieldScope): Promise<TestInterfaces.CustomTestFieldDefinition[]>;
    /**
     * @param {TestInterfaces.ResultsFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryTestResultHistory(filter: TestInterfaces.ResultsFilter, project: string): Promise<TestInterfaces.TestResultHistory>;
    /**
     * Get iteration for a result
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result that contains the iterations.
     * @param {number} iterationId - Id of the test results Iteration.
     * @param {boolean} includeActionResults - Include result details for each action performed in the test iteration. ActionResults refer to outcome (pass/fail) of test steps that are executed as part of a running a manual test. Including the ActionResults flag gets the outcome of test steps in the actionResults section and test parameters in the parameters section for each test iteration.
     */
    getTestIteration(project: string, runId: number, testCaseResultId: number, iterationId: number, includeActionResults?: boolean): Promise<TestInterfaces.TestIterationDetailsModel>;
    /**
     * Get iterations for a result
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result that contains the iterations.
     * @param {boolean} includeActionResults - Include result details for each action performed in the test iteration. ActionResults refer to outcome (pass/fail) of test steps that are executed as part of a running a manual test. Including the ActionResults flag gets the outcome of test steps in the actionResults section and test parameters in the parameters section for each test iteration.
     */
    getTestIterations(project: string, runId: number, testCaseResultId: number, includeActionResults?: boolean): Promise<TestInterfaces.TestIterationDetailsModel[]>;
    /**
     * @param {TestInterfaces.LinkedWorkItemsQuery} workItemQuery
     * @param {string} project - Project ID or project name
     */
    getLinkedWorkItemsByQuery(workItemQuery: TestInterfaces.LinkedWorkItemsQuery, project: string): Promise<TestInterfaces.LinkedWorkItemsQueryResult[]>;
    /**
     * Get test run message logs
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunLogs(project: string, runId: number): Promise<TestInterfaces.TestMessageLogDetails[]>;
    /**
     * Get a test point.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan.
     * @param {number} suiteId - ID of the suite that contains the point.
     * @param {number} pointIds - ID of the test point to get.
     * @param {string} witFields - Comma-separated list of work item field names.
     */
    getPoint(project: string, planId: number, suiteId: number, pointIds: number, witFields?: string): Promise<TestInterfaces.TestPoint>;
    /**
     * Get a list of test points.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan.
     * @param {number} suiteId - ID of the suite that contains the points.
     * @param {string} witFields - Comma-separated list of work item field names.
     * @param {string} configurationId - Get test points for specific configuration.
     * @param {string} testCaseId - Get test points for a specific test case, valid when configurationId is not set.
     * @param {string} testPointIds - Get test points for comma-separated list of test point IDs, valid only when configurationId and testCaseId are not set.
     * @param {boolean} includePointDetails - Include all properties for the test point.
     * @param {number} skip - Number of test points to skip..
     * @param {number} top - Number of test points to return.
     */
    getPoints(project: string, planId: number, suiteId: number, witFields?: string, configurationId?: string, testCaseId?: string, testPointIds?: string, includePointDetails?: boolean, skip?: number, top?: number): Promise<TestInterfaces.TestPoint[]>;
    /**
     * Update test points.
     *
     * @param {TestInterfaces.PointUpdateModel} pointUpdateModel - Data to update.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan.
     * @param {number} suiteId - ID of the suite that contains the points.
     * @param {string} pointIds - ID of the test point to get. Use a comma-separated list of IDs to update multiple test points.
     */
    updateTestPoints(pointUpdateModel: TestInterfaces.PointUpdateModel, project: string, planId: number, suiteId: number, pointIds: string): Promise<TestInterfaces.TestPoint[]>;
    /**
     * Get test points using query.
     *
     * @param {TestInterfaces.TestPointsQuery} query - TestPointsQuery to get test points.
     * @param {string} project - Project ID or project name
     * @param {number} skip - Number of test points to skip..
     * @param {number} top - Number of test points to return.
     */
    getPointsByQuery(query: TestInterfaces.TestPointsQuery, project: string, skip?: number, top?: number): Promise<TestInterfaces.TestPointsQuery>;
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
    getTestResultDetailsForBuild(project: string, buildId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<TestInterfaces.TestResultsDetails>;
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
    getTestResultDetailsForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, groupBy?: string, filter?: string, orderby?: string, shouldIncludeResults?: boolean, queryRunSummaryForInProgress?: boolean): Promise<TestInterfaces.TestResultsDetails>;
    /**
     * @param {TestInterfaces.TestResultDocument} document
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    publishTestResultDocument(document: TestInterfaces.TestResultDocument, project: string, runId: number): Promise<TestInterfaces.TestResultDocument>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {string[]} fields
     * @param {string} continuationToken
     */
    getResultGroupsByBuild(project: string, buildId: number, publishContext: string, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.FieldDetailsForTestResults>>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {string} publishContext
     * @param {number} releaseEnvId
     * @param {string[]} fields
     * @param {string} continuationToken
     */
    getResultGroupsByRelease(project: string, releaseId: number, publishContext: string, releaseEnvId?: number, fields?: string[], continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.FieldDetailsForTestResults>>;
    /**
     * Get list of test Result meta data details for corresponding testcasereferenceId
     *
     * @param {string[]} testReferenceIds - TestCaseReference Ids of the test Result to be queried, comma separated list of valid ids (limit no. of ids 200).
     * @param {string} project - Project ID or project name
     */
    queryTestResultsMetaData(testReferenceIds: string[], project: string): Promise<TestInterfaces.TestResultMetaData[]>;
    /**
     * Get test result retention settings
     *
     * @param {string} project - Project ID or project name
     */
    getResultRetentionSettings(project: string): Promise<TestInterfaces.ResultRetentionSettings>;
    /**
     * Update test result retention settings
     *
     * @param {TestInterfaces.ResultRetentionSettings} retentionSettings - Test result retention settings details to be updated
     * @param {string} project - Project ID or project name
     */
    updateResultRetentionSettings(retentionSettings: TestInterfaces.ResultRetentionSettings, project: string): Promise<TestInterfaces.ResultRetentionSettings>;
    /**
     * Add test results to a test run.
     *
     * @param {TestInterfaces.TestCaseResult[]} results - List of test results to add.
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test run ID into which test results to add.
     */
    addTestResultsToTestRun(results: TestInterfaces.TestCaseResult[], project: string, runId: number): Promise<TestInterfaces.TestCaseResult[]>;
    /**
     * Get a test result for a test run.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test run ID of a test result to fetch.
     * @param {number} testCaseResultId - Test result ID.
     * @param {TestInterfaces.ResultDetails} detailsToInclude - Details to include with test results. Default is None. Other values are Iterations, WorkItems and SubResults.
     */
    getTestResultById(project: string, runId: number, testCaseResultId: number, detailsToInclude?: TestInterfaces.ResultDetails): Promise<TestInterfaces.TestCaseResult>;
    /**
     * Get test results for a test run.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test run ID of test results to fetch.
     * @param {TestInterfaces.ResultDetails} detailsToInclude - Details to include with test results. Default is None. Other values are Iterations and WorkItems.
     * @param {number} skip - Number of test results to skip from beginning.
     * @param {number} top - Number of test results to return. Maximum is 1000 when detailsToInclude is None and 200 otherwise.
     * @param {TestInterfaces.TestOutcome[]} outcomes - Comma separated list of test outcomes to filter test results.
     */
    getTestResults(project: string, runId: number, detailsToInclude?: TestInterfaces.ResultDetails, skip?: number, top?: number, outcomes?: TestInterfaces.TestOutcome[]): Promise<TestInterfaces.TestCaseResult[]>;
    /**
     * Update test results in a test run.
     *
     * @param {TestInterfaces.TestCaseResult[]} results - List of test results to update.
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test run ID whose test results to update.
     */
    updateTestResults(results: TestInterfaces.TestCaseResult[], project: string, runId: number): Promise<TestInterfaces.TestCaseResult[]>;
    /**
     * This API will return results by Ids with fields specified/trend for particular automated test method. We are still improving this API and have not finalized proper signature and contract.
     *
     * @param {TestInterfaces.TestResultsQuery} query
     * @param {string} project - Project ID or project name
     */
    getTestResultsByQuery(query: TestInterfaces.TestResultsQuery, project: string): Promise<TestInterfaces.TestResultsQuery>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {TestInterfaces.TestOutcome[]} outcomes
     * @param {number} top
     * @param {string} continuationToken
     */
    getTestResultsByBuild(project: string, buildId: number, publishContext?: string, outcomes?: TestInterfaces.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.ShallowTestCaseResult>>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {number} releaseEnvid
     * @param {string} publishContext
     * @param {TestInterfaces.TestOutcome[]} outcomes
     * @param {number} top
     * @param {string} continuationToken
     */
    getTestResultsByRelease(project: string, releaseId: number, releaseEnvid?: number, publishContext?: string, outcomes?: TestInterfaces.TestOutcome[], top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.ShallowTestCaseResult>>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {boolean} includeFailureDetails
     * @param {TestInterfaces.BuildReference} buildToCompare
     */
    queryTestResultsReportForBuild(project: string, buildId: number, publishContext?: string, includeFailureDetails?: boolean, buildToCompare?: TestInterfaces.BuildReference): Promise<TestInterfaces.TestResultSummary>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {number} releaseEnvId
     * @param {string} publishContext
     * @param {boolean} includeFailureDetails
     * @param {TestInterfaces.ReleaseReference} releaseToCompare
     */
    queryTestResultsReportForRelease(project: string, releaseId: number, releaseEnvId: number, publishContext?: string, includeFailureDetails?: boolean, releaseToCompare?: TestInterfaces.ReleaseReference): Promise<TestInterfaces.TestResultSummary>;
    /**
     * @param {TestInterfaces.ReleaseReference[]} releases
     * @param {string} project - Project ID or project name
     */
    queryTestResultsSummaryForReleases(releases: TestInterfaces.ReleaseReference[], project: string): Promise<TestInterfaces.TestResultSummary[]>;
    /**
     * @param {TestInterfaces.TestResultsContext} resultsContext
     * @param {string} project - Project ID or project name
     * @param {number[]} workItemIds
     */
    queryTestSummaryByRequirement(resultsContext: TestInterfaces.TestResultsContext, project: string, workItemIds?: number[]): Promise<TestInterfaces.TestSummaryForWorkItem[]>;
    /**
     * @param {TestInterfaces.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForBuild(filter: TestInterfaces.TestResultTrendFilter, project: string): Promise<TestInterfaces.AggregatedDataForResultTrend[]>;
    /**
     * @param {TestInterfaces.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForRelease(filter: TestInterfaces.TestResultTrendFilter, project: string): Promise<TestInterfaces.AggregatedDataForResultTrend[]>;
    /**
     * Get test run statistics , used when we want to get summary of a run by outcome.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunStatistics(project: string, runId: number): Promise<TestInterfaces.TestRunStatistic>;
    /**
     * Create new test run.
     *
     * @param {TestInterfaces.RunCreateModel} testRun - Run details RunCreateModel
     * @param {string} project - Project ID or project name
     */
    createTestRun(testRun: TestInterfaces.RunCreateModel, project: string): Promise<TestInterfaces.TestRun>;
    /**
     * Delete a test run by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to delete.
     */
    deleteTestRun(project: string, runId: number): Promise<void>;
    /**
     * Get a test run by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     * @param {boolean} includeDetails - Default value is true. It includes details like run statistics, release, build, test environment, post process state, and more.
     */
    getTestRunById(project: string, runId: number, includeDetails?: boolean): Promise<TestInterfaces.TestRun>;
    /**
     * Get a list of test runs.
     *
     * @param {string} project - Project ID or project name
     * @param {string} buildUri - URI of the build that the runs used.
     * @param {string} owner - Team foundation ID of the owner of the runs.
     * @param {string} tmiRunId
     * @param {number} planId - ID of the test plan that the runs are a part of.
     * @param {boolean} includeRunDetails - If true, include all the properties of the runs.
     * @param {boolean} automated - If true, only returns automated runs.
     * @param {number} skip - Number of test runs to skip.
     * @param {number} top - Number of test runs to return.
     */
    getTestRuns(project: string, buildUri?: string, owner?: string, tmiRunId?: string, planId?: number, includeRunDetails?: boolean, automated?: boolean, skip?: number, top?: number): Promise<TestInterfaces.TestRun[]>;
    /**
     * Query Test Runs based on filters. Mandatory fields are minLastUpdatedDate and maxLastUpdatedDate.
     *
     * @param {string} project - Project ID or project name
     * @param {Date} minLastUpdatedDate - Minimum Last Modified Date of run to be queried (Mandatory).
     * @param {Date} maxLastUpdatedDate - Maximum Last Modified Date of run to be queried (Mandatory, difference between min and max date can be atmost 7 days).
     * @param {TestInterfaces.TestRunState} state - Current state of the Runs to be queried.
     * @param {number[]} planIds - Plan Ids of the Runs to be queried, comma separated list of valid ids (limit no. of ids 10).
     * @param {boolean} isAutomated - Automation type of the Runs to be queried.
     * @param {TestInterfaces.TestRunPublishContext} publishContext - PublishContext of the Runs to be queried.
     * @param {number[]} buildIds - Build Ids of the Runs to be queried, comma separated list of valid ids (limit no. of ids 10).
     * @param {number[]} buildDefIds - Build Definition Ids of the Runs to be queried, comma separated list of valid ids (limit no. of ids 10).
     * @param {string} branchName - Source Branch name of the Runs to be queried.
     * @param {number[]} releaseIds - Release Ids of the Runs to be queried, comma separated list of valid ids (limit no. of ids 10).
     * @param {number[]} releaseDefIds - Release Definition Ids of the Runs to be queried, comma separated list of valid ids (limit no. of ids 10).
     * @param {number[]} releaseEnvIds - Release Environment Ids of the Runs to be queried, comma separated list of valid ids (limit no. of ids 10).
     * @param {number[]} releaseEnvDefIds - Release Environment Definition Ids of the Runs to be queried, comma separated list of valid ids (limit no. of ids 10).
     * @param {string} runTitle - Run Title of the Runs to be queried.
     * @param {number} top - Number of runs to be queried. Limit is 100
     * @param {string} continuationToken - continuationToken received from previous batch or null for first batch. It is not supposed to be created (or altered, if received from last batch) by user.
     */
    queryTestRuns(project: string, minLastUpdatedDate: Date, maxLastUpdatedDate: Date, state?: TestInterfaces.TestRunState, planIds?: number[], isAutomated?: boolean, publishContext?: TestInterfaces.TestRunPublishContext, buildIds?: number[], buildDefIds?: number[], branchName?: string, releaseIds?: number[], releaseDefIds?: number[], releaseEnvIds?: number[], releaseEnvDefIds?: number[], runTitle?: string, top?: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestInterfaces.TestRun>>;
    /**
     * Update test run by its ID.
     *
     * @param {TestInterfaces.RunUpdateModel} runUpdateModel - Run details RunUpdateModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to update.
     */
    updateTestRun(runUpdateModel: TestInterfaces.RunUpdateModel, project: string, runId: number): Promise<TestInterfaces.TestRun>;
    /**
     * Create a test session
     *
     * @param {TestInterfaces.TestSession} testSession - Test session details for creation
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    createTestSession(testSession: TestInterfaces.TestSession, teamContext: TfsCoreInterfaces.TeamContext): Promise<TestInterfaces.TestSession>;
    /**
     * Get a list of test sessions
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {number} period - Period in days from now, for which test sessions are fetched.
     * @param {boolean} allSessions - If false, returns test sessions for current user. Otherwise, it returns test sessions for all users
     * @param {boolean} includeAllProperties - If true, it returns all properties of the test sessions. Otherwise, it returns the skinny version.
     * @param {TestInterfaces.TestSessionSource} source - Source of the test session.
     * @param {boolean} includeOnlyCompletedSessions - If true, it returns test sessions in completed state. Otherwise, it returns test sessions for all states
     */
    getTestSessions(teamContext: TfsCoreInterfaces.TeamContext, period?: number, allSessions?: boolean, includeAllProperties?: boolean, source?: TestInterfaces.TestSessionSource, includeOnlyCompletedSessions?: boolean): Promise<TestInterfaces.TestSession[]>;
    /**
     * Update a test session
     *
     * @param {TestInterfaces.TestSession} testSession - Test session details for update
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateTestSession(testSession: TestInterfaces.TestSession, teamContext: TfsCoreInterfaces.TeamContext): Promise<TestInterfaces.TestSession>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} sharedParameterId
     */
    deleteSharedParameter(project: string, sharedParameterId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} sharedStepId
     */
    deleteSharedStep(project: string, sharedStepId: number): Promise<void>;
    /**
     * Add test cases to suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the test suite to which the test cases must be added.
     * @param {string} testCaseIds - IDs of the test cases to add to the suite. Ids are specified in comma separated format.
     */
    addTestCasesToSuite(project: string, planId: number, suiteId: number, testCaseIds: string): Promise<TestInterfaces.SuiteTestCase[]>;
    /**
     * Get a specific test case in a test suite with test case id.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the suite that contains the test case.
     * @param {number} testCaseIds - ID of the test case to get.
     */
    getTestCaseById(project: string, planId: number, suiteId: number, testCaseIds: number): Promise<TestInterfaces.SuiteTestCase>;
    /**
     * Get all test cases in a suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the suite to get.
     */
    getTestCases(project: string, planId: number, suiteId: number): Promise<TestInterfaces.SuiteTestCase[]>;
    /**
     * The test points associated with the test cases are removed from the test suite. The test case work item is not deleted from the system. See test cases resource to delete a test case permanently.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the suite to get.
     * @param {string} testCaseIds - IDs of the test cases to remove from the suite.
     */
    removeTestCasesFromSuiteUrl(project: string, planId: number, suiteId: number, testCaseIds: string): Promise<void>;
    /**
     * Updates the properties of the test case association in a suite.
     *
     * @param {TestInterfaces.SuiteTestCaseUpdateModel} suiteTestCaseUpdateModel - Model for updation of the properties of test case suite association.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the test suite to which the test cases must be added.
     * @param {string} testCaseIds - IDs of the test cases to add to the suite. Ids are specified in comma separated format.
     */
    updateSuiteTestCases(suiteTestCaseUpdateModel: TestInterfaces.SuiteTestCaseUpdateModel, project: string, planId: number, suiteId: number, testCaseIds: string): Promise<TestInterfaces.SuiteTestCase[]>;
    /**
     * Delete a test case.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testCaseId - Id of test case to delete.
     */
    deleteTestCase(project: string, testCaseId: number): Promise<void>;
    /**
     * Get history of a test method using TestHistoryQuery
     *
     * @param {TestInterfaces.TestHistoryQuery} filter - TestHistoryQuery to get history
     * @param {string} project - Project ID or project name
     */
    queryTestHistory(filter: TestInterfaces.TestHistoryQuery, project: string): Promise<TestInterfaces.TestHistoryQuery>;
    /**
     * @param {TestInterfaces.TestSettings} testSettings
     * @param {string} project - Project ID or project name
     */
    createTestSettings(testSettings: TestInterfaces.TestSettings, project: string): Promise<number>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} testSettingsId
     */
    deleteTestSettings(project: string, testSettingsId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} testSettingsId
     */
    getTestSettingsById(project: string, testSettingsId: number): Promise<TestInterfaces.TestSettings>;
    /**
     * @param {TestInterfaces.WorkItemToTestLinks} workItemToTestLinks
     * @param {string} project - Project ID or project name
     */
    addWorkItemToTestLinks(workItemToTestLinks: TestInterfaces.WorkItemToTestLinks, project: string): Promise<TestInterfaces.WorkItemToTestLinks>;
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
    queryTestMethodLinkedWorkItems(project: string, testName: string): Promise<TestInterfaces.TestToWorkItemLinks>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} workItemCategory
     * @param {string} automatedTestName
     * @param {number} testCaseId
     * @param {Date} maxCompleteDate
     * @param {number} days
     * @param {number} workItemCount
     */
    queryTestResultWorkItems(project: string, workItemCategory: string, automatedTestName?: string, testCaseId?: number, maxCompleteDate?: Date, days?: number, workItemCount?: number): Promise<TestInterfaces.WorkItemReference[]>;
}
