"use strict";
/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 *
 * ---------------------------------------------------------
 * Generated file, DO NOT EDIT
 * ---------------------------------------------------------
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const basem = require("./ClientApiBases");
const TestPlanInterfaces = require("./interfaces/TestPlanInterfaces");
class TestPlanApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-TestPlan-api', options);
    }
    /**
     * Create a test configuration.
     *
     * @param {TestPlanInterfaces.TestConfigurationCreateUpdateParameters} testConfigurationCreateUpdateParameters - TestConfigurationCreateUpdateParameters
     * @param {string} project - Project ID or project name
     */
    createTestConfiguration(testConfigurationCreateUpdateParameters, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "8369318e-38fa-4e84-9043-4b2a75d2c256", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testConfigurationCreateUpdateParameters, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestConfiguration, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a test configuration by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testConfiguartionId - ID of the test configuration to delete.
     */
    deleteTestConfguration(project, testConfiguartionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testConfiguartionId == null) {
                throw new TypeError('testConfiguartionId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    testConfiguartionId: testConfiguartionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "8369318e-38fa-4e84-9043-4b2a75d2c256", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a test configuration
     *
     * @param {string} project - Project ID or project name
     * @param {number} testConfigurationId - ID of the test configuration to get.
     */
    getTestConfigurationById(project, testConfigurationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testConfigurationId: testConfigurationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "8369318e-38fa-4e84-9043-4b2a75d2c256", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestConfiguration, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of test configurations.
     *
     * @param {string} project - Project ID or project name
     * @param {string} continuationToken - If the list of configurations returned is not complete, a continuation token to query next batch of configurations is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test configurations.
     */
    getTestConfigurations(project, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "8369318e-38fa-4e84-9043-4b2a75d2c256", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestConfiguration, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a test configuration by its ID.
     *
     * @param {TestPlanInterfaces.TestConfigurationCreateUpdateParameters} testConfigurationCreateUpdateParameters - TestConfigurationCreateUpdateParameters
     * @param {string} project - Project ID or project name
     * @param {number} testConfiguartionId - ID of the test configuration to update.
     */
    updateTestConfiguration(testConfigurationCreateUpdateParameters, project, testConfiguartionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testConfiguartionId == null) {
                throw new TypeError('testConfiguartionId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    testConfiguartionId: testConfiguartionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "8369318e-38fa-4e84-9043-4b2a75d2c256", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testConfigurationCreateUpdateParameters, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestConfiguration, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestEntityCountByPlanId(project, planId, states, outcome, configurations, testers, assignedTo, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId
                };
                let queryValues = {
                    states: states,
                    outcome: outcome,
                    configurations: configurations,
                    testers: testers,
                    assignedTo: assignedTo,
                    entity: entity,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "300578da-7b40-4c1e-9542-7aed6029e504", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create a test plan.
     *
     * @param {TestPlanInterfaces.TestPlanCreateParams} testPlanCreateParams - A testPlanCreateParams object.TestPlanCreateParams
     * @param {string} project - Project ID or project name
     */
    createTestPlan(testPlanCreateParams, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "0e292477-a0c2-47f3-a9b6-34f153d627f4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testPlanCreateParams, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestPlan, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a test plan.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to be deleted.
     */
    deleteTestPlan(project, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "0e292477-a0c2-47f3-a9b6-34f153d627f4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a test plan by Id.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to get.
     */
    getTestPlanById(project, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "0e292477-a0c2-47f3-a9b6-34f153d627f4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestPlan, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of test plans
     *
     * @param {string} project - Project ID or project name
     * @param {string} owner - Filter for test plan by owner ID or name
     * @param {string} continuationToken - If the list of plans returned is not complete, a continuation token to query next batch of plans is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test plans.
     * @param {boolean} includePlanDetails - Get all properties of the test plan
     * @param {boolean} filterActivePlans - Get just the active plans
     */
    getTestPlans(project, owner, continuationToken, includePlanDetails, filterActivePlans) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    owner: owner,
                    continuationToken: continuationToken,
                    includePlanDetails: includePlanDetails,
                    filterActivePlans: filterActivePlans,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "0e292477-a0c2-47f3-a9b6-34f153d627f4", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestPlan, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a test plan.
     *
     * @param {TestPlanInterfaces.TestPlanUpdateParams} testPlanUpdateParams - A testPlanUpdateParams object.TestPlanUpdateParams
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to be updated.
     */
    updateTestPlan(testPlanUpdateParams, project, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "0e292477-a0c2-47f3-a9b6-34f153d627f4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testPlanUpdateParams, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestPlan, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of test suite entries in the test suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} suiteId - Id of the parent suite.
     * @param {TestPlanInterfaces.SuiteEntryTypes} suiteEntryType
     */
    getSuiteEntries(project, suiteId, suiteEntryType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    suiteId: suiteId
                };
                let queryValues = {
                    suiteEntryType: suiteEntryType,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "d6733edf-72f1-4252-925b-c560dfe9b75a", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.SuiteEntry, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Reorder test suite entries in the test suite.
     *
     * @param {TestPlanInterfaces.SuiteEntryUpdateParams[]} suiteEntries - List of SuiteEntry to reorder.
     * @param {string} project - Project ID or project name
     * @param {number} suiteId - Id of the parent test suite.
     */
    reorderSuiteEntries(suiteEntries, project, suiteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    suiteId: suiteId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "d6733edf-72f1-4252-925b-c560dfe9b75a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, suiteEntries, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.SuiteEntry, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create bulk requirement based test suites.
     *
     * @param {TestPlanInterfaces.TestSuiteCreateParams[]} testSuiteCreateParams - Parameters for suite creation
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan where requirement based suites need to be created.
     * @param {number} parentSuiteId - ID of the parent suite under which requirement based suites will be created
     */
    createBulkTestSuites(testSuiteCreateParams, project, planId, parentSuiteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    parentSuiteId: parentSuiteId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "1e58fbe6-1761-43ce-97f6-5492ec9d438e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testSuiteCreateParams, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestSuite, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create test suite.
     *
     * @param {TestPlanInterfaces.TestSuiteCreateParams} testSuiteCreateParams - Parameters for suite creation
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     */
    createTestSuite(testSuiteCreateParams, project, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "1046d5d3-ab61-4ca7-a65a-36118a978256", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testSuiteCreateParams, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestSuite, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete test suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the test suite to delete.
     */
    deleteTestSuite(project, planId, suiteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "1046d5d3-ab61-4ca7-a65a-36118a978256", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get test suite by suite id.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the suite to get.
     * @param {TestPlanInterfaces.SuiteExpand} expand - Include the children suites and testers details
     */
    getTestSuiteById(project, planId, suiteId, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    expand: expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "1046d5d3-ab61-4ca7-a65a-36118a978256", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestSuite, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get test suites for plan.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan for which suites are requested.
     * @param {TestPlanInterfaces.SuiteExpand} expand - Include the children suites and testers details.
     * @param {string} continuationToken - If the list of suites returned is not complete, a continuation token to query next batch of suites is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test suites.
     * @param {boolean} asTreeView - If the suites returned should be in a tree structure.
     */
    getTestSuitesForPlan(project, planId, expand, continuationToken, asTreeView) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId
                };
                let queryValues = {
                    expand: expand,
                    continuationToken: continuationToken,
                    asTreeView: asTreeView,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "1046d5d3-ab61-4ca7-a65a-36118a978256", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestSuite, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update test suite.
     *
     * @param {TestPlanInterfaces.TestSuiteUpdateParams} testSuiteUpdateParams - Parameters for suite updation
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the parent suite.
     */
    updateTestSuite(testSuiteUpdateParams, project, planId, suiteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "1046d5d3-ab61-4ca7-a65a-36118a978256", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testSuiteUpdateParams, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestSuite, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Find the list of all test suites in which a given test case is present. This is helpful if you need to find out which test suites are using a test case, when you need to make changes to a test case.
     *
     * @param {number} testCaseId - ID of the test case for which suites need to be fetched.
     */
    getSuitesByTestCaseId(testCaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testCaseId == null) {
                throw new TypeError('testCaseId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    testCaseId: testCaseId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "a4080e84-f17b-4fad-84f1-7960b6525bf2", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestSuite, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Add test cases to a suite with specified configurations
     *
     * @param {TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[]} suiteTestCaseCreateUpdateParameters - SuiteTestCaseCreateUpdateParameters object.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to which test cases are to be added.
     * @param {number} suiteId - ID of the test suite to which test cases are to be added.
     */
    addTestCasesToSuite(suiteTestCaseCreateUpdateParameters, project, planId, suiteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testplan", "a9bd61ac-45cf-4d13-9441-43dcd01edf8d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, suiteTestCaseCreateUpdateParameters, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestCase, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestCase(project, planId, suiteId, testCaseId, witFields, returnIdentityRef) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId,
                    testCaseId: testCaseId
                };
                let queryValues = {
                    witFields: witFields,
                    returnIdentityRef: returnIdentityRef,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testplan", "a9bd61ac-45cf-4d13-9441-43dcd01edf8d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestCase, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestCaseList(project, planId, suiteId, testIds, configurationIds, witFields, continuationToken, returnIdentityRef, expand, excludeFlags, isRecursive) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    testIds: testIds,
                    configurationIds: configurationIds,
                    witFields: witFields,
                    continuationToken: continuationToken,
                    returnIdentityRef: returnIdentityRef,
                    expand: expand,
                    excludeFlags: excludeFlags,
                    isRecursive: isRecursive,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testplan", "a9bd61ac-45cf-4d13-9441-43dcd01edf8d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestCase, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes test cases from a suite based on the list of test case Ids provided.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan from which test cases are to be removed.
     * @param {number} suiteId - ID of the test suite from which test cases are to be removed.
     * @param {string} testCaseIds - Test Case Ids to be removed.
     */
    removeTestCasesFromSuite(project, planId, suiteId, testCaseIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testCaseIds == null) {
                throw new TypeError('testCaseIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    testCaseIds: testCaseIds,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testplan", "a9bd61ac-45cf-4d13-9441-43dcd01edf8d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes test cases from a suite based on the list of test case Ids provided. This API can be used to remove a larger number of test cases.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan from which test cases are to be removed.
     * @param {number} suiteId - ID of the test suite from which test cases are to be removed.
     * @param {string} testIds - Comma separated string of Test Case Ids to be removed.
     */
    removeTestCasesListFromSuite(project, planId, suiteId, testIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testIds == null) {
                throw new TypeError('testIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    testIds: testIds,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testplan", "a9bd61ac-45cf-4d13-9441-43dcd01edf8d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update the configurations for test cases
     *
     * @param {TestPlanInterfaces.SuiteTestCaseCreateUpdateParameters[]} suiteTestCaseCreateUpdateParameters - A SuiteTestCaseCreateUpdateParameters object.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan to which test cases are to be updated.
     * @param {number} suiteId - ID of the test suite to which test cases are to be updated.
     */
    updateSuiteTestCases(suiteTestCaseCreateUpdateParameters, project, planId, suiteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testplan", "a9bd61ac-45cf-4d13-9441-43dcd01edf8d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, suiteTestCaseCreateUpdateParameters, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestCase, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestPlanInterfaces.CloneTestCaseParams} cloneRequestBody
     * @param {string} project - Project ID or project name
     */
    cloneTestCase(cloneRequestBody, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "529b2b8d-82f4-4893-b1e4-1e74ea534673", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, cloneRequestBody, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.CloneTestCaseOperationInformation, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get clone information.
     *
     * @param {string} project - Project ID or project name
     * @param {number} cloneOperationId - Operation ID returned when we queue a clone operation
     */
    getTestCaseCloneInformation(project, cloneOperationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    cloneOperationId: cloneOperationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "529b2b8d-82f4-4893-b1e4-1e74ea534673", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.CloneTestCaseOperationInformation, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Exports a set of test cases from a suite to a file. Currently supported  formats: xlsx
     *
     * @param {TestPlanInterfaces.ExportTestCaseParams} exportTestCaseRequestBody - A ExportTestCaseParams object.ExportTestCaseParams
     * @param {string} project - Project ID or project name
     */
    exportTestCases(exportTestCaseRequestBody, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "3b9d1c87-6b1a-4e7d-9e7d-1a8e543112bb", routeValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a test case.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testCaseId - Id of test case to be deleted.
     */
    deleteTestCase(project, testCaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testCaseId: testCaseId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "29006fb5-816b-4ff7-a329-599943569229", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Clone test plan
     *
     * @param {TestPlanInterfaces.CloneTestPlanParams} cloneRequestBody - Plan Clone Request Body detail TestPlanCloneRequest
     * @param {string} project - Project ID or project name
     * @param {boolean} deepClone - Clones all the associated test cases as well
     */
    cloneTestPlan(cloneRequestBody, project, deepClone) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    deepClone: deepClone,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "e65df662-d8a3-46c7-ae1c-14e2d4df57e1", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, cloneRequestBody, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.CloneTestPlanOperationInformation, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get clone information.
     *
     * @param {string} project - Project ID or project name
     * @param {number} cloneOperationId - Operation ID returned when we queue a clone operation
     */
    getCloneInformation(project, cloneOperationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    cloneOperationId: cloneOperationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "e65df662-d8a3-46c7-ae1c-14e2d4df57e1", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.CloneTestPlanOperationInformation, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getPoints(project, planId, suiteId, pointId, returnIdentityRef, includePointDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pointId == null) {
                throw new TypeError('pointId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    pointId: pointId,
                    returnIdentityRef: returnIdentityRef,
                    includePointDetails: includePointDetails,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "52df686e-bae4-4334-b0ee-b6cf4e6f6b73", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestPoint, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getPointsList(project, planId, suiteId, testPointIds, testCaseId, continuationToken, returnIdentityRef, includePointDetails, isRecursive) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    testPointIds: testPointIds,
                    testCaseId: testCaseId,
                    continuationToken: continuationToken,
                    returnIdentityRef: returnIdentityRef,
                    includePointDetails: includePointDetails,
                    isRecursive: isRecursive,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "52df686e-bae4-4334-b0ee-b6cf4e6f6b73", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestPoint, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    updateTestPoints(testPointUpdateParams, project, planId, suiteId, includePointDetails, returnIdentityRef) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    includePointDetails: includePointDetails,
                    returnIdentityRef: returnIdentityRef,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "52df686e-bae4-4334-b0ee-b6cf4e6f6b73", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testPointUpdateParams, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestPoint, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Clone test suite
     *
     * @param {TestPlanInterfaces.CloneTestSuiteParams} cloneRequestBody - Suite Clone Request Body detail TestSuiteCloneRequest
     * @param {string} project - Project ID or project name
     * @param {boolean} deepClone - Clones all the associated test cases as well
     */
    cloneTestSuite(cloneRequestBody, project, deepClone) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    deepClone: deepClone,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "181d4c97-0e98-4ee2-ad6a-4cada675e555", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, cloneRequestBody, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.CloneTestSuiteOperationInformation, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get clone information.
     *
     * @param {string} project - Project ID or project name
     * @param {number} cloneOperationId - Operation ID returned when we queue a clone operation
     */
    getSuiteCloneInformation(project, cloneOperationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    cloneOperationId: cloneOperationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testplan", "181d4c97-0e98-4ee2-ad6a-4cada675e555", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.CloneTestSuiteOperationInformation, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create a test variable.
     *
     * @param {TestPlanInterfaces.TestVariableCreateUpdateParameters} testVariableCreateUpdateParameters - TestVariableCreateUpdateParameters
     * @param {string} project - Project ID or project name
     */
    createTestVariable(testVariableCreateUpdateParameters, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "2c61fac6-ac4e-45a5-8c38-1c2b8fd8ea6c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testVariableCreateUpdateParameters, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestVariable, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a test variable by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testVariableId - ID of the test variable to delete.
     */
    deleteTestVariable(project, testVariableId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testVariableId: testVariableId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "2c61fac6-ac4e-45a5-8c38-1c2b8fd8ea6c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a test variable by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testVariableId - ID of the test variable to get.
     */
    getTestVariableById(project, testVariableId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testVariableId: testVariableId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "2c61fac6-ac4e-45a5-8c38-1c2b8fd8ea6c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestVariable, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of test variables.
     *
     * @param {string} project - Project ID or project name
     * @param {string} continuationToken - If the list of variables returned is not complete, a continuation token to query next batch of variables is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of test variables.
     */
    getTestVariables(project, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "2c61fac6-ac4e-45a5-8c38-1c2b8fd8ea6c", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestVariable, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a test variable by its ID.
     *
     * @param {TestPlanInterfaces.TestVariableCreateUpdateParameters} testVariableCreateUpdateParameters - TestVariableCreateUpdateParameters
     * @param {string} project - Project ID or project name
     * @param {number} testVariableId - ID of the test variable to update.
     */
    updateTestVariable(testVariableCreateUpdateParameters, project, testVariableId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testVariableId: testVariableId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testplan", "2c61fac6-ac4e-45a5-8c38-1c2b8fd8ea6c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testVariableCreateUpdateParameters, options);
                    let ret = this.formatResponse(res.result, TestPlanInterfaces.TypeInfo.TestVariable, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
}
exports.TestPlanApi = TestPlanApi;
