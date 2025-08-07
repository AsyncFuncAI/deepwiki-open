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
const WorkInterfaces = require("./interfaces/WorkInterfaces");
class WorkApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-Work-api', options);
    }
    /**
     * Creates/updates an automation rules settings
     *
     * @param {WorkInterfaces.TeamAutomationRulesSettingsRequestModel} ruleRequestModel - Required parameters to create/update an automation rules settings
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateAutomationRule(ruleRequestModel, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "work", "2882c15d-0cb3-43b5-8fb7-db62e09a79db", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, ruleRequestModel, options);
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
     * Gets backlog configuration for a team
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    getBacklogConfigurations(teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "7799f497-3cb5-4f16-ad4f-5cd06012db64", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.BacklogConfiguration, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of work items within a backlog level
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} backlogId
     */
    getBacklogLevelWorkItems(teamContext, backlogId) {
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
                    team: team,
                    backlogId: backlogId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "7c468d96-ab1d-4294-a360-92f07e9ccd98", routeValues);
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
     * Get a backlog level
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} id - The id of the backlog level
     */
    getBacklog(teamContext, id) {
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
                    team: team,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "a93726f9-7867-4e38-b4f2-0bfafc2f6a94", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.BacklogLevelConfiguration, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * List all backlog levels
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    getBacklogs(teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "a93726f9-7867-4e38-b4f2-0bfafc2f6a94", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.BacklogLevelConfiguration, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Gets a badge that displays the status of columns on the board.
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} id - The id of the board.
     * @param {WorkInterfaces.BoardBadgeColumnOptions} columnOptions - Determines what columns to show.
     * @param {string[]} columns - If columnOptions is set to custom, specify the list of column names.
     */
    getBoardBadge(teamContext, id, columnOptions, columns) {
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
                    team: team,
                    id: id
                };
                let queryValues = {
                    columnOptions: columnOptions,
                    columns: columns && columns.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0120b002-ab6c-4ca0-98cf-a8d7492f865c", routeValues, queryValues);
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
     * Gets a badge that displays the status of columns on the board.
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} id - The id of the board.
     * @param {WorkInterfaces.BoardBadgeColumnOptions} columnOptions - Determines what columns to show.
     * @param {string[]} columns - If columnOptions is set to custom, specify the list of column names.
     */
    getBoardBadgeData(teamContext, id, columnOptions, columns) {
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
                    team: team,
                    id: id
                };
                let queryValues = {
                    columnOptions: columnOptions,
                    columns: columns && columns.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0120b002-ab6c-4ca0-98cf-a8d7492f865c", routeValues, queryValues);
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
     * Get available board columns in a project
     *
     * @param {string} project - Project ID or project name
     */
    getColumnSuggestedValues(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "eb7ec5a3-1ba3-4fd1-b834-49a5a387e57d", routeValues);
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
     * Returns the list of parent field filter model for the given list of workitem ids
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} childBacklogContextCategoryRefName
     * @param {number[]} workitemIds
     */
    getBoardMappingParentItems(teamContext, childBacklogContextCategoryRefName, workitemIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (childBacklogContextCategoryRefName == null) {
                throw new TypeError('childBacklogContextCategoryRefName can not be null or undefined');
            }
            if (workitemIds == null) {
                throw new TypeError('workitemIds can not be null or undefined');
            }
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
                    childBacklogContextCategoryRefName: childBacklogContextCategoryRefName,
                    workitemIds: workitemIds && workitemIds.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "186abea3-5c35-432f-9e28-7a15b4312a0e", routeValues, queryValues);
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
     * Get available board rows in a project
     *
     * @param {string} project - Project ID or project name
     */
    getRowSuggestedValues(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "bb494cc6-a0f5-4c6c-8dca-ea6912e79eb9", routeValues);
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
     * Get board
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} id - identifier for board, either board's backlog level name (Eg:"Stories") or Id
     */
    getBoard(teamContext, id) {
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
                    team: team,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "23ad19fc-3b8e-4877-8462-b3f92bc06b40", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.Board, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get boards
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    getBoards(teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "23ad19fc-3b8e-4877-8462-b3f92bc06b40", routeValues);
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
     * Update board options
     *
     * @param {{ [key: string] : string; }} options - options to updated
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} id - identifier for board, either category plural name (Eg:"Stories") or guid
     */
    setBoardOptions(options, teamContext, id) {
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
                    team: team,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "23ad19fc-3b8e-4877-8462-b3f92bc06b40", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, options, options);
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
     * Get board user settings for a board id
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Board ID or Name
     */
    getBoardUserSettings(teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "b30d9f58-1891-4b0a-b168-c46408f919b0", routeValues);
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
     * Update board user settings for the board id
     *
     * @param {{ [key: string] : string; }} boardUserSettings
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board
     */
    updateBoardUserSettings(boardUserSettings, teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "b30d9f58-1891-4b0a-b168-c46408f919b0", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, boardUserSettings, options);
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
     * Get a team's capacity including total capacity and days off
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - ID of the iteration
     */
    getCapacitiesWithIdentityRefAndTotals(teamContext, iterationId) {
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
                    team: team,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "work", "74412d15-8c1a-4352-a48d-ef1ed5587d57", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamCapacity, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a team member's capacity
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - ID of the iteration
     * @param {string} teamMemberId - ID of the team member
     */
    getCapacityWithIdentityRef(teamContext, iterationId, teamMemberId) {
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
                    team: team,
                    iterationId: iterationId,
                    teamMemberId: teamMemberId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "work", "74412d15-8c1a-4352-a48d-ef1ed5587d57", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamMemberCapacityIdentityRef, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Replace a team's capacity
     *
     * @param {WorkInterfaces.TeamMemberCapacityIdentityRef[]} capacities - Team capacity to replace
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - ID of the iteration
     */
    replaceCapacitiesWithIdentityRef(capacities, teamContext, iterationId) {
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
                    team: team,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "work", "74412d15-8c1a-4352-a48d-ef1ed5587d57", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, capacities, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamMemberCapacityIdentityRef, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a team member's capacity
     *
     * @param {WorkInterfaces.CapacityPatch} patch - Updated capacity
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - ID of the iteration
     * @param {string} teamMemberId - ID of the team member
     */
    updateCapacityWithIdentityRef(patch, teamContext, iterationId, teamMemberId) {
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
                    team: team,
                    iterationId: iterationId,
                    teamMemberId: teamMemberId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "work", "74412d15-8c1a-4352-a48d-ef1ed5587d57", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, patch, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamMemberCapacityIdentityRef, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get board card Rule settings for the board id or board by name
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board
     */
    getBoardCardRuleSettings(teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "work", "b044a3d9-02ea-49c7-91a1-b730949cc896", routeValues);
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
     * Update board card Rule settings for the board id or board by name
     *
     * @param {WorkInterfaces.BoardCardRuleSettings} boardCardRuleSettings
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board
     */
    updateBoardCardRuleSettings(boardCardRuleSettings, teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "work", "b044a3d9-02ea-49c7-91a1-b730949cc896", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, boardCardRuleSettings, options);
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
     * Update taskboard card Rule settings
     *
     * @param {WorkInterfaces.BoardCardRuleSettings} boardCardRuleSettings
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateTaskboardCardRuleSettings(boardCardRuleSettings, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "work", "3f84a8d1-1aab-423e-a94b-6dcbdcca511f", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, boardCardRuleSettings, options);
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
     * Get board card settings for the board id or board by name
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board
     */
    getBoardCardSettings(teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "work", "07c3b467-bc60-4f05-8e34-599ce288fafc", routeValues);
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
     * Update board card settings for the board id or board by name
     *
     * @param {WorkInterfaces.BoardCardSettings} boardCardSettingsToSave
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board
     */
    updateBoardCardSettings(boardCardSettingsToSave, teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "work", "07c3b467-bc60-4f05-8e34-599ce288fafc", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, boardCardSettingsToSave, options);
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
     * Update taskboard card settings
     *
     * @param {WorkInterfaces.BoardCardSettings} boardCardSettingsToSave
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateTaskboardCardSettings(boardCardSettingsToSave, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "work", "0d63745f-31f3-4cf3-9056-2a064e567637", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, boardCardSettingsToSave, options);
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
     * Get a board chart
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Identifier for board, either board's backlog level name (Eg:"Stories") or Id
     * @param {string} name - The chart name
     */
    getBoardChart(teamContext, board, name) {
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
                    team: team,
                    board: board,
                    name: name
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "45fe888c-239e-49fd-958c-df1a1ab21d97", routeValues);
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
     * Get board charts
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Identifier for board, either board's backlog level name (Eg:"Stories") or Id
     */
    getBoardCharts(teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "45fe888c-239e-49fd-958c-df1a1ab21d97", routeValues);
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
     * Update a board chart
     *
     * @param {WorkInterfaces.BoardChart} chart
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Identifier for board, either board's backlog level name (Eg:"Stories") or Id
     * @param {string} name - The chart name
     */
    updateBoardChart(chart, teamContext, board, name) {
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
                    team: team,
                    board: board,
                    name: name
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "45fe888c-239e-49fd-958c-df1a1ab21d97", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, chart, options);
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
     * Get columns on a board
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Name or ID of the specific board
     */
    getBoardColumns(teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c555d7ff-84e1-47df-9923-a3fe0cd8751b", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.BoardColumn, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update columns on a board
     *
     * @param {WorkInterfaces.BoardColumn[]} boardColumns - List of board columns to update
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Name or ID of the specific board
     */
    updateBoardColumns(boardColumns, teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c555d7ff-84e1-47df-9923-a3fe0cd8751b", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, boardColumns, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.BoardColumn, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get Delivery View Data
     *
     * @param {string} project - Project ID or project name
     * @param {string} id - Identifier for delivery view
     * @param {number} revision - Revision of the plan for which you want data. If the current plan is a different revision you will get an ViewRevisionMismatchException exception. If you do not supply a revision you will get data for the latest revision.
     * @param {Date} startDate - The start date of timeline
     * @param {Date} endDate - The end date of timeline
     */
    getDeliveryTimelineData(project, id, revision, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    id: id
                };
                let queryValues = {
                    revision: revision,
                    startDate: startDate,
                    endDate: endDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "bdd0834e-101f-49f0-a6ae-509f384a12b4", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.DeliveryViewData, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get an iteration's capacity for all teams in iteration
     *
     * @param {string} project - Project ID or project name
     * @param {string} iterationId - ID of the iteration
     */
    getTotalIterationCapacities(project, iterationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "1e385ce0-396b-4273-8171-d64562c18d37", routeValues);
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
     * Delete a team's iteration by iterationId
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} id - ID of the iteration
     */
    deleteTeamIteration(teamContext, id) {
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
                    team: team,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c9175577-28a1-4b06-9197-8636af9f64ad", routeValues);
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
     * Get team's iteration by iterationId
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} id - ID of the iteration
     */
    getTeamIteration(teamContext, id) {
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
                    team: team,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c9175577-28a1-4b06-9197-8636af9f64ad", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamSettingsIteration, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a team's iterations using timeframe filter
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} timeframe - A filter for which iterations are returned based on relative time. Only Current is supported currently.
     */
    getTeamIterations(teamContext, timeframe) {
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
                    '$timeframe': timeframe,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c9175577-28a1-4b06-9197-8636af9f64ad", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamSettingsIteration, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Add an iteration to the team
     *
     * @param {WorkInterfaces.TeamSettingsIteration} iteration - Iteration to add
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    postTeamIteration(iteration, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c9175577-28a1-4b06-9197-8636af9f64ad", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, iteration, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamSettingsIteration, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Add a new plan for the team
     *
     * @param {WorkInterfaces.CreatePlan} postedPlan - Plan definition
     * @param {string} project - Project ID or project name
     */
    createPlan(postedPlan, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0b42cb47-cd73-4810-ac90-19c9ba147453", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, postedPlan, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.Plan, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete the specified plan
     *
     * @param {string} project - Project ID or project name
     * @param {string} id - Identifier of the plan
     */
    deletePlan(project, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0b42cb47-cd73-4810-ac90-19c9ba147453", routeValues);
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
     * Get the information for the specified plan
     *
     * @param {string} project - Project ID or project name
     * @param {string} id - Identifier of the plan
     */
    getPlan(project, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0b42cb47-cd73-4810-ac90-19c9ba147453", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.Plan, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get the information for all the plans configured for the given team
     *
     * @param {string} project - Project ID or project name
     */
    getPlans(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0b42cb47-cd73-4810-ac90-19c9ba147453", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.Plan, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update the information for the specified plan
     *
     * @param {WorkInterfaces.UpdatePlan} updatedPlan - Plan definition to be updated
     * @param {string} project - Project ID or project name
     * @param {string} id - Identifier of the plan
     */
    updatePlan(updatedPlan, project, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0b42cb47-cd73-4810-ac90-19c9ba147453", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, updatedPlan, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.Plan, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get process configuration
     *
     * @param {string} project - Project ID or project name
     */
    getProcessConfiguration(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "f901ba42-86d2-4b0c-89c1-3f86d06daa84", routeValues);
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
     * Get rows on a board
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Name or ID of the specific board
     */
    getBoardRows(teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0863355d-aefd-4d63-8669-984c9b7b0e78", routeValues);
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
     * Update rows on a board
     *
     * @param {WorkInterfaces.BoardRow[]} boardRows - List of board rows to update
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} board - Name or ID of the specific board
     */
    updateBoardRows(boardRows, teamContext, board) {
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
                    team: team,
                    board: board
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "0863355d-aefd-4d63-8669-984c9b7b0e78", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, boardRows, options);
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
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    getColumns(teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c6815dbe-8e7e-4ffe-9a79-e83ee712aa92", routeValues);
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
     * @param {WorkInterfaces.UpdateTaskboardColumn[]} updateColumns
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateColumns(updateColumns, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c6815dbe-8e7e-4ffe-9a79-e83ee712aa92", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, updateColumns, options);
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
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId
     */
    getWorkItemColumns(teamContext, iterationId) {
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
                    team: team,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "1be23c36-8872-4abc-b57d-402cd6c669d9", routeValues);
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
     * @param {WorkInterfaces.UpdateTaskboardWorkItemColumn} updateColumn
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId
     * @param {number} workItemId
     */
    updateWorkItemColumn(updateColumn, teamContext, iterationId, workItemId) {
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
                    team: team,
                    iterationId: iterationId,
                    workItemId: workItemId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "1be23c36-8872-4abc-b57d-402cd6c669d9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, updateColumn, options);
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
     * Get team's days off for an iteration
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - ID of the iteration
     */
    getTeamDaysOff(teamContext, iterationId) {
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
                    team: team,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "2d4faa2e-9150-4cbf-a47a-932b1b4a0773", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamSettingsDaysOff, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Set a team's days off for an iteration
     *
     * @param {WorkInterfaces.TeamSettingsDaysOffPatch} daysOffPatch - Team's days off patch containing a list of start and end dates
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - ID of the iteration
     */
    updateTeamDaysOff(daysOffPatch, teamContext, iterationId) {
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
                    team: team,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "2d4faa2e-9150-4cbf-a47a-932b1b4a0773", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, daysOffPatch, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamSettingsDaysOff, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a collection of team field values
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    getTeamFieldValues(teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "07ced576-58ed-49e6-9c1e-5cb53ab8bf2a", routeValues);
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
     * Update team field values
     *
     * @param {WorkInterfaces.TeamFieldValuesPatch} patch
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateTeamFieldValues(patch, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "07ced576-58ed-49e6-9c1e-5cb53ab8bf2a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, patch, options);
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
     * Get a team's settings
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    getTeamSettings(teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c3c1012b-bea7-49d7-b45e-1664e566f84c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamSetting, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a team's settings
     *
     * @param {WorkInterfaces.TeamSettingsPatch} teamSettingsPatch - TeamSettings changes
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    updateTeamSettings(teamSettingsPatch, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "c3c1012b-bea7-49d7-b45e-1664e566f84c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, teamSettingsPatch, options);
                    let ret = this.formatResponse(res.result, WorkInterfaces.TypeInfo.TeamSetting, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get work items for iteration
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - ID of the iteration
     */
    getIterationWorkItems(teamContext, iterationId) {
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
                    team: team,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "5b3ef1a6-d3ab-44cd-bafd-c7f45db850fa", routeValues);
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
     * Reorder Product Backlog/Boards Work Items
     *
     * @param {WorkInterfaces.ReorderOperation} operation
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    reorderBacklogWorkItems(operation, teamContext) {
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
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "1c22b714-e7e4-41b9-85e0-56ee13ef55ed", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, operation, options);
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
     * Reorder Sprint Backlog/Taskboard Work Items
     *
     * @param {WorkInterfaces.ReorderOperation} operation
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} iterationId - The id of the iteration
     */
    reorderIterationWorkItems(operation, teamContext, iterationId) {
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
                    team: team,
                    iterationId: iterationId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "work", "47755db2-d7eb-405a-8c25-675401525fc9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, operation, options);
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
WorkApi.RESOURCE_AREA_ID = "1d4f49f9-02b9-4e26-b826-2cdb6195f2a9";
exports.WorkApi = WorkApi;
