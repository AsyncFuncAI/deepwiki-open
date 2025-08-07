/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import TfsCoreInterfaces = require("./interfaces/CoreInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
import WorkItemTrackingInterfaces = require("./interfaces/WorkItemTrackingInterfaces");
export interface IWorkItemTrackingApi extends basem.ClientApiBase {
    getAccountMyWorkData(queryOption?: WorkItemTrackingInterfaces.QueryOption): Promise<WorkItemTrackingInterfaces.AccountMyWorkResult>;
    getRecentActivityData(): Promise<WorkItemTrackingInterfaces.AccountRecentActivityWorkItemModel2[]>;
    getRecentMentions(): Promise<WorkItemTrackingInterfaces.AccountRecentMentionWorkItemModel[]>;
    getWorkArtifactLinkTypes(): Promise<WorkItemTrackingInterfaces.WorkArtifactLink[]>;
    queryWorkItemsForArtifactUris(artifactUriQuery: WorkItemTrackingInterfaces.ArtifactUriQuery, project?: string): Promise<WorkItemTrackingInterfaces.ArtifactUriQueryResult>;
    createAttachment(customHeaders: any, contentStream: NodeJS.ReadableStream, fileName?: string, uploadType?: string, project?: string, areaPath?: string): Promise<WorkItemTrackingInterfaces.AttachmentReference>;
    getAttachmentContent(id: string, fileName?: string, project?: string, download?: boolean): Promise<NodeJS.ReadableStream>;
    getAttachmentZip(id: string, fileName?: string, project?: string, download?: boolean): Promise<NodeJS.ReadableStream>;
    getClassificationNodes(project: string, ids: number[], depth?: number, errorPolicy?: WorkItemTrackingInterfaces.ClassificationNodesErrorPolicy): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode[]>;
    getRootNodes(project: string, depth?: number): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode[]>;
    createOrUpdateClassificationNode(postedNode: WorkItemTrackingInterfaces.WorkItemClassificationNode, project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode>;
    deleteClassificationNode(project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string, reclassifyId?: number): Promise<void>;
    getClassificationNode(project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string, depth?: number): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode>;
    updateClassificationNode(postedNode: WorkItemTrackingInterfaces.WorkItemClassificationNode, project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode>;
    getEngagedUsers(project: string, workItemId: number, commentId: number, reactionType: WorkItemTrackingInterfaces.CommentReactionType, top?: number, skip?: number): Promise<VSSInterfaces.IdentityRef[]>;
    addComment(request: WorkItemTrackingInterfaces.CommentCreate, project: string, workItemId: number): Promise<WorkItemTrackingInterfaces.Comment>;
    deleteComment(project: string, workItemId: number, commentId: number): Promise<void>;
    getComment(project: string, workItemId: number, commentId: number, includeDeleted?: boolean, expand?: WorkItemTrackingInterfaces.CommentExpandOptions): Promise<WorkItemTrackingInterfaces.Comment>;
    getComments(project: string, workItemId: number, top?: number, continuationToken?: string, includeDeleted?: boolean, expand?: WorkItemTrackingInterfaces.CommentExpandOptions, order?: WorkItemTrackingInterfaces.CommentSortOrder): Promise<WorkItemTrackingInterfaces.CommentList>;
    getCommentsBatch(project: string, workItemId: number, ids: number[], includeDeleted?: boolean, expand?: WorkItemTrackingInterfaces.CommentExpandOptions): Promise<WorkItemTrackingInterfaces.CommentList>;
    updateComment(request: WorkItemTrackingInterfaces.CommentUpdate, project: string, workItemId: number, commentId: number): Promise<WorkItemTrackingInterfaces.Comment>;
    createCommentReaction(project: string, workItemId: number, commentId: number, reactionType: WorkItemTrackingInterfaces.CommentReactionType): Promise<WorkItemTrackingInterfaces.CommentReaction>;
    deleteCommentReaction(project: string, workItemId: number, commentId: number, reactionType: WorkItemTrackingInterfaces.CommentReactionType): Promise<WorkItemTrackingInterfaces.CommentReaction>;
    getCommentReactions(project: string, workItemId: number, commentId: number): Promise<WorkItemTrackingInterfaces.CommentReaction[]>;
    getCommentVersion(project: string, workItemId: number, commentId: number, version: number): Promise<WorkItemTrackingInterfaces.CommentVersion>;
    getCommentVersions(project: string, workItemId: number, commentId: number): Promise<WorkItemTrackingInterfaces.CommentVersion[]>;
    createField(workItemField: WorkItemTrackingInterfaces.WorkItemField, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemField>;
    deleteField(fieldNameOrRefName: string, project?: string): Promise<void>;
    getField(fieldNameOrRefName: string, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemField>;
    getFields(project?: string, expand?: WorkItemTrackingInterfaces.GetFieldsExpand): Promise<WorkItemTrackingInterfaces.WorkItemField[]>;
    updateField(payload: WorkItemTrackingInterfaces.UpdateWorkItemField, fieldNameOrRefName: string, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemField>;
    migrateProjectsProcess(newProcess: WorkItemTrackingInterfaces.ProcessIdModel, project: string): Promise<WorkItemTrackingInterfaces.ProcessMigrationResultModel>;
    createQuery(postedQuery: WorkItemTrackingInterfaces.QueryHierarchyItem, project: string, query: string, validateWiqlOnly?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem>;
    deleteQuery(project: string, query: string): Promise<void>;
    getQueries(project: string, expand?: WorkItemTrackingInterfaces.QueryExpand, depth?: number, includeDeleted?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem[]>;
    getQuery(project: string, query: string, expand?: WorkItemTrackingInterfaces.QueryExpand, depth?: number, includeDeleted?: boolean, useIsoDateFormat?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem>;
    searchQueries(project: string, filter: string, top?: number, expand?: WorkItemTrackingInterfaces.QueryExpand, includeDeleted?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItemsResult>;
    updateQuery(queryUpdate: WorkItemTrackingInterfaces.QueryHierarchyItem, project: string, query: string, undeleteDescendants?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem>;
    getQueriesBatch(queryGetRequest: WorkItemTrackingInterfaces.QueryBatchGetRequest, project: string): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem[]>;
    destroyWorkItem(id: number, project?: string): Promise<void>;
    getDeletedWorkItem(id: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDelete>;
    getDeletedWorkItems(ids: number[], project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDeleteReference[]>;
    getDeletedWorkItemShallowReferences(project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDeleteShallowReference[]>;
    restoreWorkItem(payload: WorkItemTrackingInterfaces.WorkItemDeleteUpdate, id: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDelete>;
    getRevision(id: number, revisionNumber: number, expand?: WorkItemTrackingInterfaces.WorkItemExpand, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem>;
    getRevisions(id: number, top?: number, skip?: number, expand?: WorkItemTrackingInterfaces.WorkItemExpand, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem[]>;
    sendMail(body: WorkItemTrackingInterfaces.SendMailBody, project?: string): Promise<void>;
    deleteTag(project: string, tagIdOrName: string): Promise<void>;
    getTag(project: string, tagIdOrName: string): Promise<WorkItemTrackingInterfaces.WorkItemTagDefinition>;
    getTags(project: string): Promise<WorkItemTrackingInterfaces.WorkItemTagDefinition[]>;
    updateTag(tagData: WorkItemTrackingInterfaces.WorkItemTagDefinition, project: string, tagIdOrName: string): Promise<WorkItemTrackingInterfaces.WorkItemTagDefinition>;
    createTemplate(template: WorkItemTrackingInterfaces.WorkItemTemplate, teamContext: TfsCoreInterfaces.TeamContext): Promise<WorkItemTrackingInterfaces.WorkItemTemplate>;
    getTemplates(teamContext: TfsCoreInterfaces.TeamContext, workitemtypename?: string): Promise<WorkItemTrackingInterfaces.WorkItemTemplateReference[]>;
    deleteTemplate(teamContext: TfsCoreInterfaces.TeamContext, templateId: string): Promise<void>;
    getTemplate(teamContext: TfsCoreInterfaces.TeamContext, templateId: string): Promise<WorkItemTrackingInterfaces.WorkItemTemplate>;
    replaceTemplate(templateContent: WorkItemTrackingInterfaces.WorkItemTemplate, teamContext: TfsCoreInterfaces.TeamContext, templateId: string): Promise<WorkItemTrackingInterfaces.WorkItemTemplate>;
    getUpdate(id: number, updateNumber: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemUpdate>;
    getUpdates(id: number, top?: number, skip?: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemUpdate[]>;
    queryByWiql(wiql: WorkItemTrackingInterfaces.Wiql, teamContext?: TfsCoreInterfaces.TeamContext, timePrecision?: boolean, top?: number): Promise<WorkItemTrackingInterfaces.WorkItemQueryResult>;
    queryById(id: string, teamContext?: TfsCoreInterfaces.TeamContext, timePrecision?: boolean, top?: number): Promise<WorkItemTrackingInterfaces.WorkItemQueryResult>;
    getWorkItemIconJson(icon: string, color?: string, v?: number): Promise<WorkItemTrackingInterfaces.WorkItemIcon>;
    getWorkItemIcons(): Promise<WorkItemTrackingInterfaces.WorkItemIcon[]>;
    getWorkItemIconSvg(icon: string, color?: string, v?: number): Promise<NodeJS.ReadableStream>;
    getWorkItemIconXaml(icon: string, color?: string, v?: number): Promise<NodeJS.ReadableStream>;
    getReportingLinksByLinkType(project?: string, linkTypes?: string[], types?: string[], continuationToken?: string, startDateTime?: Date): Promise<WorkItemTrackingInterfaces.ReportingWorkItemLinksBatch>;
    getRelationType(relation: string): Promise<WorkItemTrackingInterfaces.WorkItemRelationType>;
    getRelationTypes(): Promise<WorkItemTrackingInterfaces.WorkItemRelationType[]>;
    readReportingRevisionsGet(project?: string, fields?: string[], types?: string[], continuationToken?: string, startDateTime?: Date, includeIdentityRef?: boolean, includeDeleted?: boolean, includeTagRef?: boolean, includeLatestOnly?: boolean, expand?: WorkItemTrackingInterfaces.ReportingRevisionsExpand, includeDiscussionChangesOnly?: boolean, maxPageSize?: number): Promise<WorkItemTrackingInterfaces.ReportingWorkItemRevisionsBatch>;
    readReportingRevisionsPost(filter: WorkItemTrackingInterfaces.ReportingWorkItemRevisionsFilter, project?: string, continuationToken?: string, startDateTime?: Date, expand?: WorkItemTrackingInterfaces.ReportingRevisionsExpand): Promise<WorkItemTrackingInterfaces.ReportingWorkItemRevisionsBatch>;
    readReportingDiscussions(project?: string, continuationToken?: string, maxPageSize?: number): Promise<WorkItemTrackingInterfaces.ReportingWorkItemRevisionsBatch>;
    createWorkItem(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, project: string, type: string, validateOnly?: boolean, bypassRules?: boolean, suppressNotifications?: boolean, expand?: WorkItemTrackingInterfaces.WorkItemExpand): Promise<WorkItemTrackingInterfaces.WorkItem>;
    getWorkItemTemplate(project: string, type: string, fields?: string, asOf?: Date, expand?: WorkItemTrackingInterfaces.WorkItemExpand): Promise<WorkItemTrackingInterfaces.WorkItem>;
    deleteWorkItem(id: number, project?: string, destroy?: boolean): Promise<WorkItemTrackingInterfaces.WorkItemDelete>;
    getWorkItem(id: number, fields?: string[], asOf?: Date, expand?: WorkItemTrackingInterfaces.WorkItemExpand, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem>;
    getWorkItems(ids: number[], fields?: string[], asOf?: Date, expand?: WorkItemTrackingInterfaces.WorkItemExpand, errorPolicy?: WorkItemTrackingInterfaces.WorkItemErrorPolicy, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem[]>;
    updateWorkItem(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, id: number, project?: string, validateOnly?: boolean, bypassRules?: boolean, suppressNotifications?: boolean, expand?: WorkItemTrackingInterfaces.WorkItemExpand): Promise<WorkItemTrackingInterfaces.WorkItem>;
    getWorkItemsBatch(workItemGetRequest: WorkItemTrackingInterfaces.WorkItemBatchGetRequest, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem[]>;
    getWorkItemStateColors(projectNames: string[]): Promise<WorkItemTrackingInterfaces.ProjectWorkItemStateColors[]>;
    getWorkItemNextStatesOnCheckinAction(ids: number[], action?: string): Promise<WorkItemTrackingInterfaces.WorkItemNextStateOnTransition[]>;
    getWorkItemTypeCategories(project: string): Promise<WorkItemTrackingInterfaces.WorkItemTypeCategory[]>;
    getWorkItemTypeCategory(project: string, category: string): Promise<WorkItemTrackingInterfaces.WorkItemTypeCategory>;
    getWorkItemTypeColors(projectNames: string[]): Promise<{
        key: string;
        value: WorkItemTrackingInterfaces.WorkItemTypeColor[];
    }[]>;
    getWorkItemTypeColorAndIcons(projectNames: string[]): Promise<{
        key: string;
        value: WorkItemTrackingInterfaces.WorkItemTypeColorAndIcon[];
    }[]>;
    getWorkItemType(project: string, type: string): Promise<WorkItemTrackingInterfaces.WorkItemType>;
    getWorkItemTypes(project: string): Promise<WorkItemTrackingInterfaces.WorkItemType[]>;
    getWorkItemTypeFieldsWithReferences(project: string, type: string, expand?: WorkItemTrackingInterfaces.WorkItemTypeFieldsExpandLevel): Promise<WorkItemTrackingInterfaces.WorkItemTypeFieldWithReferences[]>;
    getWorkItemTypeFieldWithReferences(project: string, type: string, field: string, expand?: WorkItemTrackingInterfaces.WorkItemTypeFieldsExpandLevel): Promise<WorkItemTrackingInterfaces.WorkItemTypeFieldWithReferences>;
    getWorkItemTypeStates(project: string, type: string): Promise<WorkItemTrackingInterfaces.WorkItemStateColor[]>;
    exportWorkItemTypeDefinition(project?: string, type?: string, exportGlobalLists?: boolean): Promise<WorkItemTrackingInterfaces.WorkItemTypeTemplate>;
    updateWorkItemTypeDefinition(updateModel: WorkItemTrackingInterfaces.WorkItemTypeTemplateUpdateModel, project?: string): Promise<WorkItemTrackingInterfaces.ProvisioningResult>;
}
export declare class WorkItemTrackingApi extends basem.ClientApiBase implements IWorkItemTrackingApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "5264459e-e5e0-4bd8-b118-0985e68a4ec5";
    /**
     * INTERNAL ONLY: USED BY ACCOUNT MY WORK PAGE. This returns Doing, Done, Follows and activity work items details.
     *
     * @param {WorkItemTrackingInterfaces.QueryOption} queryOption
     */
    getAccountMyWorkData(queryOption?: WorkItemTrackingInterfaces.QueryOption): Promise<WorkItemTrackingInterfaces.AccountMyWorkResult>;
    /**
     * Gets recent work item activities
     *
     */
    getRecentActivityData(): Promise<WorkItemTrackingInterfaces.AccountRecentActivityWorkItemModel2[]>;
    /**
     * INTERNAL ONLY: USED BY ACCOUNT MY WORK PAGE.
     *
     */
    getRecentMentions(): Promise<WorkItemTrackingInterfaces.AccountRecentMentionWorkItemModel[]>;
    /**
     * Get the list of work item tracking outbound artifact link types.
     *
     */
    getWorkArtifactLinkTypes(): Promise<WorkItemTrackingInterfaces.WorkArtifactLink[]>;
    /**
     * Queries work items linked to a given list of artifact URI.
     *
     * @param {WorkItemTrackingInterfaces.ArtifactUriQuery} artifactUriQuery - Defines a list of artifact URI for querying work items.
     * @param {string} project - Project ID or project name
     */
    queryWorkItemsForArtifactUris(artifactUriQuery: WorkItemTrackingInterfaces.ArtifactUriQuery, project?: string): Promise<WorkItemTrackingInterfaces.ArtifactUriQueryResult>;
    /**
     * Uploads an attachment.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} fileName - The name of the file
     * @param {string} uploadType - Attachment upload type: Simple or Chunked
     * @param {string} project - Project ID or project name
     * @param {string} areaPath - Target project Area Path
     */
    createAttachment(customHeaders: any, contentStream: NodeJS.ReadableStream, fileName?: string, uploadType?: string, project?: string, areaPath?: string): Promise<WorkItemTrackingInterfaces.AttachmentReference>;
    /**
     * Downloads an attachment.
     *
     * @param {string} id - Attachment ID
     * @param {string} fileName - Name of the file
     * @param {string} project - Project ID or project name
     * @param {boolean} download - If set to <c>true</c> always download attachment
     */
    getAttachmentContent(id: string, fileName?: string, project?: string, download?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * Downloads an attachment.
     *
     * @param {string} id - Attachment ID
     * @param {string} fileName - Name of the file
     * @param {string} project - Project ID or project name
     * @param {boolean} download - If set to <c>true</c> always download attachment
     */
    getAttachmentZip(id: string, fileName?: string, project?: string, download?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * Gets root classification nodes or list of classification nodes for a given list of nodes ids, for a given project. In case ids parameter is supplied you will  get list of classification nodes for those ids. Otherwise you will get root classification nodes for this project.
     *
     * @param {string} project - Project ID or project name
     * @param {number[]} ids - Comma separated integer classification nodes ids. It's not required, if you want root nodes.
     * @param {number} depth - Depth of children to fetch.
     * @param {WorkItemTrackingInterfaces.ClassificationNodesErrorPolicy} errorPolicy - Flag to handle errors in getting some nodes. Possible options are Fail and Omit.
     */
    getClassificationNodes(project: string, ids: number[], depth?: number, errorPolicy?: WorkItemTrackingInterfaces.ClassificationNodesErrorPolicy): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode[]>;
    /**
     * Gets root classification nodes under the project.
     *
     * @param {string} project - Project ID or project name
     * @param {number} depth - Depth of children to fetch.
     */
    getRootNodes(project: string, depth?: number): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode[]>;
    /**
     * Create new or update an existing classification node.
     *
     * @param {WorkItemTrackingInterfaces.WorkItemClassificationNode} postedNode - Node to create or update.
     * @param {string} project - Project ID or project name
     * @param {WorkItemTrackingInterfaces.TreeStructureGroup} structureGroup - Structure group of the classification node, area or iteration.
     * @param {string} path - Path of the classification node.
     */
    createOrUpdateClassificationNode(postedNode: WorkItemTrackingInterfaces.WorkItemClassificationNode, project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode>;
    /**
     * Delete an existing classification node.
     *
     * @param {string} project - Project ID or project name
     * @param {WorkItemTrackingInterfaces.TreeStructureGroup} structureGroup - Structure group of the classification node, area or iteration.
     * @param {string} path - Path of the classification node.
     * @param {number} reclassifyId - Id of the target classification node for reclassification.
     */
    deleteClassificationNode(project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string, reclassifyId?: number): Promise<void>;
    /**
     * Gets the classification node for a given node path.
     *
     * @param {string} project - Project ID or project name
     * @param {WorkItemTrackingInterfaces.TreeStructureGroup} structureGroup - Structure group of the classification node, area or iteration.
     * @param {string} path - Path of the classification node.
     * @param {number} depth - Depth of children to fetch.
     */
    getClassificationNode(project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string, depth?: number): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode>;
    /**
     * Update an existing classification node.
     *
     * @param {WorkItemTrackingInterfaces.WorkItemClassificationNode} postedNode - Node to create or update.
     * @param {string} project - Project ID or project name
     * @param {WorkItemTrackingInterfaces.TreeStructureGroup} structureGroup - Structure group of the classification node, area or iteration.
     * @param {string} path - Path of the classification node.
     */
    updateClassificationNode(postedNode: WorkItemTrackingInterfaces.WorkItemClassificationNode, project: string, structureGroup: WorkItemTrackingInterfaces.TreeStructureGroup, path?: string): Promise<WorkItemTrackingInterfaces.WorkItemClassificationNode>;
    /**
     * Get users who reacted on the comment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - WorkItem ID.
     * @param {number} commentId - Comment ID.
     * @param {WorkItemTrackingInterfaces.CommentReactionType} reactionType - Type of the reaction.
     * @param {number} top
     * @param {number} skip
     */
    getEngagedUsers(project: string, workItemId: number, commentId: number, reactionType: WorkItemTrackingInterfaces.CommentReactionType, top?: number, skip?: number): Promise<VSSInterfaces.IdentityRef[]>;
    /**
     * Add a comment on a work item.
     *
     * @param {WorkItemTrackingInterfaces.CommentCreate} request - Comment create request.
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - Id of a work item.
     */
    addComment(request: WorkItemTrackingInterfaces.CommentCreate, project: string, workItemId: number): Promise<WorkItemTrackingInterfaces.Comment>;
    /**
     * Delete a comment on a work item.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - Id of a work item.
     * @param {number} commentId
     */
    deleteComment(project: string, workItemId: number, commentId: number): Promise<void>;
    /**
     * Returns a work item comment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - Id of a work item to get the comment.
     * @param {number} commentId - Id of the comment to return.
     * @param {boolean} includeDeleted - Specify if the deleted comment should be retrieved.
     * @param {WorkItemTrackingInterfaces.CommentExpandOptions} expand - Specifies the additional data retrieval options for work item comments.
     */
    getComment(project: string, workItemId: number, commentId: number, includeDeleted?: boolean, expand?: WorkItemTrackingInterfaces.CommentExpandOptions): Promise<WorkItemTrackingInterfaces.Comment>;
    /**
     * Returns a list of work item comments, pageable.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - Id of a work item to get comments for.
     * @param {number} top - Max number of comments to return.
     * @param {string} continuationToken - Used to query for the next page of comments.
     * @param {boolean} includeDeleted - Specify if the deleted comments should be retrieved.
     * @param {WorkItemTrackingInterfaces.CommentExpandOptions} expand - Specifies the additional data retrieval options for work item comments.
     * @param {WorkItemTrackingInterfaces.CommentSortOrder} order - Order in which the comments should be returned.
     */
    getComments(project: string, workItemId: number, top?: number, continuationToken?: string, includeDeleted?: boolean, expand?: WorkItemTrackingInterfaces.CommentExpandOptions, order?: WorkItemTrackingInterfaces.CommentSortOrder): Promise<WorkItemTrackingInterfaces.CommentList>;
    /**
     * Returns a list of work item comments by ids.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - Id of a work item to get comments for.
     * @param {number[]} ids - Comma-separated list of comment ids to return.
     * @param {boolean} includeDeleted - Specify if the deleted comments should be retrieved.
     * @param {WorkItemTrackingInterfaces.CommentExpandOptions} expand - Specifies the additional data retrieval options for work item comments.
     */
    getCommentsBatch(project: string, workItemId: number, ids: number[], includeDeleted?: boolean, expand?: WorkItemTrackingInterfaces.CommentExpandOptions): Promise<WorkItemTrackingInterfaces.CommentList>;
    /**
     * Update a comment on a work item.
     *
     * @param {WorkItemTrackingInterfaces.CommentUpdate} request - Comment update request.
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - Id of a work item.
     * @param {number} commentId
     */
    updateComment(request: WorkItemTrackingInterfaces.CommentUpdate, project: string, workItemId: number, commentId: number): Promise<WorkItemTrackingInterfaces.Comment>;
    /**
     * Adds a new reaction to a comment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - WorkItem ID
     * @param {number} commentId - Comment ID
     * @param {WorkItemTrackingInterfaces.CommentReactionType} reactionType - Type of the reaction
     */
    createCommentReaction(project: string, workItemId: number, commentId: number, reactionType: WorkItemTrackingInterfaces.CommentReactionType): Promise<WorkItemTrackingInterfaces.CommentReaction>;
    /**
     * Deletes an existing reaction on a comment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - WorkItem ID
     * @param {number} commentId - Comment ID
     * @param {WorkItemTrackingInterfaces.CommentReactionType} reactionType - Type of the reaction
     */
    deleteCommentReaction(project: string, workItemId: number, commentId: number, reactionType: WorkItemTrackingInterfaces.CommentReactionType): Promise<WorkItemTrackingInterfaces.CommentReaction>;
    /**
     * Gets reactions of a comment.
     *
     * @param {string} project - Project ID or project name
     * @param {number} workItemId - WorkItem ID
     * @param {number} commentId - Comment ID
     */
    getCommentReactions(project: string, workItemId: number, commentId: number): Promise<WorkItemTrackingInterfaces.CommentReaction[]>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} workItemId
     * @param {number} commentId
     * @param {number} version
     */
    getCommentVersion(project: string, workItemId: number, commentId: number, version: number): Promise<WorkItemTrackingInterfaces.CommentVersion>;
    /**
     * @param {string} project - Project ID or project name
     * @param {number} workItemId
     * @param {number} commentId
     */
    getCommentVersions(project: string, workItemId: number, commentId: number): Promise<WorkItemTrackingInterfaces.CommentVersion[]>;
    /**
     * Create a new field.
     *
     * @param {WorkItemTrackingInterfaces.WorkItemField} workItemField - New field definition
     * @param {string} project - Project ID or project name
     */
    createField(workItemField: WorkItemTrackingInterfaces.WorkItemField, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemField>;
    /**
     * Deletes the field. To undelete a filed, see "Update Field" API.
     *
     * @param {string} fieldNameOrRefName - Field simple name or reference name
     * @param {string} project - Project ID or project name
     */
    deleteField(fieldNameOrRefName: string, project?: string): Promise<void>;
    /**
     * Gets information on a specific field.
     *
     * @param {string} fieldNameOrRefName - Field simple name or reference name
     * @param {string} project - Project ID or project name
     */
    getField(fieldNameOrRefName: string, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemField>;
    /**
     * Returns information for all fields. The project ID/name parameter is optional.
     *
     * @param {string} project - Project ID or project name
     * @param {WorkItemTrackingInterfaces.GetFieldsExpand} expand - Use ExtensionFields to include extension fields, otherwise exclude them. Unless the feature flag for this parameter is enabled, extension fields are always included.
     */
    getFields(project?: string, expand?: WorkItemTrackingInterfaces.GetFieldsExpand): Promise<WorkItemTrackingInterfaces.WorkItemField[]>;
    /**
     * Update a field.
     *
     * @param {WorkItemTrackingInterfaces.UpdateWorkItemField} payload - Payload contains desired value of the field's properties
     * @param {string} fieldNameOrRefName - Name/reference name of the field to be updated
     * @param {string} project - Project ID or project name
     */
    updateField(payload: WorkItemTrackingInterfaces.UpdateWorkItemField, fieldNameOrRefName: string, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemField>;
    /**
     * Migrates a project to a different process within the same OOB type. For example, you can only migrate a project from agile/custom-agile to agile/custom-agile.
     *
     * @param {WorkItemTrackingInterfaces.ProcessIdModel} newProcess
     * @param {string} project - Project ID or project name
     */
    migrateProjectsProcess(newProcess: WorkItemTrackingInterfaces.ProcessIdModel, project: string): Promise<WorkItemTrackingInterfaces.ProcessMigrationResultModel>;
    /**
     * Creates a query, or moves a query.
     *
     * @param {WorkItemTrackingInterfaces.QueryHierarchyItem} postedQuery - The query to create.
     * @param {string} project - Project ID or project name
     * @param {string} query - The parent id or path under which the query is to be created.
     * @param {boolean} validateWiqlOnly - If you only want to validate your WIQL query without actually creating one, set it to true. Default is false.
     */
    createQuery(postedQuery: WorkItemTrackingInterfaces.QueryHierarchyItem, project: string, query: string, validateWiqlOnly?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem>;
    /**
     * Delete a query or a folder. This deletes any permission change on the deleted query or folder and any of its descendants if it is a folder. It is important to note that the deleted permission changes cannot be recovered upon undeleting the query or folder.
     *
     * @param {string} project - Project ID or project name
     * @param {string} query - ID or path of the query or folder to delete.
     */
    deleteQuery(project: string, query: string): Promise<void>;
    /**
     * Gets the root queries and their children
     *
     * @param {string} project - Project ID or project name
     * @param {WorkItemTrackingInterfaces.QueryExpand} expand - Include the query string (wiql), clauses, query result columns, and sort options in the results.
     * @param {number} depth - In the folder of queries, return child queries and folders to this depth.
     * @param {boolean} includeDeleted - Include deleted queries and folders
     */
    getQueries(project: string, expand?: WorkItemTrackingInterfaces.QueryExpand, depth?: number, includeDeleted?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem[]>;
    /**
     * Retrieves an individual query and its children
     *
     * @param {string} project - Project ID or project name
     * @param {string} query - ID or path of the query.
     * @param {WorkItemTrackingInterfaces.QueryExpand} expand - Include the query string (wiql), clauses, query result columns, and sort options in the results.
     * @param {number} depth - In the folder of queries, return child queries and folders to this depth.
     * @param {boolean} includeDeleted - Include deleted queries and folders
     * @param {boolean} useIsoDateFormat - DateTime query clauses will be formatted using a ISO 8601 compliant format
     */
    getQuery(project: string, query: string, expand?: WorkItemTrackingInterfaces.QueryExpand, depth?: number, includeDeleted?: boolean, useIsoDateFormat?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem>;
    /**
     * Searches all queries the user has access to in the current project
     *
     * @param {string} project - Project ID or project name
     * @param {string} filter - The text to filter the queries with.
     * @param {number} top - The number of queries to return (Default is 50 and maximum is 200).
     * @param {WorkItemTrackingInterfaces.QueryExpand} expand
     * @param {boolean} includeDeleted - Include deleted queries and folders
     */
    searchQueries(project: string, filter: string, top?: number, expand?: WorkItemTrackingInterfaces.QueryExpand, includeDeleted?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItemsResult>;
    /**
     * Update a query or a folder. This allows you to update, rename and move queries and folders.
     *
     * @param {WorkItemTrackingInterfaces.QueryHierarchyItem} queryUpdate - The query to update.
     * @param {string} project - Project ID or project name
     * @param {string} query - The ID or path for the query to update.
     * @param {boolean} undeleteDescendants - Undelete the children of this folder. It is important to note that this will not bring back the permission changes that were previously applied to the descendants.
     */
    updateQuery(queryUpdate: WorkItemTrackingInterfaces.QueryHierarchyItem, project: string, query: string, undeleteDescendants?: boolean): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem>;
    /**
     * Gets a list of queries by ids (Maximum 1000)
     *
     * @param {WorkItemTrackingInterfaces.QueryBatchGetRequest} queryGetRequest
     * @param {string} project - Project ID or project name
     */
    getQueriesBatch(queryGetRequest: WorkItemTrackingInterfaces.QueryBatchGetRequest, project: string): Promise<WorkItemTrackingInterfaces.QueryHierarchyItem[]>;
    /**
     * Destroys the specified work item permanently from the Recycle Bin. This action can not be undone.
     *
     * @param {number} id - ID of the work item to be destroyed permanently
     * @param {string} project - Project ID or project name
     */
    destroyWorkItem(id: number, project?: string): Promise<void>;
    /**
     * Gets a deleted work item from Recycle Bin.
     *
     * @param {number} id - ID of the work item to be returned
     * @param {string} project - Project ID or project name
     */
    getDeletedWorkItem(id: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDelete>;
    /**
     * Gets the work items from the recycle bin, whose IDs have been specified in the parameters
     *
     * @param {number[]} ids - Comma separated list of IDs of the deleted work items to be returned
     * @param {string} project - Project ID or project name
     */
    getDeletedWorkItems(ids: number[], project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDeleteReference[]>;
    /**
     * Gets a list of the IDs and the URLs of the deleted the work items in the Recycle Bin.
     *
     * @param {string} project - Project ID or project name
     */
    getDeletedWorkItemShallowReferences(project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDeleteShallowReference[]>;
    /**
     * Restores the deleted work item from Recycle Bin.
     *
     * @param {WorkItemTrackingInterfaces.WorkItemDeleteUpdate} payload - Paylod with instructions to update the IsDeleted flag to false
     * @param {number} id - ID of the work item to be restored
     * @param {string} project - Project ID or project name
     */
    restoreWorkItem(payload: WorkItemTrackingInterfaces.WorkItemDeleteUpdate, id: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemDelete>;
    /**
     * Returns a fully hydrated work item for the requested revision
     *
     * @param {number} id
     * @param {number} revisionNumber
     * @param {WorkItemTrackingInterfaces.WorkItemExpand} expand
     * @param {string} project - Project ID or project name
     */
    getRevision(id: number, revisionNumber: number, expand?: WorkItemTrackingInterfaces.WorkItemExpand, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem>;
    /**
     * Returns the list of fully hydrated work item revisions, paged.
     *
     * @param {number} id
     * @param {number} top
     * @param {number} skip
     * @param {WorkItemTrackingInterfaces.WorkItemExpand} expand
     * @param {string} project - Project ID or project name
     */
    getRevisions(id: number, top?: number, skip?: number, expand?: WorkItemTrackingInterfaces.WorkItemExpand, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem[]>;
    /**
     * RESTful method to send mail for selected/queried work items.
     *
     * @param {WorkItemTrackingInterfaces.SendMailBody} body
     * @param {string} project - Project ID or project name
     */
    sendMail(body: WorkItemTrackingInterfaces.SendMailBody, project?: string): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} tagIdOrName
     */
    deleteTag(project: string, tagIdOrName: string): Promise<void>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} tagIdOrName
     */
    getTag(project: string, tagIdOrName: string): Promise<WorkItemTrackingInterfaces.WorkItemTagDefinition>;
    /**
     * @param {string} project - Project ID or project name
     */
    getTags(project: string): Promise<WorkItemTrackingInterfaces.WorkItemTagDefinition[]>;
    /**
     * @param {WorkItemTrackingInterfaces.WorkItemTagDefinition} tagData
     * @param {string} project - Project ID or project name
     * @param {string} tagIdOrName
     */
    updateTag(tagData: WorkItemTrackingInterfaces.WorkItemTagDefinition, project: string, tagIdOrName: string): Promise<WorkItemTrackingInterfaces.WorkItemTagDefinition>;
    /**
     * Creates a template
     *
     * @param {WorkItemTrackingInterfaces.WorkItemTemplate} template - Template contents
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     */
    createTemplate(template: WorkItemTrackingInterfaces.WorkItemTemplate, teamContext: TfsCoreInterfaces.TeamContext): Promise<WorkItemTrackingInterfaces.WorkItemTemplate>;
    /**
     * Gets template
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} workitemtypename - Optional, When specified returns templates for given Work item type.
     */
    getTemplates(teamContext: TfsCoreInterfaces.TeamContext, workitemtypename?: string): Promise<WorkItemTrackingInterfaces.WorkItemTemplateReference[]>;
    /**
     * Deletes the template with given id
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} templateId - Template id
     */
    deleteTemplate(teamContext: TfsCoreInterfaces.TeamContext, templateId: string): Promise<void>;
    /**
     * Gets the template with specified id
     *
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} templateId - Template Id
     */
    getTemplate(teamContext: TfsCoreInterfaces.TeamContext, templateId: string): Promise<WorkItemTrackingInterfaces.WorkItemTemplate>;
    /**
     * Replace template contents
     *
     * @param {WorkItemTrackingInterfaces.WorkItemTemplate} templateContent - Template contents to replace with
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {string} templateId - Template id
     */
    replaceTemplate(templateContent: WorkItemTrackingInterfaces.WorkItemTemplate, teamContext: TfsCoreInterfaces.TeamContext, templateId: string): Promise<WorkItemTrackingInterfaces.WorkItemTemplate>;
    /**
     * Returns a single update for a work item
     *
     * @param {number} id
     * @param {number} updateNumber
     * @param {string} project - Project ID or project name
     */
    getUpdate(id: number, updateNumber: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemUpdate>;
    /**
     * Returns a the deltas between work item revisions
     *
     * @param {number} id
     * @param {number} top
     * @param {number} skip
     * @param {string} project - Project ID or project name
     */
    getUpdates(id: number, top?: number, skip?: number, project?: string): Promise<WorkItemTrackingInterfaces.WorkItemUpdate[]>;
    /**
     * Gets the results of the query given its WIQL.
     *
     * @param {WorkItemTrackingInterfaces.Wiql} wiql - The query containing the WIQL.
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {boolean} timePrecision - Whether or not to use time precision.
     * @param {number} top - The max number of results to return.
     */
    queryByWiql(wiql: WorkItemTrackingInterfaces.Wiql, teamContext?: TfsCoreInterfaces.TeamContext, timePrecision?: boolean, top?: number): Promise<WorkItemTrackingInterfaces.WorkItemQueryResult>;
    /**
     * Gets the results of the query given the query ID.
     *
     * @param {string} id - The query ID.
     * @param {TfsCoreInterfaces.TeamContext} teamContext - The team context for the operation
     * @param {boolean} timePrecision - Whether or not to use time precision.
     * @param {number} top - The max number of results to return.
     */
    queryById(id: string, teamContext?: TfsCoreInterfaces.TeamContext, timePrecision?: boolean, top?: number): Promise<WorkItemTrackingInterfaces.WorkItemQueryResult>;
    /**
     * Get a work item icon given the friendly name and icon color.
     *
     * @param {string} icon - The name of the icon
     * @param {string} color - The 6-digit hex color for the icon
     * @param {number} v - The version of the icon (used only for cache invalidation)
     */
    getWorkItemIconJson(icon: string, color?: string, v?: number): Promise<WorkItemTrackingInterfaces.WorkItemIcon>;
    /**
     * Get a list of all work item icons.
     *
     */
    getWorkItemIcons(): Promise<WorkItemTrackingInterfaces.WorkItemIcon[]>;
    /**
     * Get a work item icon given the friendly name and icon color.
     *
     * @param {string} icon - The name of the icon
     * @param {string} color - The 6-digit hex color for the icon
     * @param {number} v - The version of the icon (used only for cache invalidation)
     */
    getWorkItemIconSvg(icon: string, color?: string, v?: number): Promise<NodeJS.ReadableStream>;
    /**
     * Get a work item icon given the friendly name and icon color.
     *
     * @param {string} icon - The name of the icon
     * @param {string} color - The 6-digit hex color for the icon
     * @param {number} v - The version of the icon (used only for cache invalidation)
     */
    getWorkItemIconXaml(icon: string, color?: string, v?: number): Promise<NodeJS.ReadableStream>;
    /**
     * Get a batch of work item links
     *
     * @param {string} project - Project ID or project name
     * @param {string[]} linkTypes - A list of types to filter the results to specific link types. Omit this parameter to get work item links of all link types.
     * @param {string[]} types - A list of types to filter the results to specific work item types. Omit this parameter to get work item links of all work item types.
     * @param {string} continuationToken - Specifies the continuationToken to start the batch from. Omit this parameter to get the first batch of links.
     * @param {Date} startDateTime - Date/time to use as a starting point for link changes. Only link changes that occurred after that date/time will be returned. Cannot be used in conjunction with 'watermark' parameter.
     */
    getReportingLinksByLinkType(project?: string, linkTypes?: string[], types?: string[], continuationToken?: string, startDateTime?: Date): Promise<WorkItemTrackingInterfaces.ReportingWorkItemLinksBatch>;
    /**
     * Gets the work item relation type definition.
     *
     * @param {string} relation - The relation name
     */
    getRelationType(relation: string): Promise<WorkItemTrackingInterfaces.WorkItemRelationType>;
    /**
     * Gets the work item relation types.
     *
     */
    getRelationTypes(): Promise<WorkItemTrackingInterfaces.WorkItemRelationType[]>;
    /**
     * Get a batch of work item revisions with the option of including deleted items
     *
     * @param {string} project - Project ID or project name
     * @param {string[]} fields - A list of fields to return in work item revisions. Omit this parameter to get all reportable fields.
     * @param {string[]} types - A list of types to filter the results to specific work item types. Omit this parameter to get work item revisions of all work item types.
     * @param {string} continuationToken - Specifies the watermark to start the batch from. Omit this parameter to get the first batch of revisions.
     * @param {Date} startDateTime - Date/time to use as a starting point for revisions, all revisions will occur after this date/time. Cannot be used in conjunction with 'watermark' parameter.
     * @param {boolean} includeIdentityRef - Return an identity reference instead of a string value for identity fields.
     * @param {boolean} includeDeleted - Specify if the deleted item should be returned.
     * @param {boolean} includeTagRef - Specify if the tag objects should be returned for System.Tags field.
     * @param {boolean} includeLatestOnly - Return only the latest revisions of work items, skipping all historical revisions
     * @param {WorkItemTrackingInterfaces.ReportingRevisionsExpand} expand - Return all the fields in work item revisions, including long text fields which are not returned by default
     * @param {boolean} includeDiscussionChangesOnly - Return only the those revisions of work items, where only history field was changed
     * @param {number} maxPageSize - The maximum number of results to return in this batch
     */
    readReportingRevisionsGet(project?: string, fields?: string[], types?: string[], continuationToken?: string, startDateTime?: Date, includeIdentityRef?: boolean, includeDeleted?: boolean, includeTagRef?: boolean, includeLatestOnly?: boolean, expand?: WorkItemTrackingInterfaces.ReportingRevisionsExpand, includeDiscussionChangesOnly?: boolean, maxPageSize?: number): Promise<WorkItemTrackingInterfaces.ReportingWorkItemRevisionsBatch>;
    /**
     * Get a batch of work item revisions. This request may be used if your list of fields is large enough that it may run the URL over the length limit.
     *
     * @param {WorkItemTrackingInterfaces.ReportingWorkItemRevisionsFilter} filter - An object that contains request settings: field filter, type filter, identity format
     * @param {string} project - Project ID or project name
     * @param {string} continuationToken - Specifies the watermark to start the batch from. Omit this parameter to get the first batch of revisions.
     * @param {Date} startDateTime - Date/time to use as a starting point for revisions, all revisions will occur after this date/time. Cannot be used in conjunction with 'watermark' parameter.
     * @param {WorkItemTrackingInterfaces.ReportingRevisionsExpand} expand
     */
    readReportingRevisionsPost(filter: WorkItemTrackingInterfaces.ReportingWorkItemRevisionsFilter, project?: string, continuationToken?: string, startDateTime?: Date, expand?: WorkItemTrackingInterfaces.ReportingRevisionsExpand): Promise<WorkItemTrackingInterfaces.ReportingWorkItemRevisionsBatch>;
    /**
     * @param {string} project - Project ID or project name
     * @param {string} continuationToken
     * @param {number} maxPageSize
     */
    readReportingDiscussions(project?: string, continuationToken?: string, maxPageSize?: number): Promise<WorkItemTrackingInterfaces.ReportingWorkItemRevisionsBatch>;
    /**
     * Creates a single work item.
     *
     * @param {VSSInterfaces.JsonPatchDocument} document - The JSON Patch document representing the work item
     * @param {string} project - Project ID or project name
     * @param {string} type - The work item type of the work item to create
     * @param {boolean} validateOnly - Indicate if you only want to validate the changes without saving the work item
     * @param {boolean} bypassRules - Do not enforce the work item type rules on this update
     * @param {boolean} suppressNotifications - Do not fire any notifications for this change
     * @param {WorkItemTrackingInterfaces.WorkItemExpand} expand - The expand parameters for work item attributes. Possible options are { None, Relations, Fields, Links, All }.
     */
    createWorkItem(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, project: string, type: string, validateOnly?: boolean, bypassRules?: boolean, suppressNotifications?: boolean, expand?: WorkItemTrackingInterfaces.WorkItemExpand): Promise<WorkItemTrackingInterfaces.WorkItem>;
    /**
     * Returns a single work item from a template.
     *
     * @param {string} project - Project ID or project name
     * @param {string} type - The work item type name
     * @param {string} fields - Comma-separated list of requested fields
     * @param {Date} asOf - AsOf UTC date time string
     * @param {WorkItemTrackingInterfaces.WorkItemExpand} expand - The expand parameters for work item attributes. Possible options are { None, Relations, Fields, Links, All }.
     */
    getWorkItemTemplate(project: string, type: string, fields?: string, asOf?: Date, expand?: WorkItemTrackingInterfaces.WorkItemExpand): Promise<WorkItemTrackingInterfaces.WorkItem>;
    /**
     * Deletes the specified work item and sends it to the Recycle Bin, so that it can be restored back, if required. Optionally, if the destroy parameter has been set to true, it destroys the work item permanently. WARNING: If the destroy parameter is set to true, work items deleted by this command will NOT go to recycle-bin and there is no way to restore/recover them after deletion. It is recommended NOT to use this parameter. If you do, please use this parameter with extreme caution.
     *
     * @param {number} id - ID of the work item to be deleted
     * @param {string} project - Project ID or project name
     * @param {boolean} destroy - Optional parameter, if set to true, the work item is deleted permanently. Please note: the destroy action is PERMANENT and cannot be undone.
     */
    deleteWorkItem(id: number, project?: string, destroy?: boolean): Promise<WorkItemTrackingInterfaces.WorkItemDelete>;
    /**
     * Returns a single work item.
     *
     * @param {number} id - The work item id
     * @param {string[]} fields - Comma-separated list of requested fields
     * @param {Date} asOf - AsOf UTC date time string
     * @param {WorkItemTrackingInterfaces.WorkItemExpand} expand - The expand parameters for work item attributes. Possible options are { None, Relations, Fields, Links, All }.
     * @param {string} project - Project ID or project name
     */
    getWorkItem(id: number, fields?: string[], asOf?: Date, expand?: WorkItemTrackingInterfaces.WorkItemExpand, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem>;
    /**
     * Returns a list of work items (Maximum 200)
     *
     * @param {number[]} ids - The comma-separated list of requested work item ids. (Maximum 200 ids allowed).
     * @param {string[]} fields - Comma-separated list of requested fields
     * @param {Date} asOf - AsOf UTC date time string
     * @param {WorkItemTrackingInterfaces.WorkItemExpand} expand - The expand parameters for work item attributes. Possible options are { None, Relations, Fields, Links, All }.
     * @param {WorkItemTrackingInterfaces.WorkItemErrorPolicy} errorPolicy - The flag to control error policy in a bulk get work items request. Possible options are {Fail, Omit}.
     * @param {string} project - Project ID or project name
     */
    getWorkItems(ids: number[], fields?: string[], asOf?: Date, expand?: WorkItemTrackingInterfaces.WorkItemExpand, errorPolicy?: WorkItemTrackingInterfaces.WorkItemErrorPolicy, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem[]>;
    /**
     * Updates a single work item.
     *
     * @param {VSSInterfaces.JsonPatchDocument} document - The JSON Patch document representing the update
     * @param {number} id - The id of the work item to update
     * @param {string} project - Project ID or project name
     * @param {boolean} validateOnly - Indicate if you only want to validate the changes without saving the work item
     * @param {boolean} bypassRules - Do not enforce the work item type rules on this update
     * @param {boolean} suppressNotifications - Do not fire any notifications for this change
     * @param {WorkItemTrackingInterfaces.WorkItemExpand} expand - The expand parameters for work item attributes. Possible options are { None, Relations, Fields, Links, All }.
     */
    updateWorkItem(customHeaders: any, document: VSSInterfaces.JsonPatchDocument, id: number, project?: string, validateOnly?: boolean, bypassRules?: boolean, suppressNotifications?: boolean, expand?: WorkItemTrackingInterfaces.WorkItemExpand): Promise<WorkItemTrackingInterfaces.WorkItem>;
    /**
     * Gets work items for a list of work item ids (Maximum 200)
     *
     * @param {WorkItemTrackingInterfaces.WorkItemBatchGetRequest} workItemGetRequest
     * @param {string} project - Project ID or project name
     */
    getWorkItemsBatch(workItemGetRequest: WorkItemTrackingInterfaces.WorkItemBatchGetRequest, project?: string): Promise<WorkItemTrackingInterfaces.WorkItem[]>;
    /**
     * INTERNAL ONLY: It will be used for My account work experience. Get the work item type state color for multiple projects
     *
     * @param {string[]} projectNames
     */
    getWorkItemStateColors(projectNames: string[]): Promise<WorkItemTrackingInterfaces.ProjectWorkItemStateColors[]>;
    /**
     * Returns the next state on the given work item IDs.
     *
     * @param {number[]} ids - list of work item ids
     * @param {string} action - possible actions. Currently only supports checkin
     */
    getWorkItemNextStatesOnCheckinAction(ids: number[], action?: string): Promise<WorkItemTrackingInterfaces.WorkItemNextStateOnTransition[]>;
    /**
     * Get all work item type categories.
     *
     * @param {string} project - Project ID or project name
     */
    getWorkItemTypeCategories(project: string): Promise<WorkItemTrackingInterfaces.WorkItemTypeCategory[]>;
    /**
     * Get specific work item type category by name.
     *
     * @param {string} project - Project ID or project name
     * @param {string} category - The category name
     */
    getWorkItemTypeCategory(project: string, category: string): Promise<WorkItemTrackingInterfaces.WorkItemTypeCategory>;
    /**
     * INTERNAL ONLY: It will be used for My account work experience. Get the wit type color for multiple projects
     *
     * @param {string[]} projectNames
     */
    getWorkItemTypeColors(projectNames: string[]): Promise<{
        key: string;
        value: WorkItemTrackingInterfaces.WorkItemTypeColor[];
    }[]>;
    /**
     * INTERNAL ONLY: It is used for color and icon providers. Get the wit type color for multiple projects
     *
     * @param {string[]} projectNames
     */
    getWorkItemTypeColorAndIcons(projectNames: string[]): Promise<{
        key: string;
        value: WorkItemTrackingInterfaces.WorkItemTypeColorAndIcon[];
    }[]>;
    /**
     * Returns a work item type definition.
     *
     * @param {string} project - Project ID or project name
     * @param {string} type - Work item type name
     */
    getWorkItemType(project: string, type: string): Promise<WorkItemTrackingInterfaces.WorkItemType>;
    /**
     * Returns the list of work item types
     *
     * @param {string} project - Project ID or project name
     */
    getWorkItemTypes(project: string): Promise<WorkItemTrackingInterfaces.WorkItemType[]>;
    /**
     * Get a list of fields for a work item type with detailed references.
     *
     * @param {string} project - Project ID or project name
     * @param {string} type - Work item type.
     * @param {WorkItemTrackingInterfaces.WorkItemTypeFieldsExpandLevel} expand - Expand level for the API response. Properties: to include allowedvalues, default value, isRequired etc. as a part of response; None: to skip these properties.
     */
    getWorkItemTypeFieldsWithReferences(project: string, type: string, expand?: WorkItemTrackingInterfaces.WorkItemTypeFieldsExpandLevel): Promise<WorkItemTrackingInterfaces.WorkItemTypeFieldWithReferences[]>;
    /**
     * Get a field for a work item type with detailed references.
     *
     * @param {string} project - Project ID or project name
     * @param {string} type - Work item type.
     * @param {string} field
     * @param {WorkItemTrackingInterfaces.WorkItemTypeFieldsExpandLevel} expand - Expand level for the API response. Properties: to include allowedvalues, default value, isRequired etc. as a part of response; None: to skip these properties.
     */
    getWorkItemTypeFieldWithReferences(project: string, type: string, field: string, expand?: WorkItemTrackingInterfaces.WorkItemTypeFieldsExpandLevel): Promise<WorkItemTrackingInterfaces.WorkItemTypeFieldWithReferences>;
    /**
     * Returns the state names and colors for a work item type.
     *
     * @param {string} project - Project ID or project name
     * @param {string} type - The state name
     */
    getWorkItemTypeStates(project: string, type: string): Promise<WorkItemTrackingInterfaces.WorkItemStateColor[]>;
    /**
     * Export work item type
     *
     * @param {string} project - Project ID or project name
     * @param {string} type
     * @param {boolean} exportGlobalLists
     */
    exportWorkItemTypeDefinition(project?: string, type?: string, exportGlobalLists?: boolean): Promise<WorkItemTrackingInterfaces.WorkItemTypeTemplate>;
    /**
     * Add/updates a work item type
     *
     * @param {WorkItemTrackingInterfaces.WorkItemTypeTemplateUpdateModel} updateModel
     * @param {string} project - Project ID or project name
     */
    updateWorkItemTypeDefinition(updateModel: WorkItemTrackingInterfaces.WorkItemTypeTemplateUpdateModel, project?: string): Promise<WorkItemTrackingInterfaces.ProvisioningResult>;
}
