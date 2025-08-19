/// <reference types="node" />
import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import Comments_Contracts = require("./interfaces/CommentsInterfaces");
import GitInterfaces = require("./interfaces/GitInterfaces");
import VSSInterfaces = require("./interfaces/common/VSSInterfaces");
import WikiInterfaces = require("./interfaces/WikiInterfaces");
export interface IWikiApi extends basem.ClientApiBase {
    createCommentAttachment(customHeaders: any, contentStream: NodeJS.ReadableStream, project: string, wikiIdentifier: string, pageId: number): Promise<Comments_Contracts.CommentAttachment>;
    getAttachmentContent(project: string, wikiIdentifier: string, pageId: number, attachmentId: string): Promise<NodeJS.ReadableStream>;
    addCommentReaction(project: string, wikiIdentifier: string, pageId: number, commentId: number, type: Comments_Contracts.CommentReactionType): Promise<Comments_Contracts.CommentReaction>;
    deleteCommentReaction(project: string, wikiIdentifier: string, pageId: number, commentId: number, type: Comments_Contracts.CommentReactionType): Promise<Comments_Contracts.CommentReaction>;
    getEngagedUsers(project: string, wikiIdentifier: string, pageId: number, commentId: number, type: Comments_Contracts.CommentReactionType, top?: number, skip?: number): Promise<VSSInterfaces.IdentityRef[]>;
    addComment(request: Comments_Contracts.CommentCreateParameters, project: string, wikiIdentifier: string, pageId: number): Promise<Comments_Contracts.Comment>;
    deleteComment(project: string, wikiIdentifier: string, pageId: number, id: number): Promise<void>;
    getComment(project: string, wikiIdentifier: string, pageId: number, id: number, excludeDeleted?: boolean, expand?: Comments_Contracts.CommentExpandOptions): Promise<Comments_Contracts.Comment>;
    listComments(project: string, wikiIdentifier: string, pageId: number, top?: number, continuationToken?: string, excludeDeleted?: boolean, expand?: Comments_Contracts.CommentExpandOptions, order?: Comments_Contracts.CommentSortOrder, parentId?: number): Promise<Comments_Contracts.CommentList>;
    updateComment(comment: Comments_Contracts.CommentUpdateParameters, project: string, wikiIdentifier: string, pageId: number, id: number): Promise<Comments_Contracts.Comment>;
    getPageText(project: string, wikiIdentifier: string, path?: string, recursionLevel?: GitInterfaces.VersionControlRecursionType, versionDescriptor?: GitInterfaces.GitVersionDescriptor, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    getPageZip(project: string, wikiIdentifier: string, path?: string, recursionLevel?: GitInterfaces.VersionControlRecursionType, versionDescriptor?: GitInterfaces.GitVersionDescriptor, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    getPageByIdText(project: string, wikiIdentifier: string, id: number, recursionLevel?: GitInterfaces.VersionControlRecursionType, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    getPageByIdZip(project: string, wikiIdentifier: string, id: number, recursionLevel?: GitInterfaces.VersionControlRecursionType, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    getPagesBatch(pagesBatchRequest: WikiInterfaces.WikiPagesBatchRequest, project: string, wikiIdentifier: string, versionDescriptor?: GitInterfaces.GitVersionDescriptor): Promise<VSSInterfaces.PagedList<WikiInterfaces.WikiPageDetail>>;
    getPageData(project: string, wikiIdentifier: string, pageId: number, pageViewsForDays?: number): Promise<WikiInterfaces.WikiPageDetail>;
    createOrUpdatePageViewStats(project: string, wikiIdentifier: string, wikiVersion: GitInterfaces.GitVersionDescriptor, path: string, oldPath?: string): Promise<WikiInterfaces.WikiPageViewStats>;
    createWiki(wikiCreateParams: WikiInterfaces.WikiCreateParametersV2, project?: string): Promise<WikiInterfaces.WikiV2>;
    deleteWiki(wikiIdentifier: string, project?: string): Promise<WikiInterfaces.WikiV2>;
    getAllWikis(project?: string): Promise<WikiInterfaces.WikiV2[]>;
    getWiki(wikiIdentifier: string, project?: string): Promise<WikiInterfaces.WikiV2>;
    updateWiki(updateParameters: WikiInterfaces.WikiUpdateParameters, wikiIdentifier: string, project?: string): Promise<WikiInterfaces.WikiV2>;
}
export declare class WikiApi extends basem.ClientApiBase implements IWikiApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "bf7d82a0-8aa5-4613-94ef-6172a5ea01f3";
    /**
     * Uploads an attachment on a comment on a wiki page.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     */
    createCommentAttachment(customHeaders: any, contentStream: NodeJS.ReadableStream, project: string, wikiIdentifier: string, pageId: number): Promise<Comments_Contracts.CommentAttachment>;
    /**
     * Downloads an attachment on a comment on a wiki page.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {string} attachmentId - Attachment ID.
     */
    getAttachmentContent(project: string, wikiIdentifier: string, pageId: number, attachmentId: string): Promise<NodeJS.ReadableStream>;
    /**
     * Add a reaction on a wiki page comment.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name
     * @param {number} pageId - Wiki page ID
     * @param {number} commentId - ID of the associated comment
     * @param {Comments_Contracts.CommentReactionType} type - Type of the reaction being added
     */
    addCommentReaction(project: string, wikiIdentifier: string, pageId: number, commentId: number, type: Comments_Contracts.CommentReactionType): Promise<Comments_Contracts.CommentReaction>;
    /**
     * Delete a reaction on a wiki page comment.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or name
     * @param {number} pageId - Wiki page ID
     * @param {number} commentId - ID of the associated comment
     * @param {Comments_Contracts.CommentReactionType} type - Type of the reaction being deleted
     */
    deleteCommentReaction(project: string, wikiIdentifier: string, pageId: number, commentId: number, type: Comments_Contracts.CommentReactionType): Promise<Comments_Contracts.CommentReaction>;
    /**
     * Gets a list of users who have reacted for the given wiki comment with a given reaction type. Supports paging, with a default page size of 100 users at a time.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} commentId - ID of the associated comment
     * @param {Comments_Contracts.CommentReactionType} type - Type of the reaction for which the engaged users are being requested
     * @param {number} top - Number of enagaged users to be returned in a given page. Optional, defaults to 100
     * @param {number} skip - Number of engaged users to be skipped to page the next set of engaged users, defaults to 0
     */
    getEngagedUsers(project: string, wikiIdentifier: string, pageId: number, commentId: number, type: Comments_Contracts.CommentReactionType, top?: number, skip?: number): Promise<VSSInterfaces.IdentityRef[]>;
    /**
     * Add a comment on a wiki page.
     *
     * @param {Comments_Contracts.CommentCreateParameters} request - Comment create request.
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     */
    addComment(request: Comments_Contracts.CommentCreateParameters, project: string, wikiIdentifier: string, pageId: number): Promise<Comments_Contracts.Comment>;
    /**
     * Delete a comment on a wiki page.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} id - Comment ID.
     */
    deleteComment(project: string, wikiIdentifier: string, pageId: number, id: number): Promise<void>;
    /**
     * Returns a comment associated with the Wiki Page.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} id - ID of the comment to return.
     * @param {boolean} excludeDeleted - Specify if the deleted comment should be skipped.
     * @param {Comments_Contracts.CommentExpandOptions} expand - Specifies the additional data retrieval options for comments.
     */
    getComment(project: string, wikiIdentifier: string, pageId: number, id: number, excludeDeleted?: boolean, expand?: Comments_Contracts.CommentExpandOptions): Promise<Comments_Contracts.Comment>;
    /**
     * Returns a pageable list of comments.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} top - Max number of comments to return.
     * @param {string} continuationToken - Used to query for the next page of comments.
     * @param {boolean} excludeDeleted - Specify if the deleted comments should be skipped.
     * @param {Comments_Contracts.CommentExpandOptions} expand - Specifies the additional data retrieval options for comments.
     * @param {Comments_Contracts.CommentSortOrder} order - Order in which the comments should be returned.
     * @param {number} parentId - CommentId of the parent comment.
     */
    listComments(project: string, wikiIdentifier: string, pageId: number, top?: number, continuationToken?: string, excludeDeleted?: boolean, expand?: Comments_Contracts.CommentExpandOptions, order?: Comments_Contracts.CommentSortOrder, parentId?: number): Promise<Comments_Contracts.CommentList>;
    /**
     * Update a comment on a wiki page.
     *
     * @param {Comments_Contracts.CommentUpdateParameters} comment - Comment update request.
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} id - Comment ID.
     */
    updateComment(comment: Comments_Contracts.CommentUpdateParameters, project: string, wikiIdentifier: string, pageId: number, id: number): Promise<Comments_Contracts.Comment>;
    /**
     * Gets metadata or content of the wiki page for the provided path. Content negotiation is done based on the `Accept` header sent in the request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} path - Wiki page path.
     * @param {GitInterfaces.VersionControlRecursionType} recursionLevel - Recursion level for subpages retrieval. Defaults to `None` (Optional).
     * @param {GitInterfaces.GitVersionDescriptor} versionDescriptor - GitVersionDescriptor for the page. Defaults to the default branch (Optional).
     * @param {boolean} includeContent - True to include the content of the page in the response for Json content type. Defaults to false (Optional)
     */
    getPageText(project: string, wikiIdentifier: string, path?: string, recursionLevel?: GitInterfaces.VersionControlRecursionType, versionDescriptor?: GitInterfaces.GitVersionDescriptor, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * Gets metadata or content of the wiki page for the provided path. Content negotiation is done based on the `Accept` header sent in the request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} path - Wiki page path.
     * @param {GitInterfaces.VersionControlRecursionType} recursionLevel - Recursion level for subpages retrieval. Defaults to `None` (Optional).
     * @param {GitInterfaces.GitVersionDescriptor} versionDescriptor - GitVersionDescriptor for the page. Defaults to the default branch (Optional).
     * @param {boolean} includeContent - True to include the content of the page in the response for Json content type. Defaults to false (Optional)
     */
    getPageZip(project: string, wikiIdentifier: string, path?: string, recursionLevel?: GitInterfaces.VersionControlRecursionType, versionDescriptor?: GitInterfaces.GitVersionDescriptor, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * Gets metadata or content of the wiki page for the provided page id. Content negotiation is done based on the `Accept` header sent in the request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name..
     * @param {number} id - Wiki page ID.
     * @param {GitInterfaces.VersionControlRecursionType} recursionLevel - Recursion level for subpages retrieval. Defaults to `None` (Optional).
     * @param {boolean} includeContent - True to include the content of the page in the response for Json content type. Defaults to false (Optional)
     */
    getPageByIdText(project: string, wikiIdentifier: string, id: number, recursionLevel?: GitInterfaces.VersionControlRecursionType, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * Gets metadata or content of the wiki page for the provided page id. Content negotiation is done based on the `Accept` header sent in the request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name..
     * @param {number} id - Wiki page ID.
     * @param {GitInterfaces.VersionControlRecursionType} recursionLevel - Recursion level for subpages retrieval. Defaults to `None` (Optional).
     * @param {boolean} includeContent - True to include the content of the page in the response for Json content type. Defaults to false (Optional)
     */
    getPageByIdZip(project: string, wikiIdentifier: string, id: number, recursionLevel?: GitInterfaces.VersionControlRecursionType, includeContent?: boolean): Promise<NodeJS.ReadableStream>;
    /**
     * Returns pageable list of Wiki Pages
     *
     * @param {WikiInterfaces.WikiPagesBatchRequest} pagesBatchRequest - Wiki batch page request.
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {GitInterfaces.GitVersionDescriptor} versionDescriptor - GitVersionDescriptor for the page. (Optional in case of ProjectWiki).
     */
    getPagesBatch(pagesBatchRequest: WikiInterfaces.WikiPagesBatchRequest, project: string, wikiIdentifier: string, versionDescriptor?: GitInterfaces.GitVersionDescriptor): Promise<VSSInterfaces.PagedList<WikiInterfaces.WikiPageDetail>>;
    /**
     * Returns page detail corresponding to Page ID.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} pageViewsForDays - last N days from the current day for which page views is to be returned. It's inclusive of current day.
     */
    getPageData(project: string, wikiIdentifier: string, pageId: number, pageViewsForDays?: number): Promise<WikiInterfaces.WikiPageDetail>;
    /**
     * Creates a new page view stats resource or updates an existing page view stats resource.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {GitInterfaces.GitVersionDescriptor} wikiVersion - Wiki version.
     * @param {string} path - Wiki page path.
     * @param {string} oldPath - Old page path. This is optional and required to rename path in existing page view stats.
     */
    createOrUpdatePageViewStats(project: string, wikiIdentifier: string, wikiVersion: GitInterfaces.GitVersionDescriptor, path: string, oldPath?: string): Promise<WikiInterfaces.WikiPageViewStats>;
    /**
     * Creates the wiki resource.
     *
     * @param {WikiInterfaces.WikiCreateParametersV2} wikiCreateParams - Parameters for the wiki creation.
     * @param {string} project - Project ID or project name
     */
    createWiki(wikiCreateParams: WikiInterfaces.WikiCreateParametersV2, project?: string): Promise<WikiInterfaces.WikiV2>;
    /**
     * Deletes the wiki corresponding to the wiki ID or wiki name provided.
     *
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} project - Project ID or project name
     */
    deleteWiki(wikiIdentifier: string, project?: string): Promise<WikiInterfaces.WikiV2>;
    /**
     * Gets all wikis in a project or collection.
     *
     * @param {string} project - Project ID or project name
     */
    getAllWikis(project?: string): Promise<WikiInterfaces.WikiV2[]>;
    /**
     * Gets the wiki corresponding to the wiki ID or wiki name provided.
     *
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} project - Project ID or project name
     */
    getWiki(wikiIdentifier: string, project?: string): Promise<WikiInterfaces.WikiV2>;
    /**
     * Updates the wiki corresponding to the wiki ID or wiki name provided using the update parameters.
     *
     * @param {WikiInterfaces.WikiUpdateParameters} updateParameters - Update parameters.
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} project - Project ID or project name
     */
    updateWiki(updateParameters: WikiInterfaces.WikiUpdateParameters, wikiIdentifier: string, project?: string): Promise<WikiInterfaces.WikiV2>;
}
