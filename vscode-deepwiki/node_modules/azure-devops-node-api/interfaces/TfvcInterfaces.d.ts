import TfsCoreInterfaces = require("../interfaces/CoreInterfaces");
import VSSInterfaces = require("../interfaces/common/VSSInterfaces");
export interface AssociatedWorkItem {
    assignedTo?: string;
    /**
     * Id of associated the work item.
     */
    id?: number;
    state?: string;
    title?: string;
    /**
     * REST Url of the work item.
     */
    url?: string;
    webUrl?: string;
    workItemType?: string;
}
export interface Change<T> {
    /**
     * The type of change that was made to the item.
     */
    changeType?: VersionControlChangeType;
    /**
     * Current version.
     */
    item?: T;
    /**
     * Content of the item after the change.
     */
    newContent?: ItemContent;
    /**
     * Path of the item on the server.
     */
    sourceServerItem?: string;
    /**
     * URL to retrieve the item.
     */
    url?: string;
}
export interface CheckinNote {
    name?: string;
    value?: string;
}
export interface FileContentMetadata {
    contentType?: string;
    encoding?: number;
    extension?: string;
    fileName?: string;
    isBinary?: boolean;
    isImage?: boolean;
    vsLink?: string;
}
export interface GitRepository {
    _links?: any;
    defaultBranch?: string;
    id?: string;
    /**
     * True if the repository is disabled. False otherwise.
     */
    isDisabled?: boolean;
    /**
     * True if the repository was created as a fork.
     */
    isFork?: boolean;
    /**
     * True if the repository is in maintenance. False otherwise.
     */
    isInMaintenance?: boolean;
    name?: string;
    parentRepository?: GitRepositoryRef;
    project?: TfsCoreInterfaces.TeamProjectReference;
    remoteUrl?: string;
    /**
     * Compressed size (bytes) of the repository.
     */
    size?: number;
    sshUrl?: string;
    url?: string;
    validRemoteUrls?: string[];
    webUrl?: string;
}
export interface GitRepositoryRef {
    /**
     * Team Project Collection where this Fork resides
     */
    collection?: TfsCoreInterfaces.TeamProjectCollectionReference;
    id?: string;
    /**
     * True if the repository was created as a fork
     */
    isFork?: boolean;
    name?: string;
    project?: TfsCoreInterfaces.TeamProjectReference;
    remoteUrl?: string;
    sshUrl?: string;
    url?: string;
}
export interface ItemContent {
    content?: string;
    contentType?: ItemContentType;
}
export declare enum ItemContentType {
    RawText = 0,
    Base64Encoded = 1
}
export interface ItemModel {
    _links?: any;
    content?: string;
    contentMetadata?: FileContentMetadata;
    isFolder?: boolean;
    isSymLink?: boolean;
    path?: string;
    url?: string;
}
/**
 * Class representing a branch object.
 */
export interface TfvcBranch extends TfvcBranchRef {
    /**
     * List of children for the branch.
     */
    children?: TfvcBranch[];
    /**
     * List of branch mappings.
     */
    mappings?: TfvcBranchMapping[];
    /**
     * Path of the branch's parent.
     */
    parent?: TfvcShallowBranchRef;
    /**
     * List of paths of the related branches.
     */
    relatedBranches?: TfvcShallowBranchRef[];
}
/**
 * A branch mapping.
 */
export interface TfvcBranchMapping {
    /**
     * Depth of the branch.
     */
    depth?: string;
    /**
     * Server item for the branch.
     */
    serverItem?: string;
    /**
     * Type of the branch.
     */
    type?: string;
}
/**
 * Metadata for a branchref.
 */
export interface TfvcBranchRef extends TfvcShallowBranchRef {
    /**
     * A collection of REST reference links.
     */
    _links?: any;
    /**
     * Creation date of the branch.
     */
    createdDate?: Date;
    /**
     * Branch description.
     */
    description?: string;
    /**
     * Is the branch deleted?
     */
    isDeleted?: boolean;
    /**
     * Alias or display name of user
     */
    owner?: VSSInterfaces.IdentityRef;
    /**
     * URL to retrieve the item.
     */
    url?: string;
}
/**
 * A change.
 */
export interface TfvcChange extends Change<TfvcItem> {
    /**
     * List of merge sources in case of rename or branch creation.
     */
    mergeSources?: TfvcMergeSource[];
    /**
     * Version at which a (shelved) change was pended against
     */
    pendingVersion?: number;
}
/**
 * A collection of changes.
 */
export interface TfvcChangeset extends TfvcChangesetRef {
    /**
     * Changeset Account Id also known as Organization Id.
     */
    accountId?: string;
    /**
     * List of associated changes.
     */
    changes?: TfvcChange[];
    /**
     * List of Checkin Notes for the changeset.
     */
    checkinNotes?: CheckinNote[];
    /**
     * Changeset collection Id.
     */
    collectionId?: string;
    /**
     * True if more changes are available.
     */
    hasMoreChanges?: boolean;
    /**
     * Policy Override for the changeset.
     */
    policyOverride?: TfvcPolicyOverrideInfo;
    /**
     * Team Project Ids for the changeset.
     */
    teamProjectIds?: string[];
    /**
     * List of work items associated with the changeset.
     */
    workItems?: AssociatedWorkItem[];
}
/**
 * Metadata for a changeset.
 */
export interface TfvcChangesetRef {
    /**
     * A collection of REST reference links.
     */
    _links?: any;
    /**
     * Alias or display name of user.
     */
    author?: VSSInterfaces.IdentityRef;
    /**
     * Changeset Id.
     */
    changesetId?: number;
    /**
     * Alias or display name of user.
     */
    checkedInBy?: VSSInterfaces.IdentityRef;
    /**
     * Comment for the changeset.
     */
    comment?: string;
    /**
     * Was the Comment result truncated?
     */
    commentTruncated?: boolean;
    /**
     * Creation date of the changeset.
     */
    createdDate?: Date;
    /**
     * URL to retrieve the item.
     */
    url?: string;
}
/**
 * Criteria used in a search for change lists.
 */
export interface TfvcChangesetSearchCriteria {
    /**
     * Alias or display name of user who made the changes.
     */
    author?: string;
    /**
     * Whether or not to follow renames for the given item being queried.
     */
    followRenames?: boolean;
    /**
     * If provided, only include changesets created after this date (string).
     */
    fromDate?: string;
    /**
     * If provided, only include changesets after this changesetID.
     */
    fromId?: number;
    /**
     * Whether to include the _links field on the shallow references.
     */
    includeLinks?: boolean;
    /**
     * Path of item to search under.
     */
    itemPath?: string;
    mappings?: TfvcMappingFilter[];
    /**
     * If provided, only include changesets created before this date (string).
     */
    toDate?: string;
    /**
     * If provided, a version descriptor for the latest change list to include.
     */
    toId?: number;
}
/**
 * Request body for Get batched changesets.
 */
export interface TfvcChangesetsRequestData {
    /**
     * List of changeset Ids.
     */
    changesetIds?: number[];
    /**
     * Max length of the comment.
     */
    commentLength?: number;
    /**
     * Whether to include the _links field on the shallow references
     */
    includeLinks?: boolean;
}
/**
 * Metadata for an item.
 */
export interface TfvcItem extends ItemModel {
    /**
     * Item changed datetime.
     */
    changeDate?: Date;
    /**
     * Greater than 0 if item is deleted.
     */
    deletionId?: number;
    /**
     * File encoding from database, -1 represents binary.
     */
    encoding?: number;
    /**
     * MD5 hash as a base 64 string, applies to files only.
     */
    hashValue?: string;
    /**
     * True if item is a branch.
     */
    isBranch?: boolean;
    /**
     * True if there is a change pending.
     */
    isPendingChange?: boolean;
    /**
     * The size of the file, if applicable.
     */
    size?: number;
    /**
     * Changeset version Id.
     */
    version?: number;
}
/**
 * Item path and Version descriptor properties
 */
export interface TfvcItemDescriptor {
    /**
     * Item path.
     */
    path?: string;
    /**
     * Defaults to OneLevel.
     */
    recursionLevel?: VersionControlRecursionType;
    /**
     * Specify the desired version, can be null or empty string only if VersionType is latest or tip.
     */
    version?: string;
    /**
     * Defaults to None.
     */
    versionOption?: TfvcVersionOption;
    /**
     * Defaults to Latest.
     */
    versionType?: TfvcVersionType;
}
/**
 * Request body used by Get Items Batch
 */
export interface TfvcItemRequestData {
    /**
     * If true, include metadata about the file type
     */
    includeContentMetadata?: boolean;
    /**
     * Whether to include the _links field on the shallow references
     */
    includeLinks?: boolean;
    itemDescriptors?: TfvcItemDescriptor[];
}
/**
 * Metadata for a label.
 */
export interface TfvcLabel extends TfvcLabelRef {
    /**
     * List of items.
     */
    items?: TfvcItem[];
}
/**
 * Metadata for a Label.
 */
export interface TfvcLabelRef {
    /**
     * Collection of reference links.
     */
    _links?: any;
    /**
     * Label description.
     */
    description?: string;
    /**
     * Label Id.
     */
    id?: number;
    /**
     * Label scope.
     */
    labelScope?: string;
    /**
     * Last modified datetime for the label.
     */
    modifiedDate?: Date;
    /**
     * Label name.
     */
    name?: string;
    /**
     * Label owner.
     */
    owner?: VSSInterfaces.IdentityRef;
    /**
     * Label Url.
     */
    url?: string;
}
export interface TfvcLabelRequestData {
    /**
     * Whether to include the _links field on the shallow references
     */
    includeLinks?: boolean;
    itemLabelFilter?: string;
    labelScope?: string;
    maxItemCount?: number;
    name?: string;
    owner?: string;
}
/**
 * MappingFilter can be used to include or exclude specific paths.
 */
export interface TfvcMappingFilter {
    /**
     * True if ServerPath should be excluded.
     */
    exclude?: boolean;
    /**
     * Path to be included or excluded.
     */
    serverPath?: string;
}
export interface TfvcMergeSource {
    /**
     * Indicates if this a rename source. If false, it is a merge source.
     */
    isRename?: boolean;
    /**
     * The server item of the merge source.
     */
    serverItem?: string;
    /**
     * Start of the version range.
     */
    versionFrom?: number;
    /**
     * End of the version range.
     */
    versionTo?: number;
}
/**
 * Policy failure information.
 */
export interface TfvcPolicyFailureInfo {
    /**
     * Policy failure message.
     */
    message?: string;
    /**
     * Name of the policy that failed.
     */
    policyName?: string;
}
/**
 * Information on the policy override.
 */
export interface TfvcPolicyOverrideInfo {
    /**
     * Overidden policy comment.
     */
    comment?: string;
    /**
     * Information on the failed policy that was overridden.
     */
    policyFailures?: TfvcPolicyFailureInfo[];
}
/**
 * This is the shallow branchref class.
 */
export interface TfvcShallowBranchRef {
    /**
     * Path for the branch.
     */
    path?: string;
}
/**
 * Metadata for a shelveset.
 */
export interface TfvcShelveset extends TfvcShelvesetRef {
    /**
     * List of changes.
     */
    changes?: TfvcChange[];
    /**
     * List of checkin notes.
     */
    notes?: CheckinNote[];
    /**
     * Policy override information if applicable.
     */
    policyOverride?: TfvcPolicyOverrideInfo;
    /**
     * List of associated workitems.
     */
    workItems?: AssociatedWorkItem[];
}
/**
 * Metadata for a shallow shelveset.
 */
export interface TfvcShelvesetRef {
    /**
     * List of reference links for the shelveset.
     */
    _links?: any;
    /**
     * Shelveset comment.
     */
    comment?: string;
    /**
     * Shelveset comment truncated as applicable.
     */
    commentTruncated?: boolean;
    /**
     * Shelveset create date.
     */
    createdDate?: Date;
    /**
     * Shelveset Id.
     */
    id?: string;
    /**
     * Shelveset name.
     */
    name?: string;
    /**
     * Shelveset Owner.
     */
    owner?: VSSInterfaces.IdentityRef;
    /**
     * Shelveset Url.
     */
    url?: string;
}
export interface TfvcShelvesetRequestData {
    /**
     * Whether to include policyOverride and notes Only applies when requesting a single deep shelveset
     */
    includeDetails?: boolean;
    /**
     * Whether to include the _links field on the shallow references. Does not apply when requesting a single deep shelveset object. Links will always be included in the deep shelveset.
     */
    includeLinks?: boolean;
    /**
     * Whether to include workItems
     */
    includeWorkItems?: boolean;
    /**
     * Max number of changes to include
     */
    maxChangeCount?: number;
    /**
     * Max length of comment
     */
    maxCommentLength?: number;
    /**
     * Shelveset name
     */
    name?: string;
    /**
     * Owner's ID. Could be a name or a guid.
     */
    owner?: string;
}
export interface TfvcStatistics {
    /**
     * Id of the last changeset the stats are based on.
     */
    changesetId?: number;
    /**
     * Count of files at the requested scope.
     */
    fileCountTotal?: number;
}
/**
 * Version descriptor properties.
 */
export interface TfvcVersionDescriptor {
    /**
     * Version object.
     */
    version?: string;
    versionOption?: TfvcVersionOption;
    versionType?: TfvcVersionType;
}
/**
 * Options for Version handling.
 */
export declare enum TfvcVersionOption {
    /**
     * None.
     */
    None = 0,
    /**
     * Return the previous version.
     */
    Previous = 1,
    /**
     * Only usuable with versiontype MergeSource and integer versions, uses RenameSource identifier instead of Merge identifier.
     */
    UseRename = 2
}
/**
 * Type of Version object
 */
export declare enum TfvcVersionType {
    /**
     * Version is treated as a ChangesetId.
     */
    None = 0,
    /**
     * Version is treated as a ChangesetId.
     */
    Changeset = 1,
    /**
     * Version is treated as a Shelveset name and owner.
     */
    Shelveset = 2,
    /**
     * Version is treated as a Change.
     */
    Change = 3,
    /**
     * Version is treated as a Date.
     */
    Date = 4,
    /**
     * If Version is defined the Latest of that Version will be used, if no version is defined the latest ChangesetId will be used.
     */
    Latest = 5,
    /**
     * Version will be treated as a Tip, if no version is defined latest will be used.
     */
    Tip = 6,
    /**
     * Version will be treated as a MergeSource.
     */
    MergeSource = 7
}
export declare enum VersionControlChangeType {
    None = 0,
    Add = 1,
    Edit = 2,
    Encoding = 4,
    Rename = 8,
    Delete = 16,
    Undelete = 32,
    Branch = 64,
    Merge = 128,
    Lock = 256,
    Rollback = 512,
    SourceRename = 1024,
    TargetRename = 2048,
    Property = 4096,
    All = 8191
}
export interface VersionControlProjectInfo {
    defaultSourceControlType?: TfsCoreInterfaces.SourceControlTypes;
    project?: TfsCoreInterfaces.TeamProjectReference;
    supportsGit?: boolean;
    supportsTFVC?: boolean;
}
export declare enum VersionControlRecursionType {
    /**
     * Only return the specified item.
     */
    None = 0,
    /**
     * Return the specified item and its direct children.
     */
    OneLevel = 1,
    /**
     * Return the specified item and its direct children, as well as recursive chains of nested child folders that only contain a single folder.
     */
    OneLevelPlusNestedEmptyFolders = 4,
    /**
     * Return specified item and all descendants
     */
    Full = 120
}
export declare var TypeInfo: {
    Change: any;
    GitRepository: any;
    GitRepositoryRef: any;
    ItemContent: any;
    ItemContentType: {
        enumValues: {
            "rawText": number;
            "base64Encoded": number;
        };
    };
    TfvcBranch: any;
    TfvcBranchRef: any;
    TfvcChange: any;
    TfvcChangeset: any;
    TfvcChangesetRef: any;
    TfvcItem: any;
    TfvcItemDescriptor: any;
    TfvcItemRequestData: any;
    TfvcLabel: any;
    TfvcLabelRef: any;
    TfvcShelveset: any;
    TfvcShelvesetRef: any;
    TfvcVersionDescriptor: any;
    TfvcVersionOption: {
        enumValues: {
            "none": number;
            "previous": number;
            "useRename": number;
        };
    };
    TfvcVersionType: {
        enumValues: {
            "none": number;
            "changeset": number;
            "shelveset": number;
            "change": number;
            "date": number;
            "latest": number;
            "tip": number;
            "mergeSource": number;
        };
    };
    VersionControlChangeType: {
        enumValues: {
            "none": number;
            "add": number;
            "edit": number;
            "encoding": number;
            "rename": number;
            "delete": number;
            "undelete": number;
            "branch": number;
            "merge": number;
            "lock": number;
            "rollback": number;
            "sourceRename": number;
            "targetRename": number;
            "property": number;
            "all": number;
        };
    };
    VersionControlProjectInfo: any;
    VersionControlRecursionType: {
        enumValues: {
            "none": number;
            "oneLevel": number;
            "oneLevelPlusNestedEmptyFolders": number;
            "full": number;
        };
    };
};
