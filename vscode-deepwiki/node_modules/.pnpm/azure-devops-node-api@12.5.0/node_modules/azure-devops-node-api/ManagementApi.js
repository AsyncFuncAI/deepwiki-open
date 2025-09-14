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
const ManagementInterfaces = require("./interfaces/ManagementInterfaces");
class ManagementApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-Management-api', options);
    }
    /**
     * Delete the billing info for an organization.
     *
     * @param {string} organizationId
     */
    deleteBillingInfo(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "Default",
                    organizationId: organizationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "de45fbc6-60fd-46e2-95ef-490ad08d656a", routeValues);
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
     * Delete the meter usage history from Primary SU for an organization.
     *
     * @param {string} organizationId
     */
    deleteMeterUsageHistory(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "MeterUsageHistory",
                    organizationId: organizationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "de45fbc6-60fd-46e2-95ef-490ad08d656a", routeValues);
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
     * Get the billing info for an organization.
     *
     * @param {string} organizationId - Organization ID to get billing info for.
     */
    getBillingInfo(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "Default",
                    organizationId: organizationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "de45fbc6-60fd-46e2-95ef-490ad08d656a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, ManagementInterfaces.TypeInfo.BillingInfo, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Save the billing info for an organization.
     *
     * @param {ManagementInterfaces.BillingInfo} billingInfo
     * @param {string} organizationId
     */
    saveBillingInfo(billingInfo, organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "Default",
                    organizationId: organizationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "de45fbc6-60fd-46e2-95ef-490ad08d656a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, billingInfo, options);
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
     * Get all billable committers details, including those not matched with a VSID.
     *
     * @param {Date} billingDate - The date to query, or if not provided, today
     */
    getBillableCommitterDetails(billingDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "Details",
                };
                let queryValues = {
                    billingDate: billingDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "e58d8091-3d07-48b1-9527-7d6295fd4081", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, ManagementInterfaces.TypeInfo.BillableCommitterDetails, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     */
    getLastMeterUsage() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "Last",
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "e58d8091-3d07-48b1-9527-7d6295fd4081", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, ManagementInterfaces.TypeInfo.MeterUsage, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get commiters used when calculating billing information.
     *
     * @param {Date} billingDate - The date to query, or if not provided, today
     */
    getMeterUsage(billingDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "Default",
                };
                let queryValues = {
                    billingDate: billingDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "e58d8091-3d07-48b1-9527-7d6295fd4081", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, ManagementInterfaces.TypeInfo.MeterUsage, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {ManagementInterfaces.MeterUsage} meterUsage
     */
    setBillingSnapshot(meterUsage) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    action: "Default",
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "e58d8091-3d07-48b1-9527-7d6295fd4081", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, meterUsage, options);
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
     * Get the current status of Advanced Security for the organization
     *
     * @param {boolean} includeAllProperties - When true, also determine if pushes are blocked if they contain secrets
     */
    getOrgEnablementStatus(includeAllProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    includeAllProperties: includeAllProperties,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "d0c0450f-8882-46f4-a5a8-e48fea3095b0", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, ManagementInterfaces.TypeInfo.AdvSecEnablementSettings, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update the status of Advanced Security for the organization
     *
     * @param {ManagementInterfaces.AdvSecEnablementSettingsUpdate} savedAdvSecEnablementStatus - The new status
     */
    updateOrgEnablementStatus(savedAdvSecEnablementStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "d0c0450f-8882-46f4-a5a8-e48fea3095b0", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, savedAdvSecEnablementStatus, options);
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
     * Estimate the committers that would be added to the customer's usage if Advanced Security was enabled for this organization.
     *
     */
    getEstimatedOrgBillablePushers() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "10a9e9c3-89bf-4312-92ed-139ddbcd2e28", routeValues);
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
     * Get the current status of Advanced Security for a project
     *
     * @param {string} project - Project ID or project name
     * @param {boolean} includeAllProperties - When true, also determine if pushes are blocked if they contain secrets
     */
    getProjectEnablementStatus(project, includeAllProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    includeAllProperties: includeAllProperties,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "6b9a4b47-5f2d-40f3-8286-b0152079074d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, ManagementInterfaces.TypeInfo.AdvSecEnablementSettings, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update the status of Advanced Security for the project
     *
     * @param {ManagementInterfaces.AdvSecEnablementSettingsUpdate} savedAdvSecEnablementStatus - The new status
     * @param {string} project - Project ID or project name
     */
    updateProjectEnablementStatus(savedAdvSecEnablementStatus, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "6b9a4b47-5f2d-40f3-8286-b0152079074d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, savedAdvSecEnablementStatus, options);
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
     * Estimate the number of committers that would be added to the customer's usage if Advanced Security was enabled for this project.
     *
     * @param {string} project - Project ID or project name
     */
    getEstimatedProjectBillablePushers(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "bf09cb40-ecf4-4496-8cf7-9ec60c64fd3e", routeValues);
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
     * Determine if Advanced Security is enabled for a repository
     *
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of the repository
     * @param {boolean} includeAllProperties - When true, will also determine if pushes are blocked when secrets are detected
     */
    getRepoEnablementStatus(project, repository, includeAllProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    repository: repository
                };
                let queryValues = {
                    includeAllProperties: includeAllProperties,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "d11a1c2b-b904-43dc-b970-bf42486262db", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, ManagementInterfaces.TypeInfo.AdvSecEnablementStatus, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update the enablement of Advanced Security for a repository
     *
     * @param {ManagementInterfaces.AdvSecEnablementStatusUpdate} savedAdvSecEnablementStatus - new status
     * @param {string} project - Project ID or project name
     * @param {string} repository - Name or ID of the repository
     */
    updateRepoAdvSecEnablementStatus(savedAdvSecEnablementStatus, project, repository) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    repository: repository
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "d11a1c2b-b904-43dc-b970-bf42486262db", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, savedAdvSecEnablementStatus, options);
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
     * Estimate the committers that would be added to the customer's usage if Advanced Security was enabled for this repository.
     *
     * @param {string} project - Project ID or project name
     * @param {string} repository - The name or ID of the repository
     */
    getEstimatedRepoBillableCommitters(project, repository) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    repository: repository
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "Management", "b60f1ebf-ae77-4557-bd7f-ae3d5598dd1f", routeValues);
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
exports.ManagementApi = ManagementApi;
