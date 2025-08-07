/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import TestPlanInterfaces = require("./interfaces/TestPlanInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface ITestPlanApi extends basem.ClientApiBase {
    createTestConfiguration(testConfigurationCreateUpdateParameters: TestPlanInterfaces.TestConfigurationCreateUpdateParameters, project: string): Promise<TestPlanInterfaces.TestConfiguration>;
    deleteTestConfguration(project: string, testConfiguartionId: number): Promise<void>;
    getTestConfigurationById(project: string, testConfigurationId: number): Promise<TestPlanInterfaces.TestConfiguration>;
    getTestConfigurations(project: string, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestConfiguration>>;
    updateTestConfiguration(testConfigurationCreateUpdateParameters: TestPlanInterfaces.TestConfigurationCreateUpdateParameters, project: string, testConfiguartionId: number): Promise<TestPlanInterfaces.TestConfiguration>;
    getTestEntityCountByPlanId(project: string, planId: number, states?: string, outcome?: TestPlanInterfaces.UserFriendlyTestOutcome, configurations?: string, testers?: string, assignedTo?: string, entity?: TestPlanInterfaces.TestEntityTypes): Promise<TestPlanInterfaces.TestEntityCount[]>;
    createTestPlan(testPlanCreateParams: TestPlanInterfaces.TestPlanCreateParams, project: string): Promise<TestPlanInterfaces.TestPlan>;
    deleteTestPlan(project: string, planId: number): Promise<void>;
    getTestPlanById(project: string, planId: number): Promise<TestPlanInterfaces.TestPlan>;
    getTestPlans(project: string, owner?: string, continuationToken?: string, includePlanDetails?: boolean, filterActivePlans?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestPlan>>;
    updateTestPlan(testPlanUpdateParams: TestPlanInterfaces.TestPlanUpdateParams, project: string, planId: number): Promise<TestPlanInterfaces.TestPlan>;
    getSuiteEntries(project: string, suiteId: number, suiteEntryType?: TestPlanInterfaces.SuiteEntryTypes): Promise<TestPlanInterfaces.SuiteEntry[]>;
    reorderSuiteEntries(suiteEntries: TestPlanInterfaces.SuiteEntryUpdateParams[], project: string, suiteId: number): Promise<TestPlanInterfaces.SuiteEntry[]>;
    createBulkTestSuites(testSuiteCreateParams: TestPlanInterfaces.TestSuiteCreateParams[], project: string, planId: number, parentSuiteId: number): Promise<TestPlanInterfaces.TestSuite[]>;
    createTestSuite(testSuiteCreateParams: TestPlanInterfaces.TestSuiteCreateParams, project: string, planId: number): Promise<TestPlanInterfaces.TestSuite>;
    deleteTestSuite(project: string, planId: number, suiteId: number): Promise<void>;
    getTestSuiteById(project: string, planId: number, suiteId: number, expand?: TestPlanInterfaces.SuiteExpand): Promise<TestPlanInterfaces.TestSuite>;
    getTestSuitesForPlan(project: string, planId: number, expand?: TestPlanInterfaces.SuiteExpand, continuationToken?: string, asTreeView?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestSuite>>;
    updateTestSuite(testSuiteUpdateParams: TestPlanInterfaces.TestSuiteUpdateParams, project: string, planId: number, suiteId: number): Promise<TestPlanInterfaces.TestSuite>;
    getSuitesByTestCaseId(testCaseId: number): Promise<TestPlanInterfaces.TestSuite[]>;
    addTestCasesToSuite(suiteTestCaseCreateUpdateParameters: TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[], project: string, planId: number, suiteId: number): Promise<TestPlanInterfaces.TestCase[]>;
    getTestCase(project: string, planId: number, suiteId: number, testCaseId: string, witFields?: string, returnIdentityRef?: boolean): Promise<TestPlanInterfaces.TestCase[]>;
    getTestCaseList(project: string, planId: number, suiteId: number, testIds?: string, configurationIds?: string, witFields?: string, continuationToken?: string, returnIdentityRef?: boolean, expand?: boolean, excludeFlags?: TestPlanInterfaces.ExcludeFlags, isRecursive?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestCase>>;
    removeTestCasesFromSuite(project: string, planId: number, suiteId: number, testCaseIds: string): Promise<void>;
    removeTestCasesListFromSuite(project: string, planId: number, suiteId: number, testIds: string): Promise<void>;
    updateSuiteTestCases(suiteTestCaseCreateUpdateParameters: TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[], project: string, planId: number, suiteId: number): Promise<TestPlanInterfaces.TestCase[]>;
    cloneTestCase(cloneRequestBody: TestPlanInterfaces.CloneTestCaseParams, project: string): Promise<TestPlanInterfaces.CloneTestCaseOperationInformation>;
    getTestCaseCloneInformation(project: string, cloneOperationId: number): Promise<TestPlanInterfaces.CloneTestCaseOperationInformation>;
    exportTestCases(exportTestCaseRequestBody: TestPlanInterfaces.ExportTestCaseParams, project: string): Promise<NodeJS.ReadableStream>;
    deleteTestCase(project: string, testCaseId: number): Promise<void>;
    cloneTestPlan(cloneRequestBody: TestPlanInterfaces.CloneTestPlanParams, project: string, deepClone?: boolean): Promise<TestPlanInterfaces.CloneTestPlanOperationInformation>;
    getCloneInformation(project: string, cloneOperationId: number): Promise<TestPlanInterfaces.CloneTestPlanOperationInformation>;
    getPoints(project: string, planId: number, suiteId: number, pointId: string, returnIdentityRef?: boolean, includePointDetails?: boolean): Promise<TestPlanInterfaces.TestPoint[]>;
    getPointsList(project: string, planId: number, suiteId: number, testPointIds?: string, testCaseId?: string, continuationToken?: string, returnIdentityRef?: boolean, includePointDetails?: boolean, isRecursive?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestPoint>>;
    updateTestPoints(testPointUpdateParams: TestPlanInterfaces.TestPointUpdateParams[], project: string, planId: number, suiteId: number, includePointDetails?: boolean, returnIdentityRef?: boolean): Promise<TestPlanInterfaces.TestPoint[]>;
    cloneTestSuite(cloneRequestBody: TestPlanInterfaces.CloneTestSuiteParams, project: string, deepClone?: boolean): Promise<TestPlanInterfaces.CloneTestSuiteOperationInformation>;
    getSuiteCloneInformation(project: string, cloneOperationId: number): Promise<TestPlanInterfaces.CloneTestSuiteOperationInformation>;
    createTestVariable(testVariableCreateUpdateParameters: TestPlanInterfaces.TestVariableCreateUpdateParameters, project: string): Promise<TestPlanInterfaces.TestVariable>;
    deleteTestVariable(project: string, testVariableId: number): Promise<void>;
    getTestVariableById(project: string, testVariableId: number): Promise<TestPlanInterfaces.TestVariable>;
    getTestVariables(project: string, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestVariable>>;
    updateTestVariable(testVariableCreateUpdateParameters: TestPlanInterfaces.TestVariableCreateUpdateParameters, project: string, testVariableId: number): Promise<TestPlanInterfaces.TestVariable>;
}
export declare class TestPlanApi extends basem.ClientApiBase implements ITestPlanApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    /**
     * Create a test configuration.
     *
     * @param {TestPlanInterfaces.TestConfigurationCreateUpdateParameters} testConfigurationCreateUpdateParameters - TestConfigurationCreateUpdateParameters
     * @param {string} project - Project ID or project name
     */
    createTestConfiguration(testConfigurationCreateUpdateParameters: TestPlanInterfaces.TestConfigurationCreateUpdateParameters, project: string): Promise<TestPlanInterfaces.TestConfiguration>;
    /**
     * Delete a test configuration by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testConfiguartionId - ID of the test configuration to delete.
     */
    deleteTestConfguration(project: string, testConfiguartionId: number): Promise<void>;
    /**
     * Get a test configuration
     *
     * @param {string} project - Project ID or project name
     * @param {number} testConfigurationId - ID of the test configuration to get.
     */
    getTestConfigurationById(project: string, testConfigurationId: number): Promise<TestPlanInterfaces.TestConfiguration>;
    /**
     * Get a list of test configurations.
     *
     * @param {string} project - Project ID or project name
     * @param {string} continuationToken - If the list of configurations returned is not complete, a continuation token to query next batch of configurations is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test configurations.
     */
    getTestConfigurations(project: string, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestConfiguration>>;
    /**
     * Update a test configuration by its ID.
     *
     * @param {TestPlanInterfaces.TestConfigurationCreateUpdateParameters} testConfigurationCreateUpdateParameters - TestConfigurationCreateUpdateParameters
     * @param {string} project - Project ID or project name
     * @param {number} testConfiguartionId - ID of the test configuration to update.
     */
    updateTestConfiguration(testConfigurationCreateUpdateParameters: TestPlanInterfaces.TestConfigurationCreateUpdateParameters, project: string, testConfiguartionId: number): Promise<TestPlanInterfaces.TestConfiguration>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} planId
     * @param {string} states
     * @param {TestPlanInterfaces.UserFriendlyTestOutcome} outcome
     * @param {string} configurations
     * @param {string} testers
     * @param {string} assignedTo
     * @param {TestPlanInterfaces.TestEntityTypes} entity
     */
    getTestEntityCountByPlanId(project: string, planId: number, states?: string, outcome?: TestPlanInterfaces.UserFriendlyTestOutcome, configurations?: string, testers?: string, assignedTo?: string, entity?: TestPlanInterfaces.TestEntityTypes): Promise<TestPlanInterfaces.TestEntityCount[]>;
    /**
     * Create a test plan.
     *
     * @param {TestPlanInterfaces.TestPlanCreateParams} testPlanCreateParams - A testPlanCreateParams object.TestPlanCreateParams
     * @param {string} project - Project ID or project name
     */
    createTestPlan(testPlanCreateParams: TestPlanInterfaces.TestPlanCreateParams, project: string): Promise<TestPlanInterfaces.TestPlan>;
    /**
     * Delete a test plan.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to be deleted.
     */
    deleteTestPlan(project: string, planId: number): Promise<void>;
    /**
     * Get a test plan by Id.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to get.
     */
    getTestPlanById(project: string, planId: number): Promise<TestPlanInterfaces.TestPlan>;
    /**
     * Get a list of test plans
     *
     * @param {string} project - Project ID or project name
     * @param {string} owner - Filter for test plan by owner ID or name
     * @param {string} continuationToken - If the list of plans returned is not complete, a continuation token to query next batch of plans is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test plans.
     * @param {boolean} includePlanDetails - Get all properties of the test plan
     * @param {boolean} filterActivePlans - Get just the active plans
     */
    getTestPlans(project: string, owner?: string, continuationToken?: string, includePlanDetails?: boolean, filterActivePlans?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestPlan>>;
    /**
     * Update a test plan.
     *
     * @param {TestPlanInterfaces.TestPlanUpdateParams} testPlanUpdateParams - A testPlanUpdateParams object.TestPlanUpdateParams
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to be updated.
     */
    updateTestPlan(testPlanUpdateParams: TestPlanInterfaces.TestPlanUpdateParams, project: string, planId: number): Promise<TestPlanInterfaces.TestPlan>;
    /**
     * Get a list of test suite entries in the test suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} suiteId - Id of the parent suite.
     * @param {TestPlanInterfaces.SuiteEntryTypes} suiteEntryType
     */
    getSuiteEntries(project: string, suiteId: number, suiteEntryType?: TestPlanInterfaces.SuiteEntryTypes): Promise<TestPlanInterfaces.SuiteEntry[]>;
    /**
     * Reorder test suite entries in the test suite.
     *
     * @param {TestPlanInterfaces.SuiteEntryUpdateParams[]} suiteEntries - List of SuiteEntry to reorder.
     * @param {string} project - Project ID or project name
     * @param {number} suiteId - Id of the parent test suite.
     */
    reorderSuiteEntries(suiteEntries: TestPlanInterfaces.SuiteEntryUpdateParams[], project: string, suiteId: number): Promise<TestPlanInterfaces.SuiteEntry[]>;
    /**
     * Create bulk requirement based test suites.
     *
     * @param {TestPlanInterfaces.TestSuiteCreateParams[]} testSuiteCreateParams - Parameters for suite creation
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan where requirement based suites need to be created.
     * @param {number} parentSuiteId - ID of the parent suite under which requirement based suites will be created
     */
    createBulkTestSuites(testSuiteCreateParams: TestPlanInterfaces.TestSuiteCreateParams[], project: string, planId: number, parentSuiteId: number): Promise<TestPlanInterfaces.TestSuite[]>;
    /**
     * Create test suite.
     *
     * @param {TestPlanInterfaces.TestSuiteCreateParams} testSuiteCreateParams - Parameters for suite creation
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     */
    createTestSuite(testSuiteCreateParams: TestPlanInterfaces.TestSuiteCreateParams, project: string, planId: number): Promise<TestPlanInterfaces.TestSuite>;
    /**
     * Delete test suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the test suite to delete.
     */
    deleteTestSuite(project: string, planId: number, suiteId: number): Promise<void>;
    /**
     * Get test suite by suite id.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the suite to get.
     * @param {TestPlanInterfaces.SuiteExpand} expand - Include the children suites and testers details
     */
    getTestSuiteById(project: string, planId: number, suiteId: number, expand?: TestPlanInterfaces.SuiteExpand): Promise<TestPlanInterfaces.TestSuite>;
    /**
     * Get test suites for plan.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan for which suites are requested.
     * @param {TestPlanInterfaces.SuiteExpand} expand - Include the children suites and testers details.
     * @param {string} continuationToken - If the list of suites returned is not complete, a continuation token to query next batch of suites is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test suites.
     * @param {boolean} asTreeView - If the suites returned should be in a tree structure.
     */
    getTestSuitesForPlan(project: string, planId: number, expand?: TestPlanInterfaces.SuiteExpand, continuationToken?: string, asTreeView?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestSuite>>;
    /**
     * Update test suite.
     *
     * @param {TestPlanInterfaces.TestSuiteUpdateParams} testSuiteUpdateParams - Parameters for suite updation
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the parent suite.
     */
    updateTestSuite(testSuiteUpdateParams: TestPlanInterfaces.TestSuiteUpdateParams, project: string, planId: number, suiteId: number): Promise<TestPlanInterfaces.TestSuite>;
    /**
     * Find the list of all test suites in which a given test case is present. This is helpful if you need to find out which test suites are using a test case, when you need to make changes to a test case.
     *
     * @param {number} testCaseId - ID of the test case for which suites need to be fetched.
     */
    getSuitesByTestCaseId(testCaseId: number): Promise<TestPlanInterfaces.TestSuite[]>;
    /**
     * Add test cases to a suite with specified configurations
     *
     * @param {TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[]} suiteTestCaseCreateUpdateParameters - SuiteTestCaseCreateUpdateParameters object.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to which test cases are to be added.
     * @param {number} suiteId - ID of the test suite to which test cases are to be added.
     */
    addTestCasesToSuite(suiteTestCaseCreateUpdateParameters: TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[], project: string, planId: number, suiteId: number): Promise<TestPlanInterfaces.TestCase[]>;
    /**
     * Get a particular Test Case from a Suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan for which test cases are requested.
     * @param {number} suiteId - ID of the test suite for which test cases are requested.
     * @param {string} testCaseId - Test Case Id to be fetched.
     * @param {string} witFields - Get the list of witFields.
     * @param {boolean} returnIdentityRef - If set to true, returns all identity fields, like AssignedTo, ActivatedBy etc., as IdentityRef objects. If set to false, these fields are returned as unique names in string format. This is false by default.
     */
    getTestCase(project: string, planId: number, suiteId: number, testCaseId: string, witFields?: string, returnIdentityRef?: boolean): Promise<TestPlanInterfaces.TestCase[]>;
    /**
     * Get Test Case List return those test cases which have all the configuration Ids as mentioned in the optional parameter. If configuration Ids is null, it return all the test cases
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan for which test cases are requested.
     * @param {number} suiteId - ID of the test suite for which test cases are requested.
     * @param {string} testIds - Test Case Ids to be fetched.
     * @param {string} configurationIds - Fetch Test Cases which contains all the configuration Ids specified.
     * @param {string} witFields - Get the list of witFields.
     * @param {string} continuationToken - If the list of test cases returned is not complete, a continuation token to query next batch of test cases is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test cases.
     * @param {boolean} returnIdentityRef - If set to true, returns all identity fields, like AssignedTo, ActivatedBy etc., as IdentityRef objects. If set to false, these fields are returned as unique names in string format. This is false by default.
     * @param {boolean} expand - If set to false, will get a smaller payload containing only basic details about the suite test case object
     * @param {TestPlanInterfaces.ExcludeFlags} excludeFlags - Flag to exclude various values from payload. For example to remove point assignments pass exclude = 1. To remove extra information (links, test plan , test suite) pass exclude = 2. To remove both extra information and point assignments pass exclude = 3 (1 + 2).
     * @param {boolean} isRecursive
     */
    getTestCaseList(project: string, planId: number, suiteId: number, testIds?: string, configurationIds?: string, witFields?: string, continuationToken?: string, returnIdentityRef?: boolean, expand?: boolean, excludeFlags?: TestPlanInterfaces.ExcludeFlags, isRecursive?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestCase>>;
    /**
     * Removes test cases from a suite based on the list of test case Ids provided.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan from which test cases are to be removed.
     * @param {number} suiteId - ID of the test suite from which test cases are to be removed.
     * @param {string} testCaseIds - Test Case Ids to be removed.
     */
    removeTestCasesFromSuite(project: string, planId: number, suiteId: number, testCaseIds: string): Promise<void>;
    /**
     * Removes test cases from a suite based on the list of test case Ids provided. This API can be used to remove a larger number of test cases.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan from which test cases are to be removed.
     * @param {number} suiteId - ID of the test suite from which test cases are to be removed.
     * @param {string} testIds - Comma separated string of Test Case Ids to be removed.
     */
    removeTestCasesListFromSuite(project: string, planId: number, suiteId: number, testIds: string): Promise<void>;
    /**
     * Update the configurations for test cases
     *
     * @param {TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[]} suiteTestCaseCreateUpdateParameters - A SuiteTestCaseCreateUpdateParameters object.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to which test cases are to be updated.
     * @param {number} suiteId - ID of the test suite to which test cases are to be updated.
     */
    updateSuiteTestCases(suiteTestCaseCreateUpdateParameters: TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[], project: string, planId: number, suiteId: number): Promise<TestPlanInterfaces.TestCase[]>;
    /**
     * @param {TestPlanInterfaces.CloneTestCaseParams} cloneRequestBody
     * @param {string} project - Project ID or project name
     */
    cloneTestCase(cloneRequestBody: TestPlanInterfaces.CloneTestCaseParams, project: string): Promise<TestPlanInterfaces.CloneTestCaseOperationInformation>;
    /**
     * Get clone information.
     *
     * @param {string} project - Project ID or project name
     * @param {number} cloneOperationId - Operation ID returned when we queue a clone operation
     */
    getTestCaseCloneInformation(project: string, cloneOperationId: number): Promise<TestPlanInterfaces.CloneTestCaseOperationInformation>;
    /**
     * Exports a set of test cases from a suite to a file. Currently supported  formats: xlsx
     *
     * @param {TestPlanInterfaces.ExportTestCaseParams} exportTestCaseRequestBody - A ExportTestCaseParams object.ExportTestCaseParams
     * @param {string} project - Project ID or project name
     */
    exportTestCases(exportTestCaseRequestBody: TestPlanInterfaces.ExportTestCaseParams, project: string): Promise<NodeJS.ReadableStream>;
    /**
     * Delete a test case.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testCaseId - Id of test case to be deleted.
     */
    deleteTestCase(project: string, testCaseId: number): Promise<void>;
    /**
     * Clone test plan
     *
     * @param {TestPlanInterfaces.CloneTestPlanParams} cloneRequestBody - Plan Clone Request Body detail TestPlanCloneRequest
     * @param {string} project - Project ID or project name
     * @param {boolean} deepClone - Clones all the associated test cases as well
     */
    cloneTestPlan(cloneRequestBody: TestPlanInterfaces.CloneTestPlanParams, project: string, deepClone?: boolean): Promise<TestPlanInterfaces.CloneTestPlanOperationInformation>;
    /**
     * Get clone information.
     *
     * @param {string} project - Project ID or project name
     * @param {number} cloneOperationId - Operation ID returned when we queue a clone operation
     */
    getCloneInformation(project: string, cloneOperationId: number): Promise<TestPlanInterfaces.CloneTestPlanOperationInformation>;
    /**
     * Get a particular Test Point from a suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan for which test points are requested.
     * @param {number} suiteId - ID of the test suite for which test points are requested.
     * @param {string} pointId - ID of test point to be fetched.
     * @param {boolean} returnIdentityRef - If set to true, returns the AssignedTo field in TestCaseReference as IdentityRef object.
     * @param {boolean} includePointDetails - If set to false, will get a smaller payload containing only basic details about the test point object
     */
    getPoints(project: string, planId: number, suiteId: number, pointId: string, returnIdentityRef?: boolean, includePointDetails?: boolean): Promise<TestPlanInterfaces.TestPoint[]>;
    /**
     * Get all the points inside a suite based on some filters
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan for which test points are requested.
     * @param {number} suiteId - ID of the test suite for which test points are requested
     * @param {string} testPointIds - ID of test points to fetch.
     * @param {string} testCaseId - Get Test Points for specific test case Ids.
     * @param {string} continuationToken - If the list of test point returned is not complete, a continuation token to query next batch of test points is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test points.
     * @param {boolean} returnIdentityRef - If set to true, returns the AssignedTo field in TestCaseReference as IdentityRef object.
     * @param {boolean} includePointDetails - If set to false, will get a smaller payload containing only basic details about the test point object
     * @param {boolean} isRecursive - If set to true, will also fetch test points belonging to child suites recursively.
     */
    getPointsList(project: string, planId: number, suiteId: number, testPointIds?: string, testCaseId?: string, continuationToken?: string, returnIdentityRef?: boolean, includePointDetails?: boolean, isRecursive?: boolean): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestPoint>>;
    /**
     * Update Test Points. This is used to Reset test point to active, update the outcome of a test point or update the tester of a test point
     *
     * @param {TestPlanInterfaces.TestPointUpdateParams[]} testPointUpdateParams - A TestPointUpdateParams Object.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan for which test points are requested.
     * @param {number} suiteId - ID of the test suite for which test points are requested.
     * @param {boolean} includePointDetails - If set to false, will get a smaller payload containing only basic details about the test point object
     * @param {boolean} returnIdentityRef - If set to true, returns the AssignedTo field in TestCaseReference as IdentityRef object.
     */
    updateTestPoints(testPointUpdateParams: TestPlanInterfaces.TestPointUpdateParams[], project: string, planId: number, suiteId: number, includePointDetails?: boolean, returnIdentityRef?: boolean): Promise<TestPlanInterfaces.TestPoint[]>;
    /**
     * Clone test suite
     *
     * @param {TestPlanInterfaces.CloneTestSuiteParams} cloneRequestBody - Suite Clone Request Body detail TestSuiteCloneRequest
     * @param {string} project - Project ID or project name
     * @param {boolean} deepClone - Clones all the associated test cases as well
     */
    cloneTestSuite(cloneRequestBody: TestPlanInterfaces.CloneTestSuiteParams, project: string, deepClone?: boolean): Promise<TestPlanInterfaces.CloneTestSuiteOperationInformation>;
    /**
     * Get clone information.
     *
     * @param {string} project - Project ID or project name
     * @param {number} cloneOperationId - Operation ID returned when we queue a clone operation
     */
    getSuiteCloneInformation(project: string, cloneOperationId: number): Promise<TestPlanInterfaces.CloneTestSuiteOperationInformation>;
    /**
     * Create a test variable.
     *
     * @param {TestPlanInterfaces.TestVariableCreateUpdateParameters} testVariableCreateUpdateParameters - TestVariableCreateUpdateParameters
     * @param {string} project - Project ID or project name
     */
    createTestVariable(testVariableCreateUpdateParameters: TestPlanInterfaces.TestVariableCreateUpdateParameters, project: string): Promise<TestPlanInterfaces.TestVariable>;
    /**
     * Delete a test variable by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testVariableId - ID of the test variable to delete.
     */
    deleteTestVariable(project: string, testVariableId: number): Promise<void>;
    /**
     * Get a test variable by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testVariableId - ID of the test variable to get.
     */
    getTestVariableById(project: string, testVariableId: number): Promise<TestPlanInterfaces.TestVariable>;
    /**
     * Get a list of test variables.
     *
     * @param {string} project - Project ID or project name
     * @param {string} continuationToken - If the list of variables returned is not complete, a continuation token to query next batch of variables is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test variables.
     */
    getTestVariables(project: string, continuationToken?: string): Promise<VSSInterfaces.PagedList<TestPlanInterfaces.TestVariable>>;
    /**
     * Update a test variable by its ID.
     *
     * @param {TestPlanInterfaces.TestVariableCreateUpdateParameters} testVariableCreateUpdateParameters - TestVariableCreateUpdateParameters
     * @param {string} project - Project ID or project name
     * @param {number} testVariableId - ID of the test variable to update.
     */
    updateTestVariable(testVariableCreateUpdateParameters: TestPlanInterfaces.TestVariableCreateUpdateParameters, project: string, testVariableId: number): Promise<TestPlanInterfaces.TestVariable>;
}
