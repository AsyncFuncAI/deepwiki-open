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
var AgentArtifactType;
(function (AgentArtifactType) {
    /**
     * Indicates XamlBuild artifact
     */
    AgentArtifactType[AgentArtifactType["XamlBuild"] = 0] = "XamlBuild";
    /**
     * Indicates Build artifact
     */
    AgentArtifactType[AgentArtifactType["Build"] = 1] = "Build";
    /**
     * Indicates Jenkins artifact
     */
    AgentArtifactType[AgentArtifactType["Jenkins"] = 2] = "Jenkins";
    /**
     * Indicates FileShare artifact
     */
    AgentArtifactType[AgentArtifactType["FileShare"] = 3] = "FileShare";
    /**
     * Indicates Nuget artifact
     */
    AgentArtifactType[AgentArtifactType["Nuget"] = 4] = "Nuget";
    /**
     * Indicates TfsOnPrem artifact
     */
    AgentArtifactType[AgentArtifactType["TfsOnPrem"] = 5] = "TfsOnPrem";
    /**
     * Indicates GitHub artifact
     */
    AgentArtifactType[AgentArtifactType["GitHub"] = 6] = "GitHub";
    /**
     * Indicates TFGit artifact
     */
    AgentArtifactType[AgentArtifactType["TFGit"] = 7] = "TFGit";
    /**
     * Indicates ExternalTfsBuild artifact
     */
    AgentArtifactType[AgentArtifactType["ExternalTfsBuild"] = 8] = "ExternalTfsBuild";
    /**
     * Indicates Custom artifact
     */
    AgentArtifactType[AgentArtifactType["Custom"] = 9] = "Custom";
    /**
     * Indicates Tfvc artifact
     */
    AgentArtifactType[AgentArtifactType["Tfvc"] = 10] = "Tfvc";
})(AgentArtifactType = exports.AgentArtifactType || (exports.AgentArtifactType = {}));
var ApprovalExecutionOrder;
(function (ApprovalExecutionOrder) {
    /**
     * Approvals shown before gates.
     */
    ApprovalExecutionOrder[ApprovalExecutionOrder["BeforeGates"] = 1] = "BeforeGates";
    /**
     * Approvals shown after successful execution of gates.
     */
    ApprovalExecutionOrder[ApprovalExecutionOrder["AfterSuccessfulGates"] = 2] = "AfterSuccessfulGates";
    /**
     * Approvals shown always after execution of gates.
     */
    ApprovalExecutionOrder[ApprovalExecutionOrder["AfterGatesAlways"] = 4] = "AfterGatesAlways";
})(ApprovalExecutionOrder = exports.ApprovalExecutionOrder || (exports.ApprovalExecutionOrder = {}));
var ApprovalFilters;
(function (ApprovalFilters) {
    /**
     * No approvals or approval snapshots.
     */
    ApprovalFilters[ApprovalFilters["None"] = 0] = "None";
    /**
     * Manual approval steps but no approval snapshots (Use with ApprovalSnapshots for snapshots).
     */
    ApprovalFilters[ApprovalFilters["ManualApprovals"] = 1] = "ManualApprovals";
    /**
     * Automated approval steps but no approval snapshots (Use with ApprovalSnapshots for snapshots).
     */
    ApprovalFilters[ApprovalFilters["AutomatedApprovals"] = 2] = "AutomatedApprovals";
    /**
     * No approval steps, but approval snapshots (Use with either ManualApprovals or AutomatedApprovals for approval steps).
     */
    ApprovalFilters[ApprovalFilters["ApprovalSnapshots"] = 4] = "ApprovalSnapshots";
    /**
     * All approval steps and approval snapshots.
     */
    ApprovalFilters[ApprovalFilters["All"] = 7] = "All";
})(ApprovalFilters = exports.ApprovalFilters || (exports.ApprovalFilters = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    /**
     * Indicates the approval does not have the status set.
     */
    ApprovalStatus[ApprovalStatus["Undefined"] = 0] = "Undefined";
    /**
     * Indicates the approval is pending.
     */
    ApprovalStatus[ApprovalStatus["Pending"] = 1] = "Pending";
    /**
     * Indicates the approval is approved.
     */
    ApprovalStatus[ApprovalStatus["Approved"] = 2] = "Approved";
    /**
     * Indicates the approval is rejected.
     */
    ApprovalStatus[ApprovalStatus["Rejected"] = 4] = "Rejected";
    /**
     * Indicates the approval is reassigned.
     */
    ApprovalStatus[ApprovalStatus["Reassigned"] = 6] = "Reassigned";
    /**
     * Indicates the approval is canceled.
     */
    ApprovalStatus[ApprovalStatus["Canceled"] = 7] = "Canceled";
    /**
     * Indicates the approval is skipped.
     */
    ApprovalStatus[ApprovalStatus["Skipped"] = 8] = "Skipped";
})(ApprovalStatus = exports.ApprovalStatus || (exports.ApprovalStatus = {}));
var ApprovalType;
(function (ApprovalType) {
    /**
     * Indicates the approval type does not set.
     */
    ApprovalType[ApprovalType["Undefined"] = 0] = "Undefined";
    /**
     * Indicates the approvals which executed before deployment.
     */
    ApprovalType[ApprovalType["PreDeploy"] = 1] = "PreDeploy";
    /**
     * Indicates the approvals which executed after deployment.
     */
    ApprovalType[ApprovalType["PostDeploy"] = 2] = "PostDeploy";
    /**
     * Indicates all approvals.
     */
    ApprovalType[ApprovalType["All"] = 3] = "All";
})(ApprovalType = exports.ApprovalType || (exports.ApprovalType = {}));
var AuditAction;
(function (AuditAction) {
    /**
     * Indicates the audit add.
     */
    AuditAction[AuditAction["Add"] = 1] = "Add";
    /**
     * Indicates the audit update.
     */
    AuditAction[AuditAction["Update"] = 2] = "Update";
    /**
     * Indicates the audit delete.
     */
    AuditAction[AuditAction["Delete"] = 3] = "Delete";
    /**
     * Indicates the audit undelete.
     */
    AuditAction[AuditAction["Undelete"] = 4] = "Undelete";
})(AuditAction = exports.AuditAction || (exports.AuditAction = {}));
var AuthorizationHeaderFor;
(function (AuthorizationHeaderFor) {
    AuthorizationHeaderFor[AuthorizationHeaderFor["RevalidateApproverIdentity"] = 0] = "RevalidateApproverIdentity";
    AuthorizationHeaderFor[AuthorizationHeaderFor["OnBehalfOf"] = 1] = "OnBehalfOf";
})(AuthorizationHeaderFor = exports.AuthorizationHeaderFor || (exports.AuthorizationHeaderFor = {}));
var ConditionType;
(function (ConditionType) {
    /**
     * The condition type is undefined.
     */
    ConditionType[ConditionType["Undefined"] = 0] = "Undefined";
    /**
     * The condition type is event.
     */
    ConditionType[ConditionType["Event"] = 1] = "Event";
    /**
     * The condition type is environment state.
     */
    ConditionType[ConditionType["EnvironmentState"] = 2] = "EnvironmentState";
    /**
     * The condition type is artifact.
     */
    ConditionType[ConditionType["Artifact"] = 4] = "Artifact";
})(ConditionType = exports.ConditionType || (exports.ConditionType = {}));
var DeploymentAuthorizationOwner;
(function (DeploymentAuthorizationOwner) {
    DeploymentAuthorizationOwner[DeploymentAuthorizationOwner["Automatic"] = 0] = "Automatic";
    DeploymentAuthorizationOwner[DeploymentAuthorizationOwner["DeploymentSubmitter"] = 1] = "DeploymentSubmitter";
    DeploymentAuthorizationOwner[DeploymentAuthorizationOwner["FirstPreDeploymentApprover"] = 2] = "FirstPreDeploymentApprover";
})(DeploymentAuthorizationOwner = exports.DeploymentAuthorizationOwner || (exports.DeploymentAuthorizationOwner = {}));
var DeploymentExpands;
(function (DeploymentExpands) {
    DeploymentExpands[DeploymentExpands["All"] = 0] = "All";
    DeploymentExpands[DeploymentExpands["DeploymentOnly"] = 1] = "DeploymentOnly";
    DeploymentExpands[DeploymentExpands["Approvals"] = 2] = "Approvals";
    DeploymentExpands[DeploymentExpands["Artifacts"] = 4] = "Artifacts";
})(DeploymentExpands = exports.DeploymentExpands || (exports.DeploymentExpands = {}));
var DeploymentOperationStatus;
(function (DeploymentOperationStatus) {
    /**
     * The deployment operation status is undefined.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Undefined"] = 0] = "Undefined";
    /**
     * The deployment operation status is queued.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Queued"] = 1] = "Queued";
    /**
     * The deployment operation status is scheduled.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Scheduled"] = 2] = "Scheduled";
    /**
     * The deployment operation status is pending.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Pending"] = 4] = "Pending";
    /**
     * The deployment operation status is approved.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Approved"] = 8] = "Approved";
    /**
     * The deployment operation status is rejected.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Rejected"] = 16] = "Rejected";
    /**
     * The deployment operation status is deferred.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Deferred"] = 32] = "Deferred";
    /**
     * The deployment operation status is queued for agent.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["QueuedForAgent"] = 64] = "QueuedForAgent";
    /**
     * The deployment operation status is phase in progress.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["PhaseInProgress"] = 128] = "PhaseInProgress";
    /**
     * The deployment operation status is phase succeeded.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["PhaseSucceeded"] = 256] = "PhaseSucceeded";
    /**
     * The deployment operation status is phase partially succeeded.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["PhasePartiallySucceeded"] = 512] = "PhasePartiallySucceeded";
    /**
     * The deployment operation status is phase failed.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["PhaseFailed"] = 1024] = "PhaseFailed";
    /**
     * The deployment operation status is canceled.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Canceled"] = 2048] = "Canceled";
    /**
     * The deployment operation status is phase canceled.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["PhaseCanceled"] = 4096] = "PhaseCanceled";
    /**
     * The deployment operation status is manualintervention pending.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["ManualInterventionPending"] = 8192] = "ManualInterventionPending";
    /**
     * The deployment operation status is queued for pipeline.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["QueuedForPipeline"] = 16384] = "QueuedForPipeline";
    /**
     * The deployment operation status is cancelling.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["Cancelling"] = 32768] = "Cancelling";
    /**
     * The deployment operation status is EvaluatingGates.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["EvaluatingGates"] = 65536] = "EvaluatingGates";
    /**
     * The deployment operation status is GateFailed.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["GateFailed"] = 131072] = "GateFailed";
    /**
     * The deployment operation status is all.
     */
    DeploymentOperationStatus[DeploymentOperationStatus["All"] = 258047] = "All";
})(DeploymentOperationStatus = exports.DeploymentOperationStatus || (exports.DeploymentOperationStatus = {}));
var DeploymentReason;
(function (DeploymentReason) {
    /**
     * The deployment reason is none.
     */
    DeploymentReason[DeploymentReason["None"] = 0] = "None";
    /**
     * The deployment reason is manual.
     */
    DeploymentReason[DeploymentReason["Manual"] = 1] = "Manual";
    /**
     * The deployment reason is automated.
     */
    DeploymentReason[DeploymentReason["Automated"] = 2] = "Automated";
    /**
     * The deployment reason is scheduled.
     */
    DeploymentReason[DeploymentReason["Scheduled"] = 4] = "Scheduled";
    /**
     * The deployment reason is RedeployTrigger.
     */
    DeploymentReason[DeploymentReason["RedeployTrigger"] = 8] = "RedeployTrigger";
})(DeploymentReason = exports.DeploymentReason || (exports.DeploymentReason = {}));
var DeploymentsQueryType;
(function (DeploymentsQueryType) {
    DeploymentsQueryType[DeploymentsQueryType["Regular"] = 1] = "Regular";
    DeploymentsQueryType[DeploymentsQueryType["FailingSince"] = 2] = "FailingSince";
})(DeploymentsQueryType = exports.DeploymentsQueryType || (exports.DeploymentsQueryType = {}));
var DeploymentStatus;
(function (DeploymentStatus) {
    /**
     * The deployment status is undefined.
     */
    DeploymentStatus[DeploymentStatus["Undefined"] = 0] = "Undefined";
    /**
     * The deployment status is not deployed.
     */
    DeploymentStatus[DeploymentStatus["NotDeployed"] = 1] = "NotDeployed";
    /**
     * The deployment status is in progress.
     */
    DeploymentStatus[DeploymentStatus["InProgress"] = 2] = "InProgress";
    /**
     * The deployment status is succeeded.
     */
    DeploymentStatus[DeploymentStatus["Succeeded"] = 4] = "Succeeded";
    /**
     * The deployment status is partiallysucceeded.
     */
    DeploymentStatus[DeploymentStatus["PartiallySucceeded"] = 8] = "PartiallySucceeded";
    /**
     * The deployment status is failed.
     */
    DeploymentStatus[DeploymentStatus["Failed"] = 16] = "Failed";
    /**
     * The deployment status is all.
     */
    DeploymentStatus[DeploymentStatus["All"] = 31] = "All";
})(DeploymentStatus = exports.DeploymentStatus || (exports.DeploymentStatus = {}));
var DeployPhaseStatus;
(function (DeployPhaseStatus) {
    /**
     * Phase status not set.
     */
    DeployPhaseStatus[DeployPhaseStatus["Undefined"] = 0] = "Undefined";
    /**
     * Phase execution not started.
     */
    DeployPhaseStatus[DeployPhaseStatus["NotStarted"] = 1] = "NotStarted";
    /**
     * Phase execution in progress.
     */
    DeployPhaseStatus[DeployPhaseStatus["InProgress"] = 2] = "InProgress";
    /**
     * Phase execution partially succeeded.
     */
    DeployPhaseStatus[DeployPhaseStatus["PartiallySucceeded"] = 4] = "PartiallySucceeded";
    /**
     * Phase execution succeeded.
     */
    DeployPhaseStatus[DeployPhaseStatus["Succeeded"] = 8] = "Succeeded";
    /**
     * Phase execution failed.
     */
    DeployPhaseStatus[DeployPhaseStatus["Failed"] = 16] = "Failed";
    /**
     * Phase execution canceled.
     */
    DeployPhaseStatus[DeployPhaseStatus["Canceled"] = 32] = "Canceled";
    /**
     * Phase execution skipped.
     */
    DeployPhaseStatus[DeployPhaseStatus["Skipped"] = 64] = "Skipped";
    /**
     * Phase is in cancelling state.
     */
    DeployPhaseStatus[DeployPhaseStatus["Cancelling"] = 128] = "Cancelling";
})(DeployPhaseStatus = exports.DeployPhaseStatus || (exports.DeployPhaseStatus = {}));
var DeployPhaseTypes;
(function (DeployPhaseTypes) {
    /**
     * Phase type not defined. Don't use this.
     */
    DeployPhaseTypes[DeployPhaseTypes["Undefined"] = 0] = "Undefined";
    /**
     * Phase type which contains tasks executed on agent.
     */
    DeployPhaseTypes[DeployPhaseTypes["AgentBasedDeployment"] = 1] = "AgentBasedDeployment";
    /**
     * Phase type which contains tasks executed by server.
     */
    DeployPhaseTypes[DeployPhaseTypes["RunOnServer"] = 2] = "RunOnServer";
    /**
     * Phase type which contains tasks executed on deployment group machines.
     */
    DeployPhaseTypes[DeployPhaseTypes["MachineGroupBasedDeployment"] = 4] = "MachineGroupBasedDeployment";
    /**
     * Phase type which contains tasks which acts as Gates for the deployment to go forward.
     */
    DeployPhaseTypes[DeployPhaseTypes["DeploymentGates"] = 8] = "DeploymentGates";
})(DeployPhaseTypes = exports.DeployPhaseTypes || (exports.DeployPhaseTypes = {}));
var EnvironmentStatus;
(function (EnvironmentStatus) {
    /**
     * Environment status not set.
     */
    EnvironmentStatus[EnvironmentStatus["Undefined"] = 0] = "Undefined";
    /**
     * Environment is in not started state.
     */
    EnvironmentStatus[EnvironmentStatus["NotStarted"] = 1] = "NotStarted";
    /**
     * Environment is in progress state.
     */
    EnvironmentStatus[EnvironmentStatus["InProgress"] = 2] = "InProgress";
    /**
     * Environment is in succeeded state.
     */
    EnvironmentStatus[EnvironmentStatus["Succeeded"] = 4] = "Succeeded";
    /**
     * Environment is in canceled state.
     */
    EnvironmentStatus[EnvironmentStatus["Canceled"] = 8] = "Canceled";
    /**
     * Environment is in rejected state.
     */
    EnvironmentStatus[EnvironmentStatus["Rejected"] = 16] = "Rejected";
    /**
     * Environment is in queued state.
     */
    EnvironmentStatus[EnvironmentStatus["Queued"] = 32] = "Queued";
    /**
     * Environment is in scheduled state.
     */
    EnvironmentStatus[EnvironmentStatus["Scheduled"] = 64] = "Scheduled";
    /**
     * Environment is in partially succeeded state.
     */
    EnvironmentStatus[EnvironmentStatus["PartiallySucceeded"] = 128] = "PartiallySucceeded";
})(EnvironmentStatus = exports.EnvironmentStatus || (exports.EnvironmentStatus = {}));
var EnvironmentTriggerType;
(function (EnvironmentTriggerType) {
    /**
     * Environment trigger type undefined.
     */
    EnvironmentTriggerType[EnvironmentTriggerType["Undefined"] = 0] = "Undefined";
    /**
     * Environment trigger type is deployment group redeploy.
     */
    EnvironmentTriggerType[EnvironmentTriggerType["DeploymentGroupRedeploy"] = 1] = "DeploymentGroupRedeploy";
    /**
     * Environment trigger type is Rollback.
     */
    EnvironmentTriggerType[EnvironmentTriggerType["RollbackRedeploy"] = 2] = "RollbackRedeploy";
})(EnvironmentTriggerType = exports.EnvironmentTriggerType || (exports.EnvironmentTriggerType = {}));
/**
 * Specifies the desired ordering of folders.
 */
var FolderPathQueryOrder;
(function (FolderPathQueryOrder) {
    /**
     * No order.
     */
    FolderPathQueryOrder[FolderPathQueryOrder["None"] = 0] = "None";
    /**
     * Order by folder name and path ascending.
     */
    FolderPathQueryOrder[FolderPathQueryOrder["Ascending"] = 1] = "Ascending";
    /**
     * Order by folder name and path descending.
     */
    FolderPathQueryOrder[FolderPathQueryOrder["Descending"] = 2] = "Descending";
})(FolderPathQueryOrder = exports.FolderPathQueryOrder || (exports.FolderPathQueryOrder = {}));
var GateStatus;
(function (GateStatus) {
    /**
     * The gate does not have the status set.
     */
    GateStatus[GateStatus["None"] = 0] = "None";
    /**
     * The gate is in pending state.
     */
    GateStatus[GateStatus["Pending"] = 1] = "Pending";
    /**
     * The gate is currently in progress.
     */
    GateStatus[GateStatus["InProgress"] = 2] = "InProgress";
    /**
     * The gate completed successfully.
     */
    GateStatus[GateStatus["Succeeded"] = 4] = "Succeeded";
    /**
     * The gate execution failed.
     */
    GateStatus[GateStatus["Failed"] = 8] = "Failed";
    /**
     * The gate execution cancelled.
     */
    GateStatus[GateStatus["Canceled"] = 16] = "Canceled";
})(GateStatus = exports.GateStatus || (exports.GateStatus = {}));
var IssueSource;
(function (IssueSource) {
    IssueSource[IssueSource["None"] = 0] = "None";
    IssueSource[IssueSource["User"] = 1] = "User";
    IssueSource[IssueSource["System"] = 2] = "System";
})(IssueSource = exports.IssueSource || (exports.IssueSource = {}));
var MailSectionType;
(function (MailSectionType) {
    MailSectionType[MailSectionType["Details"] = 0] = "Details";
    MailSectionType[MailSectionType["Environments"] = 1] = "Environments";
    MailSectionType[MailSectionType["Issues"] = 2] = "Issues";
    MailSectionType[MailSectionType["TestResults"] = 3] = "TestResults";
    MailSectionType[MailSectionType["WorkItems"] = 4] = "WorkItems";
    MailSectionType[MailSectionType["ReleaseInfo"] = 5] = "ReleaseInfo";
})(MailSectionType = exports.MailSectionType || (exports.MailSectionType = {}));
/**
 * Describes manual intervention status
 */
var ManualInterventionStatus;
(function (ManualInterventionStatus) {
    /**
     * The manual intervention does not have the status set.
     */
    ManualInterventionStatus[ManualInterventionStatus["Unknown"] = 0] = "Unknown";
    /**
     * The manual intervention is pending.
     */
    ManualInterventionStatus[ManualInterventionStatus["Pending"] = 1] = "Pending";
    /**
     * The manual intervention is rejected.
     */
    ManualInterventionStatus[ManualInterventionStatus["Rejected"] = 2] = "Rejected";
    /**
     * The manual intervention is approved.
     */
    ManualInterventionStatus[ManualInterventionStatus["Approved"] = 4] = "Approved";
    /**
     * The manual intervention is canceled.
     */
    ManualInterventionStatus[ManualInterventionStatus["Canceled"] = 8] = "Canceled";
})(ManualInterventionStatus = exports.ManualInterventionStatus || (exports.ManualInterventionStatus = {}));
var ParallelExecutionTypes;
(function (ParallelExecutionTypes) {
    ParallelExecutionTypes[ParallelExecutionTypes["None"] = 0] = "None";
    ParallelExecutionTypes[ParallelExecutionTypes["MultiConfiguration"] = 1] = "MultiConfiguration";
    ParallelExecutionTypes[ParallelExecutionTypes["MultiMachine"] = 2] = "MultiMachine";
})(ParallelExecutionTypes = exports.ParallelExecutionTypes || (exports.ParallelExecutionTypes = {}));
var PipelineProcessTypes;
(function (PipelineProcessTypes) {
    PipelineProcessTypes[PipelineProcessTypes["Designer"] = 1] = "Designer";
    PipelineProcessTypes[PipelineProcessTypes["Yaml"] = 2] = "Yaml";
})(PipelineProcessTypes = exports.PipelineProcessTypes || (exports.PipelineProcessTypes = {}));
var PropertySelectorType;
(function (PropertySelectorType) {
    /**
     * Include in property selector.
     */
    PropertySelectorType[PropertySelectorType["Inclusion"] = 0] = "Inclusion";
    /**
     * Exclude in property selector.
     */
    PropertySelectorType[PropertySelectorType["Exclusion"] = 1] = "Exclusion";
})(PropertySelectorType = exports.PropertySelectorType || (exports.PropertySelectorType = {}));
var PullRequestSystemType;
(function (PullRequestSystemType) {
    PullRequestSystemType[PullRequestSystemType["None"] = 0] = "None";
    PullRequestSystemType[PullRequestSystemType["TfsGit"] = 1] = "TfsGit";
    PullRequestSystemType[PullRequestSystemType["GitHub"] = 2] = "GitHub";
})(PullRequestSystemType = exports.PullRequestSystemType || (exports.PullRequestSystemType = {}));
var ReleaseDefinitionExpands;
(function (ReleaseDefinitionExpands) {
    /**
     * Returns top level properties of object.
     */
    ReleaseDefinitionExpands[ReleaseDefinitionExpands["None"] = 0] = "None";
    /**
     * Include environments in return object.
     */
    ReleaseDefinitionExpands[ReleaseDefinitionExpands["Environments"] = 2] = "Environments";
    /**
     * Include artifacts in return object.
     */
    ReleaseDefinitionExpands[ReleaseDefinitionExpands["Artifacts"] = 4] = "Artifacts";
    /**
     * Include triggers in return object.
     */
    ReleaseDefinitionExpands[ReleaseDefinitionExpands["Triggers"] = 8] = "Triggers";
    /**
     * Include variables in return object.
     */
    ReleaseDefinitionExpands[ReleaseDefinitionExpands["Variables"] = 16] = "Variables";
    /**
     * Include tags in return object.
     */
    ReleaseDefinitionExpands[ReleaseDefinitionExpands["Tags"] = 32] = "Tags";
    /**
     * Include last release in return object.
     */
    ReleaseDefinitionExpands[ReleaseDefinitionExpands["LastRelease"] = 64] = "LastRelease";
})(ReleaseDefinitionExpands = exports.ReleaseDefinitionExpands || (exports.ReleaseDefinitionExpands = {}));
var ReleaseDefinitionQueryOrder;
(function (ReleaseDefinitionQueryOrder) {
    /**
     * Return results based on release definition Id ascending order.
     */
    ReleaseDefinitionQueryOrder[ReleaseDefinitionQueryOrder["IdAscending"] = 0] = "IdAscending";
    /**
     * Return results based on release definition Id descending order.
     */
    ReleaseDefinitionQueryOrder[ReleaseDefinitionQueryOrder["IdDescending"] = 1] = "IdDescending";
    /**
     * Return results based on release definition name ascending order.
     */
    ReleaseDefinitionQueryOrder[ReleaseDefinitionQueryOrder["NameAscending"] = 2] = "NameAscending";
    /**
     * Return results based on release definition name descending order.
     */
    ReleaseDefinitionQueryOrder[ReleaseDefinitionQueryOrder["NameDescending"] = 3] = "NameDescending";
})(ReleaseDefinitionQueryOrder = exports.ReleaseDefinitionQueryOrder || (exports.ReleaseDefinitionQueryOrder = {}));
var ReleaseDefinitionSource;
(function (ReleaseDefinitionSource) {
    /**
     * Indicates ReleaseDefinition source not defined.
     */
    ReleaseDefinitionSource[ReleaseDefinitionSource["Undefined"] = 0] = "Undefined";
    /**
     * Indicates ReleaseDefinition created using REST API.
     */
    ReleaseDefinitionSource[ReleaseDefinitionSource["RestApi"] = 1] = "RestApi";
    /**
     * Indicates ReleaseDefinition created using UI.
     */
    ReleaseDefinitionSource[ReleaseDefinitionSource["UserInterface"] = 2] = "UserInterface";
    /**
     * Indicates ReleaseDefinition created from Ibiza.
     */
    ReleaseDefinitionSource[ReleaseDefinitionSource["Ibiza"] = 4] = "Ibiza";
    /**
     * Indicates ReleaseDefinition created from PortalExtension API.
     */
    ReleaseDefinitionSource[ReleaseDefinitionSource["PortalExtensionApi"] = 8] = "PortalExtensionApi";
})(ReleaseDefinitionSource = exports.ReleaseDefinitionSource || (exports.ReleaseDefinitionSource = {}));
var ReleaseEnvironmentExpands;
(function (ReleaseEnvironmentExpands) {
    /**
     * Return top level properties of object.
     */
    ReleaseEnvironmentExpands[ReleaseEnvironmentExpands["None"] = 0] = "None";
    /**
     * Expand environment with tasks.
     */
    ReleaseEnvironmentExpands[ReleaseEnvironmentExpands["Tasks"] = 1] = "Tasks";
})(ReleaseEnvironmentExpands = exports.ReleaseEnvironmentExpands || (exports.ReleaseEnvironmentExpands = {}));
var ReleaseExpands;
(function (ReleaseExpands) {
    ReleaseExpands[ReleaseExpands["None"] = 0] = "None";
    ReleaseExpands[ReleaseExpands["Environments"] = 2] = "Environments";
    ReleaseExpands[ReleaseExpands["Artifacts"] = 4] = "Artifacts";
    ReleaseExpands[ReleaseExpands["Approvals"] = 8] = "Approvals";
    ReleaseExpands[ReleaseExpands["ManualInterventions"] = 16] = "ManualInterventions";
    ReleaseExpands[ReleaseExpands["Variables"] = 32] = "Variables";
    ReleaseExpands[ReleaseExpands["Tags"] = 64] = "Tags";
})(ReleaseExpands = exports.ReleaseExpands || (exports.ReleaseExpands = {}));
var ReleaseQueryOrder;
(function (ReleaseQueryOrder) {
    /**
     * Return results in descending order.
     */
    ReleaseQueryOrder[ReleaseQueryOrder["Descending"] = 0] = "Descending";
    /**
     * Return results in ascending order.
     */
    ReleaseQueryOrder[ReleaseQueryOrder["Ascending"] = 1] = "Ascending";
})(ReleaseQueryOrder = exports.ReleaseQueryOrder || (exports.ReleaseQueryOrder = {}));
var ReleaseReason;
(function (ReleaseReason) {
    /**
     * Indicates the release triggered reason not set.
     */
    ReleaseReason[ReleaseReason["None"] = 0] = "None";
    /**
     * Indicates the release triggered manually.
     */
    ReleaseReason[ReleaseReason["Manual"] = 1] = "Manual";
    /**
     * Indicates the release triggered by continuous integration.
     */
    ReleaseReason[ReleaseReason["ContinuousIntegration"] = 2] = "ContinuousIntegration";
    /**
     * Indicates the release triggered by schedule.
     */
    ReleaseReason[ReleaseReason["Schedule"] = 3] = "Schedule";
    /**
     * Indicates the release triggered by PullRequest.
     */
    ReleaseReason[ReleaseReason["PullRequest"] = 4] = "PullRequest";
})(ReleaseReason = exports.ReleaseReason || (exports.ReleaseReason = {}));
var ReleaseStatus;
(function (ReleaseStatus) {
    /**
     * Release status not set.
     */
    ReleaseStatus[ReleaseStatus["Undefined"] = 0] = "Undefined";
    /**
     * Release is in draft state.
     */
    ReleaseStatus[ReleaseStatus["Draft"] = 1] = "Draft";
    /**
     * Release status is in active.
     */
    ReleaseStatus[ReleaseStatus["Active"] = 2] = "Active";
    /**
     * Release status is in abandoned.
     */
    ReleaseStatus[ReleaseStatus["Abandoned"] = 4] = "Abandoned";
})(ReleaseStatus = exports.ReleaseStatus || (exports.ReleaseStatus = {}));
var ReleaseTriggerType;
(function (ReleaseTriggerType) {
    /**
     * Release trigger type not set.
     */
    ReleaseTriggerType[ReleaseTriggerType["Undefined"] = 0] = "Undefined";
    /**
     * Artifact based release trigger.
     */
    ReleaseTriggerType[ReleaseTriggerType["ArtifactSource"] = 1] = "ArtifactSource";
    /**
     * Schedule based release trigger.
     */
    ReleaseTriggerType[ReleaseTriggerType["Schedule"] = 2] = "Schedule";
    /**
     * Source repository based release trigger.
     */
    ReleaseTriggerType[ReleaseTriggerType["SourceRepo"] = 3] = "SourceRepo";
    /**
     * Container image based release trigger.
     */
    ReleaseTriggerType[ReleaseTriggerType["ContainerImage"] = 4] = "ContainerImage";
    /**
     * Package based release trigger.
     */
    ReleaseTriggerType[ReleaseTriggerType["Package"] = 5] = "Package";
    /**
     * Pull request based release trigger.
     */
    ReleaseTriggerType[ReleaseTriggerType["PullRequest"] = 6] = "PullRequest";
})(ReleaseTriggerType = exports.ReleaseTriggerType || (exports.ReleaseTriggerType = {}));
var ScheduleDays;
(function (ScheduleDays) {
    /**
     * Scheduled day not set.
     */
    ScheduleDays[ScheduleDays["None"] = 0] = "None";
    /**
     * Scheduled on Monday.
     */
    ScheduleDays[ScheduleDays["Monday"] = 1] = "Monday";
    /**
     * Scheduled on Tuesday.
     */
    ScheduleDays[ScheduleDays["Tuesday"] = 2] = "Tuesday";
    /**
     * Scheduled on Wednesday.
     */
    ScheduleDays[ScheduleDays["Wednesday"] = 4] = "Wednesday";
    /**
     * Scheduled on Thursday.
     */
    ScheduleDays[ScheduleDays["Thursday"] = 8] = "Thursday";
    /**
     * Scheduled on Friday.
     */
    ScheduleDays[ScheduleDays["Friday"] = 16] = "Friday";
    /**
     * Scheduled on Saturday.
     */
    ScheduleDays[ScheduleDays["Saturday"] = 32] = "Saturday";
    /**
     * Scheduled on Sunday.
     */
    ScheduleDays[ScheduleDays["Sunday"] = 64] = "Sunday";
    /**
     * Scheduled on all the days in week.
     */
    ScheduleDays[ScheduleDays["All"] = 127] = "All";
})(ScheduleDays = exports.ScheduleDays || (exports.ScheduleDays = {}));
var SenderType;
(function (SenderType) {
    SenderType[SenderType["ServiceAccount"] = 1] = "ServiceAccount";
    SenderType[SenderType["RequestingUser"] = 2] = "RequestingUser";
})(SenderType = exports.SenderType || (exports.SenderType = {}));
var SingleReleaseExpands;
(function (SingleReleaseExpands) {
    /**
     * Return top level properties of object.
     */
    SingleReleaseExpands[SingleReleaseExpands["None"] = 0] = "None";
    /**
     * Expand release with tasks.
     */
    SingleReleaseExpands[SingleReleaseExpands["Tasks"] = 1] = "Tasks";
})(SingleReleaseExpands = exports.SingleReleaseExpands || (exports.SingleReleaseExpands = {}));
var TaskStatus;
(function (TaskStatus) {
    /**
     * The task does not have the status set.
     */
    TaskStatus[TaskStatus["Unknown"] = 0] = "Unknown";
    /**
     * The task is in pending status.
     */
    TaskStatus[TaskStatus["Pending"] = 1] = "Pending";
    /**
     * The task is currently in progress.
     */
    TaskStatus[TaskStatus["InProgress"] = 2] = "InProgress";
    /**
     * The task completed successfully.
     */
    TaskStatus[TaskStatus["Success"] = 3] = "Success";
    /**
     * The task execution failed.
     */
    TaskStatus[TaskStatus["Failure"] = 4] = "Failure";
    /**
     * The task execution canceled.
     */
    TaskStatus[TaskStatus["Canceled"] = 5] = "Canceled";
    /**
     * The task execution skipped.
     */
    TaskStatus[TaskStatus["Skipped"] = 6] = "Skipped";
    /**
     * The task completed successfully.
     */
    TaskStatus[TaskStatus["Succeeded"] = 7] = "Succeeded";
    /**
     * The task execution failed.
     */
    TaskStatus[TaskStatus["Failed"] = 8] = "Failed";
    /**
     * The task execution partially succeeded.
     */
    TaskStatus[TaskStatus["PartiallySucceeded"] = 9] = "PartiallySucceeded";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
var VariableGroupActionFilter;
(function (VariableGroupActionFilter) {
    VariableGroupActionFilter[VariableGroupActionFilter["None"] = 0] = "None";
    VariableGroupActionFilter[VariableGroupActionFilter["Manage"] = 2] = "Manage";
    VariableGroupActionFilter[VariableGroupActionFilter["Use"] = 16] = "Use";
})(VariableGroupActionFilter = exports.VariableGroupActionFilter || (exports.VariableGroupActionFilter = {}));
var YamlFileSourceTypes;
(function (YamlFileSourceTypes) {
    YamlFileSourceTypes[YamlFileSourceTypes["None"] = 0] = "None";
    YamlFileSourceTypes[YamlFileSourceTypes["TFSGit"] = 1] = "TFSGit";
})(YamlFileSourceTypes = exports.YamlFileSourceTypes || (exports.YamlFileSourceTypes = {}));
exports.TypeInfo = {
    AgentArtifactDefinition: {},
    AgentArtifactType: {
        enumValues: {
            "xamlBuild": 0,
            "build": 1,
            "jenkins": 2,
            "fileShare": 3,
            "nuget": 4,
            "tfsOnPrem": 5,
            "gitHub": 6,
            "tfGit": 7,
            "externalTfsBuild": 8,
            "custom": 9,
            "tfvc": 10
        }
    },
    AgentBasedDeployPhase: {},
    AgentDeploymentInput: {},
    ApprovalExecutionOrder: {
        enumValues: {
            "beforeGates": 1,
            "afterSuccessfulGates": 2,
            "afterGatesAlways": 4
        }
    },
    ApprovalFilters: {
        enumValues: {
            "none": 0,
            "manualApprovals": 1,
            "automatedApprovals": 2,
            "approvalSnapshots": 4,
            "all": 7
        }
    },
    ApprovalOptions: {},
    ApprovalStatus: {
        enumValues: {
            "undefined": 0,
            "pending": 1,
            "approved": 2,
            "rejected": 4,
            "reassigned": 6,
            "canceled": 7,
            "skipped": 8
        }
    },
    ApprovalType: {
        enumValues: {
            "undefined": 0,
            "preDeploy": 1,
            "postDeploy": 2,
            "all": 3
        }
    },
    ArtifactContributionDefinition: {},
    ArtifactMetadata: {},
    ArtifactSourceTrigger: {},
    ArtifactTypeDefinition: {},
    ArtifactVersion: {},
    ArtifactVersionQueryResult: {},
    AuditAction: {
        enumValues: {
            "add": 1,
            "update": 2,
            "delete": 3,
            "undelete": 4
        }
    },
    AuthorizationHeaderFor: {
        enumValues: {
            "revalidateApproverIdentity": 0,
            "onBehalfOf": 1
        }
    },
    AutoTriggerIssue: {},
    AzureKeyVaultVariableGroupProviderData: {},
    AzureKeyVaultVariableValue: {},
    BuildVersion: {},
    Change: {},
    CodeRepositoryReference: {},
    Condition: {},
    ConditionType: {
        enumValues: {
            "undefined": 0,
            "event": 1,
            "environmentState": 2,
            "artifact": 4
        }
    },
    ContainerImageTrigger: {},
    ContinuousDeploymentTriggerIssue: {},
    Deployment: {},
    DeploymentApprovalCompletedEvent: {},
    DeploymentApprovalPendingEvent: {},
    DeploymentAttempt: {},
    DeploymentAuthorizationInfo: {},
    DeploymentAuthorizationOwner: {
        enumValues: {
            "automatic": 0,
            "deploymentSubmitter": 1,
            "firstPreDeploymentApprover": 2
        }
    },
    DeploymentCompletedEvent: {},
    DeploymentExpands: {
        enumValues: {
            "all": 0,
            "deploymentOnly": 1,
            "approvals": 2,
            "artifacts": 4
        }
    },
    DeploymentJob: {},
    DeploymentManualInterventionPendingEvent: {},
    DeploymentOperationStatus: {
        enumValues: {
            "undefined": 0,
            "queued": 1,
            "scheduled": 2,
            "pending": 4,
            "approved": 8,
            "rejected": 16,
            "deferred": 32,
            "queuedForAgent": 64,
            "phaseInProgress": 128,
            "phaseSucceeded": 256,
            "phasePartiallySucceeded": 512,
            "phaseFailed": 1024,
            "canceled": 2048,
            "phaseCanceled": 4096,
            "manualInterventionPending": 8192,
            "queuedForPipeline": 16384,
            "cancelling": 32768,
            "evaluatingGates": 65536,
            "gateFailed": 131072,
            "all": 258047
        }
    },
    DeploymentQueryParameters: {},
    DeploymentReason: {
        enumValues: {
            "none": 0,
            "manual": 1,
            "automated": 2,
            "scheduled": 4,
            "redeployTrigger": 8
        }
    },
    DeploymentsQueryType: {
        enumValues: {
            "regular": 1,
            "failingSince": 2
        }
    },
    DeploymentStartedEvent: {},
    DeploymentStatus: {
        enumValues: {
            "undefined": 0,
            "notDeployed": 1,
            "inProgress": 2,
            "succeeded": 4,
            "partiallySucceeded": 8,
            "failed": 16,
            "all": 31
        }
    },
    DeployPhase: {},
    DeployPhaseStatus: {
        enumValues: {
            "undefined": 0,
            "notStarted": 1,
            "inProgress": 2,
            "partiallySucceeded": 4,
            "succeeded": 8,
            "failed": 16,
            "canceled": 32,
            "skipped": 64,
            "cancelling": 128
        }
    },
    DeployPhaseTypes: {
        enumValues: {
            "undefined": 0,
            "agentBasedDeployment": 1,
            "runOnServer": 2,
            "machineGroupBasedDeployment": 4,
            "deploymentGates": 8
        }
    },
    EnvironmentStatus: {
        enumValues: {
            "undefined": 0,
            "notStarted": 1,
            "inProgress": 2,
            "succeeded": 4,
            "canceled": 8,
            "rejected": 16,
            "queued": 32,
            "scheduled": 64,
            "partiallySucceeded": 128
        }
    },
    EnvironmentTrigger: {},
    EnvironmentTriggerType: {
        enumValues: {
            "undefined": 0,
            "deploymentGroupRedeploy": 1,
            "rollbackRedeploy": 2
        }
    },
    ExecutionInput: {},
    Folder: {},
    FolderPathQueryOrder: {
        enumValues: {
            "none": 0,
            "ascending": 1,
            "descending": 2
        }
    },
    GatesDeployPhase: {},
    GateStatus: {
        enumValues: {
            "none": 0,
            "pending": 1,
            "inProgress": 2,
            "succeeded": 4,
            "failed": 8,
            "canceled": 16
        }
    },
    IgnoredGate: {},
    IssueSource: {
        enumValues: {
            "none": 0,
            "user": 1,
            "system": 2
        }
    },
    MachineGroupBasedDeployPhase: {},
    MailMessage: {},
    MailSectionType: {
        enumValues: {
            "details": 0,
            "environments": 1,
            "issues": 2,
            "testResults": 3,
            "workItems": 4,
            "releaseInfo": 5
        }
    },
    ManualIntervention: {},
    ManualInterventionStatus: {
        enumValues: {
            "unknown": 0,
            "pending": 1,
            "rejected": 2,
            "approved": 4,
            "canceled": 8
        }
    },
    ManualInterventionUpdateMetadata: {},
    MultiConfigInput: {},
    MultiMachineInput: {},
    PackageTrigger: {},
    ParallelExecutionInputBase: {},
    ParallelExecutionTypes: {
        enumValues: {
            "none": 0,
            "multiConfiguration": 1,
            "multiMachine": 2
        }
    },
    PipelineProcess: {},
    PipelineProcessTypes: {
        enumValues: {
            "designer": 1,
            "yaml": 2
        }
    },
    PropertySelector: {},
    PropertySelectorType: {
        enumValues: {
            "inclusion": 0,
            "exclusion": 1
        }
    },
    PullRequestConfiguration: {},
    PullRequestSystemType: {
        enumValues: {
            "none": 0,
            "tfsGit": 1,
            "gitHub": 2
        }
    },
    PullRequestTrigger: {},
    Release: {},
    ReleaseAbandonedEvent: {},
    ReleaseApproval: {},
    ReleaseApprovalHistory: {},
    ReleaseApprovalPendingEvent: {},
    ReleaseCondition: {},
    ReleaseCreatedEvent: {},
    ReleaseDefinition: {},
    ReleaseDefinitionApprovals: {},
    ReleaseDefinitionEnvironment: {},
    ReleaseDefinitionEnvironmentTemplate: {},
    ReleaseDefinitionExpands: {
        enumValues: {
            "none": 0,
            "environments": 2,
            "artifacts": 4,
            "triggers": 8,
            "variables": 16,
            "tags": 32,
            "lastRelease": 64
        }
    },
    ReleaseDefinitionQueryOrder: {
        enumValues: {
            "idAscending": 0,
            "idDescending": 1,
            "nameAscending": 2,
            "nameDescending": 3
        }
    },
    ReleaseDefinitionRevision: {},
    ReleaseDefinitionSource: {
        enumValues: {
            "undefined": 0,
            "restApi": 1,
            "userInterface": 2,
            "ibiza": 4,
            "portalExtensionApi": 8
        }
    },
    ReleaseDefinitionSummary: {},
    ReleaseDeployPhase: {},
    ReleaseEnvironment: {},
    ReleaseEnvironmentCompletedEvent: {},
    ReleaseEnvironmentExpands: {
        enumValues: {
            "none": 0,
            "tasks": 1
        }
    },
    ReleaseEnvironmentStatusUpdatedEvent: {},
    ReleaseEnvironmentUpdateMetadata: {},
    ReleaseExpands: {
        enumValues: {
            "none": 0,
            "environments": 2,
            "artifacts": 4,
            "approvals": 8,
            "manualInterventions": 16,
            "variables": 32,
            "tags": 64
        }
    },
    ReleaseGates: {},
    ReleaseGatesPhase: {},
    ReleaseNotCreatedEvent: {},
    ReleaseQueryOrder: {
        enumValues: {
            "descending": 0,
            "ascending": 1
        }
    },
    ReleaseReason: {
        enumValues: {
            "none": 0,
            "manual": 1,
            "continuousIntegration": 2,
            "schedule": 3,
            "pullRequest": 4
        }
    },
    ReleaseReference: {},
    ReleaseRevision: {},
    ReleaseSchedule: {},
    ReleaseStartMetadata: {},
    ReleaseStatus: {
        enumValues: {
            "undefined": 0,
            "draft": 1,
            "active": 2,
            "abandoned": 4
        }
    },
    ReleaseTask: {},
    ReleaseTaskAttachment: {},
    ReleaseTasksUpdatedEvent: {},
    ReleaseTriggerBase: {},
    ReleaseTriggerType: {
        enumValues: {
            "undefined": 0,
            "artifactSource": 1,
            "schedule": 2,
            "sourceRepo": 3,
            "containerImage": 4,
            "package": 5,
            "pullRequest": 6
        }
    },
    ReleaseUpdatedEvent: {},
    ReleaseUpdateMetadata: {},
    RunOnServerDeployPhase: {},
    ScheduleDays: {
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
    ScheduledReleaseTrigger: {},
    SenderType: {
        enumValues: {
            "serviceAccount": 1,
            "requestingUser": 2
        }
    },
    ServerDeploymentInput: {},
    SingleReleaseExpands: {
        enumValues: {
            "none": 0,
            "tasks": 1
        }
    },
    SourcePullRequestVersion: {},
    SourceRepoTrigger: {},
    SummaryMailSection: {},
    TaskStatus: {
        enumValues: {
            "unknown": 0,
            "pending": 1,
            "inProgress": 2,
            "success": 3,
            "failure": 4,
            "canceled": 5,
            "skipped": 6,
            "succeeded": 7,
            "failed": 8,
            "partiallySucceeded": 9
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
    YamlFileSource: {},
    YamlFileSourceTypes: {
        enumValues: {
            "none": 0,
            "tfsGit": 1
        }
    },
    YamlPipelineProcess: {},
};
exports.TypeInfo.AgentArtifactDefinition.fields = {
    artifactType: {
        enumType: exports.TypeInfo.AgentArtifactType
    }
};
exports.TypeInfo.AgentBasedDeployPhase.fields = {
    deploymentInput: {
        typeInfo: exports.TypeInfo.AgentDeploymentInput
    },
    phaseType: {
        enumType: exports.TypeInfo.DeployPhaseTypes
    }
};
exports.TypeInfo.AgentDeploymentInput.fields = {
    parallelExecution: {
        typeInfo: exports.TypeInfo.ExecutionInput
    }
};
exports.TypeInfo.ApprovalOptions.fields = {
    executionOrder: {
        enumType: exports.TypeInfo.ApprovalExecutionOrder
    }
};
exports.TypeInfo.ArtifactContributionDefinition.fields = {
    inputDescriptors: {
        isArray: true,
        typeInfo: FormInputInterfaces.TypeInfo.InputDescriptor
    }
};
exports.TypeInfo.ArtifactMetadata.fields = {
    instanceReference: {
        typeInfo: exports.TypeInfo.BuildVersion
    }
};
exports.TypeInfo.ArtifactSourceTrigger.fields = {
    triggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.ArtifactTypeDefinition.fields = {
    inputDescriptors: {
        isArray: true,
        typeInfo: FormInputInterfaces.TypeInfo.InputDescriptor
    }
};
exports.TypeInfo.ArtifactVersion.fields = {
    defaultVersion: {
        typeInfo: exports.TypeInfo.BuildVersion
    },
    versions: {
        isArray: true,
        typeInfo: exports.TypeInfo.BuildVersion
    }
};
exports.TypeInfo.ArtifactVersionQueryResult.fields = {
    artifactVersions: {
        isArray: true,
        typeInfo: exports.TypeInfo.ArtifactVersion
    }
};
exports.TypeInfo.AutoTriggerIssue.fields = {
    issueSource: {
        enumType: exports.TypeInfo.IssueSource
    },
    releaseTriggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
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
exports.TypeInfo.BuildVersion.fields = {
    sourcePullRequestVersion: {
        typeInfo: exports.TypeInfo.SourcePullRequestVersion
    }
};
exports.TypeInfo.Change.fields = {
    timestamp: {
        isDate: true,
    }
};
exports.TypeInfo.CodeRepositoryReference.fields = {
    systemType: {
        enumType: exports.TypeInfo.PullRequestSystemType
    }
};
exports.TypeInfo.Condition.fields = {
    conditionType: {
        enumType: exports.TypeInfo.ConditionType
    }
};
exports.TypeInfo.ContainerImageTrigger.fields = {
    triggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.ContinuousDeploymentTriggerIssue.fields = {
    issueSource: {
        enumType: exports.TypeInfo.IssueSource
    },
    releaseTriggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.Deployment.fields = {
    completedOn: {
        isDate: true,
    },
    conditions: {
        isArray: true,
        typeInfo: exports.TypeInfo.Condition
    },
    deploymentStatus: {
        enumType: exports.TypeInfo.DeploymentStatus
    },
    lastModifiedOn: {
        isDate: true,
    },
    operationStatus: {
        enumType: exports.TypeInfo.DeploymentOperationStatus
    },
    postDeployApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    preDeployApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    queuedOn: {
        isDate: true,
    },
    reason: {
        enumType: exports.TypeInfo.DeploymentReason
    },
    release: {
        typeInfo: exports.TypeInfo.ReleaseReference
    },
    scheduledDeploymentTime: {
        isDate: true,
    },
    startedOn: {
        isDate: true,
    }
};
exports.TypeInfo.DeploymentApprovalCompletedEvent.fields = {
    approval: {
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    release: {
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.DeploymentApprovalPendingEvent.fields = {
    approval: {
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    approvalOptions: {
        typeInfo: exports.TypeInfo.ApprovalOptions
    },
    completedApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    deployment: {
        typeInfo: exports.TypeInfo.Deployment
    },
    pendingApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    release: {
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.DeploymentAttempt.fields = {
    job: {
        typeInfo: exports.TypeInfo.ReleaseTask
    },
    lastModifiedOn: {
        isDate: true,
    },
    operationStatus: {
        enumType: exports.TypeInfo.DeploymentOperationStatus
    },
    postDeploymentGates: {
        typeInfo: exports.TypeInfo.ReleaseGates
    },
    preDeploymentGates: {
        typeInfo: exports.TypeInfo.ReleaseGates
    },
    queuedOn: {
        isDate: true,
    },
    reason: {
        enumType: exports.TypeInfo.DeploymentReason
    },
    releaseDeployPhases: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseDeployPhase
    },
    status: {
        enumType: exports.TypeInfo.DeploymentStatus
    },
    tasks: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseTask
    }
};
exports.TypeInfo.DeploymentAuthorizationInfo.fields = {
    authorizationHeaderFor: {
        enumType: exports.TypeInfo.AuthorizationHeaderFor
    }
};
exports.TypeInfo.DeploymentCompletedEvent.fields = {
    deployment: {
        typeInfo: exports.TypeInfo.Deployment
    },
    environment: {
        typeInfo: exports.TypeInfo.ReleaseEnvironment
    }
};
exports.TypeInfo.DeploymentJob.fields = {
    job: {
        typeInfo: exports.TypeInfo.ReleaseTask
    },
    tasks: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseTask
    }
};
exports.TypeInfo.DeploymentManualInterventionPendingEvent.fields = {
    approval: {
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    deployment: {
        typeInfo: exports.TypeInfo.Deployment
    },
    manualIntervention: {
        typeInfo: exports.TypeInfo.ManualIntervention
    },
    release: {
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.DeploymentQueryParameters.fields = {
    deploymentStatus: {
        enumType: exports.TypeInfo.DeploymentStatus
    },
    expands: {
        enumType: exports.TypeInfo.DeploymentExpands
    },
    maxModifiedTime: {
        isDate: true,
    },
    minModifiedTime: {
        isDate: true,
    },
    operationStatus: {
        enumType: exports.TypeInfo.DeploymentOperationStatus
    },
    queryOrder: {
        enumType: exports.TypeInfo.ReleaseQueryOrder
    },
    queryType: {
        enumType: exports.TypeInfo.DeploymentsQueryType
    }
};
exports.TypeInfo.DeploymentStartedEvent.fields = {
    environment: {
        typeInfo: exports.TypeInfo.ReleaseEnvironment
    },
    release: {
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.DeployPhase.fields = {
    phaseType: {
        enumType: exports.TypeInfo.DeployPhaseTypes
    }
};
exports.TypeInfo.EnvironmentTrigger.fields = {
    triggerType: {
        enumType: exports.TypeInfo.EnvironmentTriggerType
    }
};
exports.TypeInfo.ExecutionInput.fields = {
    parallelExecutionType: {
        enumType: exports.TypeInfo.ParallelExecutionTypes
    }
};
exports.TypeInfo.Folder.fields = {
    createdOn: {
        isDate: true,
    },
    lastChangedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GatesDeployPhase.fields = {
    phaseType: {
        enumType: exports.TypeInfo.DeployPhaseTypes
    }
};
exports.TypeInfo.IgnoredGate.fields = {
    lastModifiedOn: {
        isDate: true,
    }
};
exports.TypeInfo.MachineGroupBasedDeployPhase.fields = {
    phaseType: {
        enumType: exports.TypeInfo.DeployPhaseTypes
    }
};
exports.TypeInfo.MailMessage.fields = {
    replyBy: {
        isDate: true,
    },
    sections: {
        isArray: true,
        enumType: exports.TypeInfo.MailSectionType
    },
    senderType: {
        enumType: exports.TypeInfo.SenderType
    }
};
exports.TypeInfo.ManualIntervention.fields = {
    createdOn: {
        isDate: true,
    },
    modifiedOn: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.ManualInterventionStatus
    }
};
exports.TypeInfo.ManualInterventionUpdateMetadata.fields = {
    status: {
        enumType: exports.TypeInfo.ManualInterventionStatus
    }
};
exports.TypeInfo.MultiConfigInput.fields = {
    parallelExecutionType: {
        enumType: exports.TypeInfo.ParallelExecutionTypes
    }
};
exports.TypeInfo.MultiMachineInput.fields = {
    parallelExecutionType: {
        enumType: exports.TypeInfo.ParallelExecutionTypes
    }
};
exports.TypeInfo.PackageTrigger.fields = {
    triggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.ParallelExecutionInputBase.fields = {
    parallelExecutionType: {
        enumType: exports.TypeInfo.ParallelExecutionTypes
    }
};
exports.TypeInfo.PipelineProcess.fields = {
    type: {
        enumType: exports.TypeInfo.PipelineProcessTypes
    }
};
exports.TypeInfo.PropertySelector.fields = {
    selectorType: {
        enumType: exports.TypeInfo.PropertySelectorType
    }
};
exports.TypeInfo.PullRequestConfiguration.fields = {
    codeRepositoryReference: {
        typeInfo: exports.TypeInfo.CodeRepositoryReference
    }
};
exports.TypeInfo.PullRequestTrigger.fields = {
    pullRequestConfiguration: {
        typeInfo: exports.TypeInfo.PullRequestConfiguration
    },
    triggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.Release.fields = {
    createdOn: {
        isDate: true,
    },
    environments: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseEnvironment
    },
    modifiedOn: {
        isDate: true,
    },
    reason: {
        enumType: exports.TypeInfo.ReleaseReason
    },
    status: {
        enumType: exports.TypeInfo.ReleaseStatus
    },
    variableGroups: {
        isArray: true,
        typeInfo: exports.TypeInfo.VariableGroup
    }
};
exports.TypeInfo.ReleaseAbandonedEvent.fields = {
    release: {
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.ReleaseApproval.fields = {
    approvalType: {
        enumType: exports.TypeInfo.ApprovalType
    },
    createdOn: {
        isDate: true,
    },
    history: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApprovalHistory
    },
    modifiedOn: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.ApprovalStatus
    }
};
exports.TypeInfo.ReleaseApprovalHistory.fields = {
    createdOn: {
        isDate: true,
    },
    modifiedOn: {
        isDate: true,
    }
};
exports.TypeInfo.ReleaseApprovalPendingEvent.fields = {
    approval: {
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    approvalOptions: {
        typeInfo: exports.TypeInfo.ApprovalOptions
    },
    completedApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    deployment: {
        typeInfo: exports.TypeInfo.Deployment
    },
    environments: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseEnvironment
    },
    pendingApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    }
};
exports.TypeInfo.ReleaseCondition.fields = {
    conditionType: {
        enumType: exports.TypeInfo.ConditionType
    }
};
exports.TypeInfo.ReleaseCreatedEvent.fields = {
    release: {
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.ReleaseDefinition.fields = {
    createdOn: {
        isDate: true,
    },
    environments: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseDefinitionEnvironment
    },
    lastRelease: {
        typeInfo: exports.TypeInfo.ReleaseReference
    },
    modifiedOn: {
        isDate: true,
    },
    pipelineProcess: {
        typeInfo: exports.TypeInfo.PipelineProcess
    },
    source: {
        enumType: exports.TypeInfo.ReleaseDefinitionSource
    },
    triggers: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseTriggerBase
    }
};
exports.TypeInfo.ReleaseDefinitionApprovals.fields = {
    approvalOptions: {
        typeInfo: exports.TypeInfo.ApprovalOptions
    }
};
exports.TypeInfo.ReleaseDefinitionEnvironment.fields = {
    conditions: {
        isArray: true,
        typeInfo: exports.TypeInfo.Condition
    },
    deployPhases: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeployPhase
    },
    environmentTriggers: {
        isArray: true,
        typeInfo: exports.TypeInfo.EnvironmentTrigger
    },
    postDeployApprovals: {
        typeInfo: exports.TypeInfo.ReleaseDefinitionApprovals
    },
    preDeployApprovals: {
        typeInfo: exports.TypeInfo.ReleaseDefinitionApprovals
    },
    schedules: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseSchedule
    }
};
exports.TypeInfo.ReleaseDefinitionEnvironmentTemplate.fields = {
    environment: {
        typeInfo: exports.TypeInfo.ReleaseDefinitionEnvironment
    }
};
exports.TypeInfo.ReleaseDefinitionRevision.fields = {
    changedDate: {
        isDate: true,
    },
    changeType: {
        enumType: exports.TypeInfo.AuditAction
    }
};
exports.TypeInfo.ReleaseDefinitionSummary.fields = {
    releases: {
        isArray: true,
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.ReleaseDeployPhase.fields = {
    deploymentJobs: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentJob
    },
    manualInterventions: {
        isArray: true,
        typeInfo: exports.TypeInfo.ManualIntervention
    },
    phaseType: {
        enumType: exports.TypeInfo.DeployPhaseTypes
    },
    startedOn: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.DeployPhaseStatus
    }
};
exports.TypeInfo.ReleaseEnvironment.fields = {
    conditions: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseCondition
    },
    createdOn: {
        isDate: true,
    },
    deployPhasesSnapshot: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeployPhase
    },
    deploySteps: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentAttempt
    },
    modifiedOn: {
        isDate: true,
    },
    nextScheduledUtcTime: {
        isDate: true,
    },
    postApprovalsSnapshot: {
        typeInfo: exports.TypeInfo.ReleaseDefinitionApprovals
    },
    postDeployApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    preApprovalsSnapshot: {
        typeInfo: exports.TypeInfo.ReleaseDefinitionApprovals
    },
    preDeployApprovals: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseApproval
    },
    scheduledDeploymentTime: {
        isDate: true,
    },
    schedules: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseSchedule
    },
    status: {
        enumType: exports.TypeInfo.EnvironmentStatus
    },
    variableGroups: {
        isArray: true,
        typeInfo: exports.TypeInfo.VariableGroup
    }
};
exports.TypeInfo.ReleaseEnvironmentCompletedEvent.fields = {
    environment: {
        typeInfo: exports.TypeInfo.ReleaseEnvironment
    },
    reason: {
        enumType: exports.TypeInfo.DeploymentReason
    }
};
exports.TypeInfo.ReleaseEnvironmentStatusUpdatedEvent.fields = {
    environmentStatus: {
        enumType: exports.TypeInfo.EnvironmentStatus
    },
    latestDeploymentOperationStatus: {
        enumType: exports.TypeInfo.DeploymentOperationStatus
    },
    latestDeploymentStatus: {
        enumType: exports.TypeInfo.DeploymentStatus
    }
};
exports.TypeInfo.ReleaseEnvironmentUpdateMetadata.fields = {
    scheduledDeploymentTime: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.EnvironmentStatus
    }
};
exports.TypeInfo.ReleaseGates.fields = {
    deploymentJobs: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentJob
    },
    ignoredGates: {
        isArray: true,
        typeInfo: exports.TypeInfo.IgnoredGate
    },
    lastModifiedOn: {
        isDate: true,
    },
    stabilizationCompletedOn: {
        isDate: true,
    },
    startedOn: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.GateStatus
    },
    succeedingSince: {
        isDate: true,
    }
};
exports.TypeInfo.ReleaseGatesPhase.fields = {
    deploymentJobs: {
        isArray: true,
        typeInfo: exports.TypeInfo.DeploymentJob
    },
    ignoredGates: {
        isArray: true,
        typeInfo: exports.TypeInfo.IgnoredGate
    },
    manualInterventions: {
        isArray: true,
        typeInfo: exports.TypeInfo.ManualIntervention
    },
    phaseType: {
        enumType: exports.TypeInfo.DeployPhaseTypes
    },
    stabilizationCompletedOn: {
        isDate: true,
    },
    startedOn: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.DeployPhaseStatus
    },
    succeedingSince: {
        isDate: true,
    }
};
exports.TypeInfo.ReleaseNotCreatedEvent.fields = {
    releaseReason: {
        enumType: exports.TypeInfo.ReleaseReason
    }
};
exports.TypeInfo.ReleaseReference.fields = {
    createdOn: {
        isDate: true,
    },
    reason: {
        enumType: exports.TypeInfo.ReleaseReason
    }
};
exports.TypeInfo.ReleaseRevision.fields = {
    changedDate: {
        isDate: true,
    }
};
exports.TypeInfo.ReleaseSchedule.fields = {
    daysToRelease: {
        enumType: exports.TypeInfo.ScheduleDays
    }
};
exports.TypeInfo.ReleaseStartMetadata.fields = {
    artifacts: {
        isArray: true,
        typeInfo: exports.TypeInfo.ArtifactMetadata
    },
    reason: {
        enumType: exports.TypeInfo.ReleaseReason
    }
};
exports.TypeInfo.ReleaseTask.fields = {
    dateEnded: {
        isDate: true,
    },
    dateStarted: {
        isDate: true,
    },
    finishTime: {
        isDate: true,
    },
    startTime: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.TaskStatus
    }
};
exports.TypeInfo.ReleaseTaskAttachment.fields = {
    createdOn: {
        isDate: true,
    },
    modifiedOn: {
        isDate: true,
    }
};
exports.TypeInfo.ReleaseTasksUpdatedEvent.fields = {
    job: {
        typeInfo: exports.TypeInfo.ReleaseTask
    },
    tasks: {
        isArray: true,
        typeInfo: exports.TypeInfo.ReleaseTask
    }
};
exports.TypeInfo.ReleaseTriggerBase.fields = {
    triggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.ReleaseUpdatedEvent.fields = {
    release: {
        typeInfo: exports.TypeInfo.Release
    }
};
exports.TypeInfo.ReleaseUpdateMetadata.fields = {
    status: {
        enumType: exports.TypeInfo.ReleaseStatus
    }
};
exports.TypeInfo.RunOnServerDeployPhase.fields = {
    deploymentInput: {
        typeInfo: exports.TypeInfo.ServerDeploymentInput
    },
    phaseType: {
        enumType: exports.TypeInfo.DeployPhaseTypes
    }
};
exports.TypeInfo.ScheduledReleaseTrigger.fields = {
    schedule: {
        typeInfo: exports.TypeInfo.ReleaseSchedule
    },
    triggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.ServerDeploymentInput.fields = {
    parallelExecution: {
        typeInfo: exports.TypeInfo.ExecutionInput
    }
};
exports.TypeInfo.SourcePullRequestVersion.fields = {
    pullRequestMergedAt: {
        isDate: true,
    }
};
exports.TypeInfo.SourceRepoTrigger.fields = {
    triggerType: {
        enumType: exports.TypeInfo.ReleaseTriggerType
    }
};
exports.TypeInfo.SummaryMailSection.fields = {
    sectionType: {
        enumType: exports.TypeInfo.MailSectionType
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
exports.TypeInfo.YamlFileSource.fields = {
    type: {
        enumType: exports.TypeInfo.YamlFileSourceTypes
    }
};
exports.TypeInfo.YamlPipelineProcess.fields = {
    fileSource: {
        typeInfo: exports.TypeInfo.YamlFileSource
    },
    type: {
        enumType: exports.TypeInfo.PipelineProcessTypes
    }
};
