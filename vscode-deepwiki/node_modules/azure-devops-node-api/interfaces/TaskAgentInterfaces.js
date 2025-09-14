/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 *
 * ---------------------------------------------------------
 * Generated file, DO NOT EDIT
 * ---------------------------------------------------------
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FormInputInterfaces = require("../interfaces/common/FormInputInterfaces");
var AadLoginPromptOption;
(function (AadLoginPromptOption) {
    /**
     * Do not provide a prompt option
     */
    AadLoginPromptOption[AadLoginPromptOption["NoOption"] = 0] = "NoOption";
    /**
     * Force the user to login again.
     */
    AadLoginPromptOption[AadLoginPromptOption["Login"] = 1] = "Login";
    /**
     * Force the user to select which account they are logging in with instead of automatically picking the user up from the session state. NOTE: This does not work for switching between the variants of a dual-homed user.
     */
    AadLoginPromptOption[AadLoginPromptOption["SelectAccount"] = 2] = "SelectAccount";
    /**
     * Force the user to login again. <remarks> Ignore current authentication state and force the user to authenticate again. This option should be used instead of Login. </remarks>
     */
    AadLoginPromptOption[AadLoginPromptOption["FreshLogin"] = 3] = "FreshLogin";
    /**
     * Force the user to login again with mfa. <remarks> Ignore current authentication state and force the user to authenticate again. This option should be used instead of Login, if MFA is required. </remarks>
     */
    AadLoginPromptOption[AadLoginPromptOption["FreshLoginWithMfa"] = 4] = "FreshLoginWithMfa";
})(AadLoginPromptOption = exports.AadLoginPromptOption || (exports.AadLoginPromptOption = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction[AuditAction["Add"] = 1] = "Add";
    AuditAction[AuditAction["Update"] = 2] = "Update";
    AuditAction[AuditAction["Delete"] = 3] = "Delete";
    AuditAction[AuditAction["Undelete"] = 4] = "Undelete";
})(AuditAction = exports.AuditAction || (exports.AuditAction = {}));
var DemandSourceType;
(function (DemandSourceType) {
    DemandSourceType[DemandSourceType["Task"] = 0] = "Task";
    DemandSourceType[DemandSourceType["Feature"] = 1] = "Feature";
})(DemandSourceType = exports.DemandSourceType || (exports.DemandSourceType = {}));
/**
 * This is useful in getting a list of deployment groups, filtered for which caller has permissions to take a particular action.
 */
var DeploymentGroupActionFilter;
(function (DeploymentGroupActionFilter) {
    /**
     * All deployment groups.
     */
    DeploymentGroupActionFilter[DeploymentGroupActionFilter["None"] = 0] = "None";
    /**
     * Only deployment groups for which caller has **manage** permission.
     */
    DeploymentGroupActionFilter[DeploymentGroupActionFilter["Manage"] = 2] = "Manage";
    /**
     * Only deployment groups for which caller has **use** permission.
     */
    DeploymentGroupActionFilter[DeploymentGroupActionFilter["Use"] = 16] = "Use";
})(DeploymentGroupActionFilter = exports.DeploymentGroupActionFilter || (exports.DeploymentGroupActionFilter = {}));
/**
 * Properties to be included or expanded in deployment group objects. This is useful when getting a single or list of deployment grouops.
 */
var DeploymentGroupExpands;
(function (DeploymentGroupExpands) {
    /**
     * No additional properties.
     */
    DeploymentGroupExpands[DeploymentGroupExpands["None"] = 0] = "None";
    /**
     * Deprecated: Include all the deployment targets.
     */
    DeploymentGroupExpands[DeploymentGroupExpands["Machines"] = 2] = "Machines";
    /**
     * Include unique list of tags across all deployment targets.
     */
    DeploymentGroupExpands[DeploymentGroupExpands["Tags"] = 4] = "Tags";
})(DeploymentGroupExpands = exports.DeploymentGroupExpands || (exports.DeploymentGroupExpands = {}));
var DeploymentMachineExpands;
(function (DeploymentMachineExpands) {
    DeploymentMachineExpands[DeploymentMachineExpands["None"] = 0] = "None";
    DeploymentMachineExpands[DeploymentMachineExpands["Capabilities"] = 2] = "Capabilities";
    DeploymentMachineExpands[DeploymentMachineExpands["AssignedRequest"] = 4] = "AssignedRequest";
})(DeploymentMachineExpands = exports.DeploymentMachineExpands || (exports.DeploymentMachineExpands = {}));
/**
 * Properties to be included or expanded in deployment pool summary objects. This is useful when getting a single or list of deployment pool summaries.
 */
var DeploymentPoolSummaryExpands;
(function (DeploymentPoolSummaryExpands) {
    /**
     * No additional properties
     */
    DeploymentPoolSummaryExpands[DeploymentPoolSummaryExpands["None"] = 0] = "None";
    /**
     * Include deployment groups referring to the deployment pool.
     */
    DeploymentPoolSummaryExpands[DeploymentPoolSummaryExpands["DeploymentGroups"] = 2] = "DeploymentGroups";
    /**
     * Include Resource referring to the deployment pool.
     */
    DeploymentPoolSummaryExpands[DeploymentPoolSummaryExpands["Resource"] = 4] = "Resource";
})(DeploymentPoolSummaryExpands = exports.DeploymentPoolSummaryExpands || (exports.DeploymentPoolSummaryExpands = {}));
/**
 * Properties to be included or expanded in deployment target objects. This is useful when getting a single or list of deployment targets.
 */
var DeploymentTargetExpands;
(function (DeploymentTargetExpands) {
    /**
     * No additional properties.
     */
    DeploymentTargetExpands[DeploymentTargetExpands["None"] = 0] = "None";
    /**
     * Include capabilities of the deployment agent.
     */
    DeploymentTargetExpands[DeploymentTargetExpands["Capabilities"] = 2] = "Capabilities";
    /**
     * Include the job request assigned to the deployment agent.
     */
    DeploymentTargetExpands[DeploymentTargetExpands["AssignedRequest"] = 4] = "AssignedRequest";
    /**
     * Include the last completed job request of the deployment agent.
     */
    DeploymentTargetExpands[DeploymentTargetExpands["LastCompletedRequest"] = 8] = "LastCompletedRequest";
})(DeploymentTargetExpands = exports.DeploymentTargetExpands || (exports.DeploymentTargetExpands = {}));
var ElasticAgentState;
(function (ElasticAgentState) {
    ElasticAgentState[ElasticAgentState["None"] = 0] = "None";
    ElasticAgentState[ElasticAgentState["Enabled"] = 1] = "Enabled";
    ElasticAgentState[ElasticAgentState["Online"] = 2] = "Online";
    ElasticAgentState[ElasticAgentState["Assigned"] = 4] = "Assigned";
})(ElasticAgentState = exports.ElasticAgentState || (exports.ElasticAgentState = {}));
var ElasticComputeState;
(function (ElasticComputeState) {
    ElasticComputeState[ElasticComputeState["None"] = 0] = "None";
    ElasticComputeState[ElasticComputeState["Healthy"] = 1] = "Healthy";
    ElasticComputeState[ElasticComputeState["Creating"] = 2] = "Creating";
    ElasticComputeState[ElasticComputeState["Deleting"] = 3] = "Deleting";
    ElasticComputeState[ElasticComputeState["Failed"] = 4] = "Failed";
    ElasticComputeState[ElasticComputeState["Stopped"] = 5] = "Stopped";
    ElasticComputeState[ElasticComputeState["Reimaging"] = 6] = "Reimaging";
    ElasticComputeState[ElasticComputeState["UnhealthyVm"] = 7] = "UnhealthyVm";
    ElasticComputeState[ElasticComputeState["UnhealthyVmssVm"] = 8] = "UnhealthyVmssVm";
})(ElasticComputeState = exports.ElasticComputeState || (exports.ElasticComputeState = {}));
var ElasticNodeState;
(function (ElasticNodeState) {
    ElasticNodeState[ElasticNodeState["None"] = 0] = "None";
    ElasticNodeState[ElasticNodeState["New"] = 1] = "New";
    ElasticNodeState[ElasticNodeState["CreatingCompute"] = 2] = "CreatingCompute";
    ElasticNodeState[ElasticNodeState["StartingAgent"] = 3] = "StartingAgent";
    ElasticNodeState[ElasticNodeState["Idle"] = 4] = "Idle";
    ElasticNodeState[ElasticNodeState["Assigned"] = 5] = "Assigned";
    ElasticNodeState[ElasticNodeState["Offline"] = 6] = "Offline";
    ElasticNodeState[ElasticNodeState["PendingReimage"] = 7] = "PendingReimage";
    ElasticNodeState[ElasticNodeState["PendingDelete"] = 8] = "PendingDelete";
    ElasticNodeState[ElasticNodeState["Saved"] = 9] = "Saved";
    ElasticNodeState[ElasticNodeState["DeletingCompute"] = 10] = "DeletingCompute";
    ElasticNodeState[ElasticNodeState["Deleted"] = 11] = "Deleted";
    ElasticNodeState[ElasticNodeState["Lost"] = 12] = "Lost";
    ElasticNodeState[ElasticNodeState["ReimagingCompute"] = 13] = "ReimagingCompute";
    ElasticNodeState[ElasticNodeState["RestartingAgent"] = 14] = "RestartingAgent";
    ElasticNodeState[ElasticNodeState["FailedToStartPendingDelete"] = 15] = "FailedToStartPendingDelete";
    ElasticNodeState[ElasticNodeState["FailedToRestartPendingDelete"] = 16] = "FailedToRestartPendingDelete";
    ElasticNodeState[ElasticNodeState["FailedVMPendingDelete"] = 17] = "FailedVMPendingDelete";
    ElasticNodeState[ElasticNodeState["AssignedPendingDelete"] = 18] = "AssignedPendingDelete";
    ElasticNodeState[ElasticNodeState["RetryDelete"] = 19] = "RetryDelete";
    ElasticNodeState[ElasticNodeState["UnhealthyVm"] = 20] = "UnhealthyVm";
    ElasticNodeState[ElasticNodeState["UnhealthyVmPendingDelete"] = 21] = "UnhealthyVmPendingDelete";
})(ElasticNodeState = exports.ElasticNodeState || (exports.ElasticNodeState = {}));
var ElasticPoolState;
(function (ElasticPoolState) {
    /**
     * Online and healthy
     */
    ElasticPoolState[ElasticPoolState["Online"] = 0] = "Online";
    ElasticPoolState[ElasticPoolState["Offline"] = 1] = "Offline";
    ElasticPoolState[ElasticPoolState["Unhealthy"] = 2] = "Unhealthy";
    ElasticPoolState[ElasticPoolState["New"] = 3] = "New";
})(ElasticPoolState = exports.ElasticPoolState || (exports.ElasticPoolState = {}));
/**
 * This is useful in getting a list of Environments, filtered for which caller has permissions to take a particular action.
 */
var EnvironmentActionFilter;
(function (EnvironmentActionFilter) {
    /**
     * All environments for which user has **view** permission.
     */
    EnvironmentActionFilter[EnvironmentActionFilter["None"] = 0] = "None";
    /**
     * Only environments for which caller has **manage** permission.
     */
    EnvironmentActionFilter[EnvironmentActionFilter["Manage"] = 2] = "Manage";
    /**
     * Only environments for which caller has **use** permission.
     */
    EnvironmentActionFilter[EnvironmentActionFilter["Use"] = 16] = "Use";
})(EnvironmentActionFilter = exports.EnvironmentActionFilter || (exports.EnvironmentActionFilter = {}));
/**
 * Properties to be included or expanded in environment objects. This is useful when getting a single environment.
 */
var EnvironmentExpands;
(function (EnvironmentExpands) {
    /**
     * No additional properties
     */
    EnvironmentExpands[EnvironmentExpands["None"] = 0] = "None";
    /**
     * Include resource references referring to the environment.
     */
    EnvironmentExpands[EnvironmentExpands["ResourceReferences"] = 1] = "ResourceReferences";
})(EnvironmentExpands = exports.EnvironmentExpands || (exports.EnvironmentExpands = {}));
/**
 * EnvironmentResourceType.
 */
var EnvironmentResourceType;
(function (EnvironmentResourceType) {
    EnvironmentResourceType[EnvironmentResourceType["Undefined"] = 0] = "Undefined";
    /**
     * Unknown resource type
     */
    EnvironmentResourceType[EnvironmentResourceType["Generic"] = 1] = "Generic";
    /**
     * Virtual machine resource type
     */
    EnvironmentResourceType[EnvironmentResourceType["VirtualMachine"] = 2] = "VirtualMachine";
    /**
     * Kubernetes resource type
     */
    EnvironmentResourceType[EnvironmentResourceType["Kubernetes"] = 4] = "Kubernetes";
})(EnvironmentResourceType = exports.EnvironmentResourceType || (exports.EnvironmentResourceType = {}));
var ExclusiveLockType;
(function (ExclusiveLockType) {
    ExclusiveLockType[ExclusiveLockType["RunLatest"] = 0] = "RunLatest";
    ExclusiveLockType[ExclusiveLockType["Sequential"] = 1] = "Sequential";
})(ExclusiveLockType = exports.ExclusiveLockType || (exports.ExclusiveLockType = {}));
/**
 * The type of issue based on severity.
 */
var IssueType;
(function (IssueType) {
    IssueType[IssueType["Error"] = 1] = "Error";
    IssueType[IssueType["Warning"] = 2] = "Warning";
})(IssueType = exports.IssueType || (exports.IssueType = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Error"] = 0] = "Error";
    LogLevel[LogLevel["Warning"] = 1] = "Warning";
    LogLevel[LogLevel["Info"] = 2] = "Info";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var MachineGroupActionFilter;
(function (MachineGroupActionFilter) {
    MachineGroupActionFilter[MachineGroupActionFilter["None"] = 0] = "None";
    MachineGroupActionFilter[MachineGroupActionFilter["Manage"] = 2] = "Manage";
    MachineGroupActionFilter[MachineGroupActionFilter["Use"] = 16] = "Use";
})(MachineGroupActionFilter = exports.MachineGroupActionFilter || (exports.MachineGroupActionFilter = {}));
var MaskType;
(function (MaskType) {
    MaskType[MaskType["Variable"] = 1] = "Variable";
    MaskType[MaskType["Regex"] = 2] = "Regex";
})(MaskType = exports.MaskType || (exports.MaskType = {}));
var OperatingSystemType;
(function (OperatingSystemType) {
    OperatingSystemType[OperatingSystemType["Windows"] = 0] = "Windows";
    OperatingSystemType[OperatingSystemType["Linux"] = 1] = "Linux";
})(OperatingSystemType = exports.OperatingSystemType || (exports.OperatingSystemType = {}));
var OperationType;
(function (OperationType) {
    OperationType[OperationType["ConfigurationJob"] = 0] = "ConfigurationJob";
    OperationType[OperationType["SizingJob"] = 1] = "SizingJob";
    OperationType[OperationType["IncreaseCapacity"] = 2] = "IncreaseCapacity";
    OperationType[OperationType["Reimage"] = 3] = "Reimage";
    OperationType[OperationType["DeleteVMs"] = 4] = "DeleteVMs";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
var OrchestrationType;
(function (OrchestrationType) {
    OrchestrationType[OrchestrationType["Uniform"] = 0] = "Uniform";
    OrchestrationType[OrchestrationType["Flexible"] = 1] = "Flexible";
})(OrchestrationType = exports.OrchestrationType || (exports.OrchestrationType = {}));
var PlanGroupStatus;
(function (PlanGroupStatus) {
    PlanGroupStatus[PlanGroupStatus["Running"] = 1] = "Running";
    PlanGroupStatus[PlanGroupStatus["Queued"] = 2] = "Queued";
    PlanGroupStatus[PlanGroupStatus["All"] = 3] = "All";
})(PlanGroupStatus = exports.PlanGroupStatus || (exports.PlanGroupStatus = {}));
var PlanGroupStatusFilter;
(function (PlanGroupStatusFilter) {
    PlanGroupStatusFilter[PlanGroupStatusFilter["Running"] = 1] = "Running";
    PlanGroupStatusFilter[PlanGroupStatusFilter["Queued"] = 2] = "Queued";
    PlanGroupStatusFilter[PlanGroupStatusFilter["All"] = 3] = "All";
})(PlanGroupStatusFilter = exports.PlanGroupStatusFilter || (exports.PlanGroupStatusFilter = {}));
var ResourceLockStatus;
(function (ResourceLockStatus) {
    ResourceLockStatus[ResourceLockStatus["Queued"] = 0] = "Queued";
    ResourceLockStatus[ResourceLockStatus["InUse"] = 1] = "InUse";
    ResourceLockStatus[ResourceLockStatus["Finished"] = 2] = "Finished";
    ResourceLockStatus[ResourceLockStatus["TimedOut"] = 3] = "TimedOut";
    ResourceLockStatus[ResourceLockStatus["Canceled"] = 4] = "Canceled";
    ResourceLockStatus[ResourceLockStatus["Abandoned"] = 5] = "Abandoned";
    ResourceLockStatus[ResourceLockStatus["WaitingOnChecks"] = 6] = "WaitingOnChecks";
})(ResourceLockStatus = exports.ResourceLockStatus || (exports.ResourceLockStatus = {}));
var SecureFileActionFilter;
(function (SecureFileActionFilter) {
    SecureFileActionFilter[SecureFileActionFilter["None"] = 0] = "None";
    SecureFileActionFilter[SecureFileActionFilter["Manage"] = 2] = "Manage";
    SecureFileActionFilter[SecureFileActionFilter["Use"] = 16] = "Use";
})(SecureFileActionFilter = exports.SecureFileActionFilter || (exports.SecureFileActionFilter = {}));
/**
 * This is useful in getting a list of deployment targets, filtered by the result of their last job.
 */
var TaskAgentJobResultFilter;
(function (TaskAgentJobResultFilter) {
    /**
     * Only those deployment targets on which last job failed (**Abandoned**, **Canceled**, **Failed**, **Skipped**).
     */
    TaskAgentJobResultFilter[TaskAgentJobResultFilter["Failed"] = 1] = "Failed";
    /**
     * Only those deployment targets on which last job Passed (**Succeeded**, **Succeeded with issues**).
     */
    TaskAgentJobResultFilter[TaskAgentJobResultFilter["Passed"] = 2] = "Passed";
    /**
     * Only those deployment targets that never executed a job.
     */
    TaskAgentJobResultFilter[TaskAgentJobResultFilter["NeverDeployed"] = 4] = "NeverDeployed";
    /**
     * All deployment targets.
     */
    TaskAgentJobResultFilter[TaskAgentJobResultFilter["All"] = 7] = "All";
})(TaskAgentJobResultFilter = exports.TaskAgentJobResultFilter || (exports.TaskAgentJobResultFilter = {}));
var TaskAgentJobStepType;
(function (TaskAgentJobStepType) {
    TaskAgentJobStepType[TaskAgentJobStepType["Task"] = 1] = "Task";
    TaskAgentJobStepType[TaskAgentJobStepType["Action"] = 2] = "Action";
})(TaskAgentJobStepType = exports.TaskAgentJobStepType || (exports.TaskAgentJobStepType = {}));
/**
 * Filters pools based on whether the calling user has permission to use or manage the pool.
 */
var TaskAgentPoolActionFilter;
(function (TaskAgentPoolActionFilter) {
    TaskAgentPoolActionFilter[TaskAgentPoolActionFilter["None"] = 0] = "None";
    TaskAgentPoolActionFilter[TaskAgentPoolActionFilter["Manage"] = 2] = "Manage";
    TaskAgentPoolActionFilter[TaskAgentPoolActionFilter["Use"] = 16] = "Use";
})(TaskAgentPoolActionFilter = exports.TaskAgentPoolActionFilter || (exports.TaskAgentPoolActionFilter = {}));
var TaskAgentPoolMaintenanceJobResult;
(function (TaskAgentPoolMaintenanceJobResult) {
    TaskAgentPoolMaintenanceJobResult[TaskAgentPoolMaintenanceJobResult["Succeeded"] = 1] = "Succeeded";
    TaskAgentPoolMaintenanceJobResult[TaskAgentPoolMaintenanceJobResult["Failed"] = 2] = "Failed";
    TaskAgentPoolMaintenanceJobResult[TaskAgentPoolMaintenanceJobResult["Canceled"] = 4] = "Canceled";
})(TaskAgentPoolMaintenanceJobResult = exports.TaskAgentPoolMaintenanceJobResult || (exports.TaskAgentPoolMaintenanceJobResult = {}));
var TaskAgentPoolMaintenanceJobStatus;
(function (TaskAgentPoolMaintenanceJobStatus) {
    TaskAgentPoolMaintenanceJobStatus[TaskAgentPoolMaintenanceJobStatus["InProgress"] = 1] = "InProgress";
    TaskAgentPoolMaintenanceJobStatus[TaskAgentPoolMaintenanceJobStatus["Completed"] = 2] = "Completed";
    TaskAgentPoolMaintenanceJobStatus[TaskAgentPoolMaintenanceJobStatus["Cancelling"] = 4] = "Cancelling";
    TaskAgentPoolMaintenanceJobStatus[TaskAgentPoolMaintenanceJobStatus["Queued"] = 8] = "Queued";
})(TaskAgentPoolMaintenanceJobStatus = exports.TaskAgentPoolMaintenanceJobStatus || (exports.TaskAgentPoolMaintenanceJobStatus = {}));
var TaskAgentPoolMaintenanceScheduleDays;
(function (TaskAgentPoolMaintenanceScheduleDays) {
    /**
     * Do not run.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["None"] = 0] = "None";
    /**
     * Run on Monday.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["Monday"] = 1] = "Monday";
    /**
     * Run on Tuesday.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["Tuesday"] = 2] = "Tuesday";
    /**
     * Run on Wednesday.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["Wednesday"] = 4] = "Wednesday";
    /**
     * Run on Thursday.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["Thursday"] = 8] = "Thursday";
    /**
     * Run on Friday.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["Friday"] = 16] = "Friday";
    /**
     * Run on Saturday.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["Saturday"] = 32] = "Saturday";
    /**
     * Run on Sunday.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["Sunday"] = 64] = "Sunday";
    /**
     * Run on all days of the week.
     */
    TaskAgentPoolMaintenanceScheduleDays[TaskAgentPoolMaintenanceScheduleDays["All"] = 127] = "All";
})(TaskAgentPoolMaintenanceScheduleDays = exports.TaskAgentPoolMaintenanceScheduleDays || (exports.TaskAgentPoolMaintenanceScheduleDays = {}));
/**
 * Additional settings and descriptors for a TaskAgentPool
 */
var TaskAgentPoolOptions;
(function (TaskAgentPoolOptions) {
    TaskAgentPoolOptions[TaskAgentPoolOptions["None"] = 0] = "None";
    /**
     * TaskAgentPool backed by the Elastic pool service
     */
    TaskAgentPoolOptions[TaskAgentPoolOptions["ElasticPool"] = 1] = "ElasticPool";
    /**
     * Set to true if agents are re-imaged after each TaskAgentJobRequest
     */
    TaskAgentPoolOptions[TaskAgentPoolOptions["SingleUseAgents"] = 2] = "SingleUseAgents";
    /**
     * Set to true if agents are held for investigation after a TaskAgentJobRequest failure
     */
    TaskAgentPoolOptions[TaskAgentPoolOptions["PreserveAgentOnJobFailure"] = 4] = "PreserveAgentOnJobFailure";
})(TaskAgentPoolOptions = exports.TaskAgentPoolOptions || (exports.TaskAgentPoolOptions = {}));
/**
 * The type of agent pool.
 */
var TaskAgentPoolType;
(function (TaskAgentPoolType) {
    /**
     * A typical pool of task agents
     */
    TaskAgentPoolType[TaskAgentPoolType["Automation"] = 1] = "Automation";
    /**
     * A deployment pool
     */
    TaskAgentPoolType[TaskAgentPoolType["Deployment"] = 2] = "Deployment";
})(TaskAgentPoolType = exports.TaskAgentPoolType || (exports.TaskAgentPoolType = {}));
/**
 * Filters queues based on whether the calling user has permission to use or manage the queue.
 */
var TaskAgentQueueActionFilter;
(function (TaskAgentQueueActionFilter) {
    TaskAgentQueueActionFilter[TaskAgentQueueActionFilter["None"] = 0] = "None";
    TaskAgentQueueActionFilter[TaskAgentQueueActionFilter["Manage"] = 2] = "Manage";
    TaskAgentQueueActionFilter[TaskAgentQueueActionFilter["Use"] = 16] = "Use";
})(TaskAgentQueueActionFilter = exports.TaskAgentQueueActionFilter || (exports.TaskAgentQueueActionFilter = {}));
var TaskAgentRequestUpdateOptions;
(function (TaskAgentRequestUpdateOptions) {
    TaskAgentRequestUpdateOptions[TaskAgentRequestUpdateOptions["None"] = 0] = "None";
    TaskAgentRequestUpdateOptions[TaskAgentRequestUpdateOptions["BumpRequestToTop"] = 1] = "BumpRequestToTop";
})(TaskAgentRequestUpdateOptions = exports.TaskAgentRequestUpdateOptions || (exports.TaskAgentRequestUpdateOptions = {}));
var TaskAgentStatus;
(function (TaskAgentStatus) {
    TaskAgentStatus[TaskAgentStatus["Offline"] = 1] = "Offline";
    TaskAgentStatus[TaskAgentStatus["Online"] = 2] = "Online";
})(TaskAgentStatus = exports.TaskAgentStatus || (exports.TaskAgentStatus = {}));
/**
 * This is useful in getting a list of deployment targets, filtered by the deployment agent status.
 */
var TaskAgentStatusFilter;
(function (TaskAgentStatusFilter) {
    /**
     * Only deployment targets that are offline.
     */
    TaskAgentStatusFilter[TaskAgentStatusFilter["Offline"] = 1] = "Offline";
    /**
     * Only deployment targets that are online.
     */
    TaskAgentStatusFilter[TaskAgentStatusFilter["Online"] = 2] = "Online";
    /**
     * All deployment targets.
     */
    TaskAgentStatusFilter[TaskAgentStatusFilter["All"] = 3] = "All";
})(TaskAgentStatusFilter = exports.TaskAgentStatusFilter || (exports.TaskAgentStatusFilter = {}));
var TaskAgentUpdateReasonType;
(function (TaskAgentUpdateReasonType) {
    TaskAgentUpdateReasonType[TaskAgentUpdateReasonType["Manual"] = 1] = "Manual";
    TaskAgentUpdateReasonType[TaskAgentUpdateReasonType["MinAgentVersionRequired"] = 2] = "MinAgentVersionRequired";
    TaskAgentUpdateReasonType[TaskAgentUpdateReasonType["Downgrade"] = 3] = "Downgrade";
})(TaskAgentUpdateReasonType = exports.TaskAgentUpdateReasonType || (exports.TaskAgentUpdateReasonType = {}));
var TaskCommandMode;
(function (TaskCommandMode) {
    TaskCommandMode[TaskCommandMode["Any"] = 0] = "Any";
    TaskCommandMode[TaskCommandMode["Restricted"] = 1] = "Restricted";
})(TaskCommandMode = exports.TaskCommandMode || (exports.TaskCommandMode = {}));
var TaskDefinitionStatus;
(function (TaskDefinitionStatus) {
    TaskDefinitionStatus[TaskDefinitionStatus["Preinstalled"] = 1] = "Preinstalled";
    TaskDefinitionStatus[TaskDefinitionStatus["ReceivedInstallOrUpdate"] = 2] = "ReceivedInstallOrUpdate";
    TaskDefinitionStatus[TaskDefinitionStatus["Installed"] = 3] = "Installed";
    TaskDefinitionStatus[TaskDefinitionStatus["ReceivedUninstall"] = 4] = "ReceivedUninstall";
    TaskDefinitionStatus[TaskDefinitionStatus["Uninstalled"] = 5] = "Uninstalled";
    TaskDefinitionStatus[TaskDefinitionStatus["RequestedUpdate"] = 6] = "RequestedUpdate";
    TaskDefinitionStatus[TaskDefinitionStatus["Updated"] = 7] = "Updated";
    TaskDefinitionStatus[TaskDefinitionStatus["AlreadyUpToDate"] = 8] = "AlreadyUpToDate";
    TaskDefinitionStatus[TaskDefinitionStatus["InlineUpdateReceived"] = 9] = "InlineUpdateReceived";
})(TaskDefinitionStatus = exports.TaskDefinitionStatus || (exports.TaskDefinitionStatus = {}));
var TaskGroupExpands;
(function (TaskGroupExpands) {
    TaskGroupExpands[TaskGroupExpands["None"] = 0] = "None";
    TaskGroupExpands[TaskGroupExpands["Tasks"] = 2] = "Tasks";
})(TaskGroupExpands = exports.TaskGroupExpands || (exports.TaskGroupExpands = {}));
/**
 * Specifies the desired ordering of taskGroups.
 */
var TaskGroupQueryOrder;
(function (TaskGroupQueryOrder) {
    /**
     * Order by createdon ascending.
     */
    TaskGroupQueryOrder[TaskGroupQueryOrder["CreatedOnAscending"] = 0] = "CreatedOnAscending";
    /**
     * Order by createdon descending.
     */
    TaskGroupQueryOrder[TaskGroupQueryOrder["CreatedOnDescending"] = 1] = "CreatedOnDescending";
})(TaskGroupQueryOrder = exports.TaskGroupQueryOrder || (exports.TaskGroupQueryOrder = {}));
var TaskOrchestrationItemType;
(function (TaskOrchestrationItemType) {
    TaskOrchestrationItemType[TaskOrchestrationItemType["Container"] = 0] = "Container";
    TaskOrchestrationItemType[TaskOrchestrationItemType["Job"] = 1] = "Job";
})(TaskOrchestrationItemType = exports.TaskOrchestrationItemType || (exports.TaskOrchestrationItemType = {}));
var TaskOrchestrationPlanState;
(function (TaskOrchestrationPlanState) {
    TaskOrchestrationPlanState[TaskOrchestrationPlanState["InProgress"] = 1] = "InProgress";
    TaskOrchestrationPlanState[TaskOrchestrationPlanState["Queued"] = 2] = "Queued";
    TaskOrchestrationPlanState[TaskOrchestrationPlanState["Completed"] = 4] = "Completed";
    TaskOrchestrationPlanState[TaskOrchestrationPlanState["Throttled"] = 8] = "Throttled";
})(TaskOrchestrationPlanState = exports.TaskOrchestrationPlanState || (exports.TaskOrchestrationPlanState = {}));
/**
 * The result of an operation tracked by a timeline record.
 */
var TaskResult;
(function (TaskResult) {
    TaskResult[TaskResult["Succeeded"] = 0] = "Succeeded";
    TaskResult[TaskResult["SucceededWithIssues"] = 1] = "SucceededWithIssues";
    TaskResult[TaskResult["Failed"] = 2] = "Failed";
    TaskResult[TaskResult["Canceled"] = 3] = "Canceled";
    TaskResult[TaskResult["Skipped"] = 4] = "Skipped";
    TaskResult[TaskResult["Abandoned"] = 5] = "Abandoned";
})(TaskResult = exports.TaskResult || (exports.TaskResult = {}));
/**
 * The state of the timeline record.
 */
var TimelineRecordState;
(function (TimelineRecordState) {
    TimelineRecordState[TimelineRecordState["Pending"] = 0] = "Pending";
    TimelineRecordState[TimelineRecordState["InProgress"] = 1] = "InProgress";
    TimelineRecordState[TimelineRecordState["Completed"] = 2] = "Completed";
})(TimelineRecordState = exports.TimelineRecordState || (exports.TimelineRecordState = {}));
var VariableGroupActionFilter;
(function (VariableGroupActionFilter) {
    VariableGroupActionFilter[VariableGroupActionFilter["None"] = 0] = "None";
    VariableGroupActionFilter[VariableGroupActionFilter["Manage"] = 2] = "Manage";
    VariableGroupActionFilter[VariableGroupActionFilter["Use"] = 16] = "Use";
})(VariableGroupActionFilter = exports.VariableGroupActionFilter || (exports.VariableGroupActionFilter = {}));
/**
 * Specifies the desired ordering of variableGroups.
 */
var VariableGroupQueryOrder;
(function (VariableGroupQueryOrder) {
    /**
     * Order by id ascending.
     */
    VariableGroupQueryOrder[VariableGroupQueryOrder["IdAscending"] = 0] = "IdAscending";
    /**
     * Order by id descending.
     */
    VariableGroupQueryOrder[VariableGroupQueryOrder["IdDescending"] = 1] = "IdDescending";
})(VariableGroupQueryOrder = exports.VariableGroupQueryOrder || (exports.VariableGroupQueryOrder = {}));
exports.TypeInfo = {
    AadLoginPromptOption: {
        enumValues: {
            "noOption": 0,
            "login": 1,
            "selectAccount": 2,
            "freshLogin": 3,
            "freshLoginWithMfa": 4
        }
    },
    AgentChangeEvent: {},
    AgentJobRequestMessage: {},
    AgentPoolEvent: {},
    AgentQueueEvent: {},
    AgentQueuesEvent: {},
    AuditAction: {
        enumValues: {
            "add": 1,
            "update": 2,
            "delete": 3,
            "undelete": 4
        }
    },
    AzureKeyVaultVariableGroupProviderData: {},
    AzureKeyVaultVariableValue: {},
    DemandMinimumVersion: {},
    DemandSource: {},
    DemandSourceType: {
        enumValues: {
            "task": 0,
            "feature": 1
        }
    },
    DeploymentGroup: {},
    DeploymentGroupActionFilter: {
        enumValues: {
            "none": 0,
            "manage": 2,
            "use": 16
        }
    },
    DeploymentGroupExpands: {
        enumValues: {
            "none": 0,
            "machines": 2,
            "tags": 4
        }
    },
    DeploymentGroupMetrics: {},
    DeploymentGroupReference: {},
    DeploymentMachine: {},
    DeploymentMachineChangedData: {},
    DeploymentMachineExpands: {
        enumValues: {
            "none": 0,
            "capabilities": 2,
            "assignedRequest": 4
        }
    },
    DeploymentMachineGroup: {},
    DeploymentMachineGroupReference: {},
    DeploymentMachinesChangeEvent: {},
    DeploymentPoolSummary: {},
    DeploymentPoolSummaryExpands: {
        enumValues: {
            "none": 0,
            "deploymentGroups": 2,
            "resource": 4
        }
    },
    DeploymentTargetExpands: {
        enumValues: {
            "none": 0,
            "capabilities": 2,
            "assignedRequest": 4,
            "lastCompletedRequest": 8
        }
    },
    ElasticAgentState: {
        enumValues: {
            "none": 0,
            "enabled": 1,
            "online": 2,
            "assigned": 4
        }
    },
    ElasticComputeState: {
        enumValues: {
            "none": 0,
            "healthy": 1,
            "creating": 2,
            "deleting": 3,
            "failed": 4,
            "stopped": 5,
            "reimaging": 6,
            "unhealthyVm": 7,
            "unhealthyVmssVm": 8
        }
    },
    ElasticNode: {},
    ElasticNodeSettings: {},
    ElasticNodeState: {
        enumValues: {
            "none": 0,
            "new": 1,
            "creatingCompute": 2,
            "startingAgent": 3,
            "idle": 4,
            "assigned": 5,
            "offline": 6,
            "pendingReimage": 7,
            "pendingDelete": 8,
            "saved": 9,
            "deletingCompute": 10,
            "deleted": 11,
            "lost": 12,
            "reimagingCompute": 13,
            "restartingAgent": 14,
            "failedToStartPendingDelete": 15,
            "failedToRestartPendingDelete": 16,
            "failedVMPendingDelete": 17,
            "assignedPendingDelete": 18,
            "retryDelete": 19,
            "unhealthyVm": 20,
            "unhealthyVmPendingDelete": 21
        }
    },
    ElasticPool: {},
    ElasticPoolCreationResult: {},
    ElasticPoolLog: {},
    ElasticPoolSettings: {},
    ElasticPoolState: {
        enumValues: {
            "online": 0,
            "offline": 1,
            "unhealthy": 2,
            "new": 3
        }
    },
    EnvironmentActionFilter: {
        enumValues: {
            "none": 0,
            "manage": 2,
            "use": 16
        }
    },
    EnvironmentDeploymentExecutionRecord: {},
    EnvironmentExpands: {
        enumValues: {
            "none": 0,
            "resourceReferences": 1
        }
    },
    EnvironmentInstance: {},
    EnvironmentResource: {},
    EnvironmentResourceDeploymentExecutionRecord: {},
    EnvironmentResourceReference: {},
    EnvironmentResourceType: {
        enumValues: {
            "undefined": 0,
            "generic": 1,
            "virtualMachine": 2,
            "kubernetes": 4
        }
    },
    ExclusiveLockType: {
        enumValues: {
            "runLatest": 0,
            "sequential": 1
        }
    },
    Issue: {},
    IssueType: {
        enumValues: {
            "error": 1,
            "warning": 2
        }
    },
    JobAssignedEvent: {},
    JobCompletedEvent: {},
    JobEnvironment: {},
    JobRequestMessage: {},
    KubernetesResource: {},
    LogLevel: {
        enumValues: {
            "error": 0,
            "warning": 1,
            "info": 2
        }
    },
    MachineGroupActionFilter: {
        enumValues: {
            "none": 0,
            "manage": 2,
            "use": 16
        }
    },
    MaskHint: {},
    MaskType: {
        enumValues: {
            "variable": 1,
            "regex": 2
        }
    },
    OperatingSystemType: {
        enumValues: {
            "windows": 0,
            "linux": 1
        }
    },
    OperationType: {
        enumValues: {
            "configurationJob": 0,
            "sizingJob": 1,
            "increaseCapacity": 2,
            "reimage": 3,
            "deleteVMs": 4
        }
    },
    OrchestrationType: {
        enumValues: {
            "uniform": 0,
            "flexible": 1
        }
    },
    PackageMetadata: {},
    PlanEnvironment: {},
    PlanGroupStatus: {
        enumValues: {
            "running": 1,
            "queued": 2,
            "all": 3
        }
    },
    PlanGroupStatusFilter: {
        enumValues: {
            "running": 1,
            "queued": 2,
            "all": 3
        }
    },
    ResourceLockRequest: {},
    ResourceLockStatus: {
        enumValues: {
            "queued": 0,
            "inUse": 1,
            "finished": 2,
            "timedOut": 3,
            "canceled": 4,
            "abandoned": 5,
            "waitingOnChecks": 6
        }
    },
    ResourceUsage: {},
    SecureFile: {},
    SecureFileActionFilter: {
        enumValues: {
            "none": 0,
            "manage": 2,
            "use": 16
        }
    },
    SecureFileEvent: {},
    ServerTaskRequestMessage: {},
    ServiceEndpointAuthenticationScheme: {},
    ServiceEndpointExecutionData: {},
    ServiceEndpointExecutionRecord: {},
    ServiceEndpointExecutionRecordsInput: {},
    ServiceEndpointRequestResult: {},
    ServiceEndpointType: {},
    TaskAgent: {},
    TaskAgentCloudRequest: {},
    TaskAgentCloudType: {},
    TaskAgentDowngrade: {},
    TaskAgentJob: {},
    TaskAgentJobRequest: {},
    TaskAgentJobResultFilter: {
        enumValues: {
            "failed": 1,
            "passed": 2,
            "neverDeployed": 4,
            "all": 7
        }
    },
    TaskAgentJobStep: {},
    TaskAgentJobStepType: {
        enumValues: {
            "task": 1,
            "action": 2
        }
    },
    TaskAgentManualUpdate: {},
    TaskAgentMinAgentVersionRequiredUpdate: {},
    TaskAgentPool: {},
    TaskAgentPoolActionFilter: {
        enumValues: {
            "none": 0,
            "manage": 2,
            "use": 16
        }
    },
    TaskAgentPoolMaintenanceDefinition: {},
    TaskAgentPoolMaintenanceJob: {},
    TaskAgentPoolMaintenanceJobResult: {
        enumValues: {
            "succeeded": 1,
            "failed": 2,
            "canceled": 4
        }
    },
    TaskAgentPoolMaintenanceJobStatus: {
        enumValues: {
            "inProgress": 1,
            "completed": 2,
            "cancelling": 4,
            "queued": 8
        }
    },
    TaskAgentPoolMaintenanceJobTargetAgent: {},
    TaskAgentPoolMaintenanceSchedule: {},
    TaskAgentPoolMaintenanceScheduleDays: {
        enumValues: {
            "none": 0,
            "monday": 1,
            "tuesday": 2,
            "wednesday": 4,
            "thursday": 8,
            "friday": 16,
            "saturday": 32,
            "sunday": 64,
            "all": 127
        }
    },
    TaskAgentPoolOptions: {
        enumValues: {
            "none": 0,
            "elasticPool": 1,
            "singleUseAgents": 2,
            "preserveAgentOnJobFailure": 4
        }
    },
    TaskAgentPoolReference: {},
    TaskAgentPoolStatus: {},
    TaskAgentPoolSummary: {},
    TaskAgentPoolType: {
        enumValues: {
            "automation": 1,
            "deployment": 2
        }
    },
    TaskAgentQueue: {},
    TaskAgentQueueActionFilter: {
        enumValues: {
            "none": 0,
            "manage": 2,
            "use": 16
        }
    },
    TaskAgentReference: {},
    TaskAgentRequestUpdateOptions: {
        enumValues: {
            "none": 0,
            "bumpRequestToTop": 1
        }
    },
    TaskAgentSession: {},
    TaskAgentStatus: {
        enumValues: {
            "offline": 1,
            "online": 2
        }
    },
    TaskAgentStatusFilter: {
        enumValues: {
            "offline": 1,
            "online": 2,
            "all": 3
        }
    },
    TaskAgentUpdate: {},
    TaskAgentUpdateReason: {},
    TaskAgentUpdateReasonType: {
        enumValues: {
            "manual": 1,
            "minAgentVersionRequired": 2,
            "downgrade": 3
        }
    },
    TaskAttachment: {},
    TaskCommandMode: {
        enumValues: {
            "any": 0,
            "restricted": 1
        }
    },
    TaskCommandRestrictions: {},
    TaskCompletedEvent: {},
    TaskDefinition: {},
    TaskDefinitionStatus: {
        enumValues: {
            "preinstalled": 1,
            "receivedInstallOrUpdate": 2,
            "installed": 3,
            "receivedUninstall": 4,
            "uninstalled": 5,
            "requestedUpdate": 6,
            "updated": 7,
            "alreadyUpToDate": 8,
            "inlineUpdateReceived": 9
        }
    },
    TaskGroup: {},
    TaskGroupExpands: {
        enumValues: {
            "none": 0,
            "tasks": 2
        }
    },
    TaskGroupQueryOrder: {
        enumValues: {
            "createdOnAscending": 0,
            "createdOnDescending": 1
        }
    },
    TaskGroupRevision: {},
    TaskLog: {},
    TaskOrchestrationContainer: {},
    TaskOrchestrationItem: {},
    TaskOrchestrationItemType: {
        enumValues: {
            "container": 0,
            "job": 1
        }
    },
    TaskOrchestrationJob: {},
    TaskOrchestrationPlan: {},
    TaskOrchestrationPlanGroup: {},
    TaskOrchestrationPlanGroupsQueueMetrics: {},
    TaskOrchestrationPlanState: {
        enumValues: {
            "inProgress": 1,
            "queued": 2,
            "completed": 4,
            "throttled": 8
        }
    },
    TaskOrchestrationQueuedPlan: {},
    TaskOrchestrationQueuedPlanGroup: {},
    TaskRestrictions: {},
    TaskResult: {
        enumValues: {
            "succeeded": 0,
            "succeededWithIssues": 1,
            "failed": 2,
            "canceled": 3,
            "skipped": 4,
            "abandoned": 5
        }
    },
    Timeline: {},
    TimelineRecord: {},
    TimelineRecordReference: {},
    TimelineRecordState: {
        enumValues: {
            "pending": 0,
            "inProgress": 1,
            "completed": 2
        }
    },
    VariableGroup: {},
    VariableGroupActionFilter: {
        enumValues: {
            "none": 0,
            "manage": 2,
            "use": 16
        }
    },
    VariableGroupQueryOrder: {
        enumValues: {
            "idAscending": 0,
            "idDescending": 1
        }
    },
    VirtualMachine: {},
    VirtualMachineGroup: {},
    VirtualMachineResource: {},
    VirtualMachineResourceCreateParameters: {},
};
exports.TypeInfo.AgentChangeEvent.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgent
    },
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    },
    timeStamp: {
        isDate: true,
    }
};
exports.TypeInfo.AgentJobRequestMessage.fields = {
    environment: {
        typeInfo: exports.TypeInfo.JobEnvironment
    },
    lockedUntil: {
        isDate: true,
    }
};
exports.TypeInfo.AgentPoolEvent.fields = {
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPool
    }
};
exports.TypeInfo.AgentQueueEvent.fields = {
    queue: {
        typeInfo: exports.TypeInfo.TaskAgentQueue
    }
};
exports.TypeInfo.AgentQueuesEvent.fields = {
    queues: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskAgentQueue
    }
};
exports.TypeInfo.AzureKeyVaultVariableGroupProviderData.fields = {
    lastRefreshedOn: {
        isDate: true,
    }
};
exports.TypeInfo.AzureKeyVaultVariableValue.fields = {
    expires: {
        isDate: true,
    }
};
exports.TypeInfo.DemandMinimumVersion.fields = {
    source: {
        typeInfo: exports.TypeInfo.DemandSource
    }
};
exports.TypeInfo.DemandSource.fields = {
    sourceType: {
        enumType: exports.TypeInfo.DemandSourceType
    }
};
exports.TypeInfo.DeploymentGroup.fields = {
    machines: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentMachine
    },
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    }
};
exports.TypeInfo.DeploymentGroupMetrics.fields = {
    deploymentGroup: {
        typeInfo: exports.TypeInfo.DeploymentGroupReference
    }
};
exports.TypeInfo.DeploymentGroupReference.fields = {
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    }
};
exports.TypeInfo.DeploymentMachine.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgent
    }
};
exports.TypeInfo.DeploymentMachineChangedData.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgent
    }
};
exports.TypeInfo.DeploymentMachineGroup.fields = {
    machines: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentMachine
    },
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    }
};
exports.TypeInfo.DeploymentMachineGroupReference.fields = {
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    }
};
exports.TypeInfo.DeploymentMachinesChangeEvent.fields = {
    machineGroupReference: {
        typeInfo: exports.TypeInfo.DeploymentGroupReference
    },
    machines: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentMachineChangedData
    }
};
exports.TypeInfo.DeploymentPoolSummary.fields = {
    deploymentGroups: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentGroupReference
    },
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    },
    resource: {
        typeInfo: exports.TypeInfo.EnvironmentResourceReference
    }
};
exports.TypeInfo.ElasticNode.fields = {
    agentState: {
        enumType: exports.TypeInfo.ElasticAgentState
    },
    computeState: {
        enumType: exports.TypeInfo.ElasticComputeState
    },
    desiredState: {
        enumType: exports.TypeInfo.ElasticNodeState
    },
    state: {
        enumType: exports.TypeInfo.ElasticNodeState
    },
    stateChangedOn: {
        isDate: true,
    }
};
exports.TypeInfo.ElasticNodeSettings.fields = {
    state: {
        enumType: exports.TypeInfo.ElasticNodeState
    }
};
exports.TypeInfo.ElasticPool.fields = {
    offlineSince: {
        isDate: true,
    },
    orchestrationType: {
        enumType: exports.TypeInfo.OrchestrationType
    },
    osType: {
        enumType: exports.TypeInfo.OperatingSystemType
    },
    state: {
        enumType: exports.TypeInfo.ElasticPoolState
    }
};
exports.TypeInfo.ElasticPoolCreationResult.fields = {
    agentPool: {
        typeInfo: exports.TypeInfo.TaskAgentPool
    },
    agentQueue: {
        typeInfo: exports.TypeInfo.TaskAgentQueue
    },
    elasticPool: {
        typeInfo: exports.TypeInfo.ElasticPool
    }
};
exports.TypeInfo.ElasticPoolLog.fields = {
    level: {
        enumType: exports.TypeInfo.LogLevel
    },
    operation: {
        enumType: exports.TypeInfo.OperationType
    },
    timestamp: {
        isDate: true,
    }
};
exports.TypeInfo.ElasticPoolSettings.fields = {
    orchestrationType: {
        enumType: exports.TypeInfo.OrchestrationType
    },
    osType: {
        enumType: exports.TypeInfo.OperatingSystemType
    }
};
exports.TypeInfo.EnvironmentDeploymentExecutionRecord.fields = {
    finishTime: {
        isDate: true,
    },
    queueTime: {
        isDate: true,
    },
    result: {
        enumType: exports.TypeInfo.TaskResult
    },
    startTime: {
        isDate: true,
    }
};
exports.TypeInfo.EnvironmentInstance.fields = {
    createdOn: {
        isDate: true,
    },
    lastModifiedOn: {
        isDate: true,
    },
    resources: {
        isArray: true,
        typeInfo: exports.TypeInfo.EnvironmentResourceReference
    }
};
exports.TypeInfo.EnvironmentResource.fields = {
    createdOn: {
        isDate: true,
    },
    lastModifiedOn: {
        isDate: true,
    },
    type: {
        enumType: exports.TypeInfo.EnvironmentResourceType
    }
};
exports.TypeInfo.EnvironmentResourceDeploymentExecutionRecord.fields = {
    finishTime: {
        isDate: true,
    },
    result: {
        enumType: exports.TypeInfo.TaskResult
    },
    startTime: {
        isDate: true,
    }
};
exports.TypeInfo.EnvironmentResourceReference.fields = {
    type: {
        enumType: exports.TypeInfo.EnvironmentResourceType
    }
};
exports.TypeInfo.Issue.fields = {
    type: {
        enumType: exports.TypeInfo.IssueType
    }
};
exports.TypeInfo.JobAssignedEvent.fields = {
    request: {
        typeInfo: exports.TypeInfo.TaskAgentJobRequest
    }
};
exports.TypeInfo.JobCompletedEvent.fields = {
    result: {
        enumType: exports.TypeInfo.TaskResult
    }
};
exports.TypeInfo.JobEnvironment.fields = {
    mask: {
        isArray: true,
        typeInfo: exports.TypeInfo.MaskHint
    },
    secureFiles: {
        isArray: true,
        typeInfo: exports.TypeInfo.SecureFile
    }
};
exports.TypeInfo.JobRequestMessage.fields = {
    environment: {
        typeInfo: exports.TypeInfo.JobEnvironment
    }
};
exports.TypeInfo.KubernetesResource.fields = {
    createdOn: {
        isDate: true,
    },
    lastModifiedOn: {
        isDate: true,
    },
    type: {
        enumType: exports.TypeInfo.EnvironmentResourceType
    }
};
exports.TypeInfo.MaskHint.fields = {
    type: {
        enumType: exports.TypeInfo.MaskType
    }
};
exports.TypeInfo.PackageMetadata.fields = {
    createdOn: {
        isDate: true,
    }
};
exports.TypeInfo.PlanEnvironment.fields = {
    mask: {
        isArray: true,
        typeInfo: exports.TypeInfo.MaskHint
    }
};
exports.TypeInfo.ResourceLockRequest.fields = {
    assignTime: {
        isDate: true,
    },
    finishTime: {
        isDate: true,
    },
    lockType: {
        enumType: exports.TypeInfo.ExclusiveLockType
    },
    queueTime: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.ResourceLockStatus
    }
};
exports.TypeInfo.ResourceUsage.fields = {
    runningRequests: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskAgentJobRequest
    }
};
exports.TypeInfo.SecureFile.fields = {
    createdOn: {
        isDate: true,
    },
    modifiedOn: {
        isDate: true,
    }
};
exports.TypeInfo.SecureFileEvent.fields = {
    secureFiles: {
        isArray: true,
        typeInfo: exports.TypeInfo.SecureFile
    }
};
exports.TypeInfo.ServerTaskRequestMessage.fields = {
    environment: {
        typeInfo: exports.TypeInfo.JobEnvironment
    },
    taskDefinition: {
        typeInfo: exports.TypeInfo.TaskDefinition
    }
};
exports.TypeInfo.ServiceEndpointAuthenticationScheme.fields = {
    inputDescriptors: {
        isArray: true,
        typeInfo: FormInputInterfaces.TypeInfo.InputDescriptor
    }
};
exports.TypeInfo.ServiceEndpointExecutionData.fields = {
    finishTime: {
        isDate: true,
    },
    result: {
        enumType: exports.TypeInfo.TaskResult
    },
    startTime: {
        isDate: true,
    }
};
exports.TypeInfo.ServiceEndpointExecutionRecord.fields = {
    data: {
        typeInfo: exports.TypeInfo.ServiceEndpointExecutionData
    }
};
exports.TypeInfo.ServiceEndpointExecutionRecordsInput.fields = {
    data: {
        typeInfo: exports.TypeInfo.ServiceEndpointExecutionData
    }
};
exports.TypeInfo.ServiceEndpointRequestResult.fields = {};
exports.TypeInfo.ServiceEndpointType.fields = {
    authenticationSchemes: {
        isArray: true,
        typeInfo: exports.TypeInfo.ServiceEndpointAuthenticationScheme
    },
    inputDescriptors: {
        isArray: true,
        typeInfo: FormInputInterfaces.TypeInfo.InputDescriptor
    }
};
exports.TypeInfo.TaskAgent.fields = {
    assignedAgentCloudRequest: {
        typeInfo: exports.TypeInfo.TaskAgentCloudRequest
    },
    assignedRequest: {
        typeInfo: exports.TypeInfo.TaskAgentJobRequest
    },
    createdOn: {
        isDate: true,
    },
    lastCompletedRequest: {
        typeInfo: exports.TypeInfo.TaskAgentJobRequest
    },
    pendingUpdate: {
        typeInfo: exports.TypeInfo.TaskAgentUpdate
    },
    status: {
        enumType: exports.TypeInfo.TaskAgentStatus
    },
    statusChangedOn: {
        isDate: true,
    }
};
exports.TypeInfo.TaskAgentCloudRequest.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgentReference
    },
    agentConnectedTime: {
        isDate: true,
    },
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    },
    provisionedTime: {
        isDate: true,
    },
    provisionRequestTime: {
        isDate: true,
    },
    releaseRequestTime: {
        isDate: true,
    }
};
exports.TypeInfo.TaskAgentCloudType.fields = {
    inputDescriptors: {
        isArray: true,
        typeInfo: FormInputInterfaces.TypeInfo.InputDescriptor
    }
};
exports.TypeInfo.TaskAgentDowngrade.fields = {
    code: {
        enumType: exports.TypeInfo.TaskAgentUpdateReasonType
    }
};
exports.TypeInfo.TaskAgentJob.fields = {
    steps: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskAgentJobStep
    }
};
exports.TypeInfo.TaskAgentJobRequest.fields = {
    assignTime: {
        isDate: true,
    },
    finishTime: {
        isDate: true,
    },
    lockedUntil: {
        isDate: true,
    },
    matchedAgents: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskAgentReference
    },
    queueTime: {
        isDate: true,
    },
    receiveTime: {
        isDate: true,
    },
    reservedAgent: {
        typeInfo: exports.TypeInfo.TaskAgentReference
    },
    result: {
        enumType: exports.TypeInfo.TaskResult
    }
};
exports.TypeInfo.TaskAgentJobStep.fields = {
    type: {
        enumType: exports.TypeInfo.TaskAgentJobStepType
    }
};
exports.TypeInfo.TaskAgentManualUpdate.fields = {
    code: {
        enumType: exports.TypeInfo.TaskAgentUpdateReasonType
    }
};
exports.TypeInfo.TaskAgentMinAgentVersionRequiredUpdate.fields = {
    code: {
        enumType: exports.TypeInfo.TaskAgentUpdateReasonType
    }
};
exports.TypeInfo.TaskAgentPool.fields = {
    createdOn: {
        isDate: true,
    },
    options: {
        enumType: exports.TypeInfo.TaskAgentPoolOptions
    },
    poolType: {
        enumType: exports.TypeInfo.TaskAgentPoolType
    }
};
exports.TypeInfo.TaskAgentPoolMaintenanceDefinition.fields = {
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    },
    scheduleSetting: {
        typeInfo: exports.TypeInfo.TaskAgentPoolMaintenanceSchedule
    }
};
exports.TypeInfo.TaskAgentPoolMaintenanceJob.fields = {
    finishTime: {
        isDate: true,
    },
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    },
    queueTime: {
        isDate: true,
    },
    result: {
        enumType: exports.TypeInfo.TaskAgentPoolMaintenanceJobResult
    },
    startTime: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.TaskAgentPoolMaintenanceJobStatus
    },
    targetAgents: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskAgentPoolMaintenanceJobTargetAgent
    }
};
exports.TypeInfo.TaskAgentPoolMaintenanceJobTargetAgent.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgentReference
    },
    result: {
        enumType: exports.TypeInfo.TaskAgentPoolMaintenanceJobResult
    },
    status: {
        enumType: exports.TypeInfo.TaskAgentPoolMaintenanceJobStatus
    }
};
exports.TypeInfo.TaskAgentPoolMaintenanceSchedule.fields = {
    daysToBuild: {
        enumType: exports.TypeInfo.TaskAgentPoolMaintenanceScheduleDays
    }
};
exports.TypeInfo.TaskAgentPoolReference.fields = {
    options: {
        enumType: exports.TypeInfo.TaskAgentPoolOptions
    },
    poolType: {
        enumType: exports.TypeInfo.TaskAgentPoolType
    }
};
exports.TypeInfo.TaskAgentPoolStatus.fields = {
    options: {
        enumType: exports.TypeInfo.TaskAgentPoolOptions
    },
    poolType: {
        enumType: exports.TypeInfo.TaskAgentPoolType
    }
};
exports.TypeInfo.TaskAgentPoolSummary.fields = {
    deploymentGroups: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentGroupReference
    },
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    },
    queues: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskAgentQueue
    }
};
exports.TypeInfo.TaskAgentQueue.fields = {
    pool: {
        typeInfo: exports.TypeInfo.TaskAgentPoolReference
    }
};
exports.TypeInfo.TaskAgentReference.fields = {
    status: {
        enumType: exports.TypeInfo.TaskAgentStatus
    }
};
exports.TypeInfo.TaskAgentSession.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgentReference
    }
};
exports.TypeInfo.TaskAgentUpdate.fields = {
    reason: {
        typeInfo: exports.TypeInfo.TaskAgentUpdateReason
    },
    requestTime: {
        isDate: true,
    }
};
exports.TypeInfo.TaskAgentUpdateReason.fields = {
    code: {
        enumType: exports.TypeInfo.TaskAgentUpdateReasonType
    }
};
exports.TypeInfo.TaskAttachment.fields = {
    createdOn: {
        isDate: true,
    },
    lastChangedOn: {
        isDate: true,
    }
};
exports.TypeInfo.TaskCommandRestrictions.fields = {
    mode: {
        enumType: exports.TypeInfo.TaskCommandMode
    }
};
exports.TypeInfo.TaskCompletedEvent.fields = {
    result: {
        enumType: exports.TypeInfo.TaskResult
    }
};
exports.TypeInfo.TaskDefinition.fields = {
    restrictions: {
        typeInfo: exports.TypeInfo.TaskRestrictions
    }
};
exports.TypeInfo.TaskGroup.fields = {
    createdOn: {
        isDate: true,
    },
    modifiedOn: {
        isDate: true,
    },
    restrictions: {
        typeInfo: exports.TypeInfo.TaskRestrictions
    }
};
exports.TypeInfo.TaskGroupRevision.fields = {
    changedDate: {
        isDate: true,
    },
    changeType: {
        enumType: exports.TypeInfo.AuditAction
    }
};
exports.TypeInfo.TaskLog.fields = {
    createdOn: {
        isDate: true,
    },
    lastChangedOn: {
        isDate: true,
    }
};
exports.TypeInfo.TaskOrchestrationContainer.fields = {
    children: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskOrchestrationItem
    },
    itemType: {
        enumType: exports.TypeInfo.TaskOrchestrationItemType
    },
    rollback: {
        typeInfo: exports.TypeInfo.TaskOrchestrationContainer
    }
};
exports.TypeInfo.TaskOrchestrationItem.fields = {
    itemType: {
        enumType: exports.TypeInfo.TaskOrchestrationItemType
    }
};
exports.TypeInfo.TaskOrchestrationJob.fields = {
    itemType: {
        enumType: exports.TypeInfo.TaskOrchestrationItemType
    }
};
exports.TypeInfo.TaskOrchestrationPlan.fields = {
    environment: {
        typeInfo: exports.TypeInfo.PlanEnvironment
    },
    finishTime: {
        isDate: true,
    },
    implementation: {
        typeInfo: exports.TypeInfo.TaskOrchestrationContainer
    },
    result: {
        enumType: exports.TypeInfo.TaskResult
    },
    startTime: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.TaskOrchestrationPlanState
    }
};
exports.TypeInfo.TaskOrchestrationPlanGroup.fields = {
    runningRequests: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskAgentJobRequest
    }
};
exports.TypeInfo.TaskOrchestrationPlanGroupsQueueMetrics.fields = {
    status: {
        enumType: exports.TypeInfo.PlanGroupStatus
    }
};
exports.TypeInfo.TaskOrchestrationQueuedPlan.fields = {
    assignTime: {
        isDate: true,
    },
    queueTime: {
        isDate: true,
    }
};
exports.TypeInfo.TaskOrchestrationQueuedPlanGroup.fields = {
    plans: {
        isArray: true,
        typeInfo: exports.TypeInfo.TaskOrchestrationQueuedPlan
    }
};
exports.TypeInfo.TaskRestrictions.fields = {
    commands: {
        typeInfo: exports.TypeInfo.TaskCommandRestrictions
    }
};
exports.TypeInfo.Timeline.fields = {
    lastChangedOn: {
        isDate: true,
    },
    records: {
        isArray: true,
        typeInfo: exports.TypeInfo.TimelineRecord
    }
};
exports.TypeInfo.TimelineRecord.fields = {
    finishTime: {
        isDate: true,
    },
    issues: {
        isArray: true,
        typeInfo: exports.TypeInfo.Issue
    },
    lastModified: {
        isDate: true,
    },
    result: {
        enumType: exports.TypeInfo.TaskResult
    },
    startTime: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.TimelineRecordState
    }
};
exports.TypeInfo.TimelineRecordReference.fields = {
    state: {
        enumType: exports.TypeInfo.TimelineRecordState
    }
};
exports.TypeInfo.VariableGroup.fields = {
    createdOn: {
        isDate: true,
    },
    modifiedOn: {
        isDate: true,
    }
};
exports.TypeInfo.VirtualMachine.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgent
    }
};
exports.TypeInfo.VirtualMachineGroup.fields = {
    createdOn: {
        isDate: true,
    },
    lastModifiedOn: {
        isDate: true,
    },
    type: {
        enumType: exports.TypeInfo.EnvironmentResourceType
    }
};
exports.TypeInfo.VirtualMachineResource.fields = {
    agent: {
        typeInfo: exports.TypeInfo.TaskAgent
    },
    createdOn: {
        isDate: true,
    },
    lastModifiedOn: {
        isDate: true,
    },
    type: {
        enumType: exports.TypeInfo.EnvironmentResourceType
    }
};
exports.TypeInfo.VirtualMachineResourceCreateParameters.fields = {
    virtualMachineResource: {
        typeInfo: exports.TypeInfo.VirtualMachineResource
    }
};
