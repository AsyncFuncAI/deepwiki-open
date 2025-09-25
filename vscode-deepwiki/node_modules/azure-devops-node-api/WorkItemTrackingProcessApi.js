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
const WorkItemTrackingProcessInterfaces = require("./interfaces/WorkItemTrackingProcessInterfaces");
class WorkItemTrackingProcessApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-WorkItemTracking-api', options);
    }
    /**
     * Creates a single behavior in the given process.
     *
     * @param {WorkItemTrackingProcessInterfaces.ProcessBehaviorCreateRequest} behavior
     * @param {string} processId - The ID of the process
     */
    createProcessBehavior(behavior, processId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "d1800200-f184-4e75-a5f2-ad0b04b4373e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, behavior, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessBehavior, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes a behavior in the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    deleteProcessBehavior(processId, behaviorRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    behaviorRefName: behaviorRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "d1800200-f184-4e75-a5f2-ad0b04b4373e", routeValues);
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
     * Returns a behavior of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} behaviorRefName - The reference name of the behavior
     * @param {WorkItemTrackingProcessInterfaces.GetBehaviorsExpand} expand
     */
    getProcessBehavior(processId, behaviorRefName, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    behaviorRefName: behaviorRefName
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "d1800200-f184-4e75-a5f2-ad0b04b4373e", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessBehavior, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a list of all behaviors in the process.
     *
     * @param {string} processId - The ID of the process
     * @param {WorkItemTrackingProcessInterfaces.GetBehaviorsExpand} expand
     */
    getProcessBehaviors(processId, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "d1800200-f184-4e75-a5f2-ad0b04b4373e", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessBehavior, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Replaces a behavior in the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.ProcessBehaviorUpdateRequest} behaviorData
     * @param {string} processId - The ID of the process
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    updateProcessBehavior(behaviorData, processId, behaviorRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    behaviorRefName: behaviorRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "d1800200-f184-4e75-a5f2-ad0b04b4373e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, behaviorData, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessBehavior, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a control in a group.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control - The control.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group to add the control to.
     */
    createControlInGroup(control, processId, witRefName, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    groupId: groupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "1f59b363-a2d0-4b7e-9bc6-eb9f5f3f0e58", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, control, options);
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
     * Moves a control to a specified group.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control - The control.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group to move the control to.
     * @param {string} controlId - The ID of the control.
     * @param {string} removeFromGroupId - The group ID to remove the control from.
     */
    moveControlToGroup(control, processId, witRefName, groupId, controlId, removeFromGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    groupId: groupId,
                    controlId: controlId
                };
                let queryValues = {
                    removeFromGroupId: removeFromGroupId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "1f59b363-a2d0-4b7e-9bc6-eb9f5f3f0e58", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, control, options);
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
     * Removes a control from the work item form.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group.
     * @param {string} controlId - The ID of the control to remove.
     */
    removeControlFromGroup(processId, witRefName, groupId, controlId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    groupId: groupId,
                    controlId: controlId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "1f59b363-a2d0-4b7e-9bc6-eb9f5f3f0e58", routeValues);
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
     * Updates a control on the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control - The updated control.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} groupId - The ID of the group.
     * @param {string} controlId - The ID of the control.
     */
    updateControl(control, processId, witRefName, groupId, controlId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    groupId: groupId,
                    controlId: controlId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "1f59b363-a2d0-4b7e-9bc6-eb9f5f3f0e58", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, control, options);
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
     * Adds a field to a work item type.
     *
     * @param {WorkItemTrackingProcessInterfaces.AddProcessWorkItemTypeFieldRequest} field
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    addFieldToWorkItemType(field, processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "bc0ad8dc-e3f3-46b0-b06c-5bf861793196", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, field, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemTypeField, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a list of all fields in a work item type.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    getAllWorkItemTypeFields(processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "bc0ad8dc-e3f3-46b0-b06c-5bf861793196", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemTypeField, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a field in a work item type.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} fieldRefName - The reference name of the field.
     * @param {WorkItemTrackingProcessInterfaces.ProcessWorkItemTypeFieldsExpandLevel} expand
     */
    getWorkItemTypeField(processId, witRefName, fieldRefName, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    fieldRefName: fieldRefName
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "bc0ad8dc-e3f3-46b0-b06c-5bf861793196", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemTypeField, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes a field from a work item type. Does not permanently delete the field.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} fieldRefName - The reference name of the field.
     */
    removeWorkItemTypeField(processId, witRefName, fieldRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    fieldRefName: fieldRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "bc0ad8dc-e3f3-46b0-b06c-5bf861793196", routeValues);
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
     * Updates a field in a work item type.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeFieldRequest} field
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} fieldRefName - The reference name of the field.
     */
    updateWorkItemTypeField(field, processId, witRefName, fieldRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    fieldRefName: fieldRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "bc0ad8dc-e3f3-46b0-b06c-5bf861793196", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, field, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemTypeField, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Adds a group to the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page to add the group to.
     * @param {string} sectionId - The ID of the section to add the group to.
     */
    addGroup(group, processId, witRefName, pageId, sectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    pageId: pageId,
                    sectionId: sectionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "766e44e1-36a8-41d7-9050-c343ff02f7a5", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, group, options);
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
     * Moves a group to a different page and section.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The updated group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page the group is in.
     * @param {string} sectionId - The ID of the section the group is i.n
     * @param {string} groupId - The ID of the group.
     * @param {string} removeFromPageId - ID of the page to remove the group from.
     * @param {string} removeFromSectionId - ID of the section to remove the group from.
     */
    moveGroupToPage(group, processId, witRefName, pageId, sectionId, groupId, removeFromPageId, removeFromSectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (removeFromPageId == null) {
                throw new TypeError('removeFromPageId can not be null or undefined');
            }
            if (removeFromSectionId == null) {
                throw new TypeError('removeFromSectionId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    pageId: pageId,
                    sectionId: sectionId,
                    groupId: groupId
                };
                let queryValues = {
                    removeFromPageId: removeFromPageId,
                    removeFromSectionId: removeFromSectionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "766e44e1-36a8-41d7-9050-c343ff02f7a5", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, group, options);
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
     * Moves a group to a different section.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The updated group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page the group is in.
     * @param {string} sectionId - The ID of the section the group is in.
     * @param {string} groupId - The ID of the group.
     * @param {string} removeFromSectionId - ID of the section to remove the group from.
     */
    moveGroupToSection(group, processId, witRefName, pageId, sectionId, groupId, removeFromSectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (removeFromSectionId == null) {
                throw new TypeError('removeFromSectionId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    pageId: pageId,
                    sectionId: sectionId,
                    groupId: groupId
                };
                let queryValues = {
                    removeFromSectionId: removeFromSectionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "766e44e1-36a8-41d7-9050-c343ff02f7a5", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, group, options);
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
     * Removes a group from the work item form.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} pageId - The ID of the page the group is in
     * @param {string} sectionId - The ID of the section to the group is in
     * @param {string} groupId - The ID of the group
     */
    removeGroup(processId, witRefName, pageId, sectionId, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    pageId: pageId,
                    sectionId: sectionId,
                    groupId: groupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "766e44e1-36a8-41d7-9050-c343ff02f7a5", routeValues);
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
     * Updates a group in the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Group} group - The updated group.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} pageId - The ID of the page the group is in.
     * @param {string} sectionId - The ID of the section the group is in.
     * @param {string} groupId - The ID of the group.
     */
    updateGroup(group, processId, witRefName, pageId, sectionId, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    pageId: pageId,
                    sectionId: sectionId,
                    groupId: groupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "766e44e1-36a8-41d7-9050-c343ff02f7a5", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, group, options);
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
     * Gets the form layout.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    getFormLayout(processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "fa8646eb-43cd-4b71-9564-40106fd63e40", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.FormLayout, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a picklist.
     *
     * @param {WorkItemTrackingProcessInterfaces.PickList} picklist - Picklist
     */
    createList(picklist) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "01e15468-e27c-4e20-a974-bd957dcccebc", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, picklist, options);
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
     * Removes a picklist.
     *
     * @param {string} listId - The ID of the list
     */
    deleteList(listId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    listId: listId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "01e15468-e27c-4e20-a974-bd957dcccebc", routeValues);
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
     * Returns a picklist.
     *
     * @param {string} listId - The ID of the list
     */
    getList(listId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    listId: listId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "01e15468-e27c-4e20-a974-bd957dcccebc", routeValues);
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
     * Returns meta data of the picklist.
     *
     */
    getListsMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "01e15468-e27c-4e20-a974-bd957dcccebc", routeValues);
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
     * Updates a list.
     *
     * @param {WorkItemTrackingProcessInterfaces.PickList} picklist
     * @param {string} listId - The ID of the list
     */
    updateList(picklist, listId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    listId: listId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "01e15468-e27c-4e20-a974-bd957dcccebc", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, picklist, options);
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
     * Adds a page to the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Page} page - The page.
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    addPage(page, processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "1cc7b29f-6697-4d9d-b0a1-2650d3e1d584", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, page, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.Page, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes a page from the work item form
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} pageId - The ID of the page
     */
    removePage(processId, witRefName, pageId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    pageId: pageId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "1cc7b29f-6697-4d9d-b0a1-2650d3e1d584", routeValues);
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
     * Updates a page on the work item form
     *
     * @param {WorkItemTrackingProcessInterfaces.Page} page - The page
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    updatePage(page, processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "1cc7b29f-6697-4d9d-b0a1-2650d3e1d584", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, page, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.Page, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a process.
     *
     * @param {WorkItemTrackingProcessInterfaces.CreateProcessModel} createRequest - CreateProcessModel.
     */
    createNewProcess(createRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "02cc6a73-5cfb-427d-8c8e-b49fb086e8af", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, createRequest, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessInfo, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes a process of a specific ID.
     *
     * @param {string} processTypeId
     */
    deleteProcessById(processTypeId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processTypeId: processTypeId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "02cc6a73-5cfb-427d-8c8e-b49fb086e8af", routeValues);
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
     * Edit a process of a specific ID.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessModel} updateRequest
     * @param {string} processTypeId
     */
    editProcess(updateRequest, processTypeId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processTypeId: processTypeId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "02cc6a73-5cfb-427d-8c8e-b49fb086e8af", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, updateRequest, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessInfo, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get list of all processes including system and inherited.
     *
     * @param {WorkItemTrackingProcessInterfaces.GetProcessExpandLevel} expand
     */
    getListOfProcesses(expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "02cc6a73-5cfb-427d-8c8e-b49fb086e8af", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessInfo, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a single process of a specified ID.
     *
     * @param {string} processTypeId
     * @param {WorkItemTrackingProcessInterfaces.GetProcessExpandLevel} expand
     */
    getProcessByItsId(processTypeId, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processTypeId: processTypeId
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "02cc6a73-5cfb-427d-8c8e-b49fb086e8af", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessInfo, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Adds a rule to work item type in the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.CreateProcessRuleRequest} processRuleCreate
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    addProcessWorkItemTypeRule(processRuleCreate, processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "76fe3432-d825-479d-a5f6-983bbb78b4f3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, processRuleCreate, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessRule, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes a rule from the work item type in the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} ruleId - The ID of the rule
     */
    deleteProcessWorkItemTypeRule(processId, witRefName, ruleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    ruleId: ruleId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "76fe3432-d825-479d-a5f6-983bbb78b4f3", routeValues);
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
     * Returns a single rule in the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} ruleId - The ID of the rule
     */
    getProcessWorkItemTypeRule(processId, witRefName, ruleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    ruleId: ruleId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "76fe3432-d825-479d-a5f6-983bbb78b4f3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessRule, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a list of all rules in the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    getProcessWorkItemTypeRules(processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "76fe3432-d825-479d-a5f6-983bbb78b4f3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessRule, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Updates a rule in the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessRuleRequest} processRule
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} ruleId - The ID of the rule
     */
    updateProcessWorkItemTypeRule(processRule, processId, witRefName, ruleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    ruleId: ruleId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "76fe3432-d825-479d-a5f6-983bbb78b4f3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, processRule, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessRule, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a state definition in the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemStateInputModel} stateModel
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    createStateDefinition(stateModel, processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "31015d57-2dff-4a46-adb3-2fb4ee3dcec9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, stateModel, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.WorkItemStateResultModel, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes a state definition in the work item type of the process.
     *
     * @param {string} processId - ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - ID of the state
     */
    deleteStateDefinition(processId, witRefName, stateId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    stateId: stateId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "31015d57-2dff-4a46-adb3-2fb4ee3dcec9", routeValues);
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
     * Returns a single state definition in a work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - The ID of the state
     */
    getStateDefinition(processId, witRefName, stateId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    stateId: stateId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "31015d57-2dff-4a46-adb3-2fb4ee3dcec9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.WorkItemStateResultModel, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a list of all state definitions in a work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    getStateDefinitions(processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "31015d57-2dff-4a46-adb3-2fb4ee3dcec9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.WorkItemStateResultModel, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Hides a state definition in the work item type of the process.Only states with customizationType:System can be hidden.
     *
     * @param {WorkItemTrackingProcessInterfaces.HideStateModel} hideStateModel
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - The ID of the state
     */
    hideStateDefinition(hideStateModel, processId, witRefName, stateId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    stateId: stateId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "31015d57-2dff-4a46-adb3-2fb4ee3dcec9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, hideStateModel, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.WorkItemStateResultModel, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Updates a given state definition in the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemStateInputModel} stateModel
     * @param {string} processId - ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {string} stateId - ID of the state
     */
    updateStateDefinition(stateModel, processId, witRefName, stateId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    stateId: stateId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "31015d57-2dff-4a46-adb3-2fb4ee3dcec9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, stateModel, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.WorkItemStateResultModel, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Deletes a system control modification on the work item form.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} controlId - The ID of the control.
     */
    deleteSystemControl(processId, witRefName, controlId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    controlId: controlId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "ff9a3d2c-32b7-4c6c-991c-d5a251fb9098", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
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
     * Gets edited system controls for a work item type in a process. To get all system controls (base + edited) use layout API(s)
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    getSystemControls(processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "ff9a3d2c-32b7-4c6c-991c-d5a251fb9098", routeValues);
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
     * Updates/adds a system control on the work item form.
     *
     * @param {WorkItemTrackingProcessInterfaces.Control} control
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     * @param {string} controlId - The ID of the control.
     */
    updateSystemControl(control, processId, witRefName, controlId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName,
                    controlId: controlId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "ff9a3d2c-32b7-4c6c-991c-d5a251fb9098", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, control, options);
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
     * Creates a work item type in the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.CreateProcessWorkItemTypeRequest} workItemType
     * @param {string} processId - The ID of the process on which to create work item type.
     */
    createProcessWorkItemType(workItemType, processId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "e2e9d1a6-432d-4062-8870-bfcb8c324ad7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, workItemType, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemType, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Removes a work item type in the process.
     *
     * @param {string} processId - The ID of the process.
     * @param {string} witRefName - The reference name of the work item type.
     */
    deleteProcessWorkItemType(processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "e2e9d1a6-432d-4062-8870-bfcb8c324ad7", routeValues);
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
     * Returns a single work item type in a process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     * @param {WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand} expand - Flag to determine what properties of work item type to return
     */
    getProcessWorkItemType(processId, witRefName, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "e2e9d1a6-432d-4062-8870-bfcb8c324ad7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemType, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a list of all work item types in a process.
     *
     * @param {string} processId - The ID of the process
     * @param {WorkItemTrackingProcessInterfaces.GetWorkItemTypeExpand} expand - Flag to determine what properties of work item type to return
     */
    getProcessWorkItemTypes(processId, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "e2e9d1a6-432d-4062-8870-bfcb8c324ad7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemType, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Updates a work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.UpdateProcessWorkItemTypeRequest} workItemTypeUpdate
     * @param {string} processId - The ID of the process
     * @param {string} witRefName - The reference name of the work item type
     */
    updateProcessWorkItemType(workItemTypeUpdate, processId, witRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefName: witRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "processes", "e2e9d1a6-432d-4062-8870-bfcb8c324ad7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, workItemTypeUpdate, options);
                    let ret = this.formatResponse(res.result, WorkItemTrackingProcessInterfaces.TypeInfo.ProcessWorkItemType, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Adds a behavior to the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior} behavior
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     */
    addBehaviorToWorkItemType(behavior, processId, witRefNameForBehaviors) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefNameForBehaviors: witRefNameForBehaviors
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "6d765a2e-4e1b-4b11-be93-f953be676024", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, behavior, options);
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
     * Returns a behavior for the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    getBehaviorForWorkItemType(processId, witRefNameForBehaviors, behaviorRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefNameForBehaviors: witRefNameForBehaviors,
                    behaviorRefName: behaviorRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "6d765a2e-4e1b-4b11-be93-f953be676024", routeValues);
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
     * Returns a list of all behaviors for the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     */
    getBehaviorsForWorkItemType(processId, witRefNameForBehaviors) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefNameForBehaviors: witRefNameForBehaviors
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "6d765a2e-4e1b-4b11-be93-f953be676024", routeValues);
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
     * Removes a behavior for the work item type of the process.
     *
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     * @param {string} behaviorRefName - The reference name of the behavior
     */
    removeBehaviorFromWorkItemType(processId, witRefNameForBehaviors, behaviorRefName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefNameForBehaviors: witRefNameForBehaviors,
                    behaviorRefName: behaviorRefName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "6d765a2e-4e1b-4b11-be93-f953be676024", routeValues);
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
     * Updates a behavior for the work item type of the process.
     *
     * @param {WorkItemTrackingProcessInterfaces.WorkItemTypeBehavior} behavior
     * @param {string} processId - The ID of the process
     * @param {string} witRefNameForBehaviors - Work item type reference name for the behavior
     */
    updateBehaviorToWorkItemType(behavior, processId, witRefNameForBehaviors) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    processId: processId,
                    witRefNameForBehaviors: witRefNameForBehaviors
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "processes", "6d765a2e-4e1b-4b11-be93-f953be676024", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, behavior, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
}
WorkItemTrackingProcessApi.RESOURCE_AREA_ID = "5264459e-e5e0-4bd8-b118-0985e68a4ec5";
exports.WorkItemTrackingProcessApi = WorkItemTrackingProcessApi;
