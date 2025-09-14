/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import TaskAgentInterfaces = require("./interfaces/TaskAgentInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
export interface ITaskApi extends basem.ClientApiBase {
    getPlanAttachments(scopeIdentifier: string, hubName: string, planId: string, type: string): Promise<TaskAgentInterfaces.TaskAttachment[]>;
    createAttachment(customHeaders: any, contentStream: NodeJS.ReadableStream, scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string): Promise<TaskAgentInterfaces.TaskAttachment>;
    createAttachmentFromArtifact(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string, artifactHash: string, length: number): Promise<TaskAgentInterfaces.TaskAttachment>;
    getAttachment(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string): Promise<TaskAgentInterfaces.TaskAttachment>;
    getAttachmentContent(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string): Promise<NodeJS.ReadableStream>;
    getAttachments(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string): Promise<TaskAgentInterfaces.TaskAttachment[]>;
    appendTimelineRecordFeed(lines: TaskAgentInterfaces.TimelineRecordFeedLinesWrapper, scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string): Promise<void>;
    getLines(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, stepId: string, endLine?: number, takeCount?: number, continuationToken?: string): Promise<TaskAgentInterfaces.TimelineRecordFeedLinesWrapper>;
    getJobInstance(scopeIdentifier: string, hubName: string, orchestrationId: string): Promise<TaskAgentInterfaces.TaskAgentJob>;
    appendLogContent(customHeaders: any, contentStream: NodeJS.ReadableStream, scopeIdentifier: string, hubName: string, planId: string, logId: number): Promise<TaskAgentInterfaces.TaskLog>;
    associateLog(scopeIdentifier: string, hubName: string, planId: string, logId: number, serializedBlobId: string, lineCount: number): Promise<TaskAgentInterfaces.TaskLog>;
    createLog(log: TaskAgentInterfaces.TaskLog, scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.TaskLog>;
    getLog(scopeIdentifier: string, hubName: string, planId: string, logId: number, startLine?: number, endLine?: number): Promise<string[]>;
    getLogs(scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.TaskLog[]>;
    getPlanGroupsQueueMetrics(scopeIdentifier: string, hubName: string): Promise<TaskAgentInterfaces.TaskOrchestrationPlanGroupsQueueMetrics[]>;
    createOidcToken(claims: {
        [key: string]: string;
    }, scopeIdentifier: string, hubName: string, planId: string, jobId: string, serviceConnectionId?: string): Promise<TaskAgentInterfaces.TaskHubOidcToken>;
    getQueuedPlanGroups(scopeIdentifier: string, hubName: string, statusFilter?: TaskAgentInterfaces.PlanGroupStatus, count?: number): Promise<TaskAgentInterfaces.TaskOrchestrationQueuedPlanGroup[]>;
    getQueuedPlanGroup(scopeIdentifier: string, hubName: string, planGroup: string): Promise<TaskAgentInterfaces.TaskOrchestrationQueuedPlanGroup>;
    getPlan(scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.TaskOrchestrationPlan>;
    getRecords(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, changeId?: number): Promise<TaskAgentInterfaces.TimelineRecord[]>;
    updateRecords(records: VSSInterfaces.VssJsonCollectionWrapperV<TaskAgentInterfaces.TimelineRecord[]>, scopeIdentifier: string, hubName: string, planId: string, timelineId: string): Promise<TaskAgentInterfaces.TimelineRecord[]>;
    createTimeline(timeline: TaskAgentInterfaces.Timeline, scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.Timeline>;
    deleteTimeline(scopeIdentifier: string, hubName: string, planId: string, timelineId: string): Promise<void>;
    getTimeline(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, changeId?: number, includeRecords?: boolean): Promise<TaskAgentInterfaces.Timeline>;
    getTimelines(scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.Timeline[]>;
}
export declare class TaskApi extends basem.ClientApiBase implements ITaskApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} type
     */
    getPlanAttachments(scopeIdentifier: string, hubName: string, planId: string, type: string): Promise<TaskAgentInterfaces.TaskAttachment[]>;
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
    createAttachment(customHeaders: any, contentStream: NodeJS.ReadableStream, scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string): Promise<TaskAgentInterfaces.TaskAttachment>;
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
    createAttachmentFromArtifact(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string, artifactHash: string, length: number): Promise<TaskAgentInterfaces.TaskAttachment>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     * @param {string} name
     */
    getAttachment(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string): Promise<TaskAgentInterfaces.TaskAttachment>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     * @param {string} name
     */
    getAttachmentContent(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string, name: string): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {string} recordId
     * @param {string} type
     */
    getAttachments(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, type: string): Promise<TaskAgentInterfaces.TaskAttachment[]>;
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
    appendTimelineRecordFeed(lines: TaskAgentInterfaces.TimelineRecordFeedLinesWrapper, scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string): Promise<void>;
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
    getLines(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, recordId: string, stepId: string, endLine?: number, takeCount?: number, continuationToken?: string): Promise<TaskAgentInterfaces.TimelineRecordFeedLinesWrapper>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} orchestrationId
     */
    getJobInstance(scopeIdentifier: string, hubName: string, orchestrationId: string): Promise<TaskAgentInterfaces.TaskAgentJob>;
    /**
     * Append a log to a task's log. The log should be sent in the body of the request as a TaskLog object stream.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId - The ID of the plan.
     * @param {number} logId - The ID of the log.
     */
    appendLogContent(customHeaders: any, contentStream: NodeJS.ReadableStream, scopeIdentifier: string, hubName: string, planId: string, logId: number): Promise<TaskAgentInterfaces.TaskLog>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {number} logId
     * @param {string} serializedBlobId
     * @param {number} lineCount
     */
    associateLog(scopeIdentifier: string, hubName: string, planId: string, logId: number, serializedBlobId: string, lineCount: number): Promise<TaskAgentInterfaces.TaskLog>;
    /**
     * Create a log and connect it to a pipeline run's execution plan.
     *
     * @param {TaskAgentInterfaces.TaskLog} log - An object that contains information about log's path.
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId - The ID of the plan.
     */
    createLog(log: TaskAgentInterfaces.TaskLog, scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.TaskLog>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {number} logId
     * @param {number} startLine
     * @param {number} endLine
     */
    getLog(scopeIdentifier: string, hubName: string, planId: string, logId: number, startLine?: number, endLine?: number): Promise<string[]>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    getLogs(scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.TaskLog[]>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     */
    getPlanGroupsQueueMetrics(scopeIdentifier: string, hubName: string): Promise<TaskAgentInterfaces.TaskOrchestrationPlanGroupsQueueMetrics[]>;
    /**
     * @param {{ [key: string] : string; }} claims
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} jobId
     * @param {string} serviceConnectionId
     */
    createOidcToken(claims: {
        [key: string]: string;
    }, scopeIdentifier: string, hubName: string, planId: string, jobId: string, serviceConnectionId?: string): Promise<TaskAgentInterfaces.TaskHubOidcToken>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {TaskAgentInterfaces.PlanGroupStatus} statusFilter
     * @param {number} count
     */
    getQueuedPlanGroups(scopeIdentifier: string, hubName: string, statusFilter?: TaskAgentInterfaces.PlanGroupStatus, count?: number): Promise<TaskAgentInterfaces.TaskOrchestrationQueuedPlanGroup[]>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planGroup
     */
    getQueuedPlanGroup(scopeIdentifier: string, hubName: string, planGroup: string): Promise<TaskAgentInterfaces.TaskOrchestrationQueuedPlanGroup>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    getPlan(scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.TaskOrchestrationPlan>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {number} changeId
     */
    getRecords(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, changeId?: number): Promise<TaskAgentInterfaces.TimelineRecord[]>;
    /**
     * Update timeline records if they already exist, otherwise create new ones for the same timeline.
     *
     * @param {VSSInterfaces.VssJsonCollectionWrapperV<TaskAgentInterfaces.TimelineRecord[]>} records - The array of timeline records to be updated.
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId - The ID of the plan.
     * @param {string} timelineId - The ID of the timeline.
     */
    updateRecords(records: VSSInterfaces.VssJsonCollectionWrapperV<TaskAgentInterfaces.TimelineRecord[]>, scopeIdentifier: string, hubName: string, planId: string, timelineId: string): Promise<TaskAgentInterfaces.TimelineRecord[]>;
    /**
     * @param {TaskAgentInterfaces.Timeline} timeline
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    createTimeline(timeline: TaskAgentInterfaces.Timeline, scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.Timeline>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     */
    deleteTimeline(scopeIdentifier: string, hubName: string, planId: string, timelineId: string): Promise<void>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     * @param {string} timelineId
     * @param {number} changeId
     * @param {boolean} includeRecords
     */
    getTimeline(scopeIdentifier: string, hubName: string, planId: string, timelineId: string, changeId?: number, includeRecords?: boolean): Promise<TaskAgentInterfaces.Timeline>;
    /**
     * @param {string} scopeIdentifier - The project GUID to scope the request
     * @param {string} hubName - The name of the server hub. Common examples: "build", "rm", "checks"
     * @param {string} planId
     */
    getTimelines(scopeIdentifier: string, hubName: string, planId: string): Promise<TaskAgentInterfaces.Timeline[]>;
}
