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
const AlertInterfaces = require("./interfaces/AlertInterfaces");
class AlertApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-Alert-api', options);
    }
    /**
     * Get an alert.
     *
     * @param {string} project - Project ID or project name
     * @param {number} alertId - ID of alert to retrieve
     * @param {string} repository - Name or id  of a repository that alert is part of
     * @param {string} ref
     * @param {AlertInterfaces.ExpandOption} expand - Expand alert attributes. Possible options are {ValidationFingerprint, None}
     */
    getAlert(project, alertId, repository, ref, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    alertId: alertId,
                    repository: repository
                };
                let queryValues = {
                    ref: ref,
                    expand: expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Alert", "e21b4630-b7d2-4031-99e3-3ad328cc4a7f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, AlertInterfaces.TypeInfo.Alert, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get alerts for a repository
     *
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of the repository
     * @param {number} top - The maximum number of alerts to return
     * @param {string} orderBy - Must be "id" "firstSeen" "lastSeen" "fixedOn" or "severity"  Defaults to "id"
     * @param {AlertInterfaces.SearchCriteria} criteria - Options to limit the alerts returned
     * @param {string} continuationToken - If there are more alerts than can be returned, a continuation token is placed in the "x-ms-continuationtoken" header.  Use that token here to get the next page of alerts
     */
    getAlerts(project, repository, top, orderBy, criteria, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    repository: repository
                };
                let queryValues = {
                    top: top,
                    orderBy: orderBy,
                    criteria: criteria,
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Alert", "e21b4630-b7d2-4031-99e3-3ad328cc4a7f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, AlertInterfaces.TypeInfo.Alert, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get an alert.
     *
     * @param {string} project - Project ID or project name
     * @param {number} alertId - ID of alert to retrieve
     * @param {string} repository - Name or id  of a repository that alert is part of
     * @param {string} ref
     * @param {AlertInterfaces.ExpandOption} expand - Expand alert attributes. Possible options are {ValidationFingerprint, None}
     */
    getAlertSarif(project, alertId, repository, ref, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    alertId: alertId,
                    repository: repository
                };
                let queryValues = {
                    ref: ref,
                    expand: expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Alert", "e21b4630-b7d2-4031-99e3-3ad328cc4a7f", routeValues, queryValues);
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
     * Update the status of an alert
     *
     * @param {AlertInterfaces.AlertStateUpdate} stateUpdate - The new status of the alert
     * @param {string} project - Project ID or project name
     * @param {number} alertId - The ID of the alert
     * @param {string} repository - The name or ID of the repository
     */
    updateAlert(stateUpdate, project, alertId, repository) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    alertId: alertId,
                    repository: repository
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Alert", "e21b4630-b7d2-4031-99e3-3ad328cc4a7f", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, stateUpdate, options);
                    let ret = this.formatResponse(res.result, AlertInterfaces.TypeInfo.Alert, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get instances of an alert.
     *
     * @param {string} project - Project ID or project name
     * @param {number} alertId - ID of alert to retrieve
     * @param {string} repository - Name or id of a repository that alert is part of
     * @param {string} ref
     */
    getAlertInstances(project, alertId, repository, ref) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    alertId: alertId,
                    repository: repository
                };
                let queryValues = {
                    ref: ref,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Alert", "f451ba96-0e95-458a-8dd5-3df894770a49", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, AlertInterfaces.TypeInfo.AlertAnalysisInstance, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Upload a Sarif containing security alerts
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of a repository
     */
    uploadSarif(customHeaders, contentStream, project, repository) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    repository: repository
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Alert", "2a141cae-a50d-4c22-b41b-13f77748d035", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("POST", url, contentStream, options);
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
     * @param {string} repository
     * @param {AlertInterfaces.AlertType} alertType
     */
    getUxFilters(project, repository, alertType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (alertType == null) {
                throw new TypeError('alertType can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    repository: repository
                };
                let queryValues = {
                    alertType: alertType,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Alert", "8f90675b-f794-434d-8f2c-cfae0a11c02a", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, AlertInterfaces.TypeInfo.UxFilters, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get the status of the Sarif processing job
     *
     * @param {number} sarifId - Sarif ID returned when the Sarif was uploaded
     */
    getSarif(sarifId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    sarifId: sarifId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "Alert", "a04689e7-0f81-48a2-8d18-40654c47494c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, AlertInterfaces.TypeInfo.SarifUploadStatus, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
}
exports.AlertApi = AlertApi;
