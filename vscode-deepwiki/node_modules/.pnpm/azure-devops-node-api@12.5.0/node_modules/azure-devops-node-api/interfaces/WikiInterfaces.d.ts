import GitInterfaces = require("../interfaces/GitInterfaces");
/**
 * Defines a wiki repository which encapsulates the git repository backing the wiki.
 */
export interface Wiki extends WikiCreateParameters {
    /**
     * The head commit associated with the git repository backing up the wiki.
     */
    headCommit?: string;
    /**
     * The ID of the wiki which is same as the ID of the Git repository that it is backed by.
     */
    id?: string;
    /**
     * The git repository that backs up the wiki.
     */
    repository?: GitInterfaces.GitRepository;
}
/**
 * Defines properties for wiki attachment file.
 */
export interface WikiAttachment {
    /**
     * Name of the wiki attachment file.
     */
    name?: string;
    /**
     * Path of the wiki attachment file.
     */
    path?: string;
}
/**
 * Response contract for the Wiki Attachments API
 */
export interface WikiAttachmentResponse {
    /**
     * Defines properties for wiki attachment file.
     */
    attachment?: WikiAttachment;
    /**
     * Contains the list of ETag values from the response header of the attachments API call. The first item in the list contains the version of the wiki attachment.
     */
    eTag?: string[];
}
/**
 * Base wiki creation parameters.
 */
export interface WikiCreateBaseParameters {
    /**
     * Folder path inside repository which is shown as Wiki. Not required for ProjectWiki type.
     */
    mappedPath?: string;
    /**
     * Wiki name.
     */
    name?: string;
    /**
     * ID of the project in which the wiki is to be created.
     */
    projectId?: string;
    /**
     * ID of the git repository that backs up the wiki. Not required for ProjectWiki type.
     */
    repositoryId?: string;
    /**
     * Type of the wiki.
     */
    type?: WikiType;
}
/**
 * Wiki creations parameters.
 */
export interface WikiCreateParameters {
    /**
     * Wiki name.
     */
    name?: string;
    /**
     * ID of the project in which the wiki is to be created.
     */
    projectId?: string;
}
/**
 * Wiki creation parameters.
 */
export interface WikiCreateParametersV2 extends WikiCreateBaseParameters {
    /**
     * Version of the wiki. Not required for ProjectWiki type.
     */
    version?: GitInterfaces.GitVersionDescriptor;
}
/**
 * Defines a page in a wiki.
 */
export interface WikiPage extends WikiPageCreateOrUpdateParameters {
    /**
     * Path of the git item corresponding to the wiki page stored in the backing Git repository.
     */
    gitItemPath?: string;
    /**
     * When present, permanent identifier for the wiki page
     */
    id?: number;
    /**
     * True if a page is non-conforming, i.e. 1) if the name doesn't match page naming standards. 2) if the page does not have a valid entry in the appropriate order file.
     */
    isNonConformant?: boolean;
    /**
     * True if this page has subpages under its path.
     */
    isParentPage?: boolean;
    /**
     * Order of the wiki page, relative to other pages in the same hierarchy level.
     */
    order?: number;
    /**
     * Path of the wiki page.
     */
    path?: string;
    /**
     * Remote web url to the wiki page.
     */
    remoteUrl?: string;
    /**
     * List of subpages of the current page.
     */
    subPages?: WikiPage[];
    /**
     * REST url for this wiki page.
     */
    url?: string;
}
/**
 * Contract encapsulating parameters for the page create or update operations.
 */
export interface WikiPageCreateOrUpdateParameters {
    /**
     * Content of the wiki page.
     */
    content?: string;
}
/**
 * Defines a page with its metedata in a wiki.
 */
export interface WikiPageDetail {
    /**
     * When present, permanent identifier for the wiki page
     */
    id?: number;
    /**
     * Path of the wiki page.
     */
    path?: string;
    /**
     * Path of the wiki page.
     */
    viewStats?: WikiPageStat[];
}
/**
 * Request contract for Wiki Page Move.
 */
export interface WikiPageMove extends WikiPageMoveParameters {
    /**
     * Resultant page of this page move operation.
     */
    page?: WikiPage;
}
/**
 * Contract encapsulating parameters for the page move operation.
 */
export interface WikiPageMoveParameters {
    /**
     * New order of the wiki page.
     */
    newOrder?: number;
    /**
     * New path of the wiki page.
     */
    newPath?: string;
    /**
     * Current path of the wiki page.
     */
    path?: string;
}
/**
 * Response contract for the Wiki Page Move API.
 */
export interface WikiPageMoveResponse {
    /**
     * Contains the list of ETag values from the response header of the page move API call. The first item in the list contains the version of the wiki page subject to page move.
     */
    eTag?: string[];
    /**
     * Defines properties for wiki page move.
     */
    pageMove?: WikiPageMove;
}
/**
 * Response contract for the Wiki Pages PUT, PATCH and DELETE APIs.
 */
export interface WikiPageResponse {
    /**
     * Contains the list of ETag values from the response header of the pages API call. The first item in the list contains the version of the wiki page.
     */
    eTag?: string[];
    /**
     * Defines properties for wiki page.
     */
    page?: WikiPage;
}
/**
 * Contract encapsulating parameters for the pages batch.
 */
export interface WikiPagesBatchRequest {
    /**
     * If the list of page data returned is not complete, a continuation token to query next batch of pages is included in the response header as "x-ms-continuationtoken". Omit this parameter to get the first batch of Wiki Page Data.
     */
    continuationToken?: string;
    /**
     * last N days from the current day for which page views is to be returned. It's inclusive of current day.
     */
    pageViewsForDays?: number;
    /**
     * Total count of pages on a wiki to return.
     */
    top?: number;
}
/**
 * Defines properties for wiki page stat.
 */
export interface WikiPageStat {
    /**
     * the count of the stat for the Day
     */
    count?: number;
    /**
     * Day of the stat
     */
    day?: Date;
}
/**
 * Defines properties for wiki page view stats.
 */
export interface WikiPageViewStats {
    /**
     * Wiki page view count.
     */
    count?: number;
    /**
     * Wiki page last viewed time.
     */
    lastViewedTime?: Date;
    /**
     * Wiki page path.
     */
    path?: string;
}
/**
 * Wiki types.
 */
export declare enum WikiType {
    /**
     * Indicates that the wiki is provisioned for the team project
     */
    ProjectWiki = 0,
    /**
     * Indicates that the wiki is published from a git repository
     */
    CodeWiki = 1
}
export interface WikiUpdatedNotificationMessage {
    /**
     * Collection host Id for which the wikis are updated.
     */
    collectionId?: string;
    /**
     * Project Id for which the wikis are updated.
     */
    projectId?: string;
    /**
     * Repository Id associated with the particular wiki which is added, updated or deleted.
     */
    repositoryId?: string;
}
/**
 * Wiki update parameters.
 */
export interface WikiUpdateParameters {
    /**
     * Name for wiki.
     */
    name?: string;
    /**
     * Versions of the wiki.
     */
    versions?: GitInterfaces.GitVersionDescriptor[];
}
/**
 * Defines a wiki resource.
 */
export interface WikiV2 extends WikiCreateBaseParameters {
    /**
     * ID of the wiki.
     */
    id?: string;
    /**
     * Is wiki repository disabled
     */
    isDisabled?: boolean;
    /**
     * Properties of the wiki.
     */
    properties?: {
        [key: string]: string;
    };
    /**
     * Remote web url to the wiki.
     */
    remoteUrl?: string;
    /**
     * REST url for this wiki.
     */
    url?: string;
    /**
     * Versions of the wiki.
     */
    versions?: GitInterfaces.GitVersionDescriptor[];
}
export declare var TypeInfo: {
    Wiki: any;
    WikiCreateBaseParameters: any;
    WikiCreateParametersV2: any;
    WikiPageDetail: any;
    WikiPageStat: any;
    WikiPageViewStats: any;
    WikiType: {
        enumValues: {
            "projectWiki": number;
            "codeWiki": number;
        };
    };
    WikiUpdateParameters: any;
    WikiV2: any;
};
