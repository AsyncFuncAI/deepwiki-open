import DistributedTaskCommonInterfaces = require("../interfaces/DistributedTaskCommonInterfaces");
import FormInputInterfaces = require("../interfaces/common/FormInputInterfaces");
import VSSInterfaces = require("../interfaces/common/VSSInterfaces");
export declare enum AadLoginPromptOption {
    /**
     * Do not provide a prompt option
     */
    NoOption = 0,
    /**
     * Force the user to login again.
     */
    Login = 1,
    /**
     * Force the user to select which account they are logging in with instead of automatically picking the user up from the session state. NOTE: This does not work for switching between the variants of a dual-homed user.
     */
    SelectAccount = 2,
    /**
     * Force the user to login again. <remarks> Ignore current authentication state and force the user to authenticate again. This option should be used instead of Login. </remarks>
     */
    FreshLogin = 3,
    /**
     * Force the user to login again with mfa. <remarks> Ignore current authentication state and force the user to authenticate again. This option should be used instead of Login, if MFA is required. </remarks>
     */
    FreshLoginWithMfa = 4
}
export interface AadOauthTokenRequest {
    refresh?: boolean;
    resource?: string;
    tenantId?: string;
    token?: string;
}
export interface AadOauthTokenResult {
    accessToken?: string;
    refreshTokenCache?: string;
}
export interface AgentChangeEvent {
    agent?: TaskAgent;
    eventType?: string;
    pool?: TaskAgentPoolReference;
    poolId?: number;
    timeStamp?: Date;
}
export interface AgentJobRequestMessage extends JobRequestMessage {
    lockedUntil?: Date;
    lockToken?: string;
    requestId?: number;
    tasks?: TaskInstance[];
}
export interface AgentPoolEvent {
    eventType?: string;
    pool?: TaskAgentPool;
}
export interface AgentQueueEvent {
    eventType?: string;
    queue?: TaskAgentQueue;
}
export interface AgentQueuesEvent {
    eventType?: string;
    queues?: TaskAgentQueue[];
}
export interface AgentRefreshMessage {
    agentId?: number;
    targetVersion?: string;
    timeout?: any;
}
export declare enum AuditAction {
    Add = 1,
    Update = 2,
    Delete = 3,
    Undelete = 4
}
export interface AuthenticationSchemeReference {
    inputs?: {
        [key: string]: string;
    };
    type?: string;
}
export interface AuthorizationHeader {
    /**
     * Gets or sets the name of authorization header.
     */
    name?: string;
    /**
     * Gets or sets the value of authorization header.
     */
    value?: string;
}
export interface AzureKeyVaultPermission extends AzureResourcePermission {
    vault?: string;
}
export interface AzureKeyVaultVariableGroupProviderData extends VariableGroupProviderData {
    lastRefreshedOn?: Date;
    serviceEndpointId?: string;
    vault?: string;
}
export interface AzureKeyVaultVariableValue extends VariableValue {
    contentType?: string;
    enabled?: boolean;
    expires?: Date;
}
/**
 * Azure Management Group
 */
export interface AzureManagementGroup {
    /**
     * Display name of azure management group
     */
    displayName?: string;
    /**
     * Id of azure management group
     */
    id?: string;
    /**
     * Azure management group name
     */
    name?: string;
    /**
     * Id of tenant from which azure management group belongs
     */
    tenantId?: string;
}
/**
 * Azure management group query result
 */
export interface AzureManagementGroupQueryResult {
    /**
     * Error message in case of an exception
     */
    errorMessage?: string;
    /**
     * List of azure management groups
     */
    value?: AzureManagementGroup[];
}
export interface AzurePermission {
    provisioned?: boolean;
    resourceProvider?: string;
}
export interface AzureResourcePermission extends AzurePermission {
    resourceGroup?: string;
}
export interface AzureRoleAssignmentPermission extends AzurePermission {
    roleAssignmentId?: string;
}
export interface AzureSpnOperationStatus {
    state?: string;
    statusMessage?: string;
}
export interface AzureSubscription {
    displayName?: string;
    subscriptionId?: string;
    subscriptionTenantId?: string;
    subscriptionTenantName?: string;
}
export interface AzureSubscriptionQueryResult {
    errorMessage?: string;
    value?: AzureSubscription[];
}
export interface ClientCertificate {
    /**
     * Gets or sets the value of client certificate.
     */
    value?: string;
}
export interface CounterVariable {
    prefix?: string;
    seed?: number;
    value?: number;
}
export interface DataSource {
    authenticationScheme?: AuthenticationSchemeReference;
    endpointUrl?: string;
    headers?: AuthorizationHeader[];
    name?: string;
    resourceUrl?: string;
    resultSelector?: string;
}
export interface DataSourceBinding extends DistributedTaskCommonInterfaces.DataSourceBindingBase {
}
export interface DataSourceDetails {
    dataSourceName?: string;
    dataSourceUrl?: string;
    headers?: AuthorizationHeader[];
    parameters?: {
        [key: string]: string;
    };
    resourceUrl?: string;
    resultSelector?: string;
}
export interface Demand {
    name?: string;
    value?: string;
}
export interface DemandEquals extends Demand {
}
export interface DemandExists extends Demand {
}
export interface DemandMinimumVersion extends Demand {
    source?: DemandSource;
}
export interface DemandSource {
    sourceName?: string;
    sourceType?: DemandSourceType;
    sourceVersion?: string;
}
export declare enum DemandSourceType {
    Task = 0,
    Feature = 1
}
export interface DependencyBinding {
    key?: string;
    value?: string;
}
export interface DependencyData {
    input?: string;
    map?: {
        key: string;
        value: {
            key: string;
            value: string;
        }[];
    }[];
}
export interface DependsOn {
    input?: string;
    map?: DependencyBinding[];
}
export interface DeploymentGatesChangeEvent {
    gateNames?: string[];
}
/**
 * Deployment group.
 */
export interface DeploymentGroup extends DeploymentGroupReference {
    /**
     * Description of the deployment group.
     */
    description?: string;
    /**
     * Number of deployment targets in the deployment group.
     */
    machineCount?: number;
    /**
     * List of deployment targets in the deployment group.
     */
    machines?: DeploymentMachine[];
    /**
     * List of unique tags across all deployment targets in the deployment group.
     */
    machineTags?: string[];
}
/**
 * This is useful in getting a list of deployment groups, filtered for which caller has permissions to take a particular action.
 */
export declare enum DeploymentGroupActionFilter {
    /**
     * All deployment groups.
     */
    None = 0,
    /**
     * Only deployment groups for which caller has **manage** permission.
     */
    Manage = 2,
    /**
     * Only deployment groups for which caller has **use** permission.
     */
    Use = 16
}
/**
 * Properties to create Deployment group.
 */
export interface DeploymentGroupCreateParameter {
    /**
     * Description of the deployment group.
     */
    description?: string;
    /**
     * Name of the deployment group.
     */
    name?: string;
    /**
     * Deployment pool in which deployment agents are registered. This is obsolete. Kept for compatibility. Will be marked obsolete explicitly by M132.
     */
    pool?: DeploymentGroupCreateParameterPoolProperty;
    /**
     * Identifier of the deployment pool in which deployment agents are registered.
     */
    poolId?: number;
}
/**
 * Properties of Deployment pool to create Deployment group.
 */
export interface DeploymentGroupCreateParameterPoolProperty {
    /**
     * Deployment pool identifier.
     */
    id?: number;
}
/**
 * Properties to be included or expanded in deployment group objects. This is useful when getting a single or list of deployment grouops.
 */
export declare enum DeploymentGroupExpands {
    /**
     * No additional properties.
     */
    None = 0,
    /**
     * Deprecated: Include all the deployment targets.
     */
    Machines = 2,
    /**
     * Include unique list of tags across all deployment targets.
     */
    Tags = 4
}
/**
 * Deployment group metrics.
 */
export interface DeploymentGroupMetrics {
    /**
     * List of deployment group properties. And types of metrics provided for those properties.
     */
    columnsHeader?: MetricsColumnsHeader;
    /**
     * Deployment group.
     */
    deploymentGroup?: DeploymentGroupReference;
    /**
     * Values of properties and the metrics. E.g. 1: total count of deployment targets for which 'TargetState' is 'offline'. E.g. 2: Average time of deployment to the deployment targets for which 'LastJobStatus' is 'passed' and 'TargetState' is 'online'.
     */
    rows?: MetricsRow[];
}
/**
 * Deployment group reference. This is useful for referring a deployment group in another object.
 */
export interface DeploymentGroupReference {
    /**
     * Deployment group identifier.
     */
    id?: number;
    /**
     * Name of the deployment group.
     */
    name?: string;
    /**
     * Deployment pool in which deployment agents are registered.
     */
    pool?: TaskAgentPoolReference;
    /**
     * Project to which the deployment group belongs.
     */
    project?: ProjectReference;
}
/**
 * Deployment group update parameter.
 */
export interface DeploymentGroupUpdateParameter {
    /**
     * Description of the deployment group.
     */
    description?: string;
    /**
     * Name of the deployment group.
     */
    name?: string;
}
/**
 * Deployment target.
 */
export interface DeploymentMachine {
    /**
     * Deployment agent.
     */
    agent?: TaskAgent;
    /**
     * Deployment target Identifier.
     */
    id?: number;
    /**
     * Properties of the deployment target.
     */
    properties?: any;
    /**
     * Tags of the deployment target.
     */
    tags?: string[];
}
export interface DeploymentMachineChangedData extends DeploymentMachine {
    addedTags?: string[];
    deletedTags?: string[];
}
export declare enum DeploymentMachineExpands {
    None = 0,
    Capabilities = 2,
    AssignedRequest = 4
}
export interface DeploymentMachineGroup extends DeploymentMachineGroupReference {
    machines?: DeploymentMachine[];
    size?: number;
}
export interface DeploymentMachineGroupReference {
    id?: number;
    name?: string;
    pool?: TaskAgentPoolReference;
    project?: ProjectReference;
}
export interface DeploymentMachinesChangeEvent {
    machineGroupReference?: DeploymentGroupReference;
    machines?: DeploymentMachineChangedData[];
}
/**
 * Deployment pool summary.
 */
export interface DeploymentPoolSummary {
    /**
     * List of deployment groups referring to the deployment pool.
     */
    deploymentGroups?: DeploymentGroupReference[];
    /**
     * Number of deployment agents that are offline.
     */
    offlineAgentsCount?: number;
    /**
     * Number of deployment agents that are online.
     */
    onlineAgentsCount?: number;
    /**
     * Deployment pool.
     */
    pool?: TaskAgentPoolReference;
    /**
     * Virtual machine Resource referring in pool.
     */
    resource?: EnvironmentResourceReference;
}
/**
 * Properties to be included or expanded in deployment pool summary objects. This is useful when getting a single or list of deployment pool summaries.
 */
export declare enum DeploymentPoolSummaryExpands {
    /**
     * No additional properties
     */
    None = 0,
    /**
     * Include deployment groups referring to the deployment pool.
     */
    DeploymentGroups = 2,
    /**
     * Include Resource referring to the deployment pool.
     */
    Resource = 4
}
/**
 * Properties to be included or expanded in deployment target objects. This is useful when getting a single or list of deployment targets.
 */
export declare enum DeploymentTargetExpands {
    /**
     * No additional properties.
     */
    None = 0,
    /**
     * Include capabilities of the deployment agent.
     */
    Capabilities = 2,
    /**
     * Include the job request assigned to the deployment agent.
     */
    AssignedRequest = 4,
    /**
     * Include the last completed job request of the deployment agent.
     */
    LastCompletedRequest = 8
}
/**
 * Deployment target update parameter.
 */
export interface DeploymentTargetUpdateParameter {
    /**
     * Identifier of the deployment target.
     */
    id?: number;
    tags?: string[];
}
export interface DiagnosticLogMetadata {
    agentId?: number;
    agentName?: string;
    fileName?: string;
    phaseName?: string;
    phaseResult?: string;
    poolId?: number;
}
export interface ElasticAgentPoolResizedEvent {
    newSize?: number;
    poolId?: number;
    poolName?: string;
    previousSize?: number;
    resourceId?: string;
}
export declare enum ElasticAgentState {
    None = 0,
    Enabled = 1,
    Online = 2,
    Assigned = 4
}
export declare enum ElasticComputeState {
    None = 0,
    Healthy = 1,
    Creating = 2,
    Deleting = 3,
    Failed = 4,
    Stopped = 5,
    Reimaging = 6,
    UnhealthyVm = 7,
    UnhealthyVmssVm = 8
}
/**
 * Data and settings for an elastic node
 */
export interface ElasticNode {
    /**
     * Distributed Task's Agent Id
     */
    agentId?: number;
    /**
     * Summary of the state of the agent
     */
    agentState?: ElasticAgentState;
    /**
     * Compute Id.  VMSS's InstanceId
     */
    computeId?: string;
    /**
     * State of the compute host
     */
    computeState?: ElasticComputeState;
    /**
     * Users can force state changes to specific states (ToReimage, ToDelete, Save)
     */
    desiredState?: ElasticNodeState;
    /**
     * Unique identifier since the agent and/or VM may be null
     */
    id?: number;
    /**
     * Computer name. Used to match a scaleset VM with an agent
     */
    name?: string;
    /**
     * Pool Id that this node belongs to
     */
    poolId?: number;
    /**
     * Last job RequestId assigned to this agent
     */
    requestId?: number;
    /**
     * State of the ElasticNode
     */
    state?: ElasticNodeState;
    /**
     * Last state change. Only updated by SQL.
     */
    stateChangedOn?: Date;
}
/**
 * Class used for updating an elastic node where only certain members are populated
 */
export interface ElasticNodeSettings {
    /**
     * State of the ElasticNode
     */
    state?: ElasticNodeState;
}
export declare enum ElasticNodeState {
    None = 0,
    New = 1,
    CreatingCompute = 2,
    StartingAgent = 3,
    Idle = 4,
    Assigned = 5,
    Offline = 6,
    PendingReimage = 7,
    PendingDelete = 8,
    Saved = 9,
    DeletingCompute = 10,
    Deleted = 11,
    Lost = 12,
    ReimagingCompute = 13,
    RestartingAgent = 14,
    FailedToStartPendingDelete = 15,
    FailedToRestartPendingDelete = 16,
    FailedVMPendingDelete = 17,
    AssignedPendingDelete = 18,
    RetryDelete = 19,
    UnhealthyVm = 20,
    UnhealthyVmPendingDelete = 21
}
/**
 * Data and settings for an elastic pool
 */
export interface ElasticPool {
    /**
     * Set whether agents should be configured to run with interactive UI
     */
    agentInteractiveUI?: boolean;
    /**
     * Azure string representing to location of the resource
     */
    azureId?: string;
    /**
     * Number of agents to have ready waiting for jobs
     */
    desiredIdle?: number;
    /**
     * The desired size of the pool
     */
    desiredSize?: number;
    /**
     * Maximum number of nodes that will exist in the elastic pool
     */
    maxCapacity?: number;
    /**
     * Keep nodes in the pool on failure for investigation
     */
    maxSavedNodeCount?: number;
    /**
     * Timestamp the pool was first detected to be offline
     */
    offlineSince?: Date;
    /**
     * Operating system type of the nodes in the pool
     */
    orchestrationType?: OrchestrationType;
    /**
     * Operating system type of the nodes in the pool
     */
    osType?: OperatingSystemType;
    /**
     * Id of the associated TaskAgentPool
     */
    poolId?: number;
    /**
     * Discard node after each job completes
     */
    recycleAfterEachUse?: boolean;
    /**
     * Id of the Service Endpoint used to connect to Azure
     */
    serviceEndpointId?: string;
    /**
     * Scope the Service Endpoint belongs to
     */
    serviceEndpointScope?: string;
    /**
     * The number of sizing attempts executed while trying to achieve a desired size
     */
    sizingAttempts?: number;
    /**
     * State of the pool
     */
    state?: ElasticPoolState;
    /**
     * The minimum time in minutes to keep idle agents alive
     */
    timeToLiveMinutes?: number;
}
/**
 * Returned result from creating a new elastic pool
 */
export interface ElasticPoolCreationResult {
    /**
     * Created agent pool
     */
    agentPool?: TaskAgentPool;
    /**
     * Created agent queue
     */
    agentQueue?: TaskAgentQueue;
    /**
     * Created elastic pool
     */
    elasticPool?: ElasticPool;
}
/**
 * Log data for an Elastic Pool
 */
export interface ElasticPoolLog {
    /**
     * Log Id
     */
    id?: number;
    /**
     * E.g. error, warning, info
     */
    level?: LogLevel;
    /**
     * Log contents
     */
    message?: string;
    /**
     * Operation that triggered the message being logged
     */
    operation?: OperationType;
    /**
     * Id of the associated TaskAgentPool
     */
    poolId?: number;
    /**
     * Datetime that the log occurred
     */
    timestamp?: Date;
}
/**
 * Class used for updating an elastic pool where only certain members are populated
 */
export interface ElasticPoolSettings {
    /**
     * Set whether agents should be configured to run with interactive UI
     */
    agentInteractiveUI?: boolean;
    /**
     * Azure string representing to location of the resource
     */
    azureId?: string;
    /**
     * Number of machines to have ready waiting for jobs
     */
    desiredIdle?: number;
    /**
     * Maximum number of machines that will exist in the elastic pool
     */
    maxCapacity?: number;
    /**
     * Keep machines in the pool on failure for investigation
     */
    maxSavedNodeCount?: number;
    /**
     * Operating system type of the machines in the pool
     */
    orchestrationType?: OrchestrationType;
    /**
     * Operating system type of the machines in the pool
     */
    osType?: OperatingSystemType;
    /**
     * Discard machines after each job completes
     */
    recycleAfterEachUse?: boolean;
    /**
     * Id of the Service Endpoint used to connect to Azure
     */
    serviceEndpointId?: string;
    /**
     * Scope the Service Endpoint belongs to
     */
    serviceEndpointScope?: string;
    /**
     * The minimum time in minutes to keep idle agents alive
     */
    timeToLiveMinutes?: number;
}
export declare enum ElasticPoolState {
    /**
     * Online and healthy
     */
    Online = 0,
    Offline = 1,
    Unhealthy = 2,
    New = 3
}
export interface EndpointAuthorization {
    /**
     * Gets or sets the parameters for the selected authorization scheme.
     */
    parameters?: {
        [key: string]: string;
    };
    /**
     * Gets or sets the scheme used for service endpoint authentication.
     */
    scheme?: string;
}
/**
 * Represents url of the service endpoint.
 */
export interface EndpointUrl {
    /**
     * Gets or sets the dependency bindings.
     */
    dependsOn?: DependsOn;
    /**
     * Gets or sets the display name of service endpoint url.
     */
    displayName?: string;
    /**
     * Gets or sets the help text of service endpoint url.
     */
    helpText?: string;
    /**
     * Gets or sets the visibility of service endpoint url.
     */
    isVisible?: string;
    /**
     * Gets or sets the value of service endpoint url.
     */
    value?: string;
}
/**
 * This is useful in getting a list of Environments, filtered for which caller has permissions to take a particular action.
 */
export declare enum EnvironmentActionFilter {
    /**
     * All environments for which user has **view** permission.
     */
    None = 0,
    /**
     * Only environments for which caller has **manage** permission.
     */
    Manage = 2,
    /**
     * Only environments for which caller has **use** permission.
     */
    Use = 16
}
/**
 * Properties to create Environment.
 */
export interface EnvironmentCreateParameter {
    /**
     * Description of the environment.
     */
    description?: string;
    /**
     * Name of the environment.
     */
    name?: string;
}
/**
 * EnvironmentDeploymentExecutionRecord.
 */
export interface EnvironmentDeploymentExecutionRecord {
    /**
     * Definition of the environment deployment execution owner
     */
    definition?: TaskOrchestrationOwner;
    /**
     * Id of the Environment
     */
    environmentId?: number;
    /**
     * Finish time of the environment deployment execution
     */
    finishTime?: Date;
    /**
     * Id of the Environment deployment execution history record
     */
    id?: number;
    /**
     * Job Attempt
     */
    jobAttempt?: number;
    /**
     * Job name
     */
    jobName?: string;
    /**
     * Owner of the environment deployment execution record
     */
    owner?: TaskOrchestrationOwner;
    /**
     * Plan Id
     */
    planId?: string;
    /**
     * Plan type of the environment deployment execution record
     */
    planType?: string;
    /**
     * Queue time of the environment deployment execution
     */
    queueTime?: Date;
    /**
     * Request identifier of the Environment deployment execution history record
     */
    requestIdentifier?: string;
    /**
     * Resource Id
     */
    resourceId?: number;
    /**
     * Result of the environment deployment execution
     */
    result?: TaskResult;
    /**
     * Project Id
     */
    scopeId?: string;
    /**
     * Service owner Id
     */
    serviceOwner?: string;
    /**
     * Stage Attempt
     */
    stageAttempt?: number;
    /**
     * Stage name
     */
    stageName?: string;
    /**
     * Start time of the environment deployment execution
     */
    startTime?: Date;
}
/**
 * Properties to be included or expanded in environment objects. This is useful when getting a single environment.
 */
export declare enum EnvironmentExpands {
    /**
     * No additional properties
     */
    None = 0,
    /**
     * Include resource references referring to the environment.
     */
    ResourceReferences = 1
}
/**
 * Environment.
 */
export interface EnvironmentInstance {
    /**
     * Identity reference of the user who created the Environment.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * Creation time of the Environment
     */
    createdOn?: Date;
    /**
     * Description of the Environment.
     */
    description?: string;
    /**
     * Id of the Environment
     */
    id?: number;
    /**
     * Identity reference of the user who last modified the Environment.
     */
    lastModifiedBy?: VSSInterfaces.IdentityRef;
    /**
     * Last modified time of the Environment
     */
    lastModifiedOn?: Date;
    /**
     * Name of the Environment.
     */
    name?: string;
    /**
     * Project information for environment.
     */
    project?: ProjectReference;
    resources?: EnvironmentResourceReference[];
}
/**
 * EnvironmentLinkedResourceReference.
 */
export interface EnvironmentLinkedResourceReference {
    /**
     * Id of the resource.
     */
    id?: string;
    /**
     * Type of resource.
     */
    typeName?: string;
}
export interface EnvironmentReference {
    id?: number;
    name?: string;
}
export interface EnvironmentResource {
    createdBy?: VSSInterfaces.IdentityRef;
    createdOn?: Date;
    environmentReference?: EnvironmentReference;
    id?: number;
    lastModifiedBy?: VSSInterfaces.IdentityRef;
    lastModifiedOn?: Date;
    name?: string;
    /**
     * Tags of the Environment Resource.
     */
    tags?: string[];
    /**
     * Environment resource type
     */
    type?: EnvironmentResourceType;
}
/**
 * EnvironmentResourceDeploymentExecutionRecord.
 */
export interface EnvironmentResourceDeploymentExecutionRecord {
    /**
     * Id of the Environment
     */
    environmentId?: number;
    /**
     * Finish time of the environment resource deployment execution
     */
    finishTime?: Date;
    /**
     * Id of the Environment deployment execution history record
     */
    requestId?: number;
    /**
     * Resource Id
     */
    resourceId?: number;
    /**
     * Result of the environment deployment execution
     */
    result?: TaskResult;
    /**
     * Start time of the environment resource deployment execution
     */
    startTime?: Date;
}
/**
 * EnvironmentResourceReference.
 */
export interface EnvironmentResourceReference {
    /**
     * Id of the resource.
     */
    id?: number;
    /**
     * Name of the resource.
     */
    name?: string;
    /**
     * Tags of the Environment Resource Reference.
     */
    tags?: string[];
    /**
     * Type of the resource.
     */
    type?: EnvironmentResourceType;
}
/**
 * EnvironmentResourceType.
 */
export declare enum EnvironmentResourceType {
    Undefined = 0,
    /**
     * Unknown resource type
     */
    Generic = 1,
    /**
     * Virtual machine resource type
     */
    VirtualMachine = 2,
    /**
     * Kubernetes resource type
     */
    Kubernetes = 4
}
/**
 * Properties to update Environment.
 */
export interface EnvironmentUpdateParameter {
    /**
     * Description of the environment.
     */
    description?: string;
    /**
     * Name of the environment.
     */
    name?: string;
}
export interface EventsConfig {
}
export declare enum ExclusiveLockType {
    RunLatest = 0,
    Sequential = 1
}
export interface ExpressionValidationItem extends ValidationItem {
}
export interface HelpLink {
    text?: string;
    url?: string;
}
export interface InputBindingContext {
    /**
     * Value of the input
     */
    value?: string;
}
export interface InputValidationItem extends ValidationItem {
    /**
     * Provides binding context for the expression to evaluate
     */
    context?: InputBindingContext;
}
export interface InputValidationRequest {
    inputs?: {
        [key: string]: ValidationItem;
    };
}
/**
 * An issue (error, warning) associated with a pipeline run.
 */
export interface Issue {
    /**
     * The category of the issue. <br />Example: Code - refers to compilation errors <br />Example: General - refers to generic errors
     */
    category?: string;
    /**
     * A dictionary containing details about the issue.
     */
    data?: {
        [key: string]: string;
    };
    /**
     * A description of issue.
     */
    message?: string;
    /**
     * The type (error, warning) of the issue.
     */
    type?: IssueType;
}
/**
 * The type of issue based on severity.
 */
export declare enum IssueType {
    Error = 1,
    Warning = 2
}
export interface JobAssignedEvent extends JobEvent {
    /**
     * A pipeline job request for an agent.
     */
    request?: TaskAgentJobRequest;
}
export interface JobCanceledEvent extends JobEvent {
    /**
     * The reason for job cancellation.
     */
    reason?: string;
    /**
     * The job's timeout interval.
     */
    timeout?: any;
}
export interface JobCancelMessage {
    jobId?: string;
    timeout?: any;
}
export interface JobCompletedEvent extends JobEvent {
    /**
     * Indicates whether the agent is in the process of shutting down.
     */
    agentShuttingDown?: boolean;
    /**
     * The ID of the request.
     */
    requestId?: number;
    /**
     * The result of the request.
     */
    result?: TaskResult;
}
/**
 * Represents the context of variables and vectors for a job request.
 */
export interface JobEnvironment {
    endpoints?: ServiceEndpoint[];
    mask?: MaskHint[];
    options?: {
        [key: string]: JobOption;
    };
    secureFiles?: SecureFile[];
    /**
     * Gets or sets the endpoint used for communicating back to the calling service.
     */
    systemConnection?: ServiceEndpoint;
    variables?: {
        [key: string]: string;
    };
}
/**
 * A pipeline job event to be processed by the execution plan.
 */
export interface JobEvent {
    /**
     * The ID of the pipeline job affected by the event.
     */
    jobId?: string;
    /**
     * The name of the pipeline job event.
     */
    name?: string;
}
export interface JobEventConfig {
    timeout?: string;
}
export interface JobEventsConfig extends EventsConfig {
    jobAssigned?: JobEventConfig;
    jobCompleted?: JobEventConfig;
    jobStarted?: JobEventConfig;
}
export interface JobMetadataEvent extends JobEvent {
    /**
     * A message to be sent to an agent currently running the job.
     */
    message?: JobMetadataMessage;
}
/**
 * A message to be sent to an agent currently running the job.
 */
export interface JobMetadataMessage {
    /**
     * The id of the job.
     */
    jobId?: string;
    /**
     * The agent's frequency of posting lines to the logs console expressed in milliseconds. There are 2 modes: Slow (10 seconds) and Fast (half a second).
     */
    postLinesFrequencyMillis?: number;
}
/**
 * Represents an option that may affect the way an agent runs the job.
 */
export interface JobOption {
    data?: {
        [key: string]: string;
    };
    /**
     * Gets the id of the option.
     */
    id?: string;
}
export interface JobRequestMessage {
    environment?: JobEnvironment;
    jobId?: string;
    jobName?: string;
    jobRefName?: string;
    messageType?: string;
    plan?: TaskOrchestrationPlanReference;
    timeline?: TimelineReference;
}
export interface JobStartedEvent extends JobEvent {
}
export interface KubernetesResource extends EnvironmentResource {
    clusterName?: string;
    namespace?: string;
    serviceEndpointId?: string;
}
export interface KubernetesResourceCreateParameters {
    clusterName?: string;
    name?: string;
    namespace?: string;
    /**
     * Tags of the kubernetes resource.
     */
    tags?: string[];
}
export interface KubernetesResourceCreateParametersExistingEndpoint extends KubernetesResourceCreateParameters {
    serviceEndpointId?: string;
}
export interface KubernetesResourceCreateParametersNewEndpoint extends KubernetesResourceCreateParameters {
    endpoint?: ServiceEndpoint;
}
export interface KubernetesResourcePatchParameters {
    authorizationParameters?: {
        [key: string]: string;
    };
    /**
     * Provider type (CustomProvider or AzureKubernetesServiceProvider) of the resource to be updated
     */
    providerType?: string;
    resourceId?: number;
}
export declare enum LogLevel {
    Error = 0,
    Warning = 1,
    Info = 2
}
export declare enum MachineGroupActionFilter {
    None = 0,
    Manage = 2,
    Use = 16
}
/**
 * Represents a purchase of resource units in a secondary marketplace.
 */
export interface MarketplacePurchasedLicense {
    /**
     * The Marketplace display name.
     */
    marketplaceName?: string;
    /**
     * The name of the identity making the purchase as seen by the marketplace
     */
    purchaserName?: string;
    /**
     * The quantity purchased.
     */
    purchaseUnitCount?: number;
}
export interface MaskHint {
    type?: MaskType;
    value?: string;
}
export declare enum MaskType {
    Variable = 1,
    Regex = 2
}
/**
 * Meta data for a metrics column.
 */
export interface MetricsColumnMetaData {
    /**
     * Name.
     */
    columnName?: string;
    /**
     * Data type.
     */
    columnValueType?: string;
}
/**
 * Metrics columns header
 */
export interface MetricsColumnsHeader {
    /**
     * Properties of deployment group for which metrics are provided. E.g. 1: LastJobStatus E.g. 2: TargetState
     */
    dimensions?: MetricsColumnMetaData[];
    /**
     * The types of metrics. E.g. 1: total count of deployment targets. E.g. 2: Average time of deployment to the deployment targets.
     */
    metrics?: MetricsColumnMetaData[];
}
/**
 * Metrics row.
 */
export interface MetricsRow {
    /**
     * The values of the properties mentioned as 'Dimensions' in column header. E.g. 1: For a property 'LastJobStatus' - metrics will be provided for 'passed', 'failed', etc. E.g. 2: For a property 'TargetState' - metrics will be provided for 'online', 'offline' targets.
     */
    dimensions?: string[];
    /**
     * Metrics in serialized format. Should be deserialized based on the data type provided in header.
     */
    metrics?: string[];
}
export declare enum OperatingSystemType {
    Windows = 0,
    Linux = 1
}
export declare enum OperationType {
    ConfigurationJob = 0,
    SizingJob = 1,
    IncreaseCapacity = 2,
    Reimage = 3,
    DeleteVMs = 4
}
export declare enum OrchestrationType {
    Uniform = 0,
    Flexible = 1
}
/**
 * Represents a downloadable package.
 */
export interface PackageMetadata {
    /**
     * The date the package was created
     */
    createdOn?: Date;
    /**
     * A direct link to download the package.
     */
    downloadUrl?: string;
    /**
     * The UI uses this to display instructions, i.e. "unzip MyAgent.zip"
     */
    filename?: string;
    /**
     * MD5 hash as a base64 string
     */
    hashValue?: string;
    /**
     * A link to documentation
     */
    infoUrl?: string;
    /**
     * The platform (win7, linux, etc.)
     */
    platform?: string;
    /**
     * The type of package (e.g. "agent")
     */
    type?: string;
    /**
     * The package version.
     */
    version?: PackageVersion;
}
export interface PackageVersion {
    major?: number;
    minor?: number;
    patch?: number;
}
export interface PlanEnvironment {
    mask?: MaskHint[];
    options?: {
        [key: string]: JobOption;
    };
    variables?: {
        [key: string]: string;
    };
}
export declare enum PlanGroupStatus {
    Running = 1,
    Queued = 2,
    All = 3
}
export declare enum PlanGroupStatusFilter {
    Running = 1,
    Queued = 2,
    All = 3
}
export interface ProjectReference {
    id?: string;
    name?: string;
}
export interface PublishTaskGroupMetadata {
    comment?: string;
    parentDefinitionRevision?: number;
    preview?: boolean;
    taskGroupId?: string;
    taskGroupRevision?: number;
}
export interface ResourceFilterOptions {
    identities?: VSSInterfaces.IdentityRef[];
    resourceTypes?: string[];
}
export interface ResourceFilters {
    createdBy?: string[];
    resourceType?: string[];
    searchText?: string;
}
/**
 * Resources include Service Connections, Variable Groups and Secure Files.
 */
export interface ResourceItem {
    /**
     * Gets or sets the identity who created the resource.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * Gets or sets description of the resource.
     */
    description?: string;
    /**
     * Gets or sets icon url of the resource.
     */
    iconUrl?: string;
    /**
     * Gets or sets Id of the resource.
     */
    id?: string;
    /**
     * Indicates whether resource is outdated or not.
     */
    isOutdated?: boolean;
    /**
     * Indicates whether resource is shared with other projects or not.
     */
    isShared?: boolean;
    /**
     * Gets or sets name of the resource.
     */
    name?: string;
    /**
     * Gets or sets internal properties of the resource.
     */
    properties?: {
        [key: string]: string;
    };
    /**
     * Gets or sets resource type.
     */
    resourceType?: string;
}
export interface ResourceLimit {
    failedToReachAllProviders?: boolean;
    hostId?: string;
    isHosted?: boolean;
    isPremium?: boolean;
    parallelismTag?: string;
    resourceLimitsData?: {
        [key: string]: string;
    };
    totalCount?: number;
    totalMinutes?: number;
}
/**
 * A request for a resource's exclusive lock
 */
export interface ResourceLockRequest {
    /**
     * The date/time this request was assigned.
     */
    assignTime?: Date;
    /**
     * The ID of the check run waiting on this request
     */
    checkRunId?: string;
    /**
     * The ID of the pipeline that requested this resource
     */
    definitionId?: number;
    /**
     * The date/time this request was finished.
     */
    finishTime?: Date;
    /**
     * The behavior this request should exhibit in relation to other lock requests
     */
    lockType?: ExclusiveLockType;
    /**
     * Attempt of the graph node
     */
    nodeAttempt?: number;
    /**
     * Name of the graph node (currently stage) requesting this resource
     */
    nodeName?: string;
    /**
     * Internal ID for the orchestration plan connected with this request.
     */
    planId?: string;
    /**
     * The ID of the project of the check run and definition exist in
     */
    projectId?: string;
    /**
     * The date/time this request was queued.
     */
    queueTime?: Date;
    /**
     * ID of the request.
     */
    requestId?: number;
    /**
     * The id of the resource
     */
    resourceId?: string;
    /**
     * The type of the resource
     */
    resourceType?: string;
    /**
     * The result of this request.
     */
    status?: ResourceLockStatus;
}
export declare enum ResourceLockStatus {
    Queued = 0,
    InUse = 1,
    Finished = 2,
    TimedOut = 3,
    Canceled = 4,
    Abandoned = 5,
    WaitingOnChecks = 6
}
export interface ResourcesHubData {
    continuationToken?: string;
    hasProjectLevelManagePermission?: boolean;
    resourceFilterOptions?: ResourceFilterOptions;
    resourceFilters?: ResourceFilters;
    resourceItems?: ResourceItem[];
}
export interface ResourceUsage {
    resourceLimit?: ResourceLimit;
    runningRequests?: TaskAgentJobRequest[];
    usedCount?: number;
    usedMinutes?: number;
}
export interface ResultTransformationDetails {
    resultTemplate?: string;
}
export interface SecureFile {
    createdBy?: VSSInterfaces.IdentityRef;
    createdOn?: Date;
    id?: string;
    modifiedBy?: VSSInterfaces.IdentityRef;
    modifiedOn?: Date;
    name?: string;
    properties?: {
        [key: string]: string;
    };
    ticket?: string;
}
export declare enum SecureFileActionFilter {
    None = 0,
    Manage = 2,
    Use = 16
}
export interface SecureFileEvent {
    eventType?: string;
    projectId?: string;
    secureFiles?: SecureFile[];
}
export interface SendJobResponse {
    events?: JobEventsConfig;
    variables?: {
        [key: string]: string;
    };
}
export interface ServerExecutionDefinition {
    events?: EventsConfig;
    handlerName?: string;
}
export interface ServerTaskRequestMessage extends JobRequestMessage {
    taskDefinition?: TaskDefinition;
    taskInstance?: TaskInstance;
}
/**
 * Represents an endpoint which may be used by an orchestration job.
 */
export interface ServiceEndpoint {
    /**
     * Gets or sets the identity reference for the administrators group of the service endpoint.
     */
    administratorsGroup?: VSSInterfaces.IdentityRef;
    /**
     * Gets or sets the authorization data for talking to the endpoint.
     */
    authorization?: EndpointAuthorization;
    /**
     * Gets or sets the identity reference for the user who created the Service endpoint.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    data?: {
        [key: string]: string;
    };
    /**
     * Gets or sets the description of endpoint.
     */
    description?: string;
    groupScopeId?: string;
    /**
     * Gets or sets the identifier of this endpoint.
     */
    id?: string;
    /**
     * If this endpoint is disabled.
     */
    isDisabled?: boolean;
    /**
     * EndPoint state indicator
     */
    isReady?: boolean;
    /**
     * Indicates whether service endpoint is shared with other projects or not.
     */
    isShared?: boolean;
    /**
     * Gets or sets the friendly name of the endpoint.
     */
    name?: string;
    /**
     * Error message during creation/deletion of endpoint
     */
    operationStatus?: any;
    /**
     * Gets or sets the owner of the endpoint.
     */
    owner?: string;
    /**
     * Gets or sets the identity reference for the readers group of the service endpoint.
     */
    readersGroup?: VSSInterfaces.IdentityRef;
    /**
     * Gets or sets the type of the endpoint.
     */
    type?: string;
    /**
     * Gets or sets the url of the endpoint.
     */
    url?: string;
}
export interface ServiceEndpointAuthenticationScheme {
    /**
     * Gets or sets the authorization headers of service endpoint authentication scheme.
     */
    authorizationHeaders?: AuthorizationHeader[];
    /**
     * Gets or sets the certificates of service endpoint authentication scheme.
     */
    clientCertificates?: ClientCertificate[];
    /**
     * Gets or sets the display name for the service endpoint authentication scheme.
     */
    displayName?: string;
    /**
     * Gets or sets the input descriptors for the service endpoint authentication scheme.
     */
    inputDescriptors?: FormInputInterfaces.InputDescriptor[];
    /**
     * Gets or sets the scheme for service endpoint authentication.
     */
    scheme?: string;
}
export interface ServiceEndpointDetails {
    authorization?: EndpointAuthorization;
    data?: {
        [key: string]: string;
    };
    type?: string;
    url?: string;
}
/**
 * Represents service endpoint execution data.
 */
export interface ServiceEndpointExecutionData {
    /**
     * Gets the definition of service endpoint execution owner.
     */
    definition?: TaskOrchestrationOwner;
    /**
     * Gets the finish time of service endpoint execution.
     */
    finishTime?: Date;
    /**
     * Gets the Id of service endpoint execution data.
     */
    id?: number;
    /**
     * Gets the owner of service endpoint execution data.
     */
    owner?: TaskOrchestrationOwner;
    /**
     * Gets the plan type of service endpoint execution data.
     */
    planType?: string;
    /**
     * Gets the result of service endpoint execution.
     */
    result?: TaskResult;
    /**
     * Gets the start time of service endpoint execution.
     */
    startTime?: Date;
}
export interface ServiceEndpointExecutionRecord {
    /**
     * Gets the execution data of service endpoint execution.
     */
    data?: ServiceEndpointExecutionData;
    /**
     * Gets the Id of service endpoint.
     */
    endpointId?: string;
}
export interface ServiceEndpointExecutionRecordsInput {
    data?: ServiceEndpointExecutionData;
    endpointIds?: string[];
}
export interface ServiceEndpointRequest {
    dataSourceDetails?: DataSourceDetails;
    resultTransformationDetails?: ResultTransformationDetails;
    serviceEndpointDetails?: ServiceEndpointDetails;
}
export interface ServiceEndpointRequestResult {
    errorMessage?: string;
    result?: any;
    statusCode?: string;
}
/**
 * Represents type of the service endpoint.
 */
export interface ServiceEndpointType {
    /**
     * Authentication scheme of service endpoint type.
     */
    authenticationSchemes?: ServiceEndpointAuthenticationScheme[];
    /**
     * Data sources of service endpoint type.
     */
    dataSources?: DataSource[];
    /**
     * Dependency data of service endpoint type.
     */
    dependencyData?: DependencyData[];
    /**
     * Gets or sets the description of service endpoint type.
     */
    description?: string;
    /**
     * Gets or sets the display name of service endpoint type.
     */
    displayName?: string;
    /**
     * Gets or sets the endpoint url of service endpoint type.
     */
    endpointUrl?: EndpointUrl;
    /**
     * Gets or sets the help link of service endpoint type.
     */
    helpLink?: HelpLink;
    helpMarkDown?: string;
    /**
     * Gets or sets the icon url of service endpoint type.
     */
    iconUrl?: string;
    /**
     * Input descriptor of service endpoint type.
     */
    inputDescriptors?: FormInputInterfaces.InputDescriptor[];
    /**
     * Gets or sets the name of service endpoint type.
     */
    name?: string;
    /**
     * Trusted hosts of a service endpoint type.
     */
    trustedHosts?: string[];
    /**
     * Gets or sets the ui contribution id of service endpoint type.
     */
    uiContributionId?: string;
}
/**
 * A task agent.
 */
export interface TaskAgent extends TaskAgentReference {
    /**
     * The agent cloud request that's currently associated with this agent.
     */
    assignedAgentCloudRequest?: TaskAgentCloudRequest;
    /**
     * The request which is currently assigned to this agent.
     */
    assignedRequest?: TaskAgentJobRequest;
    /**
     * Authorization information for this agent.
     */
    authorization?: TaskAgentAuthorization;
    /**
     * Date on which this agent was created.
     */
    createdOn?: Date;
    /**
     * The last request which was completed by this agent.
     */
    lastCompletedRequest?: TaskAgentJobRequest;
    /**
     * Maximum job parallelism allowed for this agent.
     */
    maxParallelism?: number;
    /**
     * Pending update for this agent.
     */
    pendingUpdate?: TaskAgentUpdate;
    properties?: any;
    /**
     * Date on which the last connectivity status change occurred.
     */
    statusChangedOn?: Date;
    /**
     * System-defined capabilities supported by this agent's host. Warning: To set capabilities use the PUT method, PUT will completely overwrite existing capabilities.
     */
    systemCapabilities?: {
        [key: string]: string;
    };
    /**
     * User-defined capabilities supported by this agent's host. Warning: To set capabilities use the PUT method, PUT will completely overwrite existing capabilities.
     */
    userCapabilities?: {
        [key: string]: string;
    };
}
/**
 * Provides data necessary for authorizing the agent using OAuth 2.0 authentication flows.
 */
export interface TaskAgentAuthorization {
    /**
     * Endpoint used to obtain access tokens from the configured token service.
     */
    authorizationUrl?: string;
    /**
     * Client identifier for this agent.
     */
    clientId?: string;
    /**
     * Public key used to verify the identity of this agent.
     */
    publicKey?: TaskAgentPublicKey;
}
export interface TaskAgentCloud {
    /**
     * Gets or sets a AcquireAgentEndpoint using which a request can be made to acquire new agent
     */
    acquireAgentEndpoint?: string;
    acquisitionTimeout?: number;
    agentCloudId?: number;
    getAccountParallelismEndpoint?: string;
    getAgentDefinitionEndpoint?: string;
    getAgentRequestStatusEndpoint?: string;
    id?: string;
    /**
     * Signifies that this Agent Cloud is internal and should not be user-manageable
     */
    internal?: boolean;
    maxParallelism?: number;
    name?: string;
    releaseAgentEndpoint?: string;
    sharedSecret?: string;
    /**
     * Gets or sets the type of the endpoint.
     */
    type?: string;
}
export interface TaskAgentCloudRequest {
    agent?: TaskAgentReference;
    agentCloudId?: number;
    agentConnectedTime?: Date;
    agentData?: any;
    agentSpecification?: any;
    pool?: TaskAgentPoolReference;
    provisionedTime?: Date;
    provisionRequestTime?: Date;
    releaseRequestTime?: Date;
    requestId?: string;
}
export interface TaskAgentCloudType {
    /**
     * Gets or sets the display name of agent cloud type.
     */
    displayName?: string;
    /**
     * Gets or sets the input descriptors
     */
    inputDescriptors?: FormInputInterfaces.InputDescriptor[];
    /**
     * Gets or sets the name of agent cloud type.
     */
    name?: string;
}
export interface TaskAgentDowngrade extends TaskAgentUpdateReason {
}
export interface TaskAgentJob {
    container?: string;
    id?: string;
    name?: string;
    sidecarContainers?: {
        [key: string]: string;
    };
    steps?: TaskAgentJobStep[];
    variables?: TaskAgentJobVariable[];
}
/**
 * A job request for an agent.
 */
export interface TaskAgentJobRequest {
    agentSpecification?: any;
    /**
     * The date/time this request was assigned.
     */
    assignTime?: Date;
    /**
     * Additional data about the request.
     */
    data?: {
        [key: string]: string;
    };
    /**
     * The pipeline definition associated with this request
     */
    definition?: TaskOrchestrationOwner;
    /**
     * A list of demands required to fulfill this request.
     */
    demands?: Demand[];
    /**
     * The date/time this request was finished.
     */
    finishTime?: Date;
    /**
     * The host which triggered this request.
     */
    hostId?: string;
    /**
     * ID of the job resulting from this request.
     */
    jobId?: string;
    /**
     * Name of the job resulting from this request.
     */
    jobName?: string;
    /**
     * The deadline for the agent to renew the lock.
     */
    lockedUntil?: Date;
    matchedAgents?: TaskAgentReference[];
    matchesAllAgentsInPool?: boolean;
    orchestrationId?: string;
    /**
     * The pipeline associated with this request
     */
    owner?: TaskOrchestrationOwner;
    planGroup?: string;
    /**
     * Internal ID for the orchestration plan connected with this request.
     */
    planId?: string;
    /**
     * Internal detail representing the type of orchestration plan.
     */
    planType?: string;
    /**
     * The ID of the pool this request targets
     */
    poolId?: number;
    priority?: number;
    /**
     * The ID of the queue this request targets
     */
    queueId?: number;
    /**
     * The date/time this request was queued.
     */
    queueTime?: Date;
    /**
     * The date/time this request was receieved by an agent.
     */
    receiveTime?: Date;
    /**
     * ID of the request.
     */
    requestId?: number;
    /**
     * The agent allocated for this request.
     */
    reservedAgent?: TaskAgentReference;
    /**
     * The result of this request.
     */
    result?: TaskResult;
    /**
     * Scope of the pipeline; matches the project ID.
     */
    scopeId?: string;
    /**
     * The service which owns this request.
     */
    serviceOwner?: string;
    statusMessage?: string;
    userDelayed?: boolean;
}
/**
 * This is useful in getting a list of deployment targets, filtered by the result of their last job.
 */
export declare enum TaskAgentJobResultFilter {
    /**
     * Only those deployment targets on which last job failed (**Abandoned**, **Canceled**, **Failed**, **Skipped**).
     */
    Failed = 1,
    /**
     * Only those deployment targets on which last job Passed (**Succeeded**, **Succeeded with issues**).
     */
    Passed = 2,
    /**
     * Only those deployment targets that never executed a job.
     */
    NeverDeployed = 4,
    /**
     * All deployment targets.
     */
    All = 7
}
export interface TaskAgentJobStep {
    condition?: string;
    continueOnError?: boolean;
    enabled?: boolean;
    env?: {
        [key: string]: string;
    };
    id?: string;
    inputs?: {
        [key: string]: string;
    };
    name?: string;
    retryCountOnTaskFailure?: number;
    task?: TaskAgentJobTask;
    timeoutInMinutes?: number;
    type?: TaskAgentJobStepType;
}
export declare enum TaskAgentJobStepType {
    Task = 1,
    Action = 2
}
export interface TaskAgentJobTask {
    id?: string;
    name?: string;
    version?: string;
}
export interface TaskAgentJobVariable {
    name?: string;
    secret?: boolean;
    value?: string;
}
export interface TaskAgentManualUpdate extends TaskAgentUpdateReason {
}
/**
 * Provides a contract for receiving messages from the task orchestrator.
 */
export interface TaskAgentMessage {
    /**
     * Gets or sets the body of the message. If the <c>IV</c> property is provided the body will need to be decrypted using the <c>TaskAgentSession.EncryptionKey</c> value in addition to the <c>IV</c>.
     */
    body?: string;
    /**
     * Gets or sets the initialization vector used to encrypt this message.
     */
    iV?: number[];
    /**
     * Gets or sets the message identifier.
     */
    messageId?: number;
    /**
     * Gets or sets the message type, describing the data contract found in <c>TaskAgentMessage.Body</c>.
     */
    messageType?: string;
}
export interface TaskAgentMinAgentVersionRequiredUpdate extends TaskAgentUpdateReason {
    jobDefinition?: TaskOrchestrationOwner;
    jobOwner?: TaskOrchestrationOwner;
    minAgentVersion?: Demand;
}
/**
 * An organization-level grouping of agents.
 */
export interface TaskAgentPool extends TaskAgentPoolReference {
    /**
     * The ID of the associated agent cloud.
     */
    agentCloudId?: number;
    /**
     * Whether or not a queue should be automatically provisioned for each project collection.
     */
    autoProvision?: boolean;
    /**
     * Whether or not the pool should autosize itself based on the Agent Cloud Provider settings.
     */
    autoSize?: boolean;
    /**
     * Whether or not agents in this pool are allowed to automatically update
     */
    autoUpdate?: boolean;
    /**
     * Creator of the pool. The creator of the pool is automatically added into the administrators group for the pool on creation.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * The date/time of the pool creation.
     */
    createdOn?: Date;
    /**
     * Owner or administrator of the pool.
     */
    owner?: VSSInterfaces.IdentityRef;
    properties?: any;
    /**
     * Target parallelism - Only applies to agent pools that are backed by pool providers. It will be null for regular pools.
     */
    targetSize?: number;
}
/**
 * Filters pools based on whether the calling user has permission to use or manage the pool.
 */
export declare enum TaskAgentPoolActionFilter {
    None = 0,
    Manage = 2,
    Use = 16
}
export interface TaskAgentPoolMaintenanceDefinition {
    /**
     * Enable maintenance
     */
    enabled?: boolean;
    /**
     * Id
     */
    id?: number;
    /**
     * Maintenance job timeout per agent
     */
    jobTimeoutInMinutes?: number;
    /**
     * Max percentage of agents within a pool running maintenance job at given time
     */
    maxConcurrentAgentsPercentage?: number;
    options?: TaskAgentPoolMaintenanceOptions;
    /**
     * Pool reference for the maintenance definition
     */
    pool?: TaskAgentPoolReference;
    retentionPolicy?: TaskAgentPoolMaintenanceRetentionPolicy;
    scheduleSetting?: TaskAgentPoolMaintenanceSchedule;
}
export interface TaskAgentPoolMaintenanceJob {
    /**
     * The maintenance definition for the maintenance job
     */
    definitionId?: number;
    /**
     * The total error counts during the maintenance job
     */
    errorCount?: number;
    /**
     * Time that the maintenance job was completed
     */
    finishTime?: Date;
    /**
     * Id of the maintenance job
     */
    jobId?: number;
    /**
     * The log download url for the maintenance job
     */
    logsDownloadUrl?: string;
    /**
     * Orchestration/Plan Id for the maintenance job
     */
    orchestrationId?: string;
    /**
     * Pool reference for the maintenance job
     */
    pool?: TaskAgentPoolReference;
    /**
     * Time that the maintenance job was queued
     */
    queueTime?: Date;
    /**
     * The identity that queued the maintenance job
     */
    requestedBy?: VSSInterfaces.IdentityRef;
    /**
     * The maintenance job result
     */
    result?: TaskAgentPoolMaintenanceJobResult;
    /**
     * Time that the maintenance job was started
     */
    startTime?: Date;
    /**
     * Status of the maintenance job
     */
    status?: TaskAgentPoolMaintenanceJobStatus;
    targetAgents?: TaskAgentPoolMaintenanceJobTargetAgent[];
    /**
     * The total warning counts during the maintenance job
     */
    warningCount?: number;
}
export declare enum TaskAgentPoolMaintenanceJobResult {
    Succeeded = 1,
    Failed = 2,
    Canceled = 4
}
export declare enum TaskAgentPoolMaintenanceJobStatus {
    InProgress = 1,
    Completed = 2,
    Cancelling = 4,
    Queued = 8
}
export interface TaskAgentPoolMaintenanceJobTargetAgent {
    agent?: TaskAgentReference;
    jobId?: number;
    result?: TaskAgentPoolMaintenanceJobResult;
    status?: TaskAgentPoolMaintenanceJobStatus;
}
export interface TaskAgentPoolMaintenanceOptions {
    /**
     * time to consider a System.DefaultWorkingDirectory is stale
     */
    workingDirectoryExpirationInDays?: number;
}
export interface TaskAgentPoolMaintenanceRetentionPolicy {
    /**
     * Number of records to keep for maintenance job executed with this definition.
     */
    numberOfHistoryRecordsToKeep?: number;
}
export interface TaskAgentPoolMaintenanceSchedule {
    /**
     * Days for a build (flags enum for days of the week)
     */
    daysToBuild?: TaskAgentPoolMaintenanceScheduleDays;
    /**
     * The Job Id of the Scheduled job that will queue the pool maintenance job.
     */
    scheduleJobId?: string;
    /**
     * Local timezone hour to start
     */
    startHours?: number;
    /**
     * Local timezone minute to start
     */
    startMinutes?: number;
    /**
     * Time zone of the build schedule (string representation of the time zone id)
     */
    timeZoneId?: string;
}
export declare enum TaskAgentPoolMaintenanceScheduleDays {
    /**
     * Do not run.
     */
    None = 0,
    /**
     * Run on Monday.
     */
    Monday = 1,
    /**
     * Run on Tuesday.
     */
    Tuesday = 2,
    /**
     * Run on Wednesday.
     */
    Wednesday = 4,
    /**
     * Run on Thursday.
     */
    Thursday = 8,
    /**
     * Run on Friday.
     */
    Friday = 16,
    /**
     * Run on Saturday.
     */
    Saturday = 32,
    /**
     * Run on Sunday.
     */
    Sunday = 64,
    /**
     * Run on all days of the week.
     */
    All = 127
}
/**
 * Additional settings and descriptors for a TaskAgentPool
 */
export declare enum TaskAgentPoolOptions {
    None = 0,
    /**
     * TaskAgentPool backed by the Elastic pool service
     */
    ElasticPool = 1,
    /**
     * Set to true if agents are re-imaged after each TaskAgentJobRequest
     */
    SingleUseAgents = 2,
    /**
     * Set to true if agents are held for investigation after a TaskAgentJobRequest failure
     */
    PreserveAgentOnJobFailure = 4
}
export interface TaskAgentPoolReference {
    id?: number;
    /**
     * Gets or sets a value indicating whether or not this pool is managed by the service.
     */
    isHosted?: boolean;
    /**
     * Determines whether the pool is legacy.
     */
    isLegacy?: boolean;
    name?: string;
    /**
     * Additional pool settings and details
     */
    options?: TaskAgentPoolOptions;
    /**
     * Gets or sets the type of the pool
     */
    poolType?: TaskAgentPoolType;
    scope?: string;
    /**
     * Gets the current size of the pool.
     */
    size?: number;
}
export interface TaskAgentPoolStatus extends TaskAgentPoolReference {
    /**
     * Number of requests queued and assigned to an agent. Not running yet.
     */
    assignedRequestCount?: number;
    /**
     * Number of queued requests which are not assigned to any agents
     */
    queuedRequestCount?: number;
    /**
     * Number of currently running requests
     */
    runningRequestCount?: number;
}
export interface TaskAgentPoolSummary {
    columnsHeader?: MetricsColumnsHeader;
    deploymentGroups?: DeploymentGroupReference[];
    pool?: TaskAgentPoolReference;
    queues?: TaskAgentQueue[];
    rows?: MetricsRow[];
}
/**
 * The type of agent pool.
 */
export declare enum TaskAgentPoolType {
    /**
     * A typical pool of task agents
     */
    Automation = 1,
    /**
     * A deployment pool
     */
    Deployment = 2
}
/**
 * Represents the public key portion of an RSA asymmetric key.
 */
export interface TaskAgentPublicKey {
    /**
     * Gets or sets the exponent for the public key.
     */
    exponent?: number[];
    /**
     * Gets or sets the modulus for the public key.
     */
    modulus?: number[];
}
/**
 * An agent queue.
 */
export interface TaskAgentQueue {
    /**
     * ID of the queue
     */
    id?: number;
    /**
     * Name of the queue
     */
    name?: string;
    /**
     * Pool reference for this queue
     */
    pool?: TaskAgentPoolReference;
    /**
     * Project ID
     */
    projectId?: string;
}
/**
 * Filters queues based on whether the calling user has permission to use or manage the queue.
 */
export declare enum TaskAgentQueueActionFilter {
    None = 0,
    Manage = 2,
    Use = 16
}
/**
 * A reference to an agent.
 */
export interface TaskAgentReference {
    _links?: any;
    /**
     * This agent's access point.
     */
    accessPoint?: string;
    /**
     * Whether or not this agent should run jobs.
     */
    enabled?: boolean;
    /**
     * Identifier of the agent.
     */
    id?: number;
    /**
     * Name of the agent.
     */
    name?: string;
    /**
     * Agent OS.
     */
    oSDescription?: string;
    /**
     * Provisioning state of this agent.
     */
    provisioningState?: string;
    /**
     * Whether or not the agent is online.
     */
    status?: TaskAgentStatus;
    /**
     * Agent version.
     */
    version?: string;
}
export declare enum TaskAgentRequestUpdateOptions {
    None = 0,
    BumpRequestToTop = 1
}
/**
 * Represents a session for performing message exchanges from an agent.
 */
export interface TaskAgentSession {
    /**
     * Gets or sets the agent which is the target of the session.
     */
    agent?: TaskAgentReference;
    /**
     * Gets the key used to encrypt message traffic for this session.
     */
    encryptionKey?: TaskAgentSessionKey;
    /**
     * Gets or sets the owner name of this session. Generally this will be the machine of origination.
     */
    ownerName?: string;
    /**
     * Gets the unique identifier for this session.
     */
    sessionId?: string;
    systemCapabilities?: {
        [key: string]: string;
    };
}
/**
 * Represents a symmetric key used for message-level encryption for communication sent to an agent.
 */
export interface TaskAgentSessionKey {
    /**
     * Gets or sets a value indicating whether or not the key value is encrypted. If this value is true, the Value property should be decrypted using the <c>RSA</c> key exchanged with the server during registration.
     */
    encrypted?: boolean;
    /**
     * Gets or sets the symmetric key value.
     */
    value?: number[];
}
export declare enum TaskAgentStatus {
    Offline = 1,
    Online = 2
}
/**
 * This is useful in getting a list of deployment targets, filtered by the deployment agent status.
 */
export declare enum TaskAgentStatusFilter {
    /**
     * Only deployment targets that are offline.
     */
    Offline = 1,
    /**
     * Only deployment targets that are online.
     */
    Online = 2,
    /**
     * All deployment targets.
     */
    All = 3
}
/**
 * Details about an agent update.
 */
export interface TaskAgentUpdate {
    /**
     * Current state of this agent update.
     */
    currentState?: string;
    /**
     * Reason for this update.
     */
    reason?: TaskAgentUpdateReason;
    /**
     * Identity which requested this update.
     */
    requestedBy?: VSSInterfaces.IdentityRef;
    /**
     * Date on which this update was requested.
     */
    requestTime?: Date;
    /**
     * Source agent version of the update.
     */
    sourceVersion?: PackageVersion;
    /**
     * Target agent version of the update.
     */
    targetVersion?: PackageVersion;
}
export interface TaskAgentUpdateReason {
    code?: TaskAgentUpdateReasonType;
}
export declare enum TaskAgentUpdateReasonType {
    Manual = 1,
    MinAgentVersionRequired = 2,
    Downgrade = 3
}
export interface TaskAssignedEvent extends TaskEvent {
}
export interface TaskAttachment {
    _links?: any;
    createdOn?: Date;
    lastChangedBy?: string;
    lastChangedOn?: Date;
    name?: string;
    recordId?: string;
    timelineId?: string;
    type?: string;
}
export declare enum TaskCommandMode {
    Any = 0,
    Restricted = 1
}
export interface TaskCommandRestrictions {
    mode?: TaskCommandMode;
}
export interface TaskCompletedEvent extends TaskEvent {
    /**
     * The api request was no delivered successfully
     */
    deliveryFailed?: boolean;
    /**
     * The result of the task.
     */
    result?: TaskResult;
}
export interface TaskDefinition {
    _buildConfigMapping?: {
        [key: string]: string;
    };
    agentExecution?: TaskExecution;
    author?: string;
    category?: string;
    contentsUploaded?: boolean;
    contributionIdentifier?: string;
    contributionVersion?: string;
    dataSourceBindings?: DataSourceBinding[];
    definitionType?: string;
    demands?: Demand[];
    deprecated?: boolean;
    description?: string;
    disabled?: boolean;
    ecosystem?: string;
    execution?: {
        [key: string]: any;
    };
    friendlyName?: string;
    groups?: TaskGroupDefinition[];
    helpMarkDown?: string;
    helpUrl?: string;
    hostType?: string;
    iconUrl?: string;
    id?: string;
    inputs?: TaskInputDefinition[];
    instanceNameFormat?: string;
    minimumAgentVersion?: string;
    name?: string;
    outputVariables?: TaskOutputVariable[];
    packageLocation?: string;
    packageType?: string;
    postJobExecution?: {
        [key: string]: any;
    };
    preJobExecution?: {
        [key: string]: any;
    };
    preview?: boolean;
    releaseNotes?: string;
    restrictions?: TaskRestrictions;
    runsOn?: string[];
    satisfies?: string[];
    serverOwned?: boolean;
    showEnvironmentVariables?: boolean;
    sourceDefinitions?: TaskSourceDefinition[];
    sourceLocation?: string;
    version?: TaskVersion;
    visibility?: string[];
}
export interface TaskDefinitionEndpoint {
    /**
     * An ID that identifies a service connection to be used for authenticating endpoint requests.
     */
    connectionId?: string;
    /**
     * An Json based keyselector to filter response returned by fetching the endpoint <c>Url</c>.A Json based keyselector must be prefixed with "jsonpath:". KeySelector can be used to specify the filter to get the keys for the values specified with Selector. <example> The following keyselector defines an Json for extracting nodes named 'ServiceName'. <code> endpoint.KeySelector = "jsonpath://ServiceName"; </code></example>
     */
    keySelector?: string;
    /**
     * The scope as understood by Connected Services. Essentially, a project-id for now.
     */
    scope?: string;
    /**
     * An XPath/Json based selector to filter response returned by fetching the endpoint <c>Url</c>. An XPath based selector must be prefixed with the string "xpath:". A Json based selector must be prefixed with "jsonpath:". <example> The following selector defines an XPath for extracting nodes named 'ServiceName'. <code> endpoint.Selector = "xpath://ServiceName"; </code></example>
     */
    selector?: string;
    /**
     * TaskId that this endpoint belongs to.
     */
    taskId?: string;
    /**
     * URL to GET.
     */
    url?: string;
}
export interface TaskDefinitionReference {
    /**
     * Gets or sets the definition type. Values can be 'task' or 'metaTask'.
     */
    definitionType: string;
    /**
     * Gets or sets the unique identifier of task.
     */
    id: string;
    /**
     * Gets or sets the version specification of task.
     */
    versionSpec: string;
}
export declare enum TaskDefinitionStatus {
    Preinstalled = 1,
    ReceivedInstallOrUpdate = 2,
    Installed = 3,
    ReceivedUninstall = 4,
    Uninstalled = 5,
    RequestedUpdate = 6,
    Updated = 7,
    AlreadyUpToDate = 8,
    InlineUpdateReceived = 9
}
export interface TaskEvent extends JobEvent {
    /**
     * The ID of the task definition.
     */
    taskId?: string;
}
export interface TaskExecution {
    /**
     * The utility task to run.  Specifying this means that this task definition is simply a meta task to call another task. This is useful for tasks that call utility tasks like powershell and commandline
     */
    execTask?: TaskReference;
    /**
     * If a task is going to run code, then this provides the type/script etc... information by platform. For example, it might look like. net45: { typeName: "Microsoft.TeamFoundation.Automation.Tasks.PowerShellTask", assemblyName: "Microsoft.TeamFoundation.Automation.Tasks.PowerShell.dll" } net20: { typeName: "Microsoft.TeamFoundation.Automation.Tasks.PowerShellTask", assemblyName: "Microsoft.TeamFoundation.Automation.Tasks.PowerShell.dll" } java: { jar: "powershelltask.tasks.automation.teamfoundation.microsoft.com", } node: { script: "powershellhost.js", }
     */
    platformInstructions?: {
        [key: string]: {
            [key: string]: string;
        };
    };
}
export interface TaskGroup extends TaskDefinition {
    /**
     * Gets or sets comment.
     */
    comment?: string;
    /**
     * Gets or sets the identity who created.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * Gets or sets date on which it got created.
     */
    createdOn?: Date;
    /**
     * Gets or sets as 'true' to indicate as deleted, 'false' otherwise.
     */
    deleted?: boolean;
    /**
     * Gets or sets the identity who modified.
     */
    modifiedBy?: VSSInterfaces.IdentityRef;
    /**
     * Gets or sets date on which it got modified.
     */
    modifiedOn?: Date;
    /**
     * Gets or sets the owner.
     */
    owner?: string;
    /**
     * Gets or sets parent task group Id. This is used while creating a draft task group.
     */
    parentDefinitionId?: string;
    /**
     * Gets or sets revision.
     */
    revision?: number;
    /**
     * Gets or sets the tasks.
     */
    tasks?: TaskGroupStep[];
}
export interface TaskGroupCreateParameter {
    /**
     * Sets author name of the task group.
     */
    author?: string;
    /**
     * Sets category of the task group.
     */
    category?: string;
    /**
     * Sets description of the task group.
     */
    description?: string;
    /**
     * Sets friendly name of the task group.
     */
    friendlyName?: string;
    /**
     * Sets url icon of the task group.
     */
    iconUrl?: string;
    /**
     * Sets input for the task group.
     */
    inputs?: TaskInputDefinition[];
    /**
     * Sets display name of the task group.
     */
    instanceNameFormat?: string;
    /**
     * Sets name of the task group.
     */
    name?: string;
    /**
     * Sets parent task group Id. This is used while creating a draft task group.
     */
    parentDefinitionId?: string;
    /**
     * Sets RunsOn of the task group. Value can be 'Agent', 'Server' or 'DeploymentGroup'.
     */
    runsOn?: string[];
    /**
     * Sets tasks for the task group.
     */
    tasks?: TaskGroupStep[];
    /**
     * Sets version of the task group.
     */
    version?: TaskVersion;
}
export interface TaskGroupDefinition {
    displayName?: string;
    isExpanded?: boolean;
    name?: string;
    tags?: string[];
    visibleRule?: string;
}
export declare enum TaskGroupExpands {
    None = 0,
    Tasks = 2
}
export interface TaskGroupPublishPreviewParameter extends TaskGroupUpdatePropertiesBase {
    /**
     * This is to disable previous versions of task group upon publish
     */
    disablePriorVersions?: boolean;
    /**
     * Denotes if task group is in preview
     */
    preview?: boolean;
    /**
     * This is the revision of task group that is getting published
     */
    revision?: number;
    /**
     * This is the version of task group that is getting published
     */
    version?: TaskVersion;
}
/**
 * Specifies the desired ordering of taskGroups.
 */
export declare enum TaskGroupQueryOrder {
    /**
     * Order by createdon ascending.
     */
    CreatedOnAscending = 0,
    /**
     * Order by createdon descending.
     */
    CreatedOnDescending = 1
}
export interface TaskGroupRestoreParameter extends TaskGroupUpdatePropertiesBase {
    /**
     * This is to restore deleted Task Group
     */
    restore?: boolean;
}
export interface TaskGroupRevision {
    changedBy?: VSSInterfaces.IdentityRef;
    changedDate?: Date;
    changeType?: AuditAction;
    comment?: string;
    fileId?: number;
    majorVersion?: number;
    revision?: number;
    taskGroupId?: string;
}
/**
 * Represents tasks in the task group.
 */
export interface TaskGroupStep {
    /**
     * Gets or sets as 'true' to run the task always, 'false' otherwise.
     */
    alwaysRun?: boolean;
    /**
     * Gets or sets condition for the task.
     */
    condition?: string;
    /**
     * Gets or sets as 'true' to continue on error, 'false' otherwise.
     */
    continueOnError?: boolean;
    /**
     * Gets or sets the display name.
     */
    displayName?: string;
    /**
     * Gets or sets as task is enabled or not.
     */
    enabled?: boolean;
    /**
     * Gets dictionary of environment variables.
     */
    environment?: {
        [key: string]: string;
    };
    /**
     * Gets or sets dictionary of inputs.
     */
    inputs?: {
        [key: string]: string;
    };
    /**
     * Gets or sets the maximum number of retries
     */
    retryCountOnTaskFailure?: number;
    /**
     * Gets or sets the reference of the task.
     */
    task?: TaskDefinitionReference;
    /**
     * Gets or sets the maximum time, in minutes, that a task is allowed to execute on agent before being cancelled by server. A zero value indicates an infinite timeout.
     */
    timeoutInMinutes?: number;
}
export interface TaskGroupUpdateParameter {
    /**
     * Sets author name of the task group.
     */
    author?: string;
    /**
     * Sets category of the task group.
     */
    category?: string;
    /**
     * Sets comment of the task group.
     */
    comment?: string;
    /**
     * Sets description of the task group.
     */
    description?: string;
    /**
     * Sets friendly name of the task group.
     */
    friendlyName?: string;
    /**
     * Sets url icon of the task group.
     */
    iconUrl?: string;
    /**
     * Sets the unique identifier of this field.
     */
    id?: string;
    /**
     * Sets input for the task group.
     */
    inputs?: TaskInputDefinition[];
    /**
     * Sets display name of the task group.
     */
    instanceNameFormat?: string;
    /**
     * Sets name of the task group.
     */
    name?: string;
    /**
     * Gets or sets parent task group Id. This is used while creating a draft task group.
     */
    parentDefinitionId?: string;
    /**
     * Sets revision of the task group.
     */
    revision?: number;
    /**
     * Sets RunsOn of the task group. Value can be 'Agent', 'Server' or 'DeploymentGroup'.
     */
    runsOn?: string[];
    /**
     * Sets tasks for the task group.
     */
    tasks?: TaskGroupStep[];
    /**
     * Sets version of the task group.
     */
    version?: TaskVersion;
}
export interface TaskGroupUpdatePropertiesBase {
    /**
     * Comment for this update request
     */
    comment?: string;
}
export interface TaskHubLicenseDetails {
    enterpriseUsersCount?: number;
    failedToReachAllProviders?: boolean;
    freeHostedLicenseCount?: number;
    freeLicenseCount?: number;
    hasLicenseCountEverUpdated?: boolean;
    hostedAgentMinutesFreeCount?: number;
    hostedAgentMinutesUsedCount?: number;
    hostedLicensesArePremium?: boolean;
    msdnUsersCount?: number;
    /**
     * Microsoft-hosted licenses purchased from VSTS directly.
     */
    purchasedHostedLicenseCount?: number;
    /**
     * Self-hosted licenses purchased from VSTS directly.
     */
    purchasedLicenseCount?: number;
    totalHostedLicenseCount?: number;
    totalLicenseCount?: number;
    totalPrivateLicenseCount?: number;
}
export interface TaskHubOidcToken {
    oidcToken?: string;
}
export interface TaskInputDefinition extends DistributedTaskCommonInterfaces.TaskInputDefinitionBase {
}
export interface TaskInstance extends TaskReference {
    alwaysRun?: boolean;
    condition?: string;
    continueOnError?: boolean;
    displayName?: string;
    enabled?: boolean;
    environment?: {
        [key: string]: string;
    };
    instanceId?: string;
    refName?: string;
    retryCountOnTaskFailure?: number;
    timeoutInMinutes?: number;
}
/**
 * A task log connected to a timeline record.
 */
export interface TaskLog extends TaskLogReference {
    /**
     * The time of the task log creation.
     */
    createdOn?: Date;
    /**
     * The REST URL of the task log when indexed.
     */
    indexLocation?: string;
    /**
     * The time of the last modification of the task log.
     */
    lastChangedOn?: Date;
    /**
     * The number of the task log lines.
     */
    lineCount?: number;
    /**
     * The path of the task log.
     */
    path?: string;
}
/**
 * A reference to a task log. This class contains information about the output printed to the timeline record's logs console during pipeline run.
 */
export interface TaskLogReference {
    /**
     * The ID of the task log.
     */
    id?: number;
    /**
     * The REST URL of the task log.
     */
    location?: string;
}
export interface TaskOrchestrationContainer extends TaskOrchestrationItem {
    children?: TaskOrchestrationItem[];
    continueOnError?: boolean;
    data?: {
        [key: string]: string;
    };
    maxConcurrency?: number;
    parallel?: boolean;
    rollback?: TaskOrchestrationContainer;
}
export interface TaskOrchestrationItem {
    itemType?: TaskOrchestrationItemType;
}
export declare enum TaskOrchestrationItemType {
    Container = 0,
    Job = 1
}
export interface TaskOrchestrationJob extends TaskOrchestrationItem {
    demands?: Demand[];
    executeAs?: VSSInterfaces.IdentityRef;
    executionMode?: string;
    executionTimeout?: any;
    instanceId?: string;
    name?: string;
    refName?: string;
    tasks?: TaskInstance[];
    variables?: {
        [key: string]: string;
    };
}
export interface TaskOrchestrationOwner {
    _links?: any;
    id?: number;
    name?: string;
}
export interface TaskOrchestrationPlan extends TaskOrchestrationPlanReference {
    environment?: PlanEnvironment;
    expandedYaml?: TaskLogReference;
    finishTime?: Date;
    implementation?: TaskOrchestrationContainer;
    initializationLog?: TaskLogReference;
    requestedById?: string;
    requestedForId?: string;
    result?: TaskResult;
    resultCode?: string;
    startTime?: Date;
    state?: TaskOrchestrationPlanState;
    timeline?: TimelineReference;
}
export interface TaskOrchestrationPlanGroup {
    planGroup?: string;
    project?: ProjectReference;
    runningRequests?: TaskAgentJobRequest[];
}
export interface TaskOrchestrationPlanGroupsQueueMetrics {
    count?: number;
    status?: PlanGroupStatus;
}
export interface TaskOrchestrationPlanReference {
    artifactLocation?: string;
    artifactUri?: string;
    definition?: TaskOrchestrationOwner;
    owner?: TaskOrchestrationOwner;
    planGroup?: string;
    planId?: string;
    planType?: string;
    scopeIdentifier?: string;
    version?: number;
}
export declare enum TaskOrchestrationPlanState {
    InProgress = 1,
    Queued = 2,
    Completed = 4,
    Throttled = 8
}
export interface TaskOrchestrationQueuedPlan {
    assignTime?: Date;
    definition?: TaskOrchestrationOwner;
    owner?: TaskOrchestrationOwner;
    planGroup?: string;
    planId?: string;
    poolId?: number;
    queuePosition?: number;
    queueTime?: Date;
    scopeIdentifier?: string;
}
export interface TaskOrchestrationQueuedPlanGroup {
    definition?: TaskOrchestrationOwner;
    owner?: TaskOrchestrationOwner;
    planGroup?: string;
    plans?: TaskOrchestrationQueuedPlan[];
    project?: ProjectReference;
    queuePosition?: number;
}
export interface TaskOutputVariable {
    description?: string;
    name?: string;
}
export interface TaskPackageMetadata {
    /**
     * Gets the name of the package.
     */
    type?: string;
    /**
     * Gets the url of the package.
     */
    url?: string;
    /**
     * Gets the version of the package.
     */
    version?: string;
}
/**
 * A reference to a task.
 */
export interface TaskReference {
    /**
     * The ID of the task definition. Corresponds to the id value of task.json file. <br />Example: CmdLineV2 { "id": "D9BAFED4-0B18-4F58-968D-86655B4D2CE9" }
     */
    id?: string;
    /**
     * A dictionary of inputs specific to a task definition. Corresponds to inputs value of task.json file.
     */
    inputs?: {
        [key: string]: string;
    };
    /**
     * The name of the task definition. Corresponds to the name value of task.json file. <br />Example: CmdLineV2 { "name": "CmdLine" }
     */
    name?: string;
    /**
     * The version of the task definition. Corresponds to the version value of task.json file. <br />Example: CmdLineV2 { "version": { "Major": 2, "Minor": 212, "Patch": 0 } }
     */
    version?: string;
}
export interface TaskRestrictions {
    commands?: TaskCommandRestrictions;
    settableVariables?: TaskVariableRestrictions;
}
/**
 * The result of an operation tracked by a timeline record.
 */
export declare enum TaskResult {
    Succeeded = 0,
    SucceededWithIssues = 1,
    Failed = 2,
    Canceled = 3,
    Skipped = 4,
    Abandoned = 5
}
export interface TaskSourceDefinition extends DistributedTaskCommonInterfaces.TaskSourceDefinitionBase {
}
export interface TaskStartedEvent extends TaskEvent {
}
export interface TaskVariableRestrictions {
    allowed?: string[];
}
export interface TaskVersion {
    isTest?: boolean;
    major?: number;
    minor?: number;
    patch?: number;
}
export interface Timeline extends TimelineReference {
    lastChangedBy?: string;
    lastChangedOn?: Date;
    records?: TimelineRecord[];
}
/**
 * An attempt to update a TimelineRecord.
 */
export interface TimelineAttempt {
    /**
     * The attempt of the record.
     */
    attempt?: number;
    /**
     * The unique identifier for the record.
     */
    identifier?: string;
    /**
     * The record identifier located within the specified timeline.
     */
    recordId?: string;
    /**
     * The timeline identifier which owns the record representing this attempt.
     */
    timelineId?: string;
}
/**
 * Detailed information about the execution of different operations during pipeline run.
 */
export interface TimelineRecord {
    /**
     * The specification of an agent running a pipeline job, in binary format. Applicable when record is of type Job. <br />Example: { "VMImage" : "windows-2019" }
     */
    agentSpecification?: any;
    /**
     * The number of record attempts.
     */
    attempt?: number;
    /**
     * The ID connecting all records updated at the same time. This value is taken from timeline's ChangeId.
     */
    changeId?: number;
    /**
     * A string that indicates the current operation.
     */
    currentOperation?: string;
    /**
     * A reference to a sub-timeline.
     */
    details?: TimelineReference;
    /**
     * The number of errors produced by this operation.
     */
    errorCount?: number;
    /**
     * The finish time of the record.
     */
    finishTime?: Date;
    /**
     * The ID of the record.
     */
    id?: string;
    /**
     * String identifier that is consistent across attempts.
     */
    identifier?: string;
    /**
     * The list of issues produced by this operation.
     */
    issues?: Issue[];
    /**
     * The time the record was last modified.
     */
    lastModified?: Date;
    /**
     * The REST URL of the record.
     */
    location?: string;
    /**
     * A reference to the log produced by this operation.
     */
    log?: TaskLogReference;
    /**
     * The name of the record.
     */
    name?: string;
    /**
     * An ordinal value relative to other records within the timeline.
     */
    order?: number;
    /**
     * The ID of the record's parent. <br />Example: Stage is a parent of a Phase, Phase is a parent of a Job, Job is a parent of a Task.
     */
    parentId?: string;
    /**
     * The percentage of record completion.
     */
    percentComplete?: number;
    /**
     * The previous record attempts.
     */
    previousAttempts?: TimelineAttempt[];
    /**
     * The ID of the queue which connects projects to agent pools on which the operation ran on. Applicable when record is of type Job.
     */
    queueId?: number;
    /**
     * Name of the referenced record.
     */
    refName?: string;
    /**
     * The result of the record.
     */
    result?: TaskResult;
    /**
     * Evaluation of predefined conditions upon completion of record's operation. <br />Example: Evaluating `succeeded()`, Result = True <br />Example: Evaluating `and(succeeded(), eq(variables['system.debug'], False))`, Result = False
     */
    resultCode?: string;
    /**
     * The start time of the record.
     */
    startTime?: Date;
    /**
     * The state of the record.
     */
    state?: TimelineRecordState;
    /**
     * A reference to the task. Applicable when record is of type Task.
     */
    task?: TaskReference;
    /**
     * The type of operation being tracked by the record. <br />Example: Stage, Phase, Job, Task...
     */
    type?: string;
    /**
     * The variables of the record.
     */
    variables?: {
        [key: string]: VariableValue;
    };
    /**
     * The number of warnings produced by this operation.
     */
    warningCount?: number;
    /**
     * The name of the agent running the operation. Applicable when record is of type Job.
     */
    workerName?: string;
}
export interface TimelineRecordFeedLinesWrapper {
    count?: number;
    endLine?: number;
    startLine?: number;
    stepId?: string;
    value?: string[];
}
/**
 * A reference to a timeline record.
 */
export interface TimelineRecordReference {
    /**
     * The ID of the record.
     */
    id?: string;
    /**
     * String identifier that is consistent across attempts.
     */
    identifier?: string;
    /**
     * The state of the record.
     */
    state?: TimelineRecordState;
}
/**
 * The state of the timeline record.
 */
export declare enum TimelineRecordState {
    Pending = 0,
    InProgress = 1,
    Completed = 2
}
/**
 * A reference to a timeline.
 */
export interface TimelineReference {
    /**
     * The change ID.
     */
    changeId?: number;
    /**
     * The ID of the timeline.
     */
    id?: string;
    /**
     * The REST URL of the timeline.
     */
    location?: string;
}
export interface ValidationItem {
    /**
     * Tells whether the current input is valid or not
     */
    isValid?: boolean;
    /**
     * Reason for input validation failure
     */
    reason?: string;
    /**
     * Type of validation item
     */
    type?: string;
    /**
     * Value to validate. The conditional expression to validate for the input for "expression" type Eg:eq(variables['Build.SourceBranch'], 'refs/heads/master');eq(value, 'refs/heads/master')
     */
    value?: string;
}
/**
 * A variable group is a collection of related variables.
 */
export interface VariableGroup {
    /**
     * Gets or sets the identity who created the variable group.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * Gets or sets the time when variable group was created.
     */
    createdOn?: Date;
    /**
     * Gets or sets description of the variable group.
     */
    description?: string;
    /**
     * Gets or sets id of the variable group.
     */
    id?: number;
    /**
     * Indicates whether variable group is shared with other projects or not.
     */
    isShared?: boolean;
    /**
     * Gets or sets the identity who modified the variable group.
     */
    modifiedBy?: VSSInterfaces.IdentityRef;
    /**
     * Gets or sets the time when variable group was modified
     */
    modifiedOn?: Date;
    /**
     * Gets or sets name of the variable group.
     */
    name?: string;
    /**
     * Gets or sets provider data.
     */
    providerData?: VariableGroupProviderData;
    /**
     * Gets or sets type of the variable group.
     */
    type?: string;
    /**
     * all project references where the variable group is shared with other projects.
     */
    variableGroupProjectReferences?: VariableGroupProjectReference[];
    /**
     * Gets or sets variables contained in the variable group.
     */
    variables?: {
        [key: string]: VariableValue;
    };
}
export declare enum VariableGroupActionFilter {
    None = 0,
    Manage = 2,
    Use = 16
}
export interface VariableGroupParameters {
    /**
     * Sets description of the variable group.
     */
    description?: string;
    /**
     * Sets name of the variable group.
     */
    name?: string;
    /**
     * Sets provider data.
     */
    providerData?: VariableGroupProviderData;
    /**
     * Sets type of the variable group.
     */
    type?: string;
    variableGroupProjectReferences?: VariableGroupProjectReference[];
    /**
     * Sets variables contained in the variable group.
     */
    variables?: {
        [key: string]: VariableValue;
    };
}
/**
 * A variable group reference is a shallow reference to variable group.
 */
export interface VariableGroupProjectReference {
    /**
     * Gets or sets description of the variable group.
     */
    description?: string;
    /**
     * Gets or sets name of the variable group.
     */
    name?: string;
    /**
     * Gets or sets project reference of the variable group.
     */
    projectReference?: ProjectReference;
}
/**
 * Defines provider data of the variable group.
 */
export interface VariableGroupProviderData {
}
/**
 * Specifies the desired ordering of variableGroups.
 */
export declare enum VariableGroupQueryOrder {
    /**
     * Order by id ascending.
     */
    IdAscending = 0,
    /**
     * Order by id descending.
     */
    IdDescending = 1
}
/**
 * A wrapper class for a generic variable.
 */
export interface VariableValue {
    /**
     * Indicates whether the variable can be changed during script's execution runtime.
     */
    isReadOnly?: boolean;
    /**
     * Indicates whether the variable should be encrypted at rest.
     */
    isSecret?: boolean;
    /**
     * The value of the variable.
     */
    value?: string;
}
export interface VirtualMachine {
    agent?: TaskAgent;
    id?: number;
    tags?: string[];
}
export interface VirtualMachineGroup extends EnvironmentResource {
    poolId?: number;
}
export interface VirtualMachineGroupCreateParameters {
    name?: string;
}
export interface VirtualMachineResource extends EnvironmentResource {
    agent?: TaskAgent;
}
export interface VirtualMachineResourceCreateParameters {
    virtualMachineResource?: VirtualMachineResource;
}
export declare var TypeInfo: {
    AadLoginPromptOption: {
        enumValues: {
            "noOption": number;
            "login": number;
            "selectAccount": number;
            "freshLogin": number;
            "freshLoginWithMfa": number;
        };
    };
    AgentChangeEvent: any;
    AgentJobRequestMessage: any;
    AgentPoolEvent: any;
    AgentQueueEvent: any;
    AgentQueuesEvent: any;
    AuditAction: {
        enumValues: {
            "add": number;
            "update": number;
            "delete": number;
            "undelete": number;
        };
    };
    AzureKeyVaultVariableGroupProviderData: any;
    AzureKeyVaultVariableValue: any;
    DemandMinimumVersion: any;
    DemandSource: any;
    DemandSourceType: {
        enumValues: {
            "task": number;
            "feature": number;
        };
    };
    DeploymentGroup: any;
    DeploymentGroupActionFilter: {
        enumValues: {
            "none": number;
            "manage": number;
            "use": number;
        };
    };
    DeploymentGroupExpands: {
        enumValues: {
            "none": number;
            "machines": number;
            "tags": number;
        };
    };
    DeploymentGroupMetrics: any;
    DeploymentGroupReference: any;
    DeploymentMachine: any;
    DeploymentMachineChangedData: any;
    DeploymentMachineExpands: {
        enumValues: {
            "none": number;
            "capabilities": number;
            "assignedRequest": number;
        };
    };
    DeploymentMachineGroup: any;
    DeploymentMachineGroupReference: any;
    DeploymentMachinesChangeEvent: any;
    DeploymentPoolSummary: any;
    DeploymentPoolSummaryExpands: {
        enumValues: {
            "none": number;
            "deploymentGroups": number;
            "resource": number;
        };
    };
    DeploymentTargetExpands: {
        enumValues: {
            "none": number;
            "capabilities": number;
            "assignedRequest": number;
            "lastCompletedRequest": number;
        };
    };
    ElasticAgentState: {
        enumValues: {
            "none": number;
            "enabled": number;
            "online": number;
            "assigned": number;
        };
    };
    ElasticComputeState: {
        enumValues: {
            "none": number;
            "healthy": number;
            "creating": number;
            "deleting": number;
            "failed": number;
            "stopped": number;
            "reimaging": number;
            "unhealthyVm": number;
            "unhealthyVmssVm": number;
        };
    };
    ElasticNode: any;
    ElasticNodeSettings: any;
    ElasticNodeState: {
        enumValues: {
            "none": number;
            "new": number;
            "creatingCompute": number;
            "startingAgent": number;
            "idle": number;
            "assigned": number;
            "offline": number;
            "pendingReimage": number;
            "pendingDelete": number;
            "saved": number;
            "deletingCompute": number;
            "deleted": number;
            "lost": number;
            "reimagingCompute": number;
            "restartingAgent": number;
            "failedToStartPendingDelete": number;
            "failedToRestartPendingDelete": number;
            "failedVMPendingDelete": number;
            "assignedPendingDelete": number;
            "retryDelete": number;
            "unhealthyVm": number;
            "unhealthyVmPendingDelete": number;
        };
    };
    ElasticPool: any;
    ElasticPoolCreationResult: any;
    ElasticPoolLog: any;
    ElasticPoolSettings: any;
    ElasticPoolState: {
        enumValues: {
            "online": number;
            "offline": number;
            "unhealthy": number;
            "new": number;
        };
    };
    EnvironmentActionFilter: {
        enumValues: {
            "none": number;
            "manage": number;
            "use": number;
        };
    };
    EnvironmentDeploymentExecutionRecord: any;
    EnvironmentExpands: {
        enumValues: {
            "none": number;
            "resourceReferences": number;
        };
    };
    EnvironmentInstance: any;
    EnvironmentResource: any;
    EnvironmentResourceDeploymentExecutionRecord: any;
    EnvironmentResourceReference: any;
    EnvironmentResourceType: {
        enumValues: {
            "undefined": number;
            "generic": number;
            "virtualMachine": number;
            "kubernetes": number;
        };
    };
    ExclusiveLockType: {
        enumValues: {
            "runLatest": number;
            "sequential": number;
        };
    };
    Issue: any;
    IssueType: {
        enumValues: {
            "error": number;
            "warning": number;
        };
    };
    JobAssignedEvent: any;
    JobCompletedEvent: any;
    JobEnvironment: any;
    JobRequestMessage: any;
    KubernetesResource: any;
    LogLevel: {
        enumValues: {
            "error": number;
            "warning": number;
            "info": number;
        };
    };
    MachineGroupActionFilter: {
        enumValues: {
            "none": number;
            "manage": number;
            "use": number;
        };
    };
    MaskHint: any;
    MaskType: {
        enumValues: {
            "variable": number;
            "regex": number;
        };
    };
    OperatingSystemType: {
        enumValues: {
            "windows": number;
            "linux": number;
        };
    };
    OperationType: {
        enumValues: {
            "configurationJob": number;
            "sizingJob": number;
            "increaseCapacity": number;
            "reimage": number;
            "deleteVMs": number;
        };
    };
    OrchestrationType: {
        enumValues: {
            "uniform": number;
            "flexible": number;
        };
    };
    PackageMetadata: any;
    PlanEnvironment: any;
    PlanGroupStatus: {
        enumValues: {
            "running": number;
            "queued": number;
            "all": number;
        };
    };
    PlanGroupStatusFilter: {
        enumValues: {
            "running": number;
            "queued": number;
            "all": number;
        };
    };
    ResourceLockRequest: any;
    ResourceLockStatus: {
        enumValues: {
            "queued": number;
            "inUse": number;
            "finished": number;
            "timedOut": number;
            "canceled": number;
            "abandoned": number;
            "waitingOnChecks": number;
        };
    };
    ResourceUsage: any;
    SecureFile: any;
    SecureFileActionFilter: {
        enumValues: {
            "none": number;
            "manage": number;
            "use": number;
        };
    };
    SecureFileEvent: any;
    ServerTaskRequestMessage: any;
    ServiceEndpointAuthenticationScheme: any;
    ServiceEndpointExecutionData: any;
    ServiceEndpointExecutionRecord: any;
    ServiceEndpointExecutionRecordsInput: any;
    ServiceEndpointRequestResult: any;
    ServiceEndpointType: any;
    TaskAgent: any;
    TaskAgentCloudRequest: any;
    TaskAgentCloudType: any;
    TaskAgentDowngrade: any;
    TaskAgentJob: any;
    TaskAgentJobRequest: any;
    TaskAgentJobResultFilter: {
        enumValues: {
            "failed": number;
            "passed": number;
            "neverDeployed": number;
            "all": number;
        };
    };
    TaskAgentJobStep: any;
    TaskAgentJobStepType: {
        enumValues: {
            "task": number;
            "action": number;
        };
    };
    TaskAgentManualUpdate: any;
    TaskAgentMinAgentVersionRequiredUpdate: any;
    TaskAgentPool: any;
    TaskAgentPoolActionFilter: {
        enumValues: {
            "none": number;
            "manage": number;
            "use": number;
        };
    };
    TaskAgentPoolMaintenanceDefinition: any;
    TaskAgentPoolMaintenanceJob: any;
    TaskAgentPoolMaintenanceJobResult: {
        enumValues: {
            "succeeded": number;
            "failed": number;
            "canceled": number;
        };
    };
    TaskAgentPoolMaintenanceJobStatus: {
        enumValues: {
            "inProgress": number;
            "completed": number;
            "cancelling": number;
            "queued": number;
        };
    };
    TaskAgentPoolMaintenanceJobTargetAgent: any;
    TaskAgentPoolMaintenanceSchedule: any;
    TaskAgentPoolMaintenanceScheduleDays: {
        enumValues: {
            "none": number;
            "monday": number;
            "tuesday": number;
            "wednesday": number;
            "thursday": number;
            "friday": number;
            "saturday": number;
            "sunday": number;
            "all": number;
        };
    };
    TaskAgentPoolOptions: {
        enumValues: {
            "none": number;
            "elasticPool": number;
            "singleUseAgents": number;
            "preserveAgentOnJobFailure": number;
        };
    };
    TaskAgentPoolReference: any;
    TaskAgentPoolStatus: any;
    TaskAgentPoolSummary: any;
    TaskAgentPoolType: {
        enumValues: {
            "automation": number;
            "deployment": number;
        };
    };
    TaskAgentQueue: any;
    TaskAgentQueueActionFilter: {
        enumValues: {
            "none": number;
            "manage": number;
            "use": number;
        };
    };
    TaskAgentReference: any;
    TaskAgentRequestUpdateOptions: {
        enumValues: {
            "none": number;
            "bumpRequestToTop": number;
        };
    };
    TaskAgentSession: any;
    TaskAgentStatus: {
        enumValues: {
            "offline": number;
            "online": number;
        };
    };
    TaskAgentStatusFilter: {
        enumValues: {
            "offline": number;
            "online": number;
            "all": number;
        };
    };
    TaskAgentUpdate: any;
    TaskAgentUpdateReason: any;
    TaskAgentUpdateReasonType: {
        enumValues: {
            "manual": number;
            "minAgentVersionRequired": number;
            "downgrade": number;
        };
    };
    TaskAttachment: any;
    TaskCommandMode: {
        enumValues: {
            "any": number;
            "restricted": number;
        };
    };
    TaskCommandRestrictions: any;
    TaskCompletedEvent: any;
    TaskDefinition: any;
    TaskDefinitionStatus: {
        enumValues: {
            "preinstalled": number;
            "receivedInstallOrUpdate": number;
            "installed": number;
            "receivedUninstall": number;
            "uninstalled": number;
            "requestedUpdate": number;
            "updated": number;
            "alreadyUpToDate": number;
            "inlineUpdateReceived": number;
        };
    };
    TaskGroup: any;
    TaskGroupExpands: {
        enumValues: {
            "none": number;
            "tasks": number;
        };
    };
    TaskGroupQueryOrder: {
        enumValues: {
            "createdOnAscending": number;
            "createdOnDescending": number;
        };
    };
    TaskGroupRevision: any;
    TaskLog: any;
    TaskOrchestrationContainer: any;
    TaskOrchestrationItem: any;
    TaskOrchestrationItemType: {
        enumValues: {
            "container": number;
            "job": number;
        };
    };
    TaskOrchestrationJob: any;
    TaskOrchestrationPlan: any;
    TaskOrchestrationPlanGroup: any;
    TaskOrchestrationPlanGroupsQueueMetrics: any;
    TaskOrchestrationPlanState: {
        enumValues: {
            "inProgress": number;
            "queued": number;
            "completed": number;
            "throttled": number;
        };
    };
    TaskOrchestrationQueuedPlan: any;
    TaskOrchestrationQueuedPlanGroup: any;
    TaskRestrictions: any;
    TaskResult: {
        enumValues: {
            "succeeded": number;
            "succeededWithIssues": number;
            "failed": number;
            "canceled": number;
            "skipped": number;
            "abandoned": number;
        };
    };
    Timeline: any;
    TimelineRecord: any;
    TimelineRecordReference: any;
    TimelineRecordState: {
        enumValues: {
            "pending": number;
            "inProgress": number;
            "completed": number;
        };
    };
    VariableGroup: any;
    VariableGroupActionFilter: {
        enumValues: {
            "none": number;
            "manage": number;
            "use": number;
        };
    };
    VariableGroupQueryOrder: {
        enumValues: {
            "idAscending": number;
            "idDescending": number;
        };
    };
    VirtualMachine: any;
    VirtualMachineGroup: any;
    VirtualMachineResource: any;
    VirtualMachineResourceCreateParameters: any;
};
