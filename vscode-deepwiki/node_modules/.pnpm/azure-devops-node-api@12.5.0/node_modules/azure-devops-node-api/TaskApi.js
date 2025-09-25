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
const TaskAgentInterfaces = require("./interfaces/TaskAgentInterfaces");
class TaskApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-Task-api', options);
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} type
     */
    getPlanAttachments(scopeIdentifier, hubName, planId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    type: type
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "eb55e5d6-2f30-4295-b5ed-38da50b1fc52", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     * @param {string} name
     */
    createAttachment(customHeaders, contentStream, scopeIdentifier, hubName, planId, timelineId, recordId, type, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId,
                    recordId: recordId,
                    type: type,
                    name: name
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "7898f959-9cdf-4096-b29e-7f293031629e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAttachment, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     * @param {string} name
     * @param {string} artifactHash
     * @param {number} length
     */
    createAttachmentFromArtifact(scopeIdentifier, hubName, planId, timelineId, recordId, type, name, artifactHash, length) {
        return __awaiter(this, void 0, void 0, function* () {
            if (artifactHash == null) {
                throw new TypeError('artifactHash can not be null or undefined');
            }
            if (length == null) {
                throw new TypeError('length can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId,
                    recordId: recordId,
                    type: type,
                    name: name
                };
                let queryValues = {
                    artifactHash: artifactHash,
                    length: length,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "7898f959-9cdf-4096-b29e-7f293031629e", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, null, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAttachment, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     * @param {string} name
     */
    getAttachment(scopeIdentifier, hubName, planId, timelineId, recordId, type, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId,
                    recordId: recordId,
                    type: type,
                    name: name
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "7898f959-9cdf-4096-b29e-7f293031629e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAttachment, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     * @param {string} name
     */
    getAttachmentContent(scopeIdentifier, hubName, planId, timelineId, recordId, type, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId,
                    recordId: recordId,
                    type: type,
                    name: name
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "7898f959-9cdf-4096-b29e-7f293031629e", routeValues);
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
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     */
    getAttachments(scopeIdentifier, hubName, planId, timelineId, recordId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId,
                    recordId: recordId,
                    type: type
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "7898f959-9cdf-4096-b29e-7f293031629e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAttachment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Append content to timeline record feed.
     *
     * @param {TaskAgentInterfaces.TimelineRecordFeedLinesWrapper} lines - Content to be appended to the timeline record feed.
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId - ID of the plan.
     * @param {string} timelineId - ID of the task's timeline.
     * @param {string} recordId - ID of the timeline record.
     */
    appendTimelineRecordFeed(lines, scopeIdentifier, hubName, planId, timelineId, recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId,
                    recordId: recordId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "858983e4-19bd-4c5e-864c-507b59b58b12", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, lines, options);
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
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} stepId
     * @param {number} endLine
     * @param {number} takeCount
     * @param {string} continuationToken
     */
    getLines(scopeIdentifier, hubName, planId, timelineId, recordId, stepId, endLine, takeCount, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (stepId == null) {
                throw new TypeError('stepId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId,
                    recordId: recordId
                };
                let queryValues = {
                    stepId: stepId,
                    endLine: endLine,
                    takeCount: takeCount,
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "858983e4-19bd-4c5e-864c-507b59b58b12", routeValues, queryValues);
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
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} orchestrationId
     */
    getJobInstance(scopeIdentifier, hubName, orchestrationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    orchestrationId: orchestrationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "0a1efd25-abda-43bd-9629-6c7bdd2e0d60", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJob, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Append a log to a task's log. The log should be sent in the body of the request as a TaskLog object stream.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId - The ID of the plan.
     * @param {number} logId - The ID of the log.
     */
    appendLogContent(customHeaders, contentStream, scopeIdentifier, hubName, planId, logId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    logId: logId
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "46f5667d-263a-4684-91b1-dff7fdcf64e2", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("POST", url, contentStream, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskLog, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {number} logId
     * @param {string} serializedBlobId
     * @param {number} lineCount
     */
    associateLog(scopeIdentifier, hubName, planId, logId, serializedBlobId, lineCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (serializedBlobId == null) {
                throw new TypeError('serializedBlobId can not be null or undefined');
            }
            if (lineCount == null) {
                throw new TypeError('lineCount can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    logId: logId
                };
                let queryValues = {
                    serializedBlobId: serializedBlobId,
                    lineCount: lineCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "46f5667d-263a-4684-91b1-dff7fdcf64e2", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskLog, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create a log and connect it to a pipeline run's execution plan.
     *
     * @param {TaskAgentInterfaces.TaskLog} log - An object that contains information about log's path.
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId - The ID of the plan.
     */
    createLog(log, scopeIdentifier, hubName, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "46f5667d-263a-4684-91b1-dff7fdcf64e2", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, log, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskLog, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {number} logId
     * @param {number} startLine
     * @param {number} endLine
     */
    getLog(scopeIdentifier, hubName, planId, logId, startLine, endLine) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    logId: logId
                };
                let queryValues = {
                    startLine: startLine,
                    endLine: endLine,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "46f5667d-263a-4684-91b1-dff7fdcf64e2", routeValues, queryValues);
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
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    getLogs(scopeIdentifier, hubName, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "46f5667d-263a-4684-91b1-dff7fdcf64e2", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskLog, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     */
    getPlanGroupsQueueMetrics(scopeIdentifier, hubName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "038fd4d5-cda7-44ca-92c0-935843fee1a7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskOrchestrationPlanGroupsQueueMetrics, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {{ [key: string] : string; }} claims
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} jobId
     * @param {string} serviceConnectionId
     */
    createOidcToken(claims, scopeIdentifier, hubName, planId, jobId, serviceConnectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    jobId: jobId
                };
                let queryValues = {
                    serviceConnectionId: serviceConnectionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "69a319f4-28c1-4bfd-93e6-ea0ff5c6f1a2", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, claims, options);
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
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {TaskAgentInterfaces.PlanGroupStatus} statusFilter
     * @param {number} count
     */
    getQueuedPlanGroups(scopeIdentifier, hubName, statusFilter, count) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName
                };
                let queryValues = {
                    statusFilter: statusFilter,
                    count: count,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "0dd73091-3e36-4f43-b443-1b76dd426d84", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskOrchestrationQueuedPlanGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planGroup
     */
    getQueuedPlanGroup(scopeIdentifier, hubName, planGroup) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planGroup: planGroup
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "65fd0708-bc1e-447b-a731-0587c5464e5b", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskOrchestrationQueuedPlanGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    getPlan(scopeIdentifier, hubName, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "5cecd946-d704-471e-a45f-3b4064fcfaba", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskOrchestrationPlan, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {number} changeId
     */
    getRecords(scopeIdentifier, hubName, planId, timelineId, changeId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId
                };
                let queryValues = {
                    changeId: changeId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8893bc5b-35b2-4be7-83cb-99e683551db4", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TimelineRecord, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update timeline records if they already exist, otherwise create new ones for the same timeline.
     *
     * @param {VSSInterfaces.VssJsonCollectionWrapperV<TaskAgentInterfaces.TimelineRecord[]>} records - The array of timeline records to be updated.
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId - The ID of the plan.
     * @param {string} timelineId - The ID of the timeline.
     */
    updateRecords(records, scopeIdentifier, hubName, planId, timelineId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8893bc5b-35b2-4be7-83cb-99e683551db4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, records, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TimelineRecord, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.Timeline} timeline
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    createTimeline(timeline, scopeIdentifier, hubName, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "83597576-cc2c-453c-bea6-2882ae6a1653", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, timeline, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.Timeline, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     */
    deleteTimeline(scopeIdentifier, hubName, planId, timelineId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "83597576-cc2c-453c-bea6-2882ae6a1653", routeValues);
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
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {number} changeId
     * @param {boolean} includeRecords
     */
    getTimeline(scopeIdentifier, hubName, planId, timelineId, changeId, includeRecords) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId,
                    timelineId: timelineId
                };
                let queryValues = {
                    changeId: changeId,
                    includeRecords: includeRecords,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "83597576-cc2c-453c-bea6-2882ae6a1653", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.Timeline, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    getTimelines(scopeIdentifier, hubName, planId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    scopeIdentifier: scopeIdentifier,
                    hubName: hubName,
                    planId: planId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "83597576-cc2c-453c-bea6-2882ae6a1653", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.Timeline, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
}
exports.TaskApi = TaskApi;
