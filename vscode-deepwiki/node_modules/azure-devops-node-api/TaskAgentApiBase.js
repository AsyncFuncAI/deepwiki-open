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
class TaskAgentApiBase extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-TaskAgent-api', options);
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentCloud} agentCloud
     */
    addAgentCloud(agentCloud) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "bfa72b3d-0fc6-43fb-932b-a7f6559f93b9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, agentCloud, options);
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
     * @param {number} agentCloudId
     */
    deleteAgentCloud(agentCloudId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    agentCloudId: agentCloudId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "bfa72b3d-0fc6-43fb-932b-a7f6559f93b9", routeValues);
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
     * @param {number} agentCloudId
     */
    getAgentCloud(agentCloudId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    agentCloudId: agentCloudId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "bfa72b3d-0fc6-43fb-932b-a7f6559f93b9", routeValues);
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
     */
    getAgentClouds() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "bfa72b3d-0fc6-43fb-932b-a7f6559f93b9", routeValues);
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
     * @param {TaskAgentInterfaces.TaskAgentCloud} updatedCloud
     * @param {number} agentCloudId
     */
    updateAgentCloud(updatedCloud, agentCloudId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    agentCloudId: agentCloudId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "bfa72b3d-0fc6-43fb-932b-a7f6559f93b9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, updatedCloud, options);
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
     * Get agent cloud types.
     *
     */
    getAgentCloudTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "5932e193-f376-469d-9c3e-e5588ce12cb5", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentCloudType, true);
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
     * @param {number} queueId
     * @param {number} top
     * @param {string} continuationToken
     */
    getAgentRequestsForQueue(project, queueId, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (top == null) {
                throw new TypeError('top can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    queueId: queueId
                };
                let queryValues = {
                    '$top': top,
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "f5f81ffb-f396-498d-85b1-5ada145e648a", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentJobRequest} request
     * @param {string} project - Project ID or project name
     * @param {number} queueId
     */
    queueAgentRequest(request, project, queueId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    queueId: queueId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "f5f81ffb-f396-498d-85b1-5ada145e648a", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, request, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Adds an agent to a pool.  You probably don't want to call this endpoint directly. Instead, [configure an agent](https://docs.microsoft.com/azure/devops/pipelines/agents/agents) using the agent download package.
     *
     * @param {TaskAgentInterfaces.TaskAgent} agent - Details about the agent being added
     * @param {number} poolId - The agent pool in which to add the agent
     */
    addAgent(agent, poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "e298ef32-5878-4cab-993c-043836571f42", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, agent, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgent, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete an agent.  You probably don't want to call this endpoint directly. Instead, [use the agent configuration script](https://docs.microsoft.com/azure/devops/pipelines/agents/agents) to remove an agent from your organization.
     *
     * @param {number} poolId - The pool ID to remove the agent from
     * @param {number} agentId - The agent ID to remove
     */
    deleteAgent(poolId, agentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    agentId: agentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "e298ef32-5878-4cab-993c-043836571f42", routeValues);
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
     * Get information about an agent.
     *
     * @param {number} poolId - The agent pool containing the agent
     * @param {number} agentId - The agent ID to get information about
     * @param {boolean} includeCapabilities - Whether to include the agent's capabilities in the response
     * @param {boolean} includeAssignedRequest - Whether to include details about the agent's current work
     * @param {boolean} includeLastCompletedRequest - Whether to include details about the agents' most recent completed work
     * @param {string[]} propertyFilters - Filter which custom properties will be returned
     */
    getAgent(poolId, agentId, includeCapabilities, includeAssignedRequest, includeLastCompletedRequest, propertyFilters) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    agentId: agentId
                };
                let queryValues = {
                    includeCapabilities: includeCapabilities,
                    includeAssignedRequest: includeAssignedRequest,
                    includeLastCompletedRequest: includeLastCompletedRequest,
                    propertyFilters: propertyFilters && propertyFilters.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "e298ef32-5878-4cab-993c-043836571f42", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgent, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of agents.
     *
     * @param {number} poolId - The agent pool containing the agents
     * @param {string} agentName - Filter on agent name
     * @param {boolean} includeCapabilities - Whether to include the agents' capabilities in the response
     * @param {boolean} includeAssignedRequest - Whether to include details about the agents' current work
     * @param {boolean} includeLastCompletedRequest - Whether to include details about the agents' most recent completed work
     * @param {string[]} propertyFilters - Filter which custom properties will be returned
     * @param {string[]} demands - Filter by demands the agents can satisfy
     */
    getAgents(poolId, agentName, includeCapabilities, includeAssignedRequest, includeLastCompletedRequest, propertyFilters, demands) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    agentName: agentName,
                    includeCapabilities: includeCapabilities,
                    includeAssignedRequest: includeAssignedRequest,
                    includeLastCompletedRequest: includeLastCompletedRequest,
                    propertyFilters: propertyFilters && propertyFilters.join(","),
                    demands: demands && demands.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "e298ef32-5878-4cab-993c-043836571f42", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgent, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Replace an agent.  You probably don't want to call this endpoint directly. Instead, [use the agent configuration script](https://docs.microsoft.com/azure/devops/pipelines/agents/agents) to remove and reconfigure an agent from your organization.
     *
     * @param {TaskAgentInterfaces.TaskAgent} agent - Updated details about the replacing agent
     * @param {number} poolId - The agent pool to use
     * @param {number} agentId - The agent to replace
     */
    replaceAgent(agent, poolId, agentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    agentId: agentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "e298ef32-5878-4cab-993c-043836571f42", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, agent, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgent, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update agent details.
     *
     * @param {TaskAgentInterfaces.TaskAgent} agent - Updated details about the agent
     * @param {number} poolId - The agent pool to use
     * @param {number} agentId - The agent to update
     */
    updateAgent(agent, poolId, agentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    agentId: agentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "e298ef32-5878-4cab-993c-043836571f42", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, agent, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgent, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns list of azure subscriptions
     *
     */
    getAzureManagementGroups() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "39fe3bf2-7ee0-4198-a469-4a29929afa9c", routeValues);
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
     * Returns list of azure subscriptions
     *
     */
    getAzureSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "bcd6189c-0303-471f-a8e1-acb22b74d700", routeValues);
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
     * GET a PAT token for managing (configuring, removing, tagging) deployment targets in a deployment group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment targets are managed.
     */
    generateDeploymentGroupAccessToken(project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "3d197ba2-c3e9-4253-882f-0ee2440f8174", routeValues);
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
     * Create a deployment group.
     *
     * @param {TaskAgentInterfaces.DeploymentGroupCreateParameter} deploymentGroup - Deployment group to create.
     * @param {string} project - Project ID or project name
     */
    addDeploymentGroup(deploymentGroup, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "083c4d89-ab35-45af-aa11-7cf66895c53e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, deploymentGroup, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a deployment group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to be deleted.
     */
    deleteDeploymentGroup(project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "083c4d89-ab35-45af-aa11-7cf66895c53e", routeValues);
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
     * Get a deployment group by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group.
     * @param {TaskAgentInterfaces.DeploymentGroupActionFilter} actionFilter - Get the deployment group only if this action can be performed on it.
     * @param {TaskAgentInterfaces.DeploymentGroupExpands} expand - Include these additional details in the returned object.
     */
    getDeploymentGroup(project, deploymentGroupId, actionFilter, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                let queryValues = {
                    actionFilter: actionFilter,
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "083c4d89-ab35-45af-aa11-7cf66895c53e", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of deployment groups by name or IDs.
     *
     * @param {string} project - Project ID or project name
     * @param {string} name - Name of the deployment group.
     * @param {TaskAgentInterfaces.DeploymentGroupActionFilter} actionFilter - Get only deployment groups on which this action can be performed.
     * @param {TaskAgentInterfaces.DeploymentGroupExpands} expand - Include these additional details in the returned objects.
     * @param {string} continuationToken - Get deployment groups with names greater than this continuationToken lexicographically.
     * @param {number} top - Maximum number of deployment groups to return. Default is **1000**.
     * @param {number[]} ids - Comma separated list of IDs of the deployment groups.
     */
    getDeploymentGroups(project, name, actionFilter, expand, continuationToken, top, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    name: name,
                    actionFilter: actionFilter,
                    '$expand': expand,
                    continuationToken: continuationToken,
                    '$top': top,
                    ids: ids && ids.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "083c4d89-ab35-45af-aa11-7cf66895c53e", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a deployment group.
     *
     * @param {TaskAgentInterfaces.DeploymentGroupUpdateParameter} deploymentGroup - Deployment group to update.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group.
     */
    updateDeploymentGroup(deploymentGroup, project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "083c4d89-ab35-45af-aa11-7cf66895c53e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, deploymentGroup, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of deployment group metrics.
     *
     * @param {string} project - Project ID or project name
     * @param {string} deploymentGroupName - Name of the deployment group.
     * @param {string} continuationToken - Get metrics for deployment groups with names greater than this continuationToken lexicographically.
     * @param {number} top - Maximum number of deployment group metrics to return. Default is **50**.
     */
    getDeploymentGroupsMetrics(project, deploymentGroupName, continuationToken, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    deploymentGroupName: deploymentGroupName,
                    continuationToken: continuationToken,
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "281c6308-427a-49e1-b83a-dac0f4862189", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentGroupMetrics, true);
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
     * @param {number} deploymentGroupId
     * @param {number} machineId
     * @param {number} completedRequestCount
     */
    getAgentRequestsForDeploymentMachine(project, deploymentGroupId, machineId, completedRequestCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (machineId == null) {
                throw new TypeError('machineId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                let queryValues = {
                    machineId: machineId,
                    completedRequestCount: completedRequestCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a3540e5b-f0dc-4668-963b-b752459be545", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
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
     * @param {number} deploymentGroupId
     * @param {number[]} machineIds
     * @param {number} completedRequestCount
     */
    getAgentRequestsForDeploymentMachines(project, deploymentGroupId, machineIds, completedRequestCount) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                let queryValues = {
                    machineIds: machineIds && machineIds.join(","),
                    completedRequestCount: completedRequestCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a3540e5b-f0dc-4668-963b-b752459be545", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
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
     * @param {number} deploymentGroupId
     */
    refreshDeploymentMachines(project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "91006ac4-0f68-4d82-a2bc-540676bd73ce", routeValues);
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
     * GET a PAT token for managing (configuring, removing, tagging) deployment agents in a deployment pool.
     *
     * @param {number} poolId - ID of the deployment pool in which deployment agents are managed.
     */
    generateDeploymentPoolAccessToken(poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "e077ee4a-399b-420b-841f-c43fbc058e0b", routeValues);
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
     * Get a list of deployment pool summaries.
     *
     * @param {string} poolName - Name of the deployment pool.
     * @param {TaskAgentInterfaces.DeploymentPoolSummaryExpands} expands - Include these additional details in the returned objects.
     * @param {number[]} poolIds - List of deployment pool ids.
     */
    getDeploymentPoolsSummary(poolName, expands, poolIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    poolName: poolName,
                    expands: expands,
                    poolIds: poolIds && poolIds.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6525d6c6-258f-40e0-a1a9-8a24a3957625", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentPoolSummary, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get agent requests for a deployment target.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to which the target belongs.
     * @param {number} targetId - ID of the deployment target.
     * @param {number} completedRequestCount - Maximum number of completed requests to return. Default is **50**
     */
    getAgentRequestsForDeploymentTarget(project, deploymentGroupId, targetId, completedRequestCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (targetId == null) {
                throw new TypeError('targetId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                let queryValues = {
                    targetId: targetId,
                    completedRequestCount: completedRequestCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2fac0be3-8c8f-4473-ab93-c1389b08a2c9", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get agent requests for a list deployment targets.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to which the targets belong.
     * @param {number[]} targetIds - Comma separated list of IDs of the deployment targets.
     * @param {number} ownerId - Id of owner of agent job request.
     * @param {Date} completedOn - Datetime to return request after this time.
     * @param {number} completedRequestCount - Maximum number of completed requests to return for each target. Default is **50**
     */
    getAgentRequestsForDeploymentTargets(project, deploymentGroupId, targetIds, ownerId, completedOn, completedRequestCount) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                let queryValues = {
                    targetIds: targetIds && targetIds.join(","),
                    ownerId: ownerId,
                    completedOn: completedOn,
                    completedRequestCount: completedRequestCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2fac0be3-8c8f-4473-ab93-c1389b08a2c9", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Upgrade the deployment targets in a deployment group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group.
     */
    refreshDeploymentTargets(project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "1c1a817f-f23d-41c6-bf8d-14b638f64152", routeValues);
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
     * Proxy for a GET request defined by an 'endpoint'. The request is authorized using a service connection. The response is filtered using an XPath/Json based selector.
     *
     * @param {TaskAgentInterfaces.TaskDefinitionEndpoint} endpoint - Describes the URL to fetch.
     */
    queryEndpoint(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "f223b809-8c33-4b7d-b53f-07232569b5d6", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, endpoint, options);
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
     * Get environment deployment execution history
     *
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {string} continuationToken
     * @param {number} top
     */
    getEnvironmentDeploymentExecutionRecords(project, environmentId, continuationToken, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId
                };
                let queryValues = {
                    continuationToken: continuationToken,
                    top: top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "51bb5d21-4305-4ea6-9dbb-b7488af73334", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.EnvironmentDeploymentExecutionRecord, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create an environment.
     *
     * @param {TaskAgentInterfaces.EnvironmentCreateParameter} environmentCreateParameter - Environment to create.
     * @param {string} project - Project ID or project name
     */
    addEnvironment(environmentCreateParameter, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8572b1fc-2482-47fa-8f74-7e3ed53ee54b", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, environmentCreateParameter, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.EnvironmentInstance, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete the specified environment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} environmentId - ID of the environment.
     */
    deleteEnvironment(project, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8572b1fc-2482-47fa-8f74-7e3ed53ee54b", routeValues);
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
     * Get an environment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} environmentId - ID of the environment.
     * @param {TaskAgentInterfaces.EnvironmentExpands} expands - Include these additional details in the returned objects.
     */
    getEnvironmentById(project, environmentId, expands) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId
                };
                let queryValues = {
                    expands: expands,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8572b1fc-2482-47fa-8f74-7e3ed53ee54b", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.EnvironmentInstance, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get all environments.
     *
     * @param {string} project - Project ID or project name
     * @param {string} name
     * @param {string} continuationToken
     * @param {number} top
     */
    getEnvironments(project, name, continuationToken, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    name: name,
                    continuationToken: continuationToken,
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8572b1fc-2482-47fa-8f74-7e3ed53ee54b", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.EnvironmentInstance, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update the specified environment.
     *
     * @param {TaskAgentInterfaces.EnvironmentUpdateParameter} environmentUpdateParameter - Environment data to update.
     * @param {string} project - Project ID or project name
     * @param {number} environmentId - ID of the environment.
     */
    updateEnvironment(environmentUpdateParameter, project, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8572b1fc-2482-47fa-8f74-7e3ed53ee54b", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, environmentUpdateParameter, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.EnvironmentInstance, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} hubName
     * @param {boolean} includeEnterpriseUsersCount
     * @param {boolean} includeHostedAgentMinutesCount
     */
    getTaskHubLicenseDetails(hubName, includeEnterpriseUsersCount, includeHostedAgentMinutesCount) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    hubName: hubName
                };
                let queryValues = {
                    includeEnterpriseUsersCount: includeEnterpriseUsersCount,
                    includeHostedAgentMinutesCount: includeHostedAgentMinutesCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "distributedtask", "f9f0f436-b8a1-4475-9041-1ccdbf8f0128", routeValues, queryValues);
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
     * @param {TaskAgentInterfaces.TaskHubLicenseDetails} taskHubLicenseDetails
     * @param {string} hubName
     */
    updateTaskHubLicenseDetails(taskHubLicenseDetails, hubName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    hubName: hubName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.3", "distributedtask", "f9f0f436-b8a1-4475-9041-1ccdbf8f0128", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, taskHubLicenseDetails, options);
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
     * @param {TaskAgentInterfaces.InputValidationRequest} inputValidationRequest
     */
    validateInputs(inputValidationRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "58475b1e-adaf-4155-9bc1-e04bf1fff4c2", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, inputValidationRequest, options);
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
     * @param {number} poolId
     * @param {number} requestId
     * @param {string} lockToken
     * @param {TaskAgentInterfaces.TaskResult} result
     * @param {boolean} agentShuttingDown
     */
    deleteAgentRequest(poolId, requestId, lockToken, result, agentShuttingDown) {
        return __awaiter(this, void 0, void 0, function* () {
            if (lockToken == null) {
                throw new TypeError('lockToken can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    requestId: requestId
                };
                let queryValues = {
                    lockToken: lockToken,
                    result: result,
                    agentShuttingDown: agentShuttingDown,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues, queryValues);
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
     * @param {number} poolId
     * @param {number} requestId
     * @param {boolean} includeStatus
     */
    getAgentRequest(poolId, requestId, includeStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    requestId: requestId
                };
                let queryValues = {
                    includeStatus: includeStatus,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number} top
     * @param {string} continuationToken
     */
    getAgentRequests(poolId, top, continuationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (top == null) {
                throw new TypeError('top can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    '$top': top,
                    continuationToken: continuationToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number} agentId
     * @param {number} completedRequestCount
     */
    getAgentRequestsForAgent(poolId, agentId, completedRequestCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (agentId == null) {
                throw new TypeError('agentId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    agentId: agentId,
                    completedRequestCount: completedRequestCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number[]} agentIds
     * @param {number} completedRequestCount
     */
    getAgentRequestsForAgents(poolId, agentIds, completedRequestCount) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    agentIds: agentIds && agentIds.join(","),
                    completedRequestCount: completedRequestCount,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {string} planId
     * @param {string} jobId
     */
    getAgentRequestsForPlan(poolId, planId, jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (planId == null) {
                throw new TypeError('planId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    planId: planId,
                    jobId: jobId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentJobRequest} request
     * @param {number} poolId
     */
    queueAgentRequestByPool(request, poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, request, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentJobRequest} request
     * @param {number} poolId
     * @param {number} requestId
     * @param {string} lockToken
     * @param {TaskAgentInterfaces.TaskAgentRequestUpdateOptions} updateOptions
     */
    updateAgentRequest(request, poolId, requestId, lockToken, updateOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (lockToken == null) {
                throw new TypeError('lockToken can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    requestId: requestId
                };
                let queryValues = {
                    lockToken: lockToken,
                    updateOptions: updateOptions,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "fc825784-c92a-4299-9221-998a02d1b54f", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, request, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentJobRequest, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.KubernetesResourceCreateParameters} createParameters
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     */
    addKubernetesResource(createParameters, project, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "73fba52f-15ab-42b3-a538-ce67a9223a04", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, createParameters, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.KubernetesResource, false);
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
     * @param {number} environmentId
     * @param {number} resourceId
     */
    deleteKubernetesResource(project, environmentId, resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId,
                    resourceId: resourceId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "73fba52f-15ab-42b3-a538-ce67a9223a04", routeValues);
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
     * @param {number} environmentId
     * @param {number} resourceId
     */
    getKubernetesResource(project, environmentId, resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId,
                    resourceId: resourceId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "73fba52f-15ab-42b3-a538-ce67a9223a04", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.KubernetesResource, false);
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
     * @param {number} machineGroupId
     */
    generateDeploymentMachineGroupAccessToken(project, machineGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    machineGroupId: machineGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "f8c7c0de-ac0d-469b-9cb1-c21f72d67693", routeValues);
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
     * @param {TaskAgentInterfaces.DeploymentMachineGroup} machineGroup
     * @param {string} project - Project ID or project name
     */
    addDeploymentMachineGroup(machineGroup, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "d4adf50f-80c6-4ac8-9ca1-6e4e544286e9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, machineGroup, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachineGroup, false);
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
     * @param {number} machineGroupId
     */
    deleteDeploymentMachineGroup(project, machineGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    machineGroupId: machineGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "d4adf50f-80c6-4ac8-9ca1-6e4e544286e9", routeValues);
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
     * @param {number} machineGroupId
     * @param {TaskAgentInterfaces.MachineGroupActionFilter} actionFilter
     */
    getDeploymentMachineGroup(project, machineGroupId, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    machineGroupId: machineGroupId
                };
                let queryValues = {
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "d4adf50f-80c6-4ac8-9ca1-6e4e544286e9", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachineGroup, false);
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
     * @param {string} machineGroupName
     * @param {TaskAgentInterfaces.MachineGroupActionFilter} actionFilter
     */
    getDeploymentMachineGroups(project, machineGroupName, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    machineGroupName: machineGroupName,
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "d4adf50f-80c6-4ac8-9ca1-6e4e544286e9", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachineGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.DeploymentMachineGroup} machineGroup
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     */
    updateDeploymentMachineGroup(machineGroup, project, machineGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    machineGroupId: machineGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "d4adf50f-80c6-4ac8-9ca1-6e4e544286e9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, machineGroup, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachineGroup, false);
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
     * @param {number} machineGroupId
     * @param {string[]} tagFilters
     */
    getDeploymentMachineGroupMachines(project, machineGroupId, tagFilters) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    machineGroupId: machineGroupId
                };
                let queryValues = {
                    tagFilters: tagFilters && tagFilters.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "966c3874-c347-4b18-a90c-d509116717fd", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine[]} deploymentMachines
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     */
    updateDeploymentMachineGroupMachines(deploymentMachines, project, machineGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    machineGroupId: machineGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "966c3874-c347-4b18-a90c-d509116717fd", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, deploymentMachines, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine} machine
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     */
    addDeploymentMachine(machine, project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6f6d406f-cfe6-409c-9327-7009928077e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, machine, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
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
     * @param {number} deploymentGroupId
     * @param {number} machineId
     */
    deleteDeploymentMachine(project, deploymentGroupId, machineId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    machineId: machineId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6f6d406f-cfe6-409c-9327-7009928077e7", routeValues);
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
     * @param {number} deploymentGroupId
     * @param {number} machineId
     * @param {TaskAgentInterfaces.DeploymentMachineExpands} expand
     */
    getDeploymentMachine(project, deploymentGroupId, machineId, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    machineId: machineId
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6f6d406f-cfe6-409c-9327-7009928077e7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
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
     * @param {number} deploymentGroupId
     * @param {string[]} tags
     * @param {string} name
     * @param {TaskAgentInterfaces.DeploymentMachineExpands} expand
     */
    getDeploymentMachines(project, deploymentGroupId, tags, name, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                let queryValues = {
                    tags: tags && tags.join(","),
                    name: name,
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6f6d406f-cfe6-409c-9327-7009928077e7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine} machine
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number} machineId
     */
    replaceDeploymentMachine(machine, project, deploymentGroupId, machineId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    machineId: machineId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6f6d406f-cfe6-409c-9327-7009928077e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, machine, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine} machine
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number} machineId
     */
    updateDeploymentMachine(machine, project, deploymentGroupId, machineId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    machineId: machineId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6f6d406f-cfe6-409c-9327-7009928077e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, machine, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine[]} machines
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     */
    updateDeploymentMachines(machines, project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6f6d406f-cfe6-409c-9327-7009928077e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, machines, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition} definition
     * @param {number} poolId
     */
    createAgentPoolMaintenanceDefinition(definition, poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "80572e16-58f0-4419-ac07-d19fde32195c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, definition, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceDefinition, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number} definitionId
     */
    deleteAgentPoolMaintenanceDefinition(poolId, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    definitionId: definitionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "80572e16-58f0-4419-ac07-d19fde32195c", routeValues);
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
     * @param {number} poolId
     * @param {number} definitionId
     */
    getAgentPoolMaintenanceDefinition(poolId, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    definitionId: definitionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "80572e16-58f0-4419-ac07-d19fde32195c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceDefinition, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     */
    getAgentPoolMaintenanceDefinitions(poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "80572e16-58f0-4419-ac07-d19fde32195c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceDefinition, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition} definition
     * @param {number} poolId
     * @param {number} definitionId
     */
    updateAgentPoolMaintenanceDefinition(definition, poolId, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    definitionId: definitionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "80572e16-58f0-4419-ac07-d19fde32195c", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, definition, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceDefinition, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number} jobId
     */
    deleteAgentPoolMaintenanceJob(poolId, jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    jobId: jobId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "15e7ab6e-abce-4601-a6d8-e111fe148f46", routeValues);
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
     * @param {number} poolId
     * @param {number} jobId
     */
    getAgentPoolMaintenanceJob(poolId, jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    jobId: jobId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "15e7ab6e-abce-4601-a6d8-e111fe148f46", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceJob, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number} jobId
     */
    getAgentPoolMaintenanceJobLogs(poolId, jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    jobId: jobId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "15e7ab6e-abce-4601-a6d8-e111fe148f46", routeValues);
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
     * @param {number} poolId
     * @param {number} definitionId
     */
    getAgentPoolMaintenanceJobs(poolId, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    definitionId: definitionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "15e7ab6e-abce-4601-a6d8-e111fe148f46", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceJob, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceJob} job
     * @param {number} poolId
     */
    queueAgentPoolMaintenanceJob(job, poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "15e7ab6e-abce-4601-a6d8-e111fe148f46", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, job, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceJob, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceJob} job
     * @param {number} poolId
     * @param {number} jobId
     */
    updateAgentPoolMaintenanceJob(job, poolId, jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    jobId: jobId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "15e7ab6e-abce-4601-a6d8-e111fe148f46", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, job, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPoolMaintenanceJob, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number} messageId
     * @param {string} sessionId
     */
    deleteMessage(poolId, messageId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sessionId == null) {
                throw new TypeError('sessionId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    messageId: messageId
                };
                let queryValues = {
                    sessionId: sessionId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "c3a054f6-7a8a-49c0-944e-3a8e5d7adfd7", routeValues, queryValues);
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
     * @param {number} poolId
     * @param {string} sessionId
     * @param {number} lastMessageId
     */
    getMessage(poolId, sessionId, lastMessageId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sessionId == null) {
                throw new TypeError('sessionId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    sessionId: sessionId,
                    lastMessageId: lastMessageId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "c3a054f6-7a8a-49c0-944e-3a8e5d7adfd7", routeValues, queryValues);
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
     * @param {number} poolId
     * @param {number} agentId
     */
    refreshAgent(poolId, agentId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (agentId == null) {
                throw new TypeError('agentId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    agentId: agentId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "c3a054f6-7a8a-49c0-944e-3a8e5d7adfd7", routeValues, queryValues);
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
     * @param {number} poolId
     */
    refreshAgents(poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "c3a054f6-7a8a-49c0-944e-3a8e5d7adfd7", routeValues);
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
     * @param {TaskAgentInterfaces.TaskAgentMessage} message
     * @param {number} poolId
     * @param {number} requestId
     */
    sendMessage(message, poolId, requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (requestId == null) {
                throw new TypeError('requestId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    requestId: requestId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "c3a054f6-7a8a-49c0-944e-3a8e5d7adfd7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, message, options);
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
     * @param {string} packageType
     * @param {string} platform
     * @param {string} version
     */
    getPackage(packageType, platform, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    packageType: packageType,
                    platform: platform,
                    version: version
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "8ffcd551-079c-493a-9c02-54346299d144", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.PackageMetadata, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} packageType
     * @param {string} platform
     * @param {number} top
     */
    getPackages(packageType, platform, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    packageType: packageType,
                    platform: platform
                };
                let queryValues = {
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "8ffcd551-079c-493a-9c02-54346299d144", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.PackageMetadata, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     */
    getAgentPoolMetadata(poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "0d62f887-9f53-48b9-9161-4c35d5735b0f", routeValues);
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
     * @param {any} agentPoolMetadata
     * @param {number} poolId
     */
    setAgentPoolMetadata(customHeaders, agentPoolMetadata, poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "0d62f887-9f53-48b9-9161-4c35d5735b0f", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.replace(url, agentPoolMetadata, options);
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
     * Checks if current identity has passed permissions on a pool.
     *
     * @param {number} poolId - Id of the pool to check
     * @param {number} permissions - Permissions to check. Multiple permissions might be merged into single value using bitwise OR operator (e.g. AgentPoolPermissions.Manage | AgentPoolPermissions.View)
     */
    hasPoolPermissions(poolId, permissions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    permissions: permissions
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "162778f3-4b48-48f3-9d58-436fb9c407bc", routeValues);
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
     * Create an agent pool.
     *
     * @param {TaskAgentInterfaces.TaskAgentPool} pool - Details about the new agent pool
     */
    addAgentPool(pool) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a8c47e17-4d56-4a56-92bb-de7ea7dc65be", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, pool, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPool, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete an agent pool.
     *
     * @param {number} poolId - ID of the agent pool to delete
     */
    deleteAgentPool(poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a8c47e17-4d56-4a56-92bb-de7ea7dc65be", routeValues);
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
     * Get information about an agent pool.
     *
     * @param {number} poolId - An agent pool ID
     * @param {string[]} properties - Agent pool properties (comma-separated)
     * @param {TaskAgentInterfaces.TaskAgentPoolActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentPool(poolId, properties, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                let queryValues = {
                    properties: properties && properties.join(","),
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a8c47e17-4d56-4a56-92bb-de7ea7dc65be", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPool, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of agent pools.
     *
     * @param {string} poolName - Filter by name
     * @param {string[]} properties - Filter by agent pool properties (comma-separated)
     * @param {TaskAgentInterfaces.TaskAgentPoolType} poolType - Filter by pool type
     * @param {TaskAgentInterfaces.TaskAgentPoolActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentPools(poolName, properties, poolType, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    poolName: poolName,
                    properties: properties && properties.join(","),
                    poolType: poolType,
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a8c47e17-4d56-4a56-92bb-de7ea7dc65be", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPool, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of agent pools.
     *
     * @param {number[]} poolIds - pool Ids to fetch
     * @param {TaskAgentInterfaces.TaskAgentPoolActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentPoolsByIds(poolIds, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (poolIds == null) {
                throw new TypeError('poolIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    poolIds: poolIds && poolIds.join(","),
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a8c47e17-4d56-4a56-92bb-de7ea7dc65be", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPool, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update properties on an agent pool
     *
     * @param {TaskAgentInterfaces.TaskAgentPool} pool - Updated agent pool details
     * @param {number} poolId - The agent pool to update
     */
    updateAgentPool(pool, poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "a8c47e17-4d56-4a56-92bb-de7ea7dc65be", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, pool, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentPool, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create a new agent queue to connect a project to an agent pool.
     *
     * @param {TaskAgentInterfaces.TaskAgentQueue} queue - Details about the queue to create
     * @param {string} project - Project ID or project name
     * @param {boolean} authorizePipelines - Automatically authorize this queue when using YAML
     */
    addAgentQueue(queue, project, authorizePipelines) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    authorizePipelines: authorizePipelines,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, queue, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentQueue, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create a new team project.
     *
     * @param {string} project - Project ID or project name
     */
    createTeamProject(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, null, options);
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
     * Removes an agent queue from a project.
     *
     * @param {number} queueId - The agent queue to remove
     * @param {string} project - Project ID or project name
     */
    deleteAgentQueue(queueId, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    queueId: queueId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues);
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
     * Get information about an agent queue.
     *
     * @param {number} queueId - The agent queue to get information about
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueue(queueId, project, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    queueId: queueId
                };
                let queryValues = {
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentQueue, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of agent queues.
     *
     * @param {string} project - Project ID or project name
     * @param {string} queueName - Filter on the agent queue name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueues(project, queueName, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    queueName: queueName,
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentQueue, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of agent queues by their IDs
     *
     * @param {number[]} queueIds - A comma-separated list of agent queue IDs to retrieve
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueuesByIds(queueIds, project, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (queueIds == null) {
                throw new TypeError('queueIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    queueIds: queueIds && queueIds.join(","),
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentQueue, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of agent queues by their names
     *
     * @param {string[]} queueNames - A comma-separated list of agent names to retrieve
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueuesByNames(queueNames, project, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (queueNames == null) {
                throw new TypeError('queueNames can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    queueNames: queueNames && queueNames.join(","),
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentQueue, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of agent queues by pool ids
     *
     * @param {number[]} poolIds - A comma-separated list of pool ids to get the corresponding queues for
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueuesForPools(poolIds, project, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (poolIds == null) {
                throw new TypeError('poolIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    poolIds: poolIds && poolIds.join(","),
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "900fa995-c559-4923-aae7-f8424fe4fbea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentQueue, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} agentCloudId
     */
    getAgentCloudRequests(agentCloudId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    agentCloudId: agentCloudId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "20189bd7-5134-49c2-b8e9-f9e856eea2b2", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentCloudRequest, true);
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
    getResourceLimits() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "1f1f0557-c445-42a6-b4a0-0df605a3a0f8", routeValues);
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
     * @param {string} parallelismTag
     * @param {boolean} poolIsHosted
     * @param {boolean} includeRunningRequests
     */
    getResourceUsage(parallelismTag, poolIsHosted, includeRunningRequests) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    parallelismTag: parallelismTag,
                    poolIsHosted: poolIsHosted,
                    includeRunningRequests: includeRunningRequests,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "eae1d376-a8b1-4475-9041-1dfdbe8f0143", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.ResourceUsage, false);
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
     * @param {string} taskGroupId
     */
    getTaskGroupHistory(project, taskGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    taskGroupId: taskGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "100cc92a-b255-47fa-9ab3-e44a2985a3ac", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroupRevision, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a secure file
     *
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     */
    deleteSecureFile(project, secureFileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    secureFileId: secureFileId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues);
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
     * Download a secure file by Id
     *
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     * @param {string} ticket - A valid download ticket
     * @param {boolean} download - If download is true, the file is sent as attachement in the response body. If download is false, the response body contains the file stream.
     */
    downloadSecureFile(project, secureFileId, ticket, download) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ticket == null) {
                throw new TypeError('ticket can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    secureFileId: secureFileId
                };
                let queryValues = {
                    ticket: ticket,
                    download: download,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues, queryValues);
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
     * Get a secure file
     *
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     * @param {boolean} includeDownloadTicket - If includeDownloadTicket is true and the caller has permissions, a download ticket is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter
     */
    getSecureFile(project, secureFileId, includeDownloadTicket, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    secureFileId: secureFileId
                };
                let queryValues = {
                    includeDownloadTicket: includeDownloadTicket,
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get secure files
     *
     * @param {string} project - Project ID or project name
     * @param {string} namePattern - Name of the secure file to match. Can include wildcards to match multiple files.
     * @param {boolean} includeDownloadTickets - If includeDownloadTickets is true and the caller has permissions, a download ticket for each secure file is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter - Filter by secure file permissions for View, Manage or Use action. Defaults to View.
     */
    getSecureFiles(project, namePattern, includeDownloadTickets, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    namePattern: namePattern,
                    includeDownloadTickets: includeDownloadTickets,
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get secure files
     *
     * @param {string} project - Project ID or project name
     * @param {string[]} secureFileIds - A list of secure file Ids
     * @param {boolean} includeDownloadTickets - If includeDownloadTickets is true and the caller has permissions, a download ticket for each secure file is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter
     */
    getSecureFilesByIds(project, secureFileIds, includeDownloadTickets, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (secureFileIds == null) {
                throw new TypeError('secureFileIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    secureFileIds: secureFileIds && secureFileIds.join(","),
                    includeDownloadTickets: includeDownloadTickets,
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get secure files
     *
     * @param {string} project - Project ID or project name
     * @param {string[]} secureFileNames - A list of secure file Ids
     * @param {boolean} includeDownloadTickets - If includeDownloadTickets is true and the caller has permissions, a download ticket for each secure file is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter
     */
    getSecureFilesByNames(project, secureFileNames, includeDownloadTickets, actionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (secureFileNames == null) {
                throw new TypeError('secureFileNames can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    secureFileNames: secureFileNames && secureFileNames.join(","),
                    includeDownloadTickets: includeDownloadTickets,
                    actionFilter: actionFilter,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Query secure files using a name pattern and a condition on file properties.
     *
     * @param {string} condition - The main condition syntax is described [here](https://go.microsoft.com/fwlink/?linkid=842996). Use the *property('property-name')* function to access the value of the specified property of a secure file. It returns null if the property is not set. E.g. ``` and( eq( property('devices'), '2' ), in( property('provisioning profile type'), 'ad hoc', 'development' ) ) ```
     * @param {string} project - Project ID or project name
     * @param {string} namePattern - Name of the secure file to match. Can include wildcards to match multiple files.
     */
    querySecureFilesByProperties(condition, project, namePattern) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    namePattern: namePattern,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, condition, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update the name or properties of an existing secure file
     *
     * @param {TaskAgentInterfaces.SecureFile} secureFile - The secure file with updated name and/or properties
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     */
    updateSecureFile(secureFile, project, secureFileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    secureFileId: secureFileId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, secureFile, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update properties and/or names of a set of secure files. Files are identified by their IDs. Properties provided override the existing one entirely, i.e. do not merge.
     *
     * @param {TaskAgentInterfaces.SecureFile[]} secureFiles - A list of secure file objects. Only three field must be populated Id, Name, and Properties. The rest of fields in the object are ignored.
     * @param {string} project - Project ID or project name
     */
    updateSecureFiles(secureFiles, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, secureFiles, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Upload a secure file, include the file stream in the request body
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} project - Project ID or project name
     * @param {string} name - Name of the file to upload
     * @param {boolean} authorizePipelines - If authorizePipelines is true, then the secure file is authorized for use by all pipelines in the project.
     */
    uploadSecureFile(customHeaders, contentStream, project, name, authorizePipelines) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name == null) {
                throw new TypeError('name can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    name: name,
                    authorizePipelines: authorizePipelines,
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "adcfd8bc-b184-43ba-bd84-7c8c6a2ff421", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("POST", url, contentStream, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.SecureFile, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskAgentSession} session
     * @param {number} poolId
     */
    createAgentSession(session, poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "134e239e-2df3-4794-a6f6-24f1f19ec8dc", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, session, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgentSession, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {string} sessionId
     */
    deleteAgentSession(poolId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    sessionId: sessionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "134e239e-2df3-4794-a6f6-24f1f19ec8dc", routeValues);
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
     * Register a deployment target to a deployment group. Generally this is called by agent configuration tool.
     *
     * @param {TaskAgentInterfaces.DeploymentMachine} machine - Deployment target to register.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to which the deployment target is registered.
     */
    addDeploymentTarget(machine, project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2f0aa599-c121-4256-a5fd-ba370e0ae7b6", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, machine, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a deployment target in a deployment group. This deletes the agent from associated deployment pool too.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment target is deleted.
     * @param {number} targetId - ID of the deployment target to delete.
     */
    deleteDeploymentTarget(project, deploymentGroupId, targetId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    targetId: targetId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2f0aa599-c121-4256-a5fd-ba370e0ae7b6", routeValues);
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
     * Get a deployment target by its ID in a deployment group
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to which deployment target belongs.
     * @param {number} targetId - ID of the deployment target to return.
     * @param {TaskAgentInterfaces.DeploymentTargetExpands} expand - Include these additional details in the returned objects.
     */
    getDeploymentTarget(project, deploymentGroupId, targetId, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    targetId: targetId
                };
                let queryValues = {
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2f0aa599-c121-4256-a5fd-ba370e0ae7b6", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a list of deployment targets in a deployment group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group.
     * @param {string[]} tags - Get only the deployment targets that contain all these comma separted list of tags.
     * @param {string} name - Name pattern of the deployment targets to return.
     * @param {boolean} partialNameMatch - When set to true, treats **name** as pattern. Else treats it as absolute match. Default is **false**.
     * @param {TaskAgentInterfaces.DeploymentTargetExpands} expand - Include these additional details in the returned objects.
     * @param {TaskAgentInterfaces.TaskAgentStatusFilter} agentStatus - Get only deployment targets that have this status.
     * @param {TaskAgentInterfaces.TaskAgentJobResultFilter} agentJobResult - Get only deployment targets that have this last job result.
     * @param {string} continuationToken - Get deployment targets with names greater than this continuationToken lexicographically.
     * @param {number} top - Maximum number of deployment targets to return. Default is **1000**.
     * @param {boolean} enabled - Get only deployment targets that are enabled or disabled. Default is 'null' which returns all the targets.
     * @param {string[]} propertyFilters
     */
    getDeploymentTargets(project, deploymentGroupId, tags, name, partialNameMatch, expand, agentStatus, agentJobResult, continuationToken, top, enabled, propertyFilters) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                let queryValues = {
                    tags: tags && tags.join(","),
                    name: name,
                    partialNameMatch: partialNameMatch,
                    '$expand': expand,
                    agentStatus: agentStatus,
                    agentJobResult: agentJobResult,
                    continuationToken: continuationToken,
                    '$top': top,
                    enabled: enabled,
                    propertyFilters: propertyFilters && propertyFilters.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2f0aa599-c121-4256-a5fd-ba370e0ae7b6", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Replace a deployment target in a deployment group. Generally this is called by agent configuration tool.
     *
     * @param {TaskAgentInterfaces.DeploymentMachine} machine - New deployment target.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment target is replaced.
     * @param {number} targetId - ID of the deployment target to replace.
     */
    replaceDeploymentTarget(machine, project, deploymentGroupId, targetId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    targetId: targetId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2f0aa599-c121-4256-a5fd-ba370e0ae7b6", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, machine, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a deployment target and its agent properties in a deployment group. Generally this is called by agent configuration tool.
     *
     * @param {TaskAgentInterfaces.DeploymentMachine} machine - Deployment target to update.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment target is updated.
     * @param {number} targetId - ID of the deployment target to update.
     */
    updateDeploymentTarget(machine, project, deploymentGroupId, targetId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId,
                    targetId: targetId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2f0aa599-c121-4256-a5fd-ba370e0ae7b6", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, machine, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update tags of a list of deployment targets in a deployment group.
     *
     * @param {TaskAgentInterfaces.DeploymentTargetUpdateParameter[]} machines - Deployment targets with tags to udpdate.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment targets are updated.
     */
    updateDeploymentTargets(machines, project, deploymentGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    deploymentGroupId: deploymentGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "2f0aa599-c121-4256-a5fd-ba370e0ae7b6", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, machines, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.DeploymentMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Create a task group.
     *
     * @param {TaskAgentInterfaces.TaskGroupCreateParameter} taskGroup - Task group object to create.
     * @param {string} project - Project ID or project name
     */
    addTaskGroup(taskGroup, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, taskGroup, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a task group.
     *
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId - Id of the task group to be deleted.
     * @param {string} comment - Comments to delete.
     */
    deleteTaskGroup(project, taskGroupId, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    taskGroupId: taskGroupId
                };
                let queryValues = {
                    comment: comment,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues, queryValues);
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
     * Get task group.
     *
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId - Id of the task group.
     * @param {string} versionSpec - version specification of the task group. examples: 1, 1.0.
     * @param {TaskAgentInterfaces.TaskGroupExpands} expand - The properties that should be expanded. example $expand=Tasks will expand nested task groups.
     */
    getTaskGroup(project, taskGroupId, versionSpec, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            if (versionSpec == null) {
                throw new TypeError('versionSpec can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    taskGroupId: taskGroupId
                };
                let queryValues = {
                    versionSpec: versionSpec,
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroup, false);
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
     * @param {string} taskGroupId
     * @param {number} revision
     */
    getTaskGroupRevision(project, taskGroupId, revision) {
        return __awaiter(this, void 0, void 0, function* () {
            if (revision == null) {
                throw new TypeError('revision can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    taskGroupId: taskGroupId
                };
                let queryValues = {
                    revision: revision,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues, queryValues);
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
     * List task groups.
     *
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId - Id of the task group.
     * @param {boolean} expanded - 'true' to recursively expand task groups. Default is 'false'.
     * @param {string} taskIdFilter - Guid of the taskId to filter.
     * @param {boolean} deleted - 'true'to include deleted task groups. Default is 'false'.
     * @param {number} top - Number of task groups to get.
     * @param {Date} continuationToken - Gets the task groups after the continuation token provided.
     * @param {TaskAgentInterfaces.TaskGroupQueryOrder} queryOrder - Gets the results in the defined order. Default is 'CreatedOnDescending'.
     */
    getTaskGroups(project, taskGroupId, expanded, taskIdFilter, deleted, top, continuationToken, queryOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    taskGroupId: taskGroupId
                };
                let queryValues = {
                    expanded: expanded,
                    taskIdFilter: taskIdFilter,
                    deleted: deleted,
                    '$top': top,
                    continuationToken: continuationToken,
                    queryOrder: queryOrder,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.PublishTaskGroupMetadata} taskGroupMetadata
     * @param {string} project - Project ID or project name
     * @param {string} parentTaskGroupId
     */
    publishTaskGroup(taskGroupMetadata, project, parentTaskGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (parentTaskGroupId == null) {
                throw new TypeError('parentTaskGroupId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    parentTaskGroupId: parentTaskGroupId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, taskGroupMetadata, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskGroup} taskGroup
     * @param {string} project - Project ID or project name
     */
    undeleteTaskGroup(taskGroup, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, taskGroup, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a task group.
     *
     * @param {TaskAgentInterfaces.TaskGroupUpdateParameter} taskGroup - Task group to update.
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId - Id of the task group to update.
     */
    updateTaskGroup(taskGroup, project, taskGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    taskGroupId: taskGroupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, taskGroup, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.TaskGroupUpdatePropertiesBase} taskGroupUpdateProperties
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId
     * @param {boolean} disablePriorVersions
     */
    updateTaskGroupProperties(taskGroupUpdateProperties, project, taskGroupId, disablePriorVersions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    taskGroupId: taskGroupId
                };
                let queryValues = {
                    disablePriorVersions: disablePriorVersions,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "6c08ffbf-dbf1-4f9a-94e5-a1cbd47005e7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, taskGroupUpdateProperties, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} taskId
     */
    deleteTaskDefinition(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    taskId: taskId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "60aac929-f0cd-4bc8-9ce4-6b30e8f1b1bd", routeValues);
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
     * @param {string} taskId
     * @param {string} versionString
     * @param {string[]} visibility
     * @param {boolean} scopeLocal
     */
    getTaskContentZip(taskId, versionString, visibility, scopeLocal) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    taskId: taskId,
                    versionString: versionString
                };
                let queryValues = {
                    visibility: visibility,
                    scopeLocal: scopeLocal,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "60aac929-f0cd-4bc8-9ce4-6b30e8f1b1bd", routeValues, queryValues);
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
     * @param {string} taskId
     * @param {string} versionString
     * @param {string[]} visibility
     * @param {boolean} scopeLocal
     */
    getTaskDefinition(taskId, versionString, visibility, scopeLocal) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    taskId: taskId,
                    versionString: versionString
                };
                let queryValues = {
                    visibility: visibility,
                    scopeLocal: scopeLocal,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "60aac929-f0cd-4bc8-9ce4-6b30e8f1b1bd", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskDefinition, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} taskId
     * @param {string[]} visibility
     * @param {boolean} scopeLocal
     * @param {boolean} allVersions
     */
    getTaskDefinitions(taskId, visibility, scopeLocal, allVersions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    taskId: taskId
                };
                let queryValues = {
                    visibility: visibility,
                    scopeLocal: scopeLocal,
                    allVersions: allVersions,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "60aac929-f0cd-4bc8-9ce4-6b30e8f1b1bd", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskDefinition, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {number} poolId
     * @param {number} agentId
     * @param {string} currentState
     */
    updateAgentUpdateState(poolId, agentId, currentState) {
        return __awaiter(this, void 0, void 0, function* () {
            if (currentState == null) {
                throw new TypeError('currentState can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    agentId: agentId
                };
                let queryValues = {
                    currentState: currentState,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "8cc1b02b-ae49-4516-b5ad-4f9b29967c30", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, null, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgent, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {{ [key: string] : string; }} userCapabilities
     * @param {number} poolId
     * @param {number} agentId
     */
    updateAgentUserCapabilities(userCapabilities, poolId, agentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    poolId: poolId,
                    agentId: agentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "30ba3ada-fedf-4da8-bbb5-dacf2f82e176", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, userCapabilities, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.TaskAgent, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Add a variable group.
     *
     * @param {TaskAgentInterfaces.VariableGroupParameters} variableGroupParameters
     */
    addVariableGroup(variableGroupParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "ef5b7057-ffc3-4c77-bbad-c10b4a4abcc7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, variableGroupParameters, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VariableGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a variable group
     *
     * @param {number} groupId - Id of the variable group.
     * @param {string[]} projectIds
     */
    deleteVariableGroup(groupId, projectIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (projectIds == null) {
                throw new TypeError('projectIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    groupId: groupId
                };
                let queryValues = {
                    projectIds: projectIds && projectIds.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "ef5b7057-ffc3-4c77-bbad-c10b4a4abcc7", routeValues, queryValues);
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
     * Add a variable group.
     *
     * @param {TaskAgentInterfaces.VariableGroupProjectReference[]} variableGroupProjectReferences
     * @param {number} variableGroupId
     */
    shareVariableGroup(variableGroupProjectReferences, variableGroupId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (variableGroupId == null) {
                throw new TypeError('variableGroupId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    variableGroupId: variableGroupId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "ef5b7057-ffc3-4c77-bbad-c10b4a4abcc7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, variableGroupProjectReferences, options);
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
     * Update a variable group.
     *
     * @param {TaskAgentInterfaces.VariableGroupParameters} variableGroupParameters
     * @param {number} groupId - Id of the variable group to update.
     */
    updateVariableGroup(variableGroupParameters, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    groupId: groupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "ef5b7057-ffc3-4c77-bbad-c10b4a4abcc7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, variableGroupParameters, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VariableGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get a variable group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} groupId - Id of the variable group.
     */
    getVariableGroup(project, groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    groupId: groupId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "f5b09dd5-9d54-45a1-8b5a-1c8287d634cc", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VariableGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get variable groups.
     *
     * @param {string} project - Project ID or project name
     * @param {string} groupName - Name of variable group.
     * @param {TaskAgentInterfaces.VariableGroupActionFilter} actionFilter - Action filter for the variable group. It specifies the action which can be performed on the variable groups.
     * @param {number} top - Number of variable groups to get.
     * @param {number} continuationToken - Gets the variable groups after the continuation token provided.
     * @param {TaskAgentInterfaces.VariableGroupQueryOrder} queryOrder - Gets the results in the defined order. Default is 'IdDescending'.
     */
    getVariableGroups(project, groupName, actionFilter, top, continuationToken, queryOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    groupName: groupName,
                    actionFilter: actionFilter,
                    '$top': top,
                    continuationToken: continuationToken,
                    queryOrder: queryOrder,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "f5b09dd5-9d54-45a1-8b5a-1c8287d634cc", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VariableGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get variable groups by ids.
     *
     * @param {string} project - Project ID or project name
     * @param {number[]} groupIds - Comma separated list of Ids of variable groups.
     */
    getVariableGroupsById(project, groupIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (groupIds == null) {
                throw new TypeError('groupIds can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                let queryValues = {
                    groupIds: groupIds && groupIds.join(","),
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "distributedtask", "f5b09dd5-9d54-45a1-8b5a-1c8287d634cc", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VariableGroup, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.VirtualMachineGroupCreateParameters} createParameters
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     */
    addVirtualMachineGroup(createParameters, project, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "9e597901-4af7-4cc3-8d92-47d54db8ebfb", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, createParameters, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VirtualMachineGroup, false);
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
     * @param {number} environmentId
     * @param {number} resourceId
     */
    deleteVirtualMachineGroup(project, environmentId, resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId,
                    resourceId: resourceId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "9e597901-4af7-4cc3-8d92-47d54db8ebfb", routeValues);
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
     * @param {number} environmentId
     * @param {number} resourceId
     */
    getVirtualMachineGroup(project, environmentId, resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId,
                    resourceId: resourceId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "9e597901-4af7-4cc3-8d92-47d54db8ebfb", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VirtualMachineGroup, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.VirtualMachineGroup} resource
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     */
    updateVirtualMachineGroup(resource, project, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "9e597901-4af7-4cc3-8d92-47d54db8ebfb", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, resource, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VirtualMachineGroup, false);
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
     * @param {number} environmentId
     * @param {number} resourceId
     * @param {string} continuationToken
     * @param {string} name
     * @param {boolean} partialNameMatch
     * @param {string[]} tags
     * @param {number} top
     */
    getVirtualMachines(project, environmentId, resourceId, continuationToken, name, partialNameMatch, tags, top) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId,
                    resourceId: resourceId
                };
                let queryValues = {
                    continuationToken: continuationToken,
                    name: name,
                    partialNameMatch: partialNameMatch,
                    tags: tags && tags.join(","),
                    '$top': top,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "48700676-2ba5-4282-8ec8-083280d169c7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VirtualMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {TaskAgentInterfaces.VirtualMachine[]} machines
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {number} resourceId
     */
    updateVirtualMachines(machines, project, environmentId, resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    environmentId: environmentId,
                    resourceId: resourceId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "48700676-2ba5-4282-8ec8-083280d169c7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, machines, options);
                    let ret = this.formatResponse(res.result, TaskAgentInterfaces.TypeInfo.VirtualMachine, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} tenantId
     * @param {string} redirectUri
     * @param {TaskAgentInterfaces.AadLoginPromptOption} promptOption
     * @param {string} completeCallbackPayload
     * @param {boolean} completeCallbackByAuthCode
     */
    createAadOAuthRequest(tenantId, redirectUri, promptOption, completeCallbackPayload, completeCallbackByAuthCode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tenantId == null) {
                throw new TypeError('tenantId can not be null or undefined');
            }
            if (redirectUri == null) {
                throw new TypeError('redirectUri can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    tenantId: tenantId,
                    redirectUri: redirectUri,
                    promptOption: promptOption,
                    completeCallbackPayload: completeCallbackPayload,
                    completeCallbackByAuthCode: completeCallbackByAuthCode,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "9c63205e-3a0f-42a0-ad88-095200f13607", routeValues, queryValues);
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
     */
    getVstsAadTenantId() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "9c63205e-3a0f-42a0-ad88-095200f13607", routeValues);
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
     * GET the Yaml schema used for Yaml file validation.
     *
     * @param {boolean} validateTaskNames - Whether the schema should validate that tasks are actually installed (useful for offline tools where you don't want validation).
     */
    getYamlSchema(validateTaskNames) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    validateTaskNames: validateTaskNames,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "distributedtask", "1f9990b9-1dba-441f-9c2e-6485888c42b6", routeValues, queryValues);
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
}
TaskAgentApiBase.RESOURCE_AREA_ID = "a85b8835-c1a1-4aac-ae97-1c3d0ba72dbd";
exports.TaskAgentApiBase = TaskAgentApiBase;
