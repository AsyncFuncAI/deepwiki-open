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
const TestInterfaces = require("./interfaces/TestInterfaces");
class TestApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-Test-api', options);
    }
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
    createTestIterationResultAttachment(attachmentRequestModel, project, runId, testCaseResultId, iterationId, actionPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (iterationId == null) {
                throw new TypeError('iterationId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                let queryValues = {
                    iterationId: iterationId,
                    actionPath: actionPath,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, attachmentRequestModel, options);
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
     * Attach a file to a test result.
     *
     * @param {TestInterfaces.TestAttachmentRequestModel} attachmentRequestModel - Attachment details TestAttachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result against which attachment has to be uploaded.
     */
    createTestResultAttachment(attachmentRequestModel, project, runId, testCaseResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, attachmentRequestModel, options);
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
     * Attach a file to a test result
     *
     * @param {TestInterfaces.TestAttachmentRequestModel} attachmentRequestModel - Attachment Request Model.
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} testSubResultId - ID of the test sub results against which attachment has to be uploaded.
     */
    createTestSubResultAttachment(attachmentRequestModel, project, runId, testCaseResultId, testSubResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testSubResultId == null) {
                throw new TypeError('testSubResultId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                let queryValues = {
                    testSubResultId: testSubResultId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, attachmentRequestModel, options);
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
     * Download a test result attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the testCaseResultId.
     * @param {number} testCaseResultId - ID of the test result whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded.
     */
    getTestResultAttachmentContent(project, runId, testCaseResultId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    attachmentId: attachmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues);
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
     * Get list of test result attachments reference.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result.
     */
    getTestResultAttachments(project, runId, testCaseResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Download a test result attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the testCaseResultId.
     * @param {number} testCaseResultId - ID of the test result whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded.
     */
    getTestResultAttachmentZip(project, runId, testCaseResultId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    attachmentId: attachmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/zip", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Download a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded
     * @param {number} testSubResultId - ID of the test sub result whose attachment has to be downloaded
     */
    getTestSubResultAttachmentContent(project, runId, testCaseResultId, attachmentId, testSubResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testSubResultId == null) {
                throw new TypeError('testSubResultId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    attachmentId: attachmentId
                };
                let queryValues = {
                    testSubResultId: testSubResultId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues, queryValues);
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
     * Get list of test sub result attachments
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} testSubResultId - ID of the test sub result whose attachment has to be downloaded
     */
    getTestSubResultAttachments(project, runId, testCaseResultId, testSubResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testSubResultId == null) {
                throw new TypeError('testSubResultId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                let queryValues = {
                    testSubResultId: testSubResultId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Download a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test results that contains sub result.
     * @param {number} attachmentId - ID of the test result attachment to be downloaded
     * @param {number} testSubResultId - ID of the test sub result whose attachment has to be downloaded
     */
    getTestSubResultAttachmentZip(project, runId, testCaseResultId, attachmentId, testSubResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testSubResultId == null) {
                throw new TypeError('testSubResultId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    attachmentId: attachmentId
                };
                let queryValues = {
                    testSubResultId: testSubResultId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "2bffebe9-2f0f-4639-9af8-56129e9fed2d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/zip", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Attach a file to a test run.
     *
     * @param {TestInterfaces.TestAttachmentRequestModel} attachmentRequestModel - Attachment details TestAttachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run against which attachment has to be uploaded.
     */
    createTestRunAttachment(attachmentRequestModel, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "4f004af4-a507-489c-9b13-cb62060beb11", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, attachmentRequestModel, options);
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
     * Download a test run attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test run attachment to be downloaded.
     */
    getTestRunAttachmentContent(project, runId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    attachmentId: attachmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "4f004af4-a507-489c-9b13-cb62060beb11", routeValues);
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
     * Get list of test run attachments reference.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run.
     */
    getTestRunAttachments(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "4f004af4-a507-489c-9b13-cb62060beb11", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Download a test run attachment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run whose attachment has to be downloaded.
     * @param {number} attachmentId - ID of the test run attachment to be downloaded.
     */
    getTestRunAttachmentZip(project, runId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    attachmentId: attachmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "4f004af4-a507-489c-9b13-cb62060beb11", routeValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/zip", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     */
    getBugsLinkedToTestResult(project, runId, testCaseResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "6de20ca2-67de-4faf-97fa-38c5d585eb00", routeValues);
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
     * Get code coverage data for a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - ID of the build for which code coverage data needs to be fetched.
     * @param {number} flags - Value of flags determine the level of code coverage details to be fetched. Flags are additive. Expected Values are 1 for Modules, 2 for Functions, 4 for BlockData.
     */
    getBuildCodeCoverage(project, buildId, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            if (flags == null) {
                throw new TypeError('flags can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    flags: flags,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "77560e8a-4e8c-4d59-894e-a5f264c24444", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.BuildCoverage, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get Code Coverage Summary for Build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - ID of the build for which code coverage data needs to be fetched.
     * @param {number} deltaBuildId - Delta Build id (optional)
     */
    getCodeCoverageSummary(project, buildId, deltaBuildId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    deltaBuildId: deltaBuildId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "77560e8a-4e8c-4d59-894e-a5f264c24444", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.CodeCoverageSummary, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * http://(tfsserver):8080/tfs/DefaultCollection/_apis/test/CodeCoverage?buildId=10 Request: Json of code coverage summary
     *
     * @param {TestInterfaces.CodeCoverageData} coverageData
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     */
    updateCodeCoverageSummary(coverageData, project, buildId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "77560e8a-4e8c-4d59-894e-a5f264c24444", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, coverageData, options);
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
     * Get code coverage data for a test run
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run for which code coverage data needs to be fetched.
     * @param {number} flags - Value of flags determine the level of code coverage details to be fetched. Flags are additive. Expected Values are 1 for Modules, 2 for Functions, 4 for BlockData.
     */
    getTestRunCodeCoverage(project, runId, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            if (flags == null) {
                throw new TypeError('flags can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    flags: flags,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "9629116f-3b89-4ed8-b358-d4694efda160", routeValues, queryValues);
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
     * @param {TestInterfaces.CustomTestFieldDefinition[]} newFields
     * @param {string} project - Project ID or project name
     */
    addCustomFields(newFields, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "8ce1923b-f4c7-4e22-b93b-f6284e525ec2", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, newFields, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.CustomTestFieldDefinition, true);
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
     * @param {TestInterfaces.CustomTestFieldScope} scopeFilter
     */
    queryCustomFields(project, scopeFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (scopeFilter == null) {
                throw new TypeError('scopeFilter can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    scopeFilter: scopeFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "8ce1923b-f4c7-4e22-b93b-f6284e525ec2", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.CustomTestFieldDefinition, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.ResultsFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryTestResultHistory(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "234616f5-429c-4e7b-9192-affd76731dfd", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestResultHistory, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get iteration for a result
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result that contains the iterations.
     * @param {number} iterationId - Id of the test results Iteration.
     * @param {boolean} includeActionResults - Include result details for each action performed in the test iteration. ActionResults refer to outcome (pass/fail) of test steps that are executed as part of a running a manual test. Including the ActionResults flag gets the outcome of test steps in the actionResults section and test parameters in the parameters section for each test iteration.
     */
    getTestIteration(project, runId, testCaseResultId, iterationId, includeActionResults) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    iterationId: iterationId
                };
                let queryValues = {
                    includeActionResults: includeActionResults,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "73eb9074-3446-4c44-8296-2f811950ff8d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestIterationDetailsModel, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get iterations for a result
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the test run that contains the result.
     * @param {number} testCaseResultId - ID of the test result that contains the iterations.
     * @param {boolean} includeActionResults - Include result details for each action performed in the test iteration. ActionResults refer to outcome (pass/fail) of test steps that are executed as part of a running a manual test. Including the ActionResults flag gets the outcome of test steps in the actionResults section and test parameters in the parameters section for each test iteration.
     */
    getTestIterations(project, runId, testCaseResultId, includeActionResults) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                let queryValues = {
                    includeActionResults: includeActionResults,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "73eb9074-3446-4c44-8296-2f811950ff8d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestIterationDetailsModel, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.LinkedWorkItemsQuery} workItemQuery
     * @param {string} project - Project ID or project name
     */
    getLinkedWorkItemsByQuery(workItemQuery, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "a4dcb25b-9878-49ea-abfd-e440bd9b1dcd", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, workItemQuery, options);
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
     * Get test run message logs
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunLogs(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "a1e55200-637e-42e9-a7c0-7e5bfdedb1b3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestMessageLogDetails, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a test point.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan.
     * @param {number} suiteId - ID of the suite that contains the point.
     * @param {number} pointIds - ID of the test point to get.
     * @param {string} witFields - Comma-separated list of work item field names.
     */
    getPoint(project, planId, suiteId, pointIds, witFields) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId,
                    pointIds: pointIds
                };
                let queryValues = {
                    witFields: witFields,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "3bcfd5c8-be62-488e-b1da-b8289ce9299c", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestPoint, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getPoints(project, planId, suiteId, witFields, configurationId, testCaseId, testPointIds, includePointDetails, skip, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                let queryValues = {
                    witFields: witFields,
                    configurationId: configurationId,
                    testCaseId: testCaseId,
                    testPointIds: testPointIds,
                    includePointDetails: includePointDetails,
                    '$skip': skip,
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "3bcfd5c8-be62-488e-b1da-b8289ce9299c", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestPoint, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update test points.
     *
     * @param {TestInterfaces.PointUpdateModel} pointUpdateModel - Data to update.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan.
     * @param {number} suiteId - ID of the suite that contains the points.
     * @param {string} pointIds - ID of the test point to get. Use a comma-separated list of IDs to update multiple test points.
     */
    updateTestPoints(pointUpdateModel, project, planId, suiteId, pointIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    planId: planId,
                    suiteId: suiteId,
                    pointIds: pointIds
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "3bcfd5c8-be62-488e-b1da-b8289ce9299c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, pointUpdateModel, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestPoint, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get test points using query.
     *
     * @param {TestInterfaces.TestPointsQuery} query - TestPointsQuery to get test points.
     * @param {string} project - Project ID or project name
     * @param {number} skip - Number of test points to skip..
     * @param {number} top - Number of test points to return.
     */
    getPointsByQuery(query, project, skip, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    '$skip': skip,
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "b4264fd0-a5d1-43e2-82a5-b9c46b7da9ce", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, query, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestPointsQuery, false);
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
     * @param {number} buildId
     * @param {string} publishContext
     * @param {string} groupBy
     * @param {string} filter
     * @param {string} orderby
     * @param {boolean} shouldIncludeResults
     * @param {boolean} queryRunSummaryForInProgress
     */
    getTestResultDetailsForBuild(project, buildId, publishContext, groupBy, filter, orderby, shouldIncludeResults, queryRunSummaryForInProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    publishContext: publishContext,
                    groupBy: groupBy,
                    '$filter': filter,
                    '$orderby': orderby,
                    shouldIncludeResults: shouldIncludeResults,
                    queryRunSummaryForInProgress: queryRunSummaryForInProgress,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "efb387b0-10d5-42e7-be40-95e06ee9430f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestResultsDetails, false);
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
     * @param {number} releaseId
     * @param {number} releaseEnvId
     * @param {string} publishContext
     * @param {string} groupBy
     * @param {string} filter
     * @param {string} orderby
     * @param {boolean} shouldIncludeResults
     * @param {boolean} queryRunSummaryForInProgress
     */
    getTestResultDetailsForRelease(project, releaseId, releaseEnvId, publishContext, groupBy, filter, orderby, shouldIncludeResults, queryRunSummaryForInProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (releaseId == null) {
                throw new TypeError('releaseId can not be null or undefined');
            }
            if (releaseEnvId == null) {
                throw new TypeError('releaseEnvId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    releaseId: releaseId,
                    releaseEnvId: releaseEnvId,
                    publishContext: publishContext,
                    groupBy: groupBy,
                    '$filter': filter,
                    '$orderby': orderby,
                    shouldIncludeResults: shouldIncludeResults,
                    queryRunSummaryForInProgress: queryRunSummaryForInProgress,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "b834ec7e-35bb-450f-a3c8-802e70ca40dd", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestResultsDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.TestResultDocument} document
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    publishTestResultDocument(document, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "370ca04b-8eec-4ca8-8ba3-d24dca228791", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, document, options);
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
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {string[]} fields
     * @param {string} continuationToken
     */
    getResultGroupsByBuild(project, buildId, publishContext, fields, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            if (publishContext == null) {
                throw new TypeError('publishContext can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    publishContext: publishContext,
                    fields: fields && fields.join(","),
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "d279d052-c55a-4204-b913-42f733b52958", routeValues, queryValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {string} publishContext
     * @param {number} releaseEnvId
     * @param {string[]} fields
     * @param {string} continuationToken
     */
    getResultGroupsByRelease(project, releaseId, publishContext, releaseEnvId, fields, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (releaseId == null) {
                throw new TypeError('releaseId can not be null or undefined');
            }
            if (publishContext == null) {
                throw new TypeError('publishContext can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    releaseId: releaseId,
                    publishContext: publishContext,
                    releaseEnvId: releaseEnvId,
                    fields: fields && fields.join(","),
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "ef5ce5d4-a4e5-47ee-804c-354518f8d03f", routeValues, queryValues);
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
     * Get list of test Result meta data details for corresponding testcasereferenceId
     *
     * @param {string[]} testReferenceIds - TestCaseReference Ids of the test Result to be queried, comma separated list of valid ids (limit no. of ids 200).
     * @param {string} project - Project ID or project name
     */
    queryTestResultsMetaData(testReferenceIds, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "afa7830e-67a7-4336-8090-2b448ca80295", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testReferenceIds, options);
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
     * Get test result retention settings
     *
     * @param {string} project - Project ID or project name
     */
    getResultRetentionSettings(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "a3206d9e-fa8d-42d3-88cb-f75c51e69cde", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.ResultRetentionSettings, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update test result retention settings
     *
     * @param {TestInterfaces.ResultRetentionSettings} retentionSettings - Test result retention settings details to be updated
     * @param {string} project - Project ID or project name
     */
    updateResultRetentionSettings(retentionSettings, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "a3206d9e-fa8d-42d3-88cb-f75c51e69cde", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, retentionSettings, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.ResultRetentionSettings, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Add test results to a test run.
     *
     * @param {TestInterfaces.TestCaseResult[]} results - List of test results to add.
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test run ID into which test results to add.
     */
    addTestResultsToTestRun(results, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.6", "Test", "4637d869-3a76-4468-8057-0bb02aa385cf", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, results, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestCaseResult, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a test result for a test run.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test run ID of a test result to fetch.
     * @param {number} testCaseResultId - Test result ID.
     * @param {TestInterfaces.ResultDetails} detailsToInclude - Details to include with test results. Default is None. Other values are Iterations, WorkItems and SubResults.
     */
    getTestResultById(project, runId, testCaseResultId, detailsToInclude) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                let queryValues = {
                    detailsToInclude: detailsToInclude,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.6", "Test", "4637d869-3a76-4468-8057-0bb02aa385cf", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestCaseResult, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestResults(project, runId, detailsToInclude, skip, top, outcomes) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    detailsToInclude: detailsToInclude,
                    '$skip': skip,
                    '$top': top,
                    outcomes: outcomes && outcomes.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.6", "Test", "4637d869-3a76-4468-8057-0bb02aa385cf", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestCaseResult, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update test results in a test run.
     *
     * @param {TestInterfaces.TestCaseResult[]} results - List of test results to update.
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test run ID whose test results to update.
     */
    updateTestResults(results, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.6", "Test", "4637d869-3a76-4468-8057-0bb02aa385cf", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, results, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestCaseResult, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * This API will return results by Ids with fields specified/trend for particular automated test method. We are still improving this API and have not finalized proper signature and contract.
     *
     * @param {TestInterfaces.TestResultsQuery} query
     * @param {string} project - Project ID or project name
     */
    getTestResultsByQuery(query, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.6", "Test", "6711da49-8e6f-4d35-9f73-cef7a3c81a5b", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, query, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestResultsQuery, false);
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
     * @param {number} buildId
     * @param {string} publishContext
     * @param {TestInterfaces.TestOutcome[]} outcomes
     * @param {number} top
     * @param {string} continuationToken
     */
    getTestResultsByBuild(project, buildId, publishContext, outcomes, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    publishContext: publishContext,
                    outcomes: outcomes && outcomes.join(","),
                    '$top': top,
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "3c191b88-615b-4be2-b7d9-5ff9141e91d4", routeValues, queryValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} releaseId
     * @param {number} releaseEnvid
     * @param {string} publishContext
     * @param {TestInterfaces.TestOutcome[]} outcomes
     * @param {number} top
     * @param {string} continuationToken
     */
    getTestResultsByRelease(project, releaseId, releaseEnvid, publishContext, outcomes, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (releaseId == null) {
                throw new TypeError('releaseId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    releaseId: releaseId,
                    releaseEnvid: releaseEnvid,
                    publishContext: publishContext,
                    outcomes: outcomes && outcomes.join(","),
                    '$top': top,
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "ce01820b-83f3-4c15-a583-697a43292c4e", routeValues, queryValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {string} publishContext
     * @param {boolean} includeFailureDetails
     * @param {TestInterfaces.BuildReference} buildToCompare
     */
    queryTestResultsReportForBuild(project, buildId, publishContext, includeFailureDetails, buildToCompare) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    publishContext: publishContext,
                    includeFailureDetails: includeFailureDetails,
                    buildToCompare: buildToCompare,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "000ef77b-fea2-498d-a10d-ad1a037f559f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestResultSummary, false);
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
     * @param {number} releaseId
     * @param {number} releaseEnvId
     * @param {string} publishContext
     * @param {boolean} includeFailureDetails
     * @param {TestInterfaces.ReleaseReference} releaseToCompare
     */
    queryTestResultsReportForRelease(project, releaseId, releaseEnvId, publishContext, includeFailureDetails, releaseToCompare) {
        return __awaiter(this, void 0, void 0, function* () {
            if (releaseId == null) {
                throw new TypeError('releaseId can not be null or undefined');
            }
            if (releaseEnvId == null) {
                throw new TypeError('releaseEnvId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    releaseId: releaseId,
                    releaseEnvId: releaseEnvId,
                    publishContext: publishContext,
                    includeFailureDetails: includeFailureDetails,
                    releaseToCompare: releaseToCompare,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "85765790-ac68-494e-b268-af36c3929744", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestResultSummary, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.ReleaseReference[]} releases
     * @param {string} project - Project ID or project name
     */
    queryTestResultsSummaryForReleases(releases, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "85765790-ac68-494e-b268-af36c3929744", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, releases, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestResultSummary, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.TestResultsContext} resultsContext
     * @param {string} project - Project ID or project name
     * @param {number[]} workItemIds
     */
    queryTestSummaryByRequirement(resultsContext, project, workItemIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    workItemIds: workItemIds && workItemIds.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "cd08294e-308d-4460-a46e-4cfdefba0b4b", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, resultsContext, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestSummaryForWorkItem, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForBuild(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "fbc82a85-0786-4442-88bb-eb0fda6b01b0", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.AggregatedDataForResultTrend, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForRelease(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "dd178e93-d8dd-4887-9635-d6b9560b7b6e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.AggregatedDataForResultTrend, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get test run statistics , used when we want to get summary of a run by outcome.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunStatistics(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "0a42c424-d764-4a16-a2d5-5c85f87d0ae8", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestRunStatistic, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create new test run.
     *
     * @param {TestInterfaces.RunCreateModel} testRun - Run details RunCreateModel
     * @param {string} project - Project ID or project name
     */
    createTestRun(testRun, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "cadb3810-d47d-4a3c-a234-fe5f3be50138", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testRun, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestRun, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a test run by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to delete.
     */
    deleteTestRun(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "cadb3810-d47d-4a3c-a234-fe5f3be50138", routeValues);
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
     * Get a test run by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     * @param {boolean} includeDetails - Default value is true. It includes details like run statistics, release, build, test environment, post process state, and more.
     */
    getTestRunById(project, runId, includeDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    includeDetails: includeDetails,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "cadb3810-d47d-4a3c-a234-fe5f3be50138", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestRun, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestRuns(project, buildUri, owner, tmiRunId, planId, includeRunDetails, automated, skip, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildUri: buildUri,
                    owner: owner,
                    tmiRunId: tmiRunId,
                    planId: planId,
                    includeRunDetails: includeRunDetails,
                    automated: automated,
                    '$skip': skip,
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "cadb3810-d47d-4a3c-a234-fe5f3be50138", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestRun, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    queryTestRuns(project, minLastUpdatedDate, maxLastUpdatedDate, state, planIds, isAutomated, publishContext, buildIds, buildDefIds, branchName, releaseIds, releaseDefIds, releaseEnvIds, releaseEnvDefIds, runTitle, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (minLastUpdatedDate == null) {
                throw new TypeError('minLastUpdatedDate can not be null or undefined');
            }
            if (maxLastUpdatedDate == null) {
                throw new TypeError('maxLastUpdatedDate can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    minLastUpdatedDate: minLastUpdatedDate,
                    maxLastUpdatedDate: maxLastUpdatedDate,
                    state: state,
                    planIds: planIds && planIds.join(","),
                    isAutomated: isAutomated,
                    publishContext: publishContext,
                    buildIds: buildIds && buildIds.join(","),
                    buildDefIds: buildDefIds && buildDefIds.join(","),
                    branchName: branchName,
                    releaseIds: releaseIds && releaseIds.join(","),
                    releaseDefIds: releaseDefIds && releaseDefIds.join(","),
                    releaseEnvIds: releaseEnvIds && releaseEnvIds.join(","),
                    releaseEnvDefIds: releaseEnvDefIds && releaseEnvDefIds.join(","),
                    runTitle: runTitle,
                    '$top': top,
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "cadb3810-d47d-4a3c-a234-fe5f3be50138", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestRun, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update test run by its ID.
     *
     * @param {TestInterfaces.RunUpdateModel} runUpdateModel - Run details RunUpdateModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to update.
     */
    updateTestRun(runUpdateModel, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "cadb3810-d47d-4a3c-a234-fe5f3be50138", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, runUpdateModel, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestRun, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create a test session
     *
     * @param {TestInterfaces.TestSession} testSession - Test session details for creation
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    createTestSession(testSession, teamContext) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let project = null;
                let team = null;
                if (teamContext) {
                    project = teamContext.projectId || teamContext.project;
                    team = teamContext.teamId || teamContext.team;
                }
                let routeValues = {
                    project: project,
                    team: team
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "1500b4b4-6c69-4ca6-9b18-35e9e97fe2ac", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testSession, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestSession, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestSessions(teamContext, period, allSessions, includeAllProperties, source, includeOnlyCompletedSessions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let project = null;
                let team = null;
                if (teamContext) {
                    project = teamContext.projectId || teamContext.project;
                    team = teamContext.teamId || teamContext.team;
                }
                let routeValues = {
                    project: project,
                    team: team
                };
                let queryValues = {
                    period: period,
                    allSessions: allSessions,
                    includeAllProperties: includeAllProperties,
                    source: source,
                    includeOnlyCompletedSessions: includeOnlyCompletedSessions,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "1500b4b4-6c69-4ca6-9b18-35e9e97fe2ac", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestSession, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a test session
     *
     * @param {TestInterfaces.TestSession} testSession - Test session details for update
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateTestSession(testSession, teamContext) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let project = null;
                let team = null;
                if (teamContext) {
                    project = teamContext.projectId || teamContext.project;
                    team = teamContext.teamId || teamContext.team;
                }
                let routeValues = {
                    project: project,
                    team: team
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "1500b4b4-6c69-4ca6-9b18-35e9e97fe2ac", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testSession, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestSession, false);
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
     * @param {number} sharedParameterId
     */
    deleteSharedParameter(project, sharedParameterId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    sharedParameterId: sharedParameterId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "8300eeca-0f8c-4eff-a089-d2dda409c41f", routeValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} sharedStepId
     */
    deleteSharedStep(project, sharedStepId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    sharedStepId: sharedStepId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "fabb3cc9-e3f8-40b7-8b62-24cc4b73fccf", routeValues);
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
     * Add test cases to suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the test suite to which the test cases must be added.
     * @param {string} testCaseIds - IDs of the test cases to add to the suite. Ids are specified in comma separated format.
     */
    addTestCasesToSuite(project, planId, suiteId, testCaseIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "TestCases",
                    project: project,
                    planId: planId,
                    suiteId: suiteId,
                    testCaseIds: testCaseIds
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "a4a1ec1c-b03f-41ca-8857-704594ecf58e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
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
     * Get a specific test case in a test suite with test case id.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the suite that contains the test case.
     * @param {number} testCaseIds - ID of the test case to get.
     */
    getTestCaseById(project, planId, suiteId, testCaseIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "TestCases",
                    project: project,
                    planId: planId,
                    suiteId: suiteId,
                    testCaseIds: testCaseIds
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "a4a1ec1c-b03f-41ca-8857-704594ecf58e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
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
     * Get all test cases in a suite.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suites.
     * @param {number} suiteId - ID of the suite to get.
     */
    getTestCases(project, planId, suiteId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "TestCases",
                    project: project,
                    planId: planId,
                    suiteId: suiteId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "a4a1ec1c-b03f-41ca-8857-704594ecf58e", routeValues);
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
     * The test points associated with the test cases are removed from the test suite. The test case work item is not deleted from the system. See test cases resource to delete a test case permanently.
     *
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the suite to get.
     * @param {string} testCaseIds - IDs of the test cases to remove from the suite.
     */
    removeTestCasesFromSuiteUrl(project, planId, suiteId, testCaseIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "TestCases",
                    project: project,
                    planId: planId,
                    suiteId: suiteId,
                    testCaseIds: testCaseIds
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "a4a1ec1c-b03f-41ca-8857-704594ecf58e", routeValues);
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
     * Updates the properties of the test case association in a suite.
     *
     * @param {TestInterfaces.SuiteTestCaseUpdateModel} suiteTestCaseUpdateModel - Model for updation of the properties of test case suite association.
     * @param {string} project - Project ID or project name
     * @param {number} planId - ID of the test plan that contains the suite.
     * @param {number} suiteId - ID of the test suite to which the test cases must be added.
     * @param {string} testCaseIds - IDs of the test cases to add to the suite. Ids are specified in comma separated format.
     */
    updateSuiteTestCases(suiteTestCaseUpdateModel, project, planId, suiteId, testCaseIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "TestCases",
                    project: project,
                    planId: planId,
                    suiteId: suiteId,
                    testCaseIds: testCaseIds
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "Test", "a4a1ec1c-b03f-41ca-8857-704594ecf58e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, suiteTestCaseUpdateModel, options);
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
     * Delete a test case.
     *
     * @param {string} project - Project ID or project name
     * @param {number} testCaseId - Id of test case to delete.
     */
    deleteTestCase(project, testCaseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testCaseId: testCaseId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "4d472e0f-e32c-4ef8-adf4-a4078772889c", routeValues);
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
     * Get history of a test method using TestHistoryQuery
     *
     * @param {TestInterfaces.TestHistoryQuery} filter - TestHistoryQuery to get history
     * @param {string} project - Project ID or project name
     */
    queryTestHistory(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Test", "929fd86c-3e38-4d8c-b4b6-90df256e5971", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.TestHistoryQuery, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TestInterfaces.TestSettings} testSettings
     * @param {string} project - Project ID or project name
     */
    createTestSettings(testSettings, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "8133ce14-962f-42af-a5f9-6aa9defcb9c8", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testSettings, options);
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
     * @param {string} project - Project ID or project name
     * @param {number} testSettingsId
     */
    deleteTestSettings(project, testSettingsId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testSettingsId: testSettingsId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "8133ce14-962f-42af-a5f9-6aa9defcb9c8", routeValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} testSettingsId
     */
    getTestSettingsById(project, testSettingsId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testSettingsId: testSettingsId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "8133ce14-962f-42af-a5f9-6aa9defcb9c8", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
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
     * @param {TestInterfaces.WorkItemToTestLinks} workItemToTestLinks
     * @param {string} project - Project ID or project name
     */
    addWorkItemToTestLinks(workItemToTestLinks, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "371b1655-ce05-412e-a113-64cc77bb78d2", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, workItemToTestLinks, options);
                    let ret = this.formatResponse(res.result, TestInterfaces.TypeInfo.WorkItemToTestLinks, false);
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
     * @param {string} testName
     * @param {number} workItemId
     */
    deleteTestMethodToWorkItemLink(project, testName, workItemId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testName == null) {
                throw new TypeError('testName can not be null or undefined');
            }
            if (workItemId == null) {
                throw new TypeError('workItemId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    testName: testName,
                    workItemId: workItemId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "7b0bdee3-a354-47f9-a42c-89018d7808d5", routeValues, queryValues);
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
     * @param {string} project - Project ID or project name
     * @param {string} testName
     */
    queryTestMethodLinkedWorkItems(project, testName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testName == null) {
                throw new TypeError('testName can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    testName: testName,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "7b0bdee3-a354-47f9-a42c-89018d7808d5", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
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
     * @param {string} project - Project ID or project name
     * @param {string} workItemCategory
     * @param {string} automatedTestName
     * @param {number} testCaseId
     * @param {Date} maxCompleteDate
     * @param {number} days
     * @param {number} workItemCount
     */
    queryTestResultWorkItems(project, workItemCategory, automatedTestName, testCaseId, maxCompleteDate, days, workItemCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (workItemCategory == null) {
                throw new TypeError('workItemCategory can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    workItemCategory: workItemCategory,
                    automatedTestName: automatedTestName,
                    testCaseId: testCaseId,
                    maxCompleteDate: maxCompleteDate,
                    days: days,
                    '$workItemCount': workItemCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Test", "926ff5dc-137f-45f0-bd51-9412fa9810ce", routeValues, queryValues);
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
}
TestApi.RESOURCE_AREA_ID = "c2aa639c-3ccc-4740-b3b6-ce2a1e1d984e";
exports.TestApi = TestApi;
