/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import TaskAgentInterfaces = require("./interfaces/TaskAgentInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface ITaskAgentApiBase extends basem.ClientApiBase {
    addAgentCloud(agentCloud: TaskAgentInterfaces.TaskAgentCloud): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    deleteAgentCloud(agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    getAgentCloud(agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    getAgentClouds(): Promise<TaskAgentInterfaces.TaskAgentCloud[]>;
    updateAgentCloud(updatedCloud: TaskAgentInterfaces.TaskAgentCloud, agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    getAgentCloudTypes(): Promise<TaskAgentInterfaces.TaskAgentCloudType[]>;
    getAgentRequestsForQueue(project: string, queueId: number, top: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.TaskAgentJobRequest>>;
    queueAgentRequest(request: TaskAgentInterfaces.TaskAgentJobRequest, project: string, queueId: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    addAgent(agent: TaskAgentInterfaces.TaskAgent, poolId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    deleteAgent(poolId: number, agentId: number): Promise<void>;
    getAgent(poolId: number, agentId: number, includeCapabilities?: boolean, includeAssignedRequest?: boolean, includeLastCompletedRequest?: boolean, propertyFilters?: string[]): Promise<TaskAgentInterfaces.TaskAgent>;
    getAgents(poolId: number, agentName?: string, includeCapabilities?: boolean, includeAssignedRequest?: boolean, includeLastCompletedRequest?: boolean, propertyFilters?: string[], demands?: string[]): Promise<TaskAgentInterfaces.TaskAgent[]>;
    replaceAgent(agent: TaskAgentInterfaces.TaskAgent, poolId: number, agentId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    updateAgent(agent: TaskAgentInterfaces.TaskAgent, poolId: number, agentId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    getAzureManagementGroups(): Promise<TaskAgentInterfaces.AzureManagementGroupQueryResult>;
    getAzureSubscriptions(): Promise<TaskAgentInterfaces.AzureSubscriptionQueryResult>;
    generateDeploymentGroupAccessToken(project: string, deploymentGroupId: number): Promise<string>;
    addDeploymentGroup(deploymentGroup: TaskAgentInterfaces.DeploymentGroupCreateParameter, project: string): Promise<TaskAgentInterfaces.DeploymentGroup>;
    deleteDeploymentGroup(project: string, deploymentGroupId: number): Promise<void>;
    getDeploymentGroup(project: string, deploymentGroupId: number, actionFilter?: TaskAgentInterfaces.DeploymentGroupActionFilter, expand?: TaskAgentInterfaces.DeploymentGroupExpands): Promise<TaskAgentInterfaces.DeploymentGroup>;
    getDeploymentGroups(project: string, name?: string, actionFilter?: TaskAgentInterfaces.DeploymentGroupActionFilter, expand?: TaskAgentInterfaces.DeploymentGroupExpands, continuationToken?: string, top?: number, ids?: number[]): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.DeploymentGroup>>;
    updateDeploymentGroup(deploymentGroup: TaskAgentInterfaces.DeploymentGroupUpdateParameter, project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentGroup>;
    getDeploymentGroupsMetrics(project: string, deploymentGroupName?: string, continuationToken?: string, top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.DeploymentGroupMetrics>>;
    getAgentRequestsForDeploymentMachine(project: string, deploymentGroupId: number, machineId: number, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    getAgentRequestsForDeploymentMachines(project: string, deploymentGroupId: number, machineIds?: number[], completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    refreshDeploymentMachines(project: string, deploymentGroupId: number): Promise<void>;
    generateDeploymentPoolAccessToken(poolId: number): Promise<string>;
    getDeploymentPoolsSummary(poolName?: string, expands?: TaskAgentInterfaces.DeploymentPoolSummaryExpands, poolIds?: number[]): Promise<TaskAgentInterfaces.DeploymentPoolSummary[]>;
    getAgentRequestsForDeploymentTarget(project: string, deploymentGroupId: number, targetId: number, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    getAgentRequestsForDeploymentTargets(project: string, deploymentGroupId: number, targetIds?: number[], ownerId?: number, completedOn?: Date, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    refreshDeploymentTargets(project: string, deploymentGroupId: number): Promise<void>;
    queryEndpoint(endpoint: TaskAgentInterfaces.TaskDefinitionEndpoint): Promise<string[]>;
    getEnvironmentDeploymentExecutionRecords(project: string, environmentId: number, continuationToken?: string, top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.EnvironmentDeploymentExecutionRecord>>;
    addEnvironment(environmentCreateParameter: TaskAgentInterfaces.EnvironmentCreateParameter, project: string): Promise<TaskAgentInterfaces.EnvironmentInstance>;
    deleteEnvironment(project: string, environmentId: number): Promise<void>;
    getEnvironmentById(project: string, environmentId: number, expands?: TaskAgentInterfaces.EnvironmentExpands): Promise<TaskAgentInterfaces.EnvironmentInstance>;
    getEnvironments(project: string, name?: string, continuationToken?: string, top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.EnvironmentInstance>>;
    updateEnvironment(environmentUpdateParameter: TaskAgentInterfaces.EnvironmentUpdateParameter, project: string, environmentId: number): Promise<TaskAgentInterfaces.EnvironmentInstance>;
    getTaskHubLicenseDetails(hubName: string, includeEnterpriseUsersCount?: boolean, includeHostedAgentMinutesCount?: boolean): Promise<TaskAgentInterfaces.TaskHubLicenseDetails>;
    updateTaskHubLicenseDetails(taskHubLicenseDetails: TaskAgentInterfaces.TaskHubLicenseDetails, hubName: string): Promise<TaskAgentInterfaces.TaskHubLicenseDetails>;
    validateInputs(inputValidationRequest: TaskAgentInterfaces.InputValidationRequest): Promise<TaskAgentInterfaces.InputValidationRequest>;
    deleteAgentRequest(poolId: number, requestId: number, lockToken: string, result?: TaskAgentInterfaces.TaskResult, agentShuttingDown?: boolean): Promise<void>;
    getAgentRequest(poolId: number, requestId: number, includeStatus?: boolean): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    getAgentRequests(poolId: number, top: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.TaskAgentJobRequest>>;
    getAgentRequestsForAgent(poolId: number, agentId: number, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    getAgentRequestsForAgents(poolId: number, agentIds?: number[], completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    getAgentRequestsForPlan(poolId: number, planId: string, jobId?: string): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    queueAgentRequestByPool(request: TaskAgentInterfaces.TaskAgentJobRequest, poolId: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    updateAgentRequest(request: TaskAgentInterfaces.TaskAgentJobRequest, poolId: number, requestId: number, lockToken: string, updateOptions?: TaskAgentInterfaces.TaskAgentRequestUpdateOptions): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    addKubernetesResource(createParameters: TaskAgentInterfaces.KubernetesResourceCreateParameters, project: string, environmentId: number): Promise<TaskAgentInterfaces.KubernetesResource>;
    deleteKubernetesResource(project: string, environmentId: number, resourceId: number): Promise<void>;
    getKubernetesResource(project: string, environmentId: number, resourceId: number): Promise<TaskAgentInterfaces.KubernetesResource>;
    generateDeploymentMachineGroupAccessToken(project: string, machineGroupId: number): Promise<string>;
    addDeploymentMachineGroup(machineGroup: TaskAgentInterfaces.DeploymentMachineGroup, project: string): Promise<TaskAgentInterfaces.DeploymentMachineGroup>;
    deleteDeploymentMachineGroup(project: string, machineGroupId: number): Promise<void>;
    getDeploymentMachineGroup(project: string, machineGroupId: number, actionFilter?: TaskAgentInterfaces.MachineGroupActionFilter): Promise<TaskAgentInterfaces.DeploymentMachineGroup>;
    getDeploymentMachineGroups(project: string, machineGroupName?: string, actionFilter?: TaskAgentInterfaces.MachineGroupActionFilter): Promise<TaskAgentInterfaces.DeploymentMachineGroup[]>;
    updateDeploymentMachineGroup(machineGroup: TaskAgentInterfaces.DeploymentMachineGroup, project: string, machineGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachineGroup>;
    getDeploymentMachineGroupMachines(project: string, machineGroupId: number, tagFilters?: string[]): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    updateDeploymentMachineGroupMachines(deploymentMachines: TaskAgentInterfaces.DeploymentMachine[], project: string, machineGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    addDeploymentMachine(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    deleteDeploymentMachine(project: string, deploymentGroupId: number, machineId: number): Promise<void>;
    getDeploymentMachine(project: string, deploymentGroupId: number, machineId: number, expand?: TaskAgentInterfaces.DeploymentMachineExpands): Promise<TaskAgentInterfaces.DeploymentMachine>;
    getDeploymentMachines(project: string, deploymentGroupId: number, tags?: string[], name?: string, expand?: TaskAgentInterfaces.DeploymentMachineExpands): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    replaceDeploymentMachine(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, machineId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    updateDeploymentMachine(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, machineId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    updateDeploymentMachines(machines: TaskAgentInterfaces.DeploymentMachine[], project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    createAgentPoolMaintenanceDefinition(definition: TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition, poolId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition>;
    deleteAgentPoolMaintenanceDefinition(poolId: number, definitionId: number): Promise<void>;
    getAgentPoolMaintenanceDefinition(poolId: number, definitionId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition>;
    getAgentPoolMaintenanceDefinitions(poolId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition[]>;
    updateAgentPoolMaintenanceDefinition(definition: TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition, poolId: number, definitionId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition>;
    deleteAgentPoolMaintenanceJob(poolId: number, jobId: number): Promise<void>;
    getAgentPoolMaintenanceJob(poolId: number, jobId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob>;
    getAgentPoolMaintenanceJobLogs(poolId: number, jobId: number): Promise<NodeJS.ReadableStream>;
    getAgentPoolMaintenanceJobs(poolId: number, definitionId?: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob[]>;
    queueAgentPoolMaintenanceJob(job: TaskAgentInterfaces.TaskAgentPoolMaintenanceJob, poolId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob>;
    updateAgentPoolMaintenanceJob(job: TaskAgentInterfaces.TaskAgentPoolMaintenanceJob, poolId: number, jobId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob>;
    deleteMessage(poolId: number, messageId: number, sessionId: string): Promise<void>;
    getMessage(poolId: number, sessionId: string, lastMessageId?: number): Promise<TaskAgentInterfaces.TaskAgentMessage>;
    refreshAgent(poolId: number, agentId: number): Promise<void>;
    refreshAgents(poolId: number): Promise<void>;
    sendMessage(message: TaskAgentInterfaces.TaskAgentMessage, poolId: number, requestId: number): Promise<void>;
    getPackage(packageType: string, platform: string, version: string): Promise<TaskAgentInterfaces.PackageMetadata>;
    getPackages(packageType: string, platform?: string, top?: number): Promise<TaskAgentInterfaces.PackageMetadata[]>;
    getAgentPoolMetadata(poolId: number): Promise<NodeJS.ReadableStream>;
    setAgentPoolMetadata(customHeaders: any, agentPoolMetadata: any, poolId: number): Promise<void>;
    hasPoolPermissions(poolId: number, permissions: number): Promise<boolean>;
    addAgentPool(pool: TaskAgentInterfaces.TaskAgentPool): Promise<TaskAgentInterfaces.TaskAgentPool>;
    deleteAgentPool(poolId: number): Promise<void>;
    getAgentPool(poolId: number, properties?: string[], actionFilter?: TaskAgentInterfaces.TaskAgentPoolActionFilter): Promise<TaskAgentInterfaces.TaskAgentPool>;
    getAgentPools(poolName?: string, properties?: string[], poolType?: TaskAgentInterfaces.TaskAgentPoolType, actionFilter?: TaskAgentInterfaces.TaskAgentPoolActionFilter): Promise<TaskAgentInterfaces.TaskAgentPool[]>;
    getAgentPoolsByIds(poolIds: number[], actionFilter?: TaskAgentInterfaces.TaskAgentPoolActionFilter): Promise<TaskAgentInterfaces.TaskAgentPool[]>;
    updateAgentPool(pool: TaskAgentInterfaces.TaskAgentPool, poolId: number): Promise<TaskAgentInterfaces.TaskAgentPool>;
    addAgentQueue(queue: TaskAgentInterfaces.TaskAgentQueue, project?: string, authorizePipelines?: boolean): Promise<TaskAgentInterfaces.TaskAgentQueue>;
    createTeamProject(project?: string): Promise<void>;
    deleteAgentQueue(queueId: number, project?: string): Promise<void>;
    getAgentQueue(queueId: number, project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue>;
    getAgentQueues(project?: string, queueName?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    getAgentQueuesByIds(queueIds: number[], project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    getAgentQueuesByNames(queueNames: string[], project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    getAgentQueuesForPools(poolIds: number[], project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    getAgentCloudRequests(agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloudRequest[]>;
    getResourceLimits(): Promise<TaskAgentInterfaces.ResourceLimit[]>;
    getResourceUsage(parallelismTag?: string, poolIsHosted?: boolean, includeRunningRequests?: boolean): Promise<TaskAgentInterfaces.ResourceUsage>;
    getTaskGroupHistory(project: string, taskGroupId: string): Promise<TaskAgentInterfaces.TaskGroupRevision[]>;
    deleteSecureFile(project: string, secureFileId: string): Promise<void>;
    downloadSecureFile(project: string, secureFileId: string, ticket: string, download?: boolean): Promise<NodeJS.ReadableStream>;
    getSecureFile(project: string, secureFileId: string, includeDownloadTicket?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile>;
    getSecureFiles(project: string, namePattern?: string, includeDownloadTickets?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile[]>;
    getSecureFilesByIds(project: string, secureFileIds: string[], includeDownloadTickets?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile[]>;
    getSecureFilesByNames(project: string, secureFileNames: string[], includeDownloadTickets?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile[]>;
    querySecureFilesByProperties(condition: string, project: string, namePattern?: string): Promise<TaskAgentInterfaces.SecureFile[]>;
    updateSecureFile(secureFile: TaskAgentInterfaces.SecureFile, project: string, secureFileId: string): Promise<TaskAgentInterfaces.SecureFile>;
    updateSecureFiles(secureFiles: TaskAgentInterfaces.SecureFile[], project: string): Promise<TaskAgentInterfaces.SecureFile[]>;
    uploadSecureFile(customHeaders: any, contentStream: NodeJS.ReadableStream, project: string, name: string, authorizePipelines?: boolean): Promise<TaskAgentInterfaces.SecureFile>;
    createAgentSession(session: TaskAgentInterfaces.TaskAgentSession, poolId: number): Promise<TaskAgentInterfaces.TaskAgentSession>;
    deleteAgentSession(poolId: number, sessionId: string): Promise<void>;
    addDeploymentTarget(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    deleteDeploymentTarget(project: string, deploymentGroupId: number, targetId: number): Promise<void>;
    getDeploymentTarget(project: string, deploymentGroupId: number, targetId: number, expand?: TaskAgentInterfaces.DeploymentTargetExpands): Promise<TaskAgentInterfaces.DeploymentMachine>;
    getDeploymentTargets(project: string, deploymentGroupId: number, tags?: string[], name?: string, partialNameMatch?: boolean, expand?: TaskAgentInterfaces.DeploymentTargetExpands, agentStatus?: TaskAgentInterfaces.TaskAgentStatusFilter, agentJobResult?: TaskAgentInterfaces.TaskAgentJobResultFilter, continuationToken?: string, top?: number, enabled?: boolean, propertyFilters?: string[]): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.DeploymentMachine>>;
    replaceDeploymentTarget(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, targetId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    updateDeploymentTarget(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, targetId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    updateDeploymentTargets(machines: TaskAgentInterfaces.DeploymentTargetUpdateParameter[], project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    addTaskGroup(taskGroup: TaskAgentInterfaces.TaskGroupCreateParameter, project: string): Promise<TaskAgentInterfaces.TaskGroup>;
    deleteTaskGroup(project: string, taskGroupId: string, comment?: string): Promise<void>;
    getTaskGroup(project: string, taskGroupId: string, versionSpec: string, expand?: TaskAgentInterfaces.TaskGroupExpands): Promise<TaskAgentInterfaces.TaskGroup>;
    getTaskGroupRevision(project: string, taskGroupId: string, revision: number): Promise<NodeJS.ReadableStream>;
    getTaskGroups(project: string, taskGroupId?: string, expanded?: boolean, taskIdFilter?: string, deleted?: boolean, top?: number, continuationToken?: Date, queryOrder?: TaskAgentInterfaces.TaskGroupQueryOrder): Promise<TaskAgentInterfaces.TaskGroup[]>;
    publishTaskGroup(taskGroupMetadata: TaskAgentInterfaces.PublishTaskGroupMetadata, project: string, parentTaskGroupId: string): Promise<TaskAgentInterfaces.TaskGroup[]>;
    undeleteTaskGroup(taskGroup: TaskAgentInterfaces.TaskGroup, project: string): Promise<TaskAgentInterfaces.TaskGroup[]>;
    updateTaskGroup(taskGroup: TaskAgentInterfaces.TaskGroupUpdateParameter, project: string, taskGroupId?: string): Promise<TaskAgentInterfaces.TaskGroup>;
    updateTaskGroupProperties(taskGroupUpdateProperties: TaskAgentInterfaces.TaskGroupUpdatePropertiesBase, project: string, taskGroupId: string, disablePriorVersions?: boolean): Promise<TaskAgentInterfaces.TaskGroup[]>;
    deleteTaskDefinition(taskId: string): Promise<void>;
    getTaskContentZip(taskId: string, versionString: string, visibility?: string[], scopeLocal?: boolean): Promise<NodeJS.ReadableStream>;
    getTaskDefinition(taskId: string, versionString: string, visibility?: string[], scopeLocal?: boolean): Promise<TaskAgentInterfaces.TaskDefinition>;
    getTaskDefinitions(taskId?: string, visibility?: string[], scopeLocal?: boolean, allVersions?: boolean): Promise<TaskAgentInterfaces.TaskDefinition[]>;
    updateAgentUpdateState(poolId: number, agentId: number, currentState: string): Promise<TaskAgentInterfaces.TaskAgent>;
    updateAgentUserCapabilities(userCapabilities: {
        [key: string]: string;
    }, poolId: number, agentId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    addVariableGroup(variableGroupParameters: TaskAgentInterfaces.VariableGroupParameters): Promise<TaskAgentInterfaces.VariableGroup>;
    deleteVariableGroup(groupId: number, projectIds: string[]): Promise<void>;
    shareVariableGroup(variableGroupProjectReferences: TaskAgentInterfaces.VariableGroupProjectReference[], variableGroupId: number): Promise<void>;
    updateVariableGroup(variableGroupParameters: TaskAgentInterfaces.VariableGroupParameters, groupId: number): Promise<TaskAgentInterfaces.VariableGroup>;
    getVariableGroup(project: string, groupId: number): Promise<TaskAgentInterfaces.VariableGroup>;
    getVariableGroups(project: string, groupName?: string, actionFilter?: TaskAgentInterfaces.VariableGroupActionFilter, top?: number, continuationToken?: number, queryOrder?: TaskAgentInterfaces.VariableGroupQueryOrder): Promise<TaskAgentInterfaces.VariableGroup[]>;
    getVariableGroupsById(project: string, groupIds: number[]): Promise<TaskAgentInterfaces.VariableGroup[]>;
    addVirtualMachineGroup(createParameters: TaskAgentInterfaces.VirtualMachineGroupCreateParameters, project: string, environmentId: number): Promise<TaskAgentInterfaces.VirtualMachineGroup>;
    deleteVirtualMachineGroup(project: string, environmentId: number, resourceId: number): Promise<void>;
    getVirtualMachineGroup(project: string, environmentId: number, resourceId: number): Promise<TaskAgentInterfaces.VirtualMachineGroup>;
    updateVirtualMachineGroup(resource: TaskAgentInterfaces.VirtualMachineGroup, project: string, environmentId: number): Promise<TaskAgentInterfaces.VirtualMachineGroup>;
    getVirtualMachines(project: string, environmentId: number, resourceId: number, continuationToken?: string, name?: string, partialNameMatch?: boolean, tags?: string[], top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.VirtualMachine>>;
    updateVirtualMachines(machines: TaskAgentInterfaces.VirtualMachine[], project: string, environmentId: number, resourceId: number): Promise<TaskAgentInterfaces.VirtualMachine[]>;
    createAadOAuthRequest(tenantId: string, redirectUri: string, promptOption?: TaskAgentInterfaces.AadLoginPromptOption, completeCallbackPayload?: string, completeCallbackByAuthCode?: boolean): Promise<string>;
    getVstsAadTenantId(): Promise<string>;
    getYamlSchema(validateTaskNames?: boolean): Promise<any>;
}
export declare class TaskAgentApiBase extends basem.ClientApiBase implements ITaskAgentApiBase {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "a85b8835-c1a1-4aac-ae97-1c3d0ba72dbd";
    /**
     * @param {TaskAgentInterfaces.TaskAgentCloud} agentCloud
     */
    addAgentCloud(agentCloud: TaskAgentInterfaces.TaskAgentCloud): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    /**
     * @param {number} agentCloudId
     */
    deleteAgentCloud(agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    /**
     * @param {number} agentCloudId
     */
    getAgentCloud(agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    /**
     */
    getAgentClouds(): Promise<TaskAgentInterfaces.TaskAgentCloud[]>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentCloud} updatedCloud
     * @param {number} agentCloudId
     */
    updateAgentCloud(updatedCloud: TaskAgentInterfaces.TaskAgentCloud, agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloud>;
    /**
     * Get agent cloud types.
     *
     */
    getAgentCloudTypes(): Promise<TaskAgentInterfaces.TaskAgentCloudType[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} queueId
     * @param {number} top
     * @param {string} continuationToken
     */
    getAgentRequestsForQueue(project: string, queueId: number, top: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.TaskAgentJobRequest>>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentJobRequest} request
     * @param {string} project - Project ID or project name
     * @param {number} queueId
     */
    queueAgentRequest(request: TaskAgentInterfaces.TaskAgentJobRequest, project: string, queueId: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    /**
     * Adds an agent to a pool.  You probably don't want to call this endpoint directly. Instead, [configure an agent](https://docs.microsoft.com/azure/devops/pipelines/agents/agents) using the agent download package.
     *
     * @param {TaskAgentInterfaces.TaskAgent} agent - Details about the agent being added
     * @param {number} poolId - The agent pool in which to add the agent
     */
    addAgent(agent: TaskAgentInterfaces.TaskAgent, poolId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    /**
     * Delete an agent.  You probably don't want to call this endpoint directly. Instead, [use the agent configuration script](https://docs.microsoft.com/azure/devops/pipelines/agents/agents) to remove an agent from your organization.
     *
     * @param {number} poolId - The pool ID to remove the agent from
     * @param {number} agentId - The agent ID to remove
     */
    deleteAgent(poolId: number, agentId: number): Promise<void>;
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
    getAgent(poolId: number, agentId: number, includeCapabilities?: boolean, includeAssignedRequest?: boolean, includeLastCompletedRequest?: boolean, propertyFilters?: string[]): Promise<TaskAgentInterfaces.TaskAgent>;
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
    getAgents(poolId: number, agentName?: string, includeCapabilities?: boolean, includeAssignedRequest?: boolean, includeLastCompletedRequest?: boolean, propertyFilters?: string[], demands?: string[]): Promise<TaskAgentInterfaces.TaskAgent[]>;
    /**
     * Replace an agent.  You probably don't want to call this endpoint directly. Instead, [use the agent configuration script](https://docs.microsoft.com/azure/devops/pipelines/agents/agents) to remove and reconfigure an agent from your organization.
     *
     * @param {TaskAgentInterfaces.TaskAgent} agent - Updated details about the replacing agent
     * @param {number} poolId - The agent pool to use
     * @param {number} agentId - The agent to replace
     */
    replaceAgent(agent: TaskAgentInterfaces.TaskAgent, poolId: number, agentId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    /**
     * Update agent details.
     *
     * @param {TaskAgentInterfaces.TaskAgent} agent - Updated details about the agent
     * @param {number} poolId - The agent pool to use
     * @param {number} agentId - The agent to update
     */
    updateAgent(agent: TaskAgentInterfaces.TaskAgent, poolId: number, agentId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    /**
     * Returns list of azure subscriptions
     *
     */
    getAzureManagementGroups(): Promise<TaskAgentInterfaces.AzureManagementGroupQueryResult>;
    /**
     * Returns list of azure subscriptions
     *
     */
    getAzureSubscriptions(): Promise<TaskAgentInterfaces.AzureSubscriptionQueryResult>;
    /**
     * GET a PAT token for managing (configuring, removing, tagging) deployment targets in a deployment group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment targets are managed.
     */
    generateDeploymentGroupAccessToken(project: string, deploymentGroupId: number): Promise<string>;
    /**
     * Create a deployment group.
     *
     * @param {TaskAgentInterfaces.DeploymentGroupCreateParameter} deploymentGroup - Deployment group to create.
     * @param {string} project - Project ID or project name
     */
    addDeploymentGroup(deploymentGroup: TaskAgentInterfaces.DeploymentGroupCreateParameter, project: string): Promise<TaskAgentInterfaces.DeploymentGroup>;
    /**
     * Delete a deployment group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to be deleted.
     */
    deleteDeploymentGroup(project: string, deploymentGroupId: number): Promise<void>;
    /**
     * Get a deployment group by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group.
     * @param {TaskAgentInterfaces.DeploymentGroupActionFilter} actionFilter - Get the deployment group only if this action can be performed on it.
     * @param {TaskAgentInterfaces.DeploymentGroupExpands} expand - Include these additional details in the returned object.
     */
    getDeploymentGroup(project: string, deploymentGroupId: number, actionFilter?: TaskAgentInterfaces.DeploymentGroupActionFilter, expand?: TaskAgentInterfaces.DeploymentGroupExpands): Promise<TaskAgentInterfaces.DeploymentGroup>;
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
    getDeploymentGroups(project: string, name?: string, actionFilter?: TaskAgentInterfaces.DeploymentGroupActionFilter, expand?: TaskAgentInterfaces.DeploymentGroupExpands, continuationToken?: string, top?: number, ids?: number[]): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.DeploymentGroup>>;
    /**
     * Update a deployment group.
     *
     * @param {TaskAgentInterfaces.DeploymentGroupUpdateParameter} deploymentGroup - Deployment group to update.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group.
     */
    updateDeploymentGroup(deploymentGroup: TaskAgentInterfaces.DeploymentGroupUpdateParameter, project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentGroup>;
    /**
     * Get a list of deployment group metrics.
     *
     * @param {string} project - Project ID or project name
     * @param {string} deploymentGroupName - Name of the deployment group.
     * @param {string} continuationToken - Get metrics for deployment groups with names greater than this continuationToken lexicographically.
     * @param {number} top - Maximum number of deployment group metrics to return. Default is **50**.
     */
    getDeploymentGroupsMetrics(project: string, deploymentGroupName?: string, continuationToken?: string, top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.DeploymentGroupMetrics>>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number} machineId
     * @param {number} completedRequestCount
     */
    getAgentRequestsForDeploymentMachine(project: string, deploymentGroupId: number, machineId: number, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number[]} machineIds
     * @param {number} completedRequestCount
     */
    getAgentRequestsForDeploymentMachines(project: string, deploymentGroupId: number, machineIds?: number[], completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     */
    refreshDeploymentMachines(project: string, deploymentGroupId: number): Promise<void>;
    /**
     * GET a PAT token for managing (configuring, removing, tagging) deployment agents in a deployment pool.
     *
     * @param {number} poolId - ID of the deployment pool in which deployment agents are managed.
     */
    generateDeploymentPoolAccessToken(poolId: number): Promise<string>;
    /**
     * Get a list of deployment pool summaries.
     *
     * @param {string} poolName - Name of the deployment pool.
     * @param {TaskAgentInterfaces.DeploymentPoolSummaryExpands} expands - Include these additional details in the returned objects.
     * @param {number[]} poolIds - List of deployment pool ids.
     */
    getDeploymentPoolsSummary(poolName?: string, expands?: TaskAgentInterfaces.DeploymentPoolSummaryExpands, poolIds?: number[]): Promise<TaskAgentInterfaces.DeploymentPoolSummary[]>;
    /**
     * Get agent requests for a deployment target.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to which the target belongs.
     * @param {number} targetId - ID of the deployment target.
     * @param {number} completedRequestCount - Maximum number of completed requests to return. Default is **50**
     */
    getAgentRequestsForDeploymentTarget(project: string, deploymentGroupId: number, targetId: number, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
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
    getAgentRequestsForDeploymentTargets(project: string, deploymentGroupId: number, targetIds?: number[], ownerId?: number, completedOn?: Date, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    /**
     * Upgrade the deployment targets in a deployment group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group.
     */
    refreshDeploymentTargets(project: string, deploymentGroupId: number): Promise<void>;
    /**
     * Proxy for a GET request defined by an 'endpoint'. The request is authorized using a service connection. The response is filtered using an XPath/Json based selector.
     *
     * @param {TaskAgentInterfaces.TaskDefinitionEndpoint} endpoint - Describes the URL to fetch.
     */
    queryEndpoint(endpoint: TaskAgentInterfaces.TaskDefinitionEndpoint): Promise<string[]>;
    /**
     * Get environment deployment execution history
     *
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {string} continuationToken
     * @param {number} top
     */
    getEnvironmentDeploymentExecutionRecords(project: string, environmentId: number, continuationToken?: string, top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.EnvironmentDeploymentExecutionRecord>>;
    /**
     * Create an environment.
     *
     * @param {TaskAgentInterfaces.EnvironmentCreateParameter} environmentCreateParameter - Environment to create.
     * @param {string} project - Project ID or project name
     */
    addEnvironment(environmentCreateParameter: TaskAgentInterfaces.EnvironmentCreateParameter, project: string): Promise<TaskAgentInterfaces.EnvironmentInstance>;
    /**
     * Delete the specified environment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} environmentId - ID of the environment.
     */
    deleteEnvironment(project: string, environmentId: number): Promise<void>;
    /**
     * Get an environment by its ID.
     *
     * @param {string} project - Project ID or project name
     * @param {number} environmentId - ID of the environment.
     * @param {TaskAgentInterfaces.EnvironmentExpands} expands - Include these additional details in the returned objects.
     */
    getEnvironmentById(project: string, environmentId: number, expands?: TaskAgentInterfaces.EnvironmentExpands): Promise<TaskAgentInterfaces.EnvironmentInstance>;
    /**
     * Get all environments.
     *
     * @param {string} project - Project ID or project name
     * @param {string} name
     * @param {string} continuationToken
     * @param {number} top
     */
    getEnvironments(project: string, name?: string, continuationToken?: string, top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.EnvironmentInstance>>;
    /**
     * Update the specified environment.
     *
     * @param {TaskAgentInterfaces.EnvironmentUpdateParameter} environmentUpdateParameter - Environment data to update.
     * @param {string} project - Project ID or project name
     * @param {number} environmentId - ID of the environment.
     */
    updateEnvironment(environmentUpdateParameter: TaskAgentInterfaces.EnvironmentUpdateParameter, project: string, environmentId: number): Promise<TaskAgentInterfaces.EnvironmentInstance>;
    /**
     * @param {string} hubName
     * @param {boolean} includeEnterpriseUsersCount
     * @param {boolean} includeHostedAgentMinutesCount
     */
    getTaskHubLicenseDetails(hubName: string, includeEnterpriseUsersCount?: boolean, includeHostedAgentMinutesCount?: boolean): Promise<TaskAgentInterfaces.TaskHubLicenseDetails>;
    /**
     * @param {TaskAgentInterfaces.TaskHubLicenseDetails} taskHubLicenseDetails
     * @param {string} hubName
     */
    updateTaskHubLicenseDetails(taskHubLicenseDetails: TaskAgentInterfaces.TaskHubLicenseDetails, hubName: string): Promise<TaskAgentInterfaces.TaskHubLicenseDetails>;
    /**
     * @param {TaskAgentInterfaces.InputValidationRequest} inputValidationRequest
     */
    validateInputs(inputValidationRequest: TaskAgentInterfaces.InputValidationRequest): Promise<TaskAgentInterfaces.InputValidationRequest>;
    /**
     * @param {number} poolId
     * @param {number} requestId
     * @param {string} lockToken
     * @param {TaskAgentInterfaces.TaskResult} result
     * @param {boolean} agentShuttingDown
     */
    deleteAgentRequest(poolId: number, requestId: number, lockToken: string, result?: TaskAgentInterfaces.TaskResult, agentShuttingDown?: boolean): Promise<void>;
    /**
     * @param {number} poolId
     * @param {number} requestId
     * @param {boolean} includeStatus
     */
    getAgentRequest(poolId: number, requestId: number, includeStatus?: boolean): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    /**
     * @param {number} poolId
     * @param {number} top
     * @param {string} continuationToken
     */
    getAgentRequests(poolId: number, top: number, continuationToken?: string): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.TaskAgentJobRequest>>;
    /**
     * @param {number} poolId
     * @param {number} agentId
     * @param {number} completedRequestCount
     */
    getAgentRequestsForAgent(poolId: number, agentId: number, completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    /**
     * @param {number} poolId
     * @param {number[]} agentIds
     * @param {number} completedRequestCount
     */
    getAgentRequestsForAgents(poolId: number, agentIds?: number[], completedRequestCount?: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    /**
     * @param {number} poolId
     * @param {string} planId
     * @param {string} jobId
     */
    getAgentRequestsForPlan(poolId: number, planId: string, jobId?: string): Promise<TaskAgentInterfaces.TaskAgentJobRequest[]>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentJobRequest} request
     * @param {number} poolId
     */
    queueAgentRequestByPool(request: TaskAgentInterfaces.TaskAgentJobRequest, poolId: number): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentJobRequest} request
     * @param {number} poolId
     * @param {number} requestId
     * @param {string} lockToken
     * @param {TaskAgentInterfaces.TaskAgentRequestUpdateOptions} updateOptions
     */
    updateAgentRequest(request: TaskAgentInterfaces.TaskAgentJobRequest, poolId: number, requestId: number, lockToken: string, updateOptions?: TaskAgentInterfaces.TaskAgentRequestUpdateOptions): Promise<TaskAgentInterfaces.TaskAgentJobRequest>;
    /**
     * @param {TaskAgentInterfaces.KubernetesResourceCreateParameters} createParameters
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     */
    addKubernetesResource(createParameters: TaskAgentInterfaces.KubernetesResourceCreateParameters, project: string, environmentId: number): Promise<TaskAgentInterfaces.KubernetesResource>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {number} resourceId
     */
    deleteKubernetesResource(project: string, environmentId: number, resourceId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {number} resourceId
     */
    getKubernetesResource(project: string, environmentId: number, resourceId: number): Promise<TaskAgentInterfaces.KubernetesResource>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     */
    generateDeploymentMachineGroupAccessToken(project: string, machineGroupId: number): Promise<string>;
    /**
     * @param {TaskAgentInterfaces.DeploymentMachineGroup} machineGroup
     * @param {string} project - Project ID or project name
     */
    addDeploymentMachineGroup(machineGroup: TaskAgentInterfaces.DeploymentMachineGroup, project: string): Promise<TaskAgentInterfaces.DeploymentMachineGroup>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     */
    deleteDeploymentMachineGroup(project: string, machineGroupId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     * @param {TaskAgentInterfaces.MachineGroupActionFilter} actionFilter
     */
    getDeploymentMachineGroup(project: string, machineGroupId: number, actionFilter?: TaskAgentInterfaces.MachineGroupActionFilter): Promise<TaskAgentInterfaces.DeploymentMachineGroup>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} machineGroupName
     * @param {TaskAgentInterfaces.MachineGroupActionFilter} actionFilter
     */
    getDeploymentMachineGroups(project: string, machineGroupName?: string, actionFilter?: TaskAgentInterfaces.MachineGroupActionFilter): Promise<TaskAgentInterfaces.DeploymentMachineGroup[]>;
    /**
     * @param {TaskAgentInterfaces.DeploymentMachineGroup} machineGroup
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     */
    updateDeploymentMachineGroup(machineGroup: TaskAgentInterfaces.DeploymentMachineGroup, project: string, machineGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachineGroup>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     * @param {string[]} tagFilters
     */
    getDeploymentMachineGroupMachines(project: string, machineGroupId: number, tagFilters?: string[]): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine[]} deploymentMachines
     * @param {string} project - Project ID or project name
     * @param {number} machineGroupId
     */
    updateDeploymentMachineGroupMachines(deploymentMachines: TaskAgentInterfaces.DeploymentMachine[], project: string, machineGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine} machine
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     */
    addDeploymentMachine(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number} machineId
     */
    deleteDeploymentMachine(project: string, deploymentGroupId: number, machineId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number} machineId
     * @param {TaskAgentInterfaces.DeploymentMachineExpands} expand
     */
    getDeploymentMachine(project: string, deploymentGroupId: number, machineId: number, expand?: TaskAgentInterfaces.DeploymentMachineExpands): Promise<TaskAgentInterfaces.DeploymentMachine>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {string[]} tags
     * @param {string} name
     * @param {TaskAgentInterfaces.DeploymentMachineExpands} expand
     */
    getDeploymentMachines(project: string, deploymentGroupId: number, tags?: string[], name?: string, expand?: TaskAgentInterfaces.DeploymentMachineExpands): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine} machine
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number} machineId
     */
    replaceDeploymentMachine(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, machineId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine} machine
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     * @param {number} machineId
     */
    updateDeploymentMachine(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, machineId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    /**
     * @param {TaskAgentInterfaces.DeploymentMachine[]} machines
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId
     */
    updateDeploymentMachines(machines: TaskAgentInterfaces.DeploymentMachine[], project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition} definition
     * @param {number} poolId
     */
    createAgentPoolMaintenanceDefinition(definition: TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition, poolId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition>;
    /**
     * @param {number} poolId
     * @param {number} definitionId
     */
    deleteAgentPoolMaintenanceDefinition(poolId: number, definitionId: number): Promise<void>;
    /**
     * @param {number} poolId
     * @param {number} definitionId
     */
    getAgentPoolMaintenanceDefinition(poolId: number, definitionId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition>;
    /**
     * @param {number} poolId
     */
    getAgentPoolMaintenanceDefinitions(poolId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition[]>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition} definition
     * @param {number} poolId
     * @param {number} definitionId
     */
    updateAgentPoolMaintenanceDefinition(definition: TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition, poolId: number, definitionId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceDefinition>;
    /**
     * @param {number} poolId
     * @param {number} jobId
     */
    deleteAgentPoolMaintenanceJob(poolId: number, jobId: number): Promise<void>;
    /**
     * @param {number} poolId
     * @param {number} jobId
     */
    getAgentPoolMaintenanceJob(poolId: number, jobId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob>;
    /**
     * @param {number} poolId
     * @param {number} jobId
     */
    getAgentPoolMaintenanceJobLogs(poolId: number, jobId: number): Promise<NodeJS.ReadableStream>;
    /**
     * @param {number} poolId
     * @param {number} definitionId
     */
    getAgentPoolMaintenanceJobs(poolId: number, definitionId?: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob[]>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceJob} job
     * @param {number} poolId
     */
    queueAgentPoolMaintenanceJob(job: TaskAgentInterfaces.TaskAgentPoolMaintenanceJob, poolId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentPoolMaintenanceJob} job
     * @param {number} poolId
     * @param {number} jobId
     */
    updateAgentPoolMaintenanceJob(job: TaskAgentInterfaces.TaskAgentPoolMaintenanceJob, poolId: number, jobId: number): Promise<TaskAgentInterfaces.TaskAgentPoolMaintenanceJob>;
    /**
     * @param {number} poolId
     * @param {number} messageId
     * @param {string} sessionId
     */
    deleteMessage(poolId: number, messageId: number, sessionId: string): Promise<void>;
    /**
     * @param {number} poolId
     * @param {string} sessionId
     * @param {number} lastMessageId
     */
    getMessage(poolId: number, sessionId: string, lastMessageId?: number): Promise<TaskAgentInterfaces.TaskAgentMessage>;
    /**
     * @param {number} poolId
     * @param {number} agentId
     */
    refreshAgent(poolId: number, agentId: number): Promise<void>;
    /**
     * @param {number} poolId
     */
    refreshAgents(poolId: number): Promise<void>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentMessage} message
     * @param {number} poolId
     * @param {number} requestId
     */
    sendMessage(message: TaskAgentInterfaces.TaskAgentMessage, poolId: number, requestId: number): Promise<void>;
    /**
     * @param {string} packageType
     * @param {string} platform
     * @param {string} version
     */
    getPackage(packageType: string, platform: string, version: string): Promise<TaskAgentInterfaces.PackageMetadata>;
    /**
     * @param {string} packageType
     * @param {string} platform
     * @param {number} top
     */
    getPackages(packageType: string, platform?: string, top?: number): Promise<TaskAgentInterfaces.PackageMetadata[]>;
    /**
     * @param {number} poolId
     */
    getAgentPoolMetadata(poolId: number): Promise<NodeJS.ReadableStream>;
    /**
     * @param {any} agentPoolMetadata
     * @param {number} poolId
     */
    setAgentPoolMetadata(customHeaders: any, agentPoolMetadata: any, poolId: number): Promise<void>;
    /**
     * Checks if current identity has passed permissions on a pool.
     *
     * @param {number} poolId - Id of the pool to check
     * @param {number} permissions - Permissions to check. Multiple permissions might be merged into single value using bitwise OR operator (e.g. AgentPoolPermissions.Manage | AgentPoolPermissions.View)
     */
    hasPoolPermissions(poolId: number, permissions: number): Promise<boolean>;
    /**
     * Create an agent pool.
     *
     * @param {TaskAgentInterfaces.TaskAgentPool} pool - Details about the new agent pool
     */
    addAgentPool(pool: TaskAgentInterfaces.TaskAgentPool): Promise<TaskAgentInterfaces.TaskAgentPool>;
    /**
     * Delete an agent pool.
     *
     * @param {number} poolId - ID of the agent pool to delete
     */
    deleteAgentPool(poolId: number): Promise<void>;
    /**
     * Get information about an agent pool.
     *
     * @param {number} poolId - An agent pool ID
     * @param {string[]} properties - Agent pool properties (comma-separated)
     * @param {TaskAgentInterfaces.TaskAgentPoolActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentPool(poolId: number, properties?: string[], actionFilter?: TaskAgentInterfaces.TaskAgentPoolActionFilter): Promise<TaskAgentInterfaces.TaskAgentPool>;
    /**
     * Get a list of agent pools.
     *
     * @param {string} poolName - Filter by name
     * @param {string[]} properties - Filter by agent pool properties (comma-separated)
     * @param {TaskAgentInterfaces.TaskAgentPoolType} poolType - Filter by pool type
     * @param {TaskAgentInterfaces.TaskAgentPoolActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentPools(poolName?: string, properties?: string[], poolType?: TaskAgentInterfaces.TaskAgentPoolType, actionFilter?: TaskAgentInterfaces.TaskAgentPoolActionFilter): Promise<TaskAgentInterfaces.TaskAgentPool[]>;
    /**
     * Get a list of agent pools.
     *
     * @param {number[]} poolIds - pool Ids to fetch
     * @param {TaskAgentInterfaces.TaskAgentPoolActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentPoolsByIds(poolIds: number[], actionFilter?: TaskAgentInterfaces.TaskAgentPoolActionFilter): Promise<TaskAgentInterfaces.TaskAgentPool[]>;
    /**
     * Update properties on an agent pool
     *
     * @param {TaskAgentInterfaces.TaskAgentPool} pool - Updated agent pool details
     * @param {number} poolId - The agent pool to update
     */
    updateAgentPool(pool: TaskAgentInterfaces.TaskAgentPool, poolId: number): Promise<TaskAgentInterfaces.TaskAgentPool>;
    /**
     * Create a new agent queue to connect a project to an agent pool.
     *
     * @param {TaskAgentInterfaces.TaskAgentQueue} queue - Details about the queue to create
     * @param {string} project - Project ID or project name
     * @param {boolean} authorizePipelines - Automatically authorize this queue when using YAML
     */
    addAgentQueue(queue: TaskAgentInterfaces.TaskAgentQueue, project?: string, authorizePipelines?: boolean): Promise<TaskAgentInterfaces.TaskAgentQueue>;
    /**
     * Create a new team project.
     *
     * @param {string} project - Project ID or project name
     */
    createTeamProject(project?: string): Promise<void>;
    /**
     * Removes an agent queue from a project.
     *
     * @param {number} queueId - The agent queue to remove
     * @param {string} project - Project ID or project name
     */
    deleteAgentQueue(queueId: number, project?: string): Promise<void>;
    /**
     * Get information about an agent queue.
     *
     * @param {number} queueId - The agent queue to get information about
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueue(queueId: number, project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue>;
    /**
     * Get a list of agent queues.
     *
     * @param {string} project - Project ID or project name
     * @param {string} queueName - Filter on the agent queue name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueues(project?: string, queueName?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    /**
     * Get a list of agent queues by their IDs
     *
     * @param {number[]} queueIds - A comma-separated list of agent queue IDs to retrieve
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueuesByIds(queueIds: number[], project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    /**
     * Get a list of agent queues by their names
     *
     * @param {string[]} queueNames - A comma-separated list of agent names to retrieve
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueuesByNames(queueNames: string[], project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    /**
     * Get a list of agent queues by pool ids
     *
     * @param {number[]} poolIds - A comma-separated list of pool ids to get the corresponding queues for
     * @param {string} project - Project ID or project name
     * @param {TaskAgentInterfaces.TaskAgentQueueActionFilter} actionFilter - Filter by whether the calling user has use or manage permissions
     */
    getAgentQueuesForPools(poolIds: number[], project?: string, actionFilter?: TaskAgentInterfaces.TaskAgentQueueActionFilter): Promise<TaskAgentInterfaces.TaskAgentQueue[]>;
    /**
     * @param {number} agentCloudId
     */
    getAgentCloudRequests(agentCloudId: number): Promise<TaskAgentInterfaces.TaskAgentCloudRequest[]>;
    /**
     */
    getResourceLimits(): Promise<TaskAgentInterfaces.ResourceLimit[]>;
    /**
     * @param {string} parallelismTag
     * @param {boolean} poolIsHosted
     * @param {boolean} includeRunningRequests
     */
    getResourceUsage(parallelismTag?: string, poolIsHosted?: boolean, includeRunningRequests?: boolean): Promise<TaskAgentInterfaces.ResourceUsage>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId
     */
    getTaskGroupHistory(project: string, taskGroupId: string): Promise<TaskAgentInterfaces.TaskGroupRevision[]>;
    /**
     * Delete a secure file
     *
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     */
    deleteSecureFile(project: string, secureFileId: string): Promise<void>;
    /**
     * Download a secure file by Id
     *
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     * @param {string} ticket - A valid download ticket
     * @param {boolean} download - If download is true, the file is sent as attachement in the response body. If download is false, the response body contains the file stream.
     */
    downloadSecureFile(project: string, secureFileId: string, ticket: string, download?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * Get a secure file
     *
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     * @param {boolean} includeDownloadTicket - If includeDownloadTicket is true and the caller has permissions, a download ticket is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter
     */
    getSecureFile(project: string, secureFileId: string, includeDownloadTicket?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile>;
    /**
     * Get secure files
     *
     * @param {string} project - Project ID or project name
     * @param {string} namePattern - Name of the secure file to match. Can include wildcards to match multiple files.
     * @param {boolean} includeDownloadTickets - If includeDownloadTickets is true and the caller has permissions, a download ticket for each secure file is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter - Filter by secure file permissions for View, Manage or Use action. Defaults to View.
     */
    getSecureFiles(project: string, namePattern?: string, includeDownloadTickets?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile[]>;
    /**
     * Get secure files
     *
     * @param {string} project - Project ID or project name
     * @param {string[]} secureFileIds - A list of secure file Ids
     * @param {boolean} includeDownloadTickets - If includeDownloadTickets is true and the caller has permissions, a download ticket for each secure file is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter
     */
    getSecureFilesByIds(project: string, secureFileIds: string[], includeDownloadTickets?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile[]>;
    /**
     * Get secure files
     *
     * @param {string} project - Project ID or project name
     * @param {string[]} secureFileNames - A list of secure file Ids
     * @param {boolean} includeDownloadTickets - If includeDownloadTickets is true and the caller has permissions, a download ticket for each secure file is included in the response.
     * @param {TaskAgentInterfaces.SecureFileActionFilter} actionFilter
     */
    getSecureFilesByNames(project: string, secureFileNames: string[], includeDownloadTickets?: boolean, actionFilter?: TaskAgentInterfaces.SecureFileActionFilter): Promise<TaskAgentInterfaces.SecureFile[]>;
    /**
     * Query secure files using a name pattern and a condition on file properties.
     *
     * @param {string} condition - The main condition syntax is described [here](https://go.microsoft.com/fwlink/?linkid=842996). Use the *property('property-name')* function to access the value of the specified property of a secure file. It returns null if the property is not set. E.g. ``` and( eq( property('devices'), '2' ), in( property('provisioning profile type'), 'ad hoc', 'development' ) ) ```
     * @param {string} project - Project ID or project name
     * @param {string} namePattern - Name of the secure file to match. Can include wildcards to match multiple files.
     */
    querySecureFilesByProperties(condition: string, project: string, namePattern?: string): Promise<TaskAgentInterfaces.SecureFile[]>;
    /**
     * Update the name or properties of an existing secure file
     *
     * @param {TaskAgentInterfaces.SecureFile} secureFile - The secure file with updated name and/or properties
     * @param {string} project - Project ID or project name
     * @param {string} secureFileId - The unique secure file Id
     */
    updateSecureFile(secureFile: TaskAgentInterfaces.SecureFile, project: string, secureFileId: string): Promise<TaskAgentInterfaces.SecureFile>;
    /**
     * Update properties and/or names of a set of secure files. Files are identified by their IDs. Properties provided override the existing one entirely, i.e. do not merge.
     *
     * @param {TaskAgentInterfaces.SecureFile[]} secureFiles - A list of secure file objects. Only three field must be populated Id, Name, and Properties. The rest of fields in the object are ignored.
     * @param {string} project - Project ID or project name
     */
    updateSecureFiles(secureFiles: TaskAgentInterfaces.SecureFile[], project: string): Promise<TaskAgentInterfaces.SecureFile[]>;
    /**
     * Upload a secure file, include the file stream in the request body
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} project - Project ID or project name
     * @param {string} name - Name of the file to upload
     * @param {boolean} authorizePipelines - If authorizePipelines is true, then the secure file is authorized for use by all pipelines in the project.
     */
    uploadSecureFile(customHeaders: any, contentStream: NodeJS.ReadableStream, project: string, name: string, authorizePipelines?: boolean): Promise<TaskAgentInterfaces.SecureFile>;
    /**
     * @param {TaskAgentInterfaces.TaskAgentSession} session
     * @param {number} poolId
     */
    createAgentSession(session: TaskAgentInterfaces.TaskAgentSession, poolId: number): Promise<TaskAgentInterfaces.TaskAgentSession>;
    /**
     * @param {number} poolId
     * @param {string} sessionId
     */
    deleteAgentSession(poolId: number, sessionId: string): Promise<void>;
    /**
     * Register a deployment target to a deployment group. Generally this is called by agent configuration tool.
     *
     * @param {TaskAgentInterfaces.DeploymentMachine} machine - Deployment target to register.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to which the deployment target is registered.
     */
    addDeploymentTarget(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    /**
     * Delete a deployment target in a deployment group. This deletes the agent from associated deployment pool too.
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment target is deleted.
     * @param {number} targetId - ID of the deployment target to delete.
     */
    deleteDeploymentTarget(project: string, deploymentGroupId: number, targetId: number): Promise<void>;
    /**
     * Get a deployment target by its ID in a deployment group
     *
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group to which deployment target belongs.
     * @param {number} targetId - ID of the deployment target to return.
     * @param {TaskAgentInterfaces.DeploymentTargetExpands} expand - Include these additional details in the returned objects.
     */
    getDeploymentTarget(project: string, deploymentGroupId: number, targetId: number, expand?: TaskAgentInterfaces.DeploymentTargetExpands): Promise<TaskAgentInterfaces.DeploymentMachine>;
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
    getDeploymentTargets(project: string, deploymentGroupId: number, tags?: string[], name?: string, partialNameMatch?: boolean, expand?: TaskAgentInterfaces.DeploymentTargetExpands, agentStatus?: TaskAgentInterfaces.TaskAgentStatusFilter, agentJobResult?: TaskAgentInterfaces.TaskAgentJobResultFilter, continuationToken?: string, top?: number, enabled?: boolean, propertyFilters?: string[]): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.DeploymentMachine>>;
    /**
     * Replace a deployment target in a deployment group. Generally this is called by agent configuration tool.
     *
     * @param {TaskAgentInterfaces.DeploymentMachine} machine - New deployment target.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment target is replaced.
     * @param {number} targetId - ID of the deployment target to replace.
     */
    replaceDeploymentTarget(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, targetId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    /**
     * Update a deployment target and its agent properties in a deployment group. Generally this is called by agent configuration tool.
     *
     * @param {TaskAgentInterfaces.DeploymentMachine} machine - Deployment target to update.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment target is updated.
     * @param {number} targetId - ID of the deployment target to update.
     */
    updateDeploymentTarget(machine: TaskAgentInterfaces.DeploymentMachine, project: string, deploymentGroupId: number, targetId: number): Promise<TaskAgentInterfaces.DeploymentMachine>;
    /**
     * Update tags of a list of deployment targets in a deployment group.
     *
     * @param {TaskAgentInterfaces.DeploymentTargetUpdateParameter[]} machines - Deployment targets with tags to udpdate.
     * @param {string} project - Project ID or project name
     * @param {number} deploymentGroupId - ID of the deployment group in which deployment targets are updated.
     */
    updateDeploymentTargets(machines: TaskAgentInterfaces.DeploymentTargetUpdateParameter[], project: string, deploymentGroupId: number): Promise<TaskAgentInterfaces.DeploymentMachine[]>;
    /**
     * Create a task group.
     *
     * @param {TaskAgentInterfaces.TaskGroupCreateParameter} taskGroup - Task group object to create.
     * @param {string} project - Project ID or project name
     */
    addTaskGroup(taskGroup: TaskAgentInterfaces.TaskGroupCreateParameter, project: string): Promise<TaskAgentInterfaces.TaskGroup>;
    /**
     * Delete a task group.
     *
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId - Id of the task group to be deleted.
     * @param {string} comment - Comments to delete.
     */
    deleteTaskGroup(project: string, taskGroupId: string, comment?: string): Promise<void>;
    /**
     * Get task group.
     *
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId - Id of the task group.
     * @param {string} versionSpec - version specification of the task group. examples: 1, 1.0.
     * @param {TaskAgentInterfaces.TaskGroupExpands} expand - The properties that should be expanded. example $expand=Tasks will expand nested task groups.
     */
    getTaskGroup(project: string, taskGroupId: string, versionSpec: string, expand?: TaskAgentInterfaces.TaskGroupExpands): Promise<TaskAgentInterfaces.TaskGroup>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId
     * @param {number} revision
     */
    getTaskGroupRevision(project: string, taskGroupId: string, revision: number): Promise<NodeJS.ReadableStream>;
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
    getTaskGroups(project: string, taskGroupId?: string, expanded?: boolean, taskIdFilter?: string, deleted?: boolean, top?: number, continuationToken?: Date, queryOrder?: TaskAgentInterfaces.TaskGroupQueryOrder): Promise<TaskAgentInterfaces.TaskGroup[]>;
    /**
     * @param {TaskAgentInterfaces.PublishTaskGroupMetadata} taskGroupMetadata
     * @param {string} project - Project ID or project name
     * @param {string} parentTaskGroupId
     */
    publishTaskGroup(taskGroupMetadata: TaskAgentInterfaces.PublishTaskGroupMetadata, project: string, parentTaskGroupId: string): Promise<TaskAgentInterfaces.TaskGroup[]>;
    /**
     * @param {TaskAgentInterfaces.TaskGroup} taskGroup
     * @param {string} project - Project ID or project name
     */
    undeleteTaskGroup(taskGroup: TaskAgentInterfaces.TaskGroup, project: string): Promise<TaskAgentInterfaces.TaskGroup[]>;
    /**
     * Update a task group.
     *
     * @param {TaskAgentInterfaces.TaskGroupUpdateParameter} taskGroup - Task group to update.
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId - Id of the task group to update.
     */
    updateTaskGroup(taskGroup: TaskAgentInterfaces.TaskGroupUpdateParameter, project: string, taskGroupId?: string): Promise<TaskAgentInterfaces.TaskGroup>;
    /**
     * @param {TaskAgentInterfaces.TaskGroupUpdatePropertiesBase} taskGroupUpdateProperties
     * @param {string} project - Project ID or project name
     * @param {string} taskGroupId
     * @param {boolean} disablePriorVersions
     */
    updateTaskGroupProperties(taskGroupUpdateProperties: TaskAgentInterfaces.TaskGroupUpdatePropertiesBase, project: string, taskGroupId: string, disablePriorVersions?: boolean): Promise<TaskAgentInterfaces.TaskGroup[]>;
    /**
     * @param {string} taskId
     */
    deleteTaskDefinition(taskId: string): Promise<void>;
    /**
     * @param {string} taskId
     * @param {string} versionString
     * @param {string[]} visibility
     * @param {boolean} scopeLocal
     */
    getTaskContentZip(taskId: string, versionString: string, visibility?: string[], scopeLocal?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} taskId
     * @param {string} versionString
     * @param {string[]} visibility
     * @param {boolean} scopeLocal
     */
    getTaskDefinition(taskId: string, versionString: string, visibility?: string[], scopeLocal?: boolean): Promise<TaskAgentInterfaces.TaskDefinition>;
    /**
     * @param {string} taskId
     * @param {string[]} visibility
     * @param {boolean} scopeLocal
     * @param {boolean} allVersions
     */
    getTaskDefinitions(taskId?: string, visibility?: string[], scopeLocal?: boolean, allVersions?: boolean): Promise<TaskAgentInterfaces.TaskDefinition[]>;
    /**
     * @param {number} poolId
     * @param {number} agentId
     * @param {string} currentState
     */
    updateAgentUpdateState(poolId: number, agentId: number, currentState: string): Promise<TaskAgentInterfaces.TaskAgent>;
    /**
     * @param {{ [key: string] : string; }} userCapabilities
     * @param {number} poolId
     * @param {number} agentId
     */
    updateAgentUserCapabilities(userCapabilities: {
        [key: string]: string;
    }, poolId: number, agentId: number): Promise<TaskAgentInterfaces.TaskAgent>;
    /**
     * Add a variable group.
     *
     * @param {TaskAgentInterfaces.VariableGroupParameters} variableGroupParameters
     */
    addVariableGroup(variableGroupParameters: TaskAgentInterfaces.VariableGroupParameters): Promise<TaskAgentInterfaces.VariableGroup>;
    /**
     * Delete a variable group
     *
     * @param {number} groupId - Id of the variable group.
     * @param {string[]} projectIds
     */
    deleteVariableGroup(groupId: number, projectIds: string[]): Promise<void>;
    /**
     * Add a variable group.
     *
     * @param {TaskAgentInterfaces.VariableGroupProjectReference[]} variableGroupProjectReferences
     * @param {number} variableGroupId
     */
    shareVariableGroup(variableGroupProjectReferences: TaskAgentInterfaces.VariableGroupProjectReference[], variableGroupId: number): Promise<void>;
    /**
     * Update a variable group.
     *
     * @param {TaskAgentInterfaces.VariableGroupParameters} variableGroupParameters
     * @param {number} groupId - Id of the variable group to update.
     */
    updateVariableGroup(variableGroupParameters: TaskAgentInterfaces.VariableGroupParameters, groupId: number): Promise<TaskAgentInterfaces.VariableGroup>;
    /**
     * Get a variable group.
     *
     * @param {string} project - Project ID or project name
     * @param {number} groupId - Id of the variable group.
     */
    getVariableGroup(project: string, groupId: number): Promise<TaskAgentInterfaces.VariableGroup>;
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
    getVariableGroups(project: string, groupName?: string, actionFilter?: TaskAgentInterfaces.VariableGroupActionFilter, top?: number, continuationToken?: number, queryOrder?: TaskAgentInterfaces.VariableGroupQueryOrder): Promise<TaskAgentInterfaces.VariableGroup[]>;
    /**
     * Get variable groups by ids.
     *
     * @param {string} project - Project ID or project name
     * @param {number[]} groupIds - Comma separated list of Ids of variable groups.
     */
    getVariableGroupsById(project: string, groupIds: number[]): Promise<TaskAgentInterfaces.VariableGroup[]>;
    /**
     * @param {TaskAgentInterfaces.VirtualMachineGroupCreateParameters} createParameters
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     */
    addVirtualMachineGroup(createParameters: TaskAgentInterfaces.VirtualMachineGroupCreateParameters, project: string, environmentId: number): Promise<TaskAgentInterfaces.VirtualMachineGroup>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {number} resourceId
     */
    deleteVirtualMachineGroup(project: string, environmentId: number, resourceId: number): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {number} resourceId
     */
    getVirtualMachineGroup(project: string, environmentId: number, resourceId: number): Promise<TaskAgentInterfaces.VirtualMachineGroup>;
    /**
     * @param {TaskAgentInterfaces.VirtualMachineGroup} resource
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     */
    updateVirtualMachineGroup(resource: TaskAgentInterfaces.VirtualMachineGroup, project: string, environmentId: number): Promise<TaskAgentInterfaces.VirtualMachineGroup>;
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
    getVirtualMachines(project: string, environmentId: number, resourceId: number, continuationToken?: string, name?: string, partialNameMatch?: boolean, tags?: string[], top?: number): Promise<VSSInterfaces.PagedList<TaskAgentInterfaces.VirtualMachine>>;
    /**
     * @param {TaskAgentInterfaces.VirtualMachine[]} machines
     * @param {string} project - Project ID or project name
     * @param {number} environmentId
     * @param {number} resourceId
     */
    updateVirtualMachines(machines: TaskAgentInterfaces.VirtualMachine[], project: string, environmentId: number, resourceId: number): Promise<TaskAgentInterfaces.VirtualMachine[]>;
    /**
     * @param {string} tenantId
     * @param {string} redirectUri
     * @param {TaskAgentInterfaces.AadLoginPromptOption} promptOption
     * @param {string} completeCallbackPayload
     * @param {boolean} completeCallbackByAuthCode
     */
    createAadOAuthRequest(tenantId: string, redirectUri: string, promptOption?: TaskAgentInterfaces.AadLoginPromptOption, completeCallbackPayload?: string, completeCallbackByAuthCode?: boolean): Promise<string>;
    /**
     */
    getVstsAadTenantId(): Promise<string>;
    /**
     * GET the Yaml schema used for Yaml file validation.
     *
     * @param {boolean} validateTaskNames - Whether the schema should validate that tasks are actually installed (useful for offline tools where you don't want validation).
     */
    getYamlSchema(validateTaskNames?: boolean): Promise<any>;
}
