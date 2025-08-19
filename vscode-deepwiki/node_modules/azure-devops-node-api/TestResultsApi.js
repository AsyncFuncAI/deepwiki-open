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
const Contracts = require("./interfaces/TestInterfaces");
class TestResultsApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-testResults-api', options);
    }
    /**
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} iterationId
     * @param {string} actionPath
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues, queryValues);
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
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues);
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
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} testSubResultId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues, queryValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     */
    deleteTestResultAttachment(project, runId, testCaseResultId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    attachmentId: attachmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues);
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
     * Returns a test iteration attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} iterationId
     */
    getTestIterationAttachmentContent(project, runId, testCaseResultId, attachmentId, iterationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (iterationId == null) {
                throw new TypeError('iterationId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    attachmentId: attachmentId
                };
                let queryValues = {
                    iterationId: iterationId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues, queryValues);
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
     * Returns a test iteration attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} iterationId
     */
    getTestIterationAttachmentZip(project, runId, testCaseResultId, attachmentId, iterationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (iterationId == null) {
                throw new TypeError('iterationId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId,
                    attachmentId: attachmentId
                };
                let queryValues = {
                    iterationId: iterationId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues, queryValues);
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
     * Returns a test result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a test result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues);
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
     * Returns a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} testSubResultId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues, queryValues);
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
     * Returns attachment references for test sub result.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} testSubResultId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a test sub result attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} testCaseResultId
     * @param {number} attachmentId
     * @param {number} testSubResultId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "2a632e97-e014-4275-978f-8e5c4906d4b3", routeValues, queryValues);
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
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    createTestRunAttachment(attachmentRequestModel, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "b5731898-8206-477a-a51d-3fdf116fc6bf", routeValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} attachmentId
     */
    deleteTestRunAttachment(project, runId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    attachmentId: attachmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "b5731898-8206-477a-a51d-3fdf116fc6bf", routeValues);
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
     * Returns a test run attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} attachmentId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "b5731898-8206-477a-a51d-3fdf116fc6bf", routeValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    getTestRunAttachments(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "b5731898-8206-477a-a51d-3fdf116fc6bf", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a test run attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} attachmentId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "b5731898-8206-477a-a51d-3fdf116fc6bf", routeValues);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "d8dbf98f-eb34-4f8d-8365-47972af34f29", routeValues);
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
     */
    fetchSourceCodeCoverageReport(project, buildId) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "a459e10b-d703-4193-b3c1-60f2287918b3", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.SourceViewBuildCoverage, true);
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
     * @param {number} flags
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "9b3e1ece-c6ab-4fbb-8167-8a32a0c92216", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.BuildCoverage, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * http://(tfsserver):8080/tfs/DefaultCollection/_apis/test/CodeCoverage?buildId=10&deltaBuildId=9 Request: build id and delta build id (optional)
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {number} deltaBuildId
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "9b3e1ece-c6ab-4fbb-8167-8a32a0c92216", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.CodeCoverageSummary, false);
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
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     * @param {Contracts.CodeCoverageData} coverageData
     */
    updateCodeCoverageSummary(project, buildId, coverageData) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "9b3e1ece-c6ab-4fbb-8167-8a32a0c92216", routeValues, queryValues);
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
     * @param {string} project - Project ID or project name
     * @param {number} runId
     * @param {number} flags
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "5641efbc-6f9b-401a-baeb-d3da22489e5e", routeValues, queryValues);
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
     * Get file coverage for the specified file
     *
     * @param {Contracts.FileCoverageRequest} fileCoverageRequest - File details with pull request iteration context
     * @param {string} project - Project ID or project name
     */
    getFileLevelCodeCoverage(fileCoverageRequest, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "4a6d0c46-51ca-45aa-9163-249cee3289b7", routeValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("text/plain", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.ResultsFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryTestResultHistory(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "bdf7a97b-0395-4da8-9d5d-f957619327d1", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultHistory, false);
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
    getTestRunMessageLogs(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "e9ab0c6a-1984-418b-87c0-ee4202318ba3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestMessageLogDetails, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestPipelineMetrics(project, pipelineId, stageName, phaseName, jobName, metricNames, groupByNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pipelineId == null) {
                throw new TypeError('pipelineId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    pipelineId: pipelineId,
                    stageName: stageName,
                    phaseName: phaseName,
                    jobName: jobName,
                    metricNames: metricNames && metricNames.join(","),
                    groupByNode: groupByNode,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "65f35817-86a1-4131-b38b-3ec2d4744e53", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.PipelineTestMetrics, false);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "a518c749-4524-45b2-a7ef-1ac009b312cd", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultsDetails, false);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "19a8183a-69fb-47d7-bfbf-1b6b0d921294", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultsDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.TestResultDocument} document
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "74838649-b038-42f1-a0e7-6deb3973bf14", routeValues);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "e49244d1-c49f-49ad-a717-3bbaefe6a201", routeValues, queryValues);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "3c2b6bb0-0620-434a-a5c3-26aa0fcfda15", routeValues, queryValues);
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
     * @param {string[]} testCaseReferenceIds - TestCaseReference Ids of the test Result to be queried, comma separated list of valid ids (limit no. of ids 200).
     * @param {string} project - Project ID or project name
     * @param {Contracts.ResultMetaDataDetails} detailsToInclude - Details to include with test results metadata. Default is None. Other values are FlakyIdentifiers.
     */
    queryTestResultsMetaData(testCaseReferenceIds, project, detailsToInclude) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    detailsToInclude: detailsToInclude,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.4", "testresults", "b72ff4c0-4341-4213-ba27-f517cf341c95", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testCaseReferenceIds, options);
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
     * Update properties of test result meta data
     *
     * @param {Contracts.TestResultMetaDataUpdateInput} testResultMetaDataUpdateInput - TestResultMetaData update input TestResultMetaDataUpdateInput
     * @param {string} project - Project ID or project name
     * @param {number} testCaseReferenceId - TestCaseReference Id of Test Result to be updated.
     */
    updateTestResultsMetaData(testResultMetaDataUpdateInput, project, testCaseReferenceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    testCaseReferenceId: testCaseReferenceId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.4", "testresults", "b72ff4c0-4341-4213-ba27-f517cf341c95", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testResultMetaDataUpdateInput, options);
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
     * @param {Contracts.TestResultsQuery} query
     * @param {string} project - Project ID or project name
     */
    getTestResultsByQuery(query, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "14033a2c-af25-4af1-9e39-8ef6900482e3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, query, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultsQuery, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.QueryModel} queryModel
     * @param {string} project - Project ID or project name
     * @param {boolean} includeResultDetails
     * @param {boolean} includeIterationDetails
     * @param {number} skip
     * @param {number} top
     */
    getTestResultsByQueryWiql(queryModel, project, includeResultDetails, includeIterationDetails, skip, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    includeResultDetails: includeResultDetails,
                    includeIterationDetails: includeIterationDetails,
                    '$skip': skip,
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "5ea78be3-2f5a-4110-8034-c27f24c62db1", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, queryModel, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestCaseResult, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.TestCaseResult[]} results
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    addTestResultsToTestRun(results, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "02afa165-e79a-4d70-8f0c-2af0f35b4e07", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, results, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestCaseResult, true);
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
     * @param {number} runId
     * @param {number} testResultId
     * @param {Contracts.ResultDetails} detailsToInclude
     */
    getTestResultById(project, runId, testResultId, detailsToInclude) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testResultId: testResultId
                };
                let queryValues = {
                    detailsToInclude: detailsToInclude,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "02afa165-e79a-4d70-8f0c-2af0f35b4e07", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestCaseResult, false);
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
     * @param {number} runId
     * @param {Contracts.ResultDetails} detailsToInclude
     * @param {number} skip
     * @param {number} top
     * @param {Contracts.TestOutcome[]} outcomes
     * @param {boolean} newTestsOnly
     */
    getTestResults(project, runId, detailsToInclude, skip, top, outcomes, newTestsOnly) {
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
                    '$newTestsOnly': newTestsOnly,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "02afa165-e79a-4d70-8f0c-2af0f35b4e07", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestCaseResult, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.TestCaseResult[]} results
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    updateTestResults(results, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "02afa165-e79a-4d70-8f0c-2af0f35b4e07", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, results, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestCaseResult, true);
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
     * @param {Contracts.TestOutcome[]} outcomes
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "f48cc885-dbc4-4efc-ab19-ae8c19d1e02a", routeValues, queryValues);
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
    getTestResultsByPipeline(customHeaders, project, pipelineId, stageName, phaseName, jobName, outcomes, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pipelineId == null) {
                throw new TypeError('pipelineId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    pipelineId: pipelineId,
                    stageName: stageName,
                    phaseName: phaseName,
                    jobName: jobName,
                    outcomes: outcomes && outcomes.join(","),
                    '$top': top,
                };
                customHeaders = customHeaders || {};
                customHeaders["x-ms-continuationtoken"] = "continuationToken";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "80169dc2-30c3-4c25-84b2-dd67d7ff1f52", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
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
     * @param {Contracts.TestOutcome[]} outcomes
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "3994b949-77e5-495d-8034-edf80d95b84e", routeValues, queryValues);
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
    testResultsGroupDetails(project, pipelineId, stageName, phaseName, jobName, shouldIncludeFailedAndAbortedResults, queryGroupSummaryForInProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pipelineId == null) {
                throw new TypeError('pipelineId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    pipelineId: pipelineId,
                    stageName: stageName,
                    phaseName: phaseName,
                    jobName: jobName,
                    shouldIncludeFailedAndAbortedResults: shouldIncludeFailedAndAbortedResults,
                    queryGroupSummaryForInProgress: queryGroupSummaryForInProgress,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "f903b850-06af-4b50-a344-d7bbfb19e93b", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultsDetails, false);
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
     * @param {Contracts.BuildReference} buildToCompare
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "e009fa95-95a5-4ad4-9681-590043ce2423", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultSummary, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    queryTestResultsReportForPipeline(project, pipelineId, stageName, phaseName, jobName, includeFailureDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pipelineId == null) {
                throw new TypeError('pipelineId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    pipelineId: pipelineId,
                    stageName: stageName,
                    phaseName: phaseName,
                    jobName: jobName,
                    includeFailureDetails: includeFailureDetails,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "71f746a1-7d68-40fe-b705-9d821a73dff2", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultSummary, false);
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
     * @param {Contracts.ReleaseReference} releaseToCompare
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "f10f9577-2c04-45ab-8c99-b26567a7cd55", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultSummary, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.ReleaseReference[]} releases
     * @param {string} project - Project ID or project name
     */
    queryTestResultsSummaryForReleases(releases, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "f10f9577-2c04-45ab-8c99-b26567a7cd55", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, releases, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultSummary, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.TestResultsContext} resultsContext
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "3b7fd26f-c335-4e55-afc1-a588f5e2af3c", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, resultsContext, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestSummaryForWorkItem, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForBuild(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "0886a7ae-315a-4dba-9122-bcce93301f3a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.AggregatedDataForResultTrend, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.TestResultTrendFilter} filter
     * @param {string} project - Project ID or project name
     */
    queryResultTrendForRelease(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "107f23c3-359a-460a-a70c-63ee739f9f9a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.AggregatedDataForResultTrend, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.RunCreateModel} testRun
     * @param {string} project - Project ID or project name
     */
    createTestRun(testRun, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "364538f9-8062-4ce0-b024-75a0fb463f0d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testRun, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestRun, false);
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
     * @param {number} runId
     */
    deleteTestRun(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "364538f9-8062-4ce0-b024-75a0fb463f0d", routeValues);
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
     * @param {number} runId
     * @param {boolean} includeDetails
     * @param {boolean} includeTags
     */
    getTestRunById(project, runId, includeDetails, includeTags) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    includeDetails: includeDetails,
                    includeTags: includeTags,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "364538f9-8062-4ce0-b024-75a0fb463f0d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestRun, false);
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
     * @param {string} buildUri
     * @param {string} owner
     * @param {string} tmiRunId
     * @param {number} planId
     * @param {boolean} includeRunDetails
     * @param {boolean} automated
     * @param {number} skip
     * @param {number} top
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "364538f9-8062-4ce0-b024-75a0fb463f0d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestRun, true);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "364538f9-8062-4ce0-b024-75a0fb463f0d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestRun, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {Contracts.RunUpdateModel} runUpdateModel
     * @param {string} project - Project ID or project name
     * @param {number} runId
     */
    updateTestRun(runUpdateModel, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "364538f9-8062-4ce0-b024-75a0fb463f0d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, runUpdateModel, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestRun, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get test run summary, used when we want to get summary of a run by outcome. Test run should be in completed state.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - ID of the run to get.
     */
    getTestRunSummaryByOutcome(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "5c6a250c-53b7-4851-990c-42a7a00c8b39", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestRunStatistic, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get TestResultsSettings data
     *
     * @param {string} project - Project ID or project name
     * @param {Contracts.TestResultsSettingsType} settingsType
     */
    getTestResultsSettings(project, settingsType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    settingsType: settingsType,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testresults", "7319952e-e5a9-4e19-a006-84f3be8b7c68", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultsSettings, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update project settings of test results
     *
     * @param {Contracts.TestResultsUpdateSettings} testResultsUpdateSettings
     * @param {string} project - Project ID or project name
     */
    updatePipelinesTestSettings(testResultsUpdateSettings, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "testresults", "7319952e-e5a9-4e19-a006-84f3be8b7c68", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testResultsUpdateSettings, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultsSettings, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getSimilarTestResults(customHeaders, project, runId, testResultId, testSubResultId, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testSubResultId == null) {
                throw new TypeError('testSubResultId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testResultId: testResultId
                };
                let queryValues = {
                    testSubResultId: testSubResultId,
                    '$top': top,
                };
                customHeaders = customHeaders || {};
                customHeaders["x-ms-continuationtoken"] = "continuationToken";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "67d0a074-b255-4902-a639-e3e6de7a3de6", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestCaseResult, true);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "82b986e8-ca9e-4a89-b39e-f65c69bc104a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestRunStatistic, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * <p>Gets the coverage status for the last successful build of a definition, optionally scoped to a specific branch</p>
     *
     * @param {string} project - Project ID or project name
     * @param {string} definition - The ID or name of the definition.
     * @param {string} branchName - The branch name.
     * @param {string} label - The String to replace the default text on the left side of the badge.
     */
    getCoverageStatusBadge(project, definition, branchName, label) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    definition: definition
                };
                let queryValues = {
                    branchName: branchName,
                    label: label,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "73b7c9d8-defb-4b60-b3d6-2162d60d6b13", routeValues, queryValues);
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
     * Get all the tags in a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - Build ID
     */
    getTestTagsForBuild(project, buildId) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "52ee2057-4b54-41a6-a18c-ed4375a00f8d", routeValues, queryValues);
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
     * Get all the tags in a release.
     *
     * @param {string} project - Project ID or project name
     * @param {number} releaseId - Release ID
     * @param {number} releaseEnvId - Release environment ID
     */
    getTestTagsForRelease(project, releaseId, releaseEnvId) {
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
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "52ee2057-4b54-41a6-a18c-ed4375a00f8d", routeValues, queryValues);
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
     * Update tags of a run, Tags can be Added and Deleted
     *
     * @param {Contracts.TestTagsUpdateModel} testTagsUpdateModel - TestTagsUpdateModel
     * @param {string} project - Project ID or project name
     * @param {number} runId - RunId of the run
     */
    updateTestRunTags(testTagsUpdateModel, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "a5e2f411-2b43-45f3-989c-05b71339f5b8", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, testTagsUpdateModel, options);
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
     * Get all the tags in a build.
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - Build ID
     */
    getTestTagSummaryForBuild(project, buildId) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "655a8f6b-fec7-4b46-b672-68b44141b498", routeValues, queryValues);
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
     * Get all the tags in a release.
     *
     * @param {string} project - Project ID or project name
     * @param {number} releaseId - Release ID
     * @param {number} releaseEnvId - Release environment ID
     */
    getTestTagSummaryForRelease(project, releaseId, releaseEnvId) {
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
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "655a8f6b-fec7-4b46-b672-68b44141b498", routeValues, queryValues);
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
     * Creates an attachment in the LogStore for the specified buildId.
     *
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel - Contains attachment info like stream, filename, comment, attachmentType
     * @param {string} project - Project ID or project name
     * @param {number} buildId - BuildId
     */
    createBuildAttachmentInLogStore(attachmentRequestModel, project, buildId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    buildId: buildId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "6f747e16-18c2-435a-b4fb-fa05d6845fee", routeValues);
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
     * Creates an attachment in the LogStore for the specified runId.
     *
     * @param {Contracts.TestAttachmentRequestModel} attachmentRequestModel - Contains attachment info like stream, filename, comment, attachmentType
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     */
    createTestRunLogStoreAttachment(attachmentRequestModel, project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "1026d5de-4b0b-46ae-a31f-7c59b6af51ef", routeValues);
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
     * Deletes the attachment with the specified filename for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     * @param {string} filename - Attachment FileName
     */
    deleteTestRunLogStoreAttachment(project, runId, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (filename == null) {
                throw new TypeError('filename can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    filename: filename,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "1026d5de-4b0b-46ae-a31f-7c59b6af51ef", routeValues, queryValues);
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
     * Returns the attachment with the specified filename for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     * @param {string} filename - Attachment FileName
     */
    getTestRunLogStoreAttachmentContent(project, runId, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (filename == null) {
                throw new TypeError('filename can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    filename: filename,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "1026d5de-4b0b-46ae-a31f-7c59b6af51ef", routeValues, queryValues);
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
     * Returns a list of attachments for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     */
    getTestRunLogStoreAttachments(project, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "1026d5de-4b0b-46ae-a31f-7c59b6af51ef", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns the attachment with the specified filename for the specified runId from the LogStore.
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Test RunId
     * @param {string} filename - Attachment FileName
     */
    getTestRunLogStoreAttachmentZip(project, runId, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (filename == null) {
                throw new TypeError('filename can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    filename: filename,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "1026d5de-4b0b-46ae-a31f-7c59b6af51ef", routeValues, queryValues);
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
     * Creates a new test failure type
     *
     * @param {Contracts.TestResultFailureTypeRequestModel} testResultFailureType
     * @param {string} project - Project ID or project name
     */
    createFailureType(testResultFailureType, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "c4ac0486-830c-4a2a-9ef9-e8a1791a70fd", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, testResultFailureType, options);
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
     * Deletes a test failure type with specified failureTypeId
     *
     * @param {string} project - Project ID or project name
     * @param {number} failureTypeId
     */
    deleteFailureType(project, failureTypeId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    failureTypeId: failureTypeId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "c4ac0486-830c-4a2a-9ef9-e8a1791a70fd", routeValues);
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
     * Returns the list of test failure types.
     *
     * @param {string} project - Project ID or project name
     */
    getFailureTypes(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "c4ac0486-830c-4a2a-9ef9-e8a1791a70fd", routeValues);
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
     * Get history of a test method using TestHistoryQuery
     *
     * @param {Contracts.TestHistoryQuery} filter - TestHistoryQuery to get history
     * @param {string} project - Project ID or project name
     */
    queryTestHistory(filter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "2a41bd6a-8118-4403-b74e-5ba7492aed9d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, filter, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestHistoryQuery, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestLogsForBuild(customHeaders, project, buildId, type, directoryPath, fileNamePrefix, fetchMetaData, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    type: type,
                    directoryPath: directoryPath,
                    fileNamePrefix: fileNamePrefix,
                    fetchMetaData: fetchMetaData,
                    top: top,
                };
                customHeaders = customHeaders || {};
                customHeaders["x-ms-continuationtoken"] = "continuationToken";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "dff8ce3a-e539-4817-a405-d968491a88f1", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLog, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestResultLogs(customHeaders, project, runId, resultId, type, directoryPath, fileNamePrefix, fetchMetaData, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    resultId: resultId
                };
                let queryValues = {
                    type: type,
                    directoryPath: directoryPath,
                    fileNamePrefix: fileNamePrefix,
                    fetchMetaData: fetchMetaData,
                    top: top,
                };
                customHeaders = customHeaders || {};
                customHeaders["x-ms-continuationtoken"] = "continuationToken";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "714caaac-ae1e-4869-8323-9bc0f5120dbf", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLog, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestSubResultLogs(customHeaders, project, runId, resultId, subResultId, type, directoryPath, fileNamePrefix, fetchMetaData, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (subResultId == null) {
                throw new TypeError('subResultId can not be null or undefined');
            }
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    resultId: resultId
                };
                let queryValues = {
                    subResultId: subResultId,
                    type: type,
                    directoryPath: directoryPath,
                    fileNamePrefix: fileNamePrefix,
                    fetchMetaData: fetchMetaData,
                    top: top,
                };
                customHeaders = customHeaders || {};
                customHeaders["x-ms-continuationtoken"] = "continuationToken";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "714caaac-ae1e-4869-8323-9bc0f5120dbf", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLog, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestRunLogs(customHeaders, project, runId, type, directoryPath, fileNamePrefix, fetchMetaData, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    type: type,
                    directoryPath: directoryPath,
                    fileNamePrefix: fileNamePrefix,
                    fetchMetaData: fetchMetaData,
                    top: top,
                };
                customHeaders = customHeaders || {};
                customHeaders["x-ms-continuationtoken"] = "continuationToken";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "5b47b946-e875-4c9a-acdc-2a20996caebe", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLog, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get SAS Uri of a build attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} build - Id of the build to get
     * @param {Contracts.TestLogType} type - type of the file
     * @param {string} filePath - filePath for which sas uri is needed
     */
    getTestLogStoreEndpointDetailsForBuildLog(project, build, type, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (build == null) {
                throw new TypeError('build can not be null or undefined');
            }
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            if (filePath == null) {
                throw new TypeError('filePath can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    build: build,
                    type: type,
                    filePath: filePath,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "39b09be7-f0c9-4a83-a513-9ae31b45c56f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreEndpointDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create and Get sas uri of the build container
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId - Id of the build to get
     * @param {Contracts.TestLogStoreOperationType} testLogStoreOperationType - Type of operation to perform using sas uri
     */
    testLogStoreEndpointDetailsForBuild(project, buildId, testLogStoreOperationType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buildId == null) {
                throw new TypeError('buildId can not be null or undefined');
            }
            if (testLogStoreOperationType == null) {
                throw new TypeError('testLogStoreOperationType can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    buildId: buildId,
                    testLogStoreOperationType: testLogStoreOperationType,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "39b09be7-f0c9-4a83-a513-9ae31b45c56f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreEndpointDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get SAS Uri of a test results attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run that contains result
     * @param {number} resultId - Id of the test result whose files need to be downloaded
     * @param {Contracts.TestLogType} type - type of the file
     * @param {string} filePath - filePath for which sas uri is needed
     */
    getTestLogStoreEndpointDetailsForResultLog(project, runId, resultId, type, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            if (filePath == null) {
                throw new TypeError('filePath can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    resultId: resultId
                };
                let queryValues = {
                    type: type,
                    filePath: filePath,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "da630b37-1236-45b5-945e-1d7bdb673850", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreEndpointDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getTestLogStoreEndpointDetailsForSubResultLog(project, runId, resultId, subResultId, type, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (subResultId == null) {
                throw new TypeError('subResultId can not be null or undefined');
            }
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            if (filePath == null) {
                throw new TypeError('filePath can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    resultId: resultId
                };
                let queryValues = {
                    subResultId: subResultId,
                    type: type,
                    filePath: filePath,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "da630b37-1236-45b5-945e-1d7bdb673850", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreEndpointDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    testLogStoreEndpointDetailsForResult(project, runId, resultId, subResultId, filePath, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (subResultId == null) {
                throw new TypeError('subResultId can not be null or undefined');
            }
            if (filePath == null) {
                throw new TypeError('filePath can not be null or undefined');
            }
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    resultId: resultId
                };
                let queryValues = {
                    subResultId: subResultId,
                    filePath: filePath,
                    type: type,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "da630b37-1236-45b5-945e-1d7bdb673850", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreEndpointDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get SAS Uri of a test run attachment
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the test run whose file has to be downloaded
     * @param {Contracts.TestLogType} type - type of the file
     * @param {string} filePath - filePath for which sas uri is needed
     */
    getTestLogStoreEndpointDetailsForRunLog(project, runId, type, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type == null) {
                throw new TypeError('type can not be null or undefined');
            }
            if (filePath == null) {
                throw new TypeError('filePath can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    type: type,
                    filePath: filePath,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "67eb3f92-6c97-4fd9-8b63-6cbdc7e526ea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreEndpointDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create empty file for a run and Get Sas uri for the file
     *
     * @param {string} project - Project ID or project name
     * @param {number} runId - Id of the run to get endpoint details
     * @param {Contracts.TestLogStoreOperationType} testLogStoreOperationType - Type of operation to perform using sas uri
     * @param {string} filePath - file path to create an empty file
     * @param {Contracts.TestLogType} type - Default is GeneralAttachment, type of empty file to be created
     */
    testLogStoreEndpointDetailsForRun(project, runId, testLogStoreOperationType, filePath, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testLogStoreOperationType == null) {
                throw new TypeError('testLogStoreOperationType can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId
                };
                let queryValues = {
                    testLogStoreOperationType: testLogStoreOperationType,
                    filePath: filePath,
                    type: type,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "67eb3f92-6c97-4fd9-8b63-6cbdc7e526ea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestLogStoreEndpointDetails, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates TestResultsSession object in TCM data store
     *
     * @param {Contracts.TestResultsSession} session - Received session object.
     * @param {string} project - Project ID or project name
     */
    createTestSession(session, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "531e61ce-580d-4962-8591-0b2942b6bf78", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, session, options);
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
     * Retrieves TestResultsSession metadata object in TCM data store
     *
     * @param {string} project - Project ID or project name
     * @param {number} buildId
     */
    getTestSession(project, buildId) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "531e61ce-580d-4962-8591-0b2942b6bf78", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.TestResultsSession, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Retrieves TestResultsSession Layout object in TCM data store
     *
     * @param {string} project - Project ID or project name
     * @param {string} sessionId
     */
    getTestSessionLayout(project, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sessionId == null) {
                throw new TypeError('sessionId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    sessionId: sessionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "531e61ce-580d-4962-8591-0b2942b6bf78", routeValues, queryValues);
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
     * Creates Environment object in TCM data store
     *
     * @param {Contracts.TestSessionEnvironment[]} environments - Received Environment object.
     * @param {string} project - Project ID or project name
     */
    createEnvironment(environments, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "f9c2e9e4-9c9a-4c1d-9a7d-2b4c8a6f0d5f", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, environments, options);
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
     * @param {Contracts.TestSettings} testSettings
     * @param {string} project - Project ID or project name
     */
    createTestSettings(testSettings, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "930bad47-f826-4099-9597-f44d0a9c735c", routeValues);
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
            if (testSettingsId == null) {
                throw new TypeError('testSettingsId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    testSettingsId: testSettingsId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "930bad47-f826-4099-9597-f44d0a9c735c", routeValues, queryValues);
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
            if (testSettingsId == null) {
                throw new TypeError('testSettingsId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    testSettingsId: testSettingsId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "testresults", "930bad47-f826-4099-9597-f44d0a9c735c", routeValues, queryValues);
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
     * @param {Contracts.WorkItemToTestLinks} workItemToTestLinks
     * @param {string} project - Project ID or project name
     */
    addWorkItemToTestLinks(workItemToTestLinks, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "4e3abe63-ca46-4fe0-98b2-363f7ec7aa5f", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, workItemToTestLinks, options);
                    let ret = this.formatResponse(res.result, Contracts.TypeInfo.WorkItemToTestLinks, false);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "cbd50bd7-f7ed-4e35-b127-4408ae6bfa2c", routeValues, queryValues);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "cbd50bd7-f7ed-4e35-b127-4408ae6bfa2c", routeValues, queryValues);
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
     * @param {number} runId
     * @param {number} testCaseResultId
     */
    getTestResultWorkItemsById(project, runId, testCaseResultId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    runId: runId,
                    testCaseResultId: testCaseResultId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "3d032fd6-e7a0-468b-b105-75d206f99aad", routeValues);
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "testresults", "f7401a26-331b-44fe-a470-f7ed35138e4a", routeValues, queryValues);
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
TestResultsApi.RESOURCE_AREA_ID = "c83eaf52-edf3-4034-ae11-17d38f25404c";
exports.TestResultsApi = TestResultsApi;
