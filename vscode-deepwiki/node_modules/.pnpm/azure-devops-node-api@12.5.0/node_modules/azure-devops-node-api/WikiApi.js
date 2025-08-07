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
const Comments_Contracts = require("./interfaces/CommentsInterfaces");
const WikiInterfaces = require("./interfaces/WikiInterfaces");
class WikiApi extends basem.ClientApiBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-Wiki-api', options);
    }
    /**
     * Uploads an attachment on a comment on a wiki page.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     */
    createCommentAttachment(customHeaders, contentStream, project, wikiIdentifier, pageId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "5100d976-363d-42e7-a19d-4171ecb44782", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("POST", url, contentStream, options);
                    let ret = this.formatResponse(res.result, Comments_Contracts.TypeInfo.CommentAttachment, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Downloads an attachment on a comment on a wiki page.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {string} attachmentId - Attachment ID.
     */
    getAttachmentContent(project, wikiIdentifier, pageId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId,
                    attachmentId: attachmentId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "5100d976-363d-42e7-a19d-4171ecb44782", routeValues);
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
     * Add a reaction on a wiki page comment.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name
     * @param {number} pageId - Wiki page ID
     * @param {number} commentId - ID of the associated comment
     * @param {Comments_Contracts.CommentReactionType} type - Type of the reaction being added
     */
    addCommentReaction(project, wikiIdentifier, pageId, commentId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId,
                    commentId: commentId,
                    type: type
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "7a5bc693-aab7-4d48-8f34-36f373022063", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, null, options);
                    let ret = this.formatResponse(res.result, Comments_Contracts.TypeInfo.CommentReaction, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a reaction on a wiki page comment.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or name
     * @param {number} pageId - Wiki page ID
     * @param {number} commentId - ID of the associated comment
     * @param {Comments_Contracts.CommentReactionType} type - Type of the reaction being deleted
     */
    deleteCommentReaction(project, wikiIdentifier, pageId, commentId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId,
                    commentId: commentId,
                    type: type
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "7a5bc693-aab7-4d48-8f34-36f373022063", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, Comments_Contracts.TypeInfo.CommentReaction, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getEngagedUsers(project, wikiIdentifier, pageId, commentId, type, top, skip) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId,
                    commentId: commentId,
                    type: type
                };
                let queryValues = {
                    '$top': top,
                    '$skip': skip,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "598a5268-41a7-4162-b7dc-344131e4d1fa", routeValues, queryValues);
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
     * Add a comment on a wiki page.
     *
     * @param {Comments_Contracts.CommentCreateParameters} request - Comment create request.
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     */
    addComment(request, project, wikiIdentifier, pageId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "9b394e93-7db5-46cb-9c26-09a36aa5c895", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, request, options);
                    let ret = this.formatResponse(res.result, Comments_Contracts.TypeInfo.Comment, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete a comment on a wiki page.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} id - Comment ID.
     */
    deleteComment(project, wikiIdentifier, pageId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "9b394e93-7db5-46cb-9c26-09a36aa5c895", routeValues);
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
     * Returns a comment associated with the Wiki Page.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} id - ID of the comment to return.
     * @param {boolean} excludeDeleted - Specify if the deleted comment should be skipped.
     * @param {Comments_Contracts.CommentExpandOptions} expand - Specifies the additional data retrieval options for comments.
     */
    getComment(project, wikiIdentifier, pageId, id, excludeDeleted, expand) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId,
                    id: id
                };
                let queryValues = {
                    excludeDeleted: excludeDeleted,
                    '$expand': expand,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "9b394e93-7db5-46cb-9c26-09a36aa5c895", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Comments_Contracts.TypeInfo.Comment, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    listComments(project, wikiIdentifier, pageId, top, continuationToken, excludeDeleted, expand, order, parentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId
                };
                let queryValues = {
                    '$top': top,
                    continuationToken: continuationToken,
                    excludeDeleted: excludeDeleted,
                    '$expand': expand,
                    order: order,
                    parentId: parentId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "9b394e93-7db5-46cb-9c26-09a36aa5c895", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, Comments_Contracts.TypeInfo.CommentList, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update a comment on a wiki page.
     *
     * @param {Comments_Contracts.CommentUpdateParameters} comment - Comment update request.
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} id - Comment ID.
     */
    updateComment(comment, project, wikiIdentifier, pageId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId,
                    id: id
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "9b394e93-7db5-46cb-9c26-09a36aa5c895", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, comment, options);
                    let ret = this.formatResponse(res.result, Comments_Contracts.TypeInfo.Comment, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
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
    getPageText(project, wikiIdentifier, path, recursionLevel, versionDescriptor, includeContent) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier
                };
                let queryValues = {
                    path: path,
                    recursionLevel: recursionLevel,
                    versionDescriptor: versionDescriptor,
                    includeContent: includeContent,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "25d3fbc7-fe3d-46cb-b5a5-0b6f79caf27b", routeValues, queryValues);
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
     * Gets metadata or content of the wiki page for the provided path. Content negotiation is done based on the `Accept` header sent in the request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} path - Wiki page path.
     * @param {GitInterfaces.VersionControlRecursionType} recursionLevel - Recursion level for subpages retrieval. Defaults to `None` (Optional).
     * @param {GitInterfaces.GitVersionDescriptor} versionDescriptor - GitVersionDescriptor for the page. Defaults to the default branch (Optional).
     * @param {boolean} includeContent - True to include the content of the page in the response for Json content type. Defaults to false (Optional)
     */
    getPageZip(project, wikiIdentifier, path, recursionLevel, versionDescriptor, includeContent) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier
                };
                let queryValues = {
                    path: path,
                    recursionLevel: recursionLevel,
                    versionDescriptor: versionDescriptor,
                    includeContent: includeContent,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "25d3fbc7-fe3d-46cb-b5a5-0b6f79caf27b", routeValues, queryValues);
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
     * Gets metadata or content of the wiki page for the provided page id. Content negotiation is done based on the `Accept` header sent in the request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name..
     * @param {number} id - Wiki page ID.
     * @param {GitInterfaces.VersionControlRecursionType} recursionLevel - Recursion level for subpages retrieval. Defaults to `None` (Optional).
     * @param {boolean} includeContent - True to include the content of the page in the response for Json content type. Defaults to false (Optional)
     */
    getPageByIdText(project, wikiIdentifier, id, recursionLevel, includeContent) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    id: id
                };
                let queryValues = {
                    recursionLevel: recursionLevel,
                    includeContent: includeContent,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "ceddcf75-1068-452d-8b13-2d4d76e1f970", routeValues, queryValues);
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
     * Gets metadata or content of the wiki page for the provided page id. Content negotiation is done based on the `Accept` header sent in the request.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name..
     * @param {number} id - Wiki page ID.
     * @param {GitInterfaces.VersionControlRecursionType} recursionLevel - Recursion level for subpages retrieval. Defaults to `None` (Optional).
     * @param {boolean} includeContent - True to include the content of the page in the response for Json content type. Defaults to false (Optional)
     */
    getPageByIdZip(project, wikiIdentifier, id, recursionLevel, includeContent) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    id: id
                };
                let queryValues = {
                    recursionLevel: recursionLevel,
                    includeContent: includeContent,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "ceddcf75-1068-452d-8b13-2d4d76e1f970", routeValues, queryValues);
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
     * Returns pageable list of Wiki Pages
     *
     * @param {WikiInterfaces.WikiPagesBatchRequest} pagesBatchRequest - Wiki batch page request.
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {GitInterfaces.GitVersionDescriptor} versionDescriptor - GitVersionDescriptor for the page. (Optional in case of ProjectWiki).
     */
    getPagesBatch(pagesBatchRequest, project, wikiIdentifier, versionDescriptor) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier
                };
                let queryValues = {
                    versionDescriptor: versionDescriptor,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "71323c46-2592-4398-8771-ced73dd87207", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, pagesBatchRequest, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiPageDetail, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns page detail corresponding to Page ID.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {number} pageId - Wiki page ID.
     * @param {number} pageViewsForDays - last N days from the current day for which page views is to be returned. It's inclusive of current day.
     */
    getPageData(project, wikiIdentifier, pageId, pageViewsForDays) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier,
                    pageId: pageId
                };
                let queryValues = {
                    pageViewsForDays: pageViewsForDays,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "81c4e0fe-7663-4d62-ad46-6ab78459f274", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiPageDetail, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a new page view stats resource or updates an existing page view stats resource.
     *
     * @param {string} project - Project ID or project name
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {GitInterfaces.GitVersionDescriptor} wikiVersion - Wiki version.
     * @param {string} path - Wiki page path.
     * @param {string} oldPath - Old page path. This is optional and required to rename path in existing page view stats.
     */
    createOrUpdatePageViewStats(project, wikiIdentifier, wikiVersion, path, oldPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (wikiVersion == null) {
                throw new TypeError('wikiVersion can not be null or undefined');
            }
            if (path == null) {
                throw new TypeError('path can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier
                };
                let queryValues = {
                    wikiVersion: wikiVersion,
                    path: path,
                    oldPath: oldPath,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "wiki", "1087b746-5d15-41b9-bea6-14e325e7f880", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiPageViewStats, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates the wiki resource.
     *
     * @param {WikiInterfaces.WikiCreateParametersV2} wikiCreateParams - Parameters for the wiki creation.
     * @param {string} project - Project ID or project name
     */
    createWiki(wikiCreateParams, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "wiki", "288d122c-dbd4-451d-aa5f-7dbbba070728", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, wikiCreateParams, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiV2, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Deletes the wiki corresponding to the wiki ID or wiki name provided.
     *
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} project - Project ID or project name
     */
    deleteWiki(wikiIdentifier, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "wiki", "288d122c-dbd4-451d-aa5f-7dbbba070728", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiV2, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Gets all wikis in a project or collection.
     *
     * @param {string} project - Project ID or project name
     */
    getAllWikis(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "wiki", "288d122c-dbd4-451d-aa5f-7dbbba070728", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiV2, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Gets the wiki corresponding to the wiki ID or wiki name provided.
     *
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} project - Project ID or project name
     */
    getWiki(wikiIdentifier, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "wiki", "288d122c-dbd4-451d-aa5f-7dbbba070728", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiV2, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Updates the wiki corresponding to the wiki ID or wiki name provided using the update parameters.
     *
     * @param {WikiInterfaces.WikiUpdateParameters} updateParameters - Update parameters.
     * @param {string} wikiIdentifier - Wiki ID or wiki name.
     * @param {string} project - Project ID or project name
     */
    updateWiki(updateParameters, wikiIdentifier, project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    project: project,
                    wikiIdentifier: wikiIdentifier
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "wiki", "288d122c-dbd4-451d-aa5f-7dbbba070728", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, updateParameters, options);
                    let ret = this.formatResponse(res.result, WikiInterfaces.TypeInfo.WikiV2, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
}
WikiApi.RESOURCE_AREA_ID = "bf7d82a0-8aa5-4613-94ef-6172a5ea01f3";
exports.WikiApi = WikiApi;
