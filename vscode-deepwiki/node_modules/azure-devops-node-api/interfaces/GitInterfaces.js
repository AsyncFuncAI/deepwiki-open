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
const PolicyInterfaces = require("../interfaces/PolicyInterfaces");
const TfsCoreInterfaces = require("../interfaces/CoreInterfaces");
/**
 * The status of a comment thread.
 */
var CommentThreadStatus;
(function (CommentThreadStatus) {
    /**
     * The thread status is unknown.
     */
    CommentThreadStatus[CommentThreadStatus["Unknown"] = 0] = "Unknown";
    /**
     * The thread status is active.
     */
    CommentThreadStatus[CommentThreadStatus["Active"] = 1] = "Active";
    /**
     * The thread status is resolved as fixed.
     */
    CommentThreadStatus[CommentThreadStatus["Fixed"] = 2] = "Fixed";
    /**
     * The thread status is resolved as won't fix.
     */
    CommentThreadStatus[CommentThreadStatus["WontFix"] = 3] = "WontFix";
    /**
     * The thread status is closed.
     */
    CommentThreadStatus[CommentThreadStatus["Closed"] = 4] = "Closed";
    /**
     * The thread status is resolved as by design.
     */
    CommentThreadStatus[CommentThreadStatus["ByDesign"] = 5] = "ByDesign";
    /**
     * The thread status is pending.
     */
    CommentThreadStatus[CommentThreadStatus["Pending"] = 6] = "Pending";
})(CommentThreadStatus = exports.CommentThreadStatus || (exports.CommentThreadStatus = {}));
/**
 * The type of a comment.
 */
var CommentType;
(function (CommentType) {
    /**
     * The comment type is not known.
     */
    CommentType[CommentType["Unknown"] = 0] = "Unknown";
    /**
     * This is a regular user comment.
     */
    CommentType[CommentType["Text"] = 1] = "Text";
    /**
     * The comment comes as a result of a code change.
     */
    CommentType[CommentType["CodeChange"] = 2] = "CodeChange";
    /**
     * The comment represents a system message.
     */
    CommentType[CommentType["System"] = 3] = "System";
})(CommentType = exports.CommentType || (exports.CommentType = {}));
/**
 * Current status of the asynchronous operation.
 */
var GitAsyncOperationStatus;
(function (GitAsyncOperationStatus) {
    /**
     * The operation is waiting in a queue and has not yet started.
     */
    GitAsyncOperationStatus[GitAsyncOperationStatus["Queued"] = 1] = "Queued";
    /**
     * The operation is currently in progress.
     */
    GitAsyncOperationStatus[GitAsyncOperationStatus["InProgress"] = 2] = "InProgress";
    /**
     * The operation has completed.
     */
    GitAsyncOperationStatus[GitAsyncOperationStatus["Completed"] = 3] = "Completed";
    /**
     * The operation has failed. Check for an error message.
     */
    GitAsyncOperationStatus[GitAsyncOperationStatus["Failed"] = 4] = "Failed";
    /**
     * The operation has been abandoned.
     */
    GitAsyncOperationStatus[GitAsyncOperationStatus["Abandoned"] = 5] = "Abandoned";
})(GitAsyncOperationStatus = exports.GitAsyncOperationStatus || (exports.GitAsyncOperationStatus = {}));
var GitAsyncRefOperationFailureStatus;
(function (GitAsyncRefOperationFailureStatus) {
    /**
     * No status
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["None"] = 0] = "None";
    /**
     * Indicates that the ref update request could not be completed because the ref name presented in the request was not valid.
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["InvalidRefName"] = 1] = "InvalidRefName";
    /**
     * The ref update could not be completed because, in case-insensitive mode, the ref name conflicts with an existing, differently-cased ref name.
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["RefNameConflict"] = 2] = "RefNameConflict";
    /**
     * The ref update request could not be completed because the user lacks the permission to create a branch
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["CreateBranchPermissionRequired"] = 3] = "CreateBranchPermissionRequired";
    /**
     * The ref update request could not be completed because the user lacks write permissions required to write this ref
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["WritePermissionRequired"] = 4] = "WritePermissionRequired";
    /**
     * Target branch was deleted after Git async operation started
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["TargetBranchDeleted"] = 5] = "TargetBranchDeleted";
    /**
     * Git object is too large to materialize into memory
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["GitObjectTooLarge"] = 6] = "GitObjectTooLarge";
    /**
     * Identity who authorized the operation was not found
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["OperationIndentityNotFound"] = 7] = "OperationIndentityNotFound";
    /**
     * Async operation was not found
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["AsyncOperationNotFound"] = 8] = "AsyncOperationNotFound";
    /**
     * Unexpected failure
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["Other"] = 9] = "Other";
    /**
     * Initiator of async operation has signature with empty name or email
     */
    GitAsyncRefOperationFailureStatus[GitAsyncRefOperationFailureStatus["EmptyCommitterSignature"] = 10] = "EmptyCommitterSignature";
})(GitAsyncRefOperationFailureStatus = exports.GitAsyncRefOperationFailureStatus || (exports.GitAsyncRefOperationFailureStatus = {}));
/**
 * The type of a merge conflict.
 */
var GitConflictType;
(function (GitConflictType) {
    /**
     * No conflict
     */
    GitConflictType[GitConflictType["None"] = 0] = "None";
    /**
     * Added on source and target; content differs
     */
    GitConflictType[GitConflictType["AddAdd"] = 1] = "AddAdd";
    /**
     * Added on source and rename destination on target
     */
    GitConflictType[GitConflictType["AddRename"] = 2] = "AddRename";
    /**
     * Deleted on source and edited on target
     */
    GitConflictType[GitConflictType["DeleteEdit"] = 3] = "DeleteEdit";
    /**
     * Deleted on source and renamed on target
     */
    GitConflictType[GitConflictType["DeleteRename"] = 4] = "DeleteRename";
    /**
     * Path is a directory on source and a file on target
     */
    GitConflictType[GitConflictType["DirectoryFile"] = 5] = "DirectoryFile";
    /**
     * Children of directory which has DirectoryFile or FileDirectory conflict
     */
    GitConflictType[GitConflictType["DirectoryChild"] = 6] = "DirectoryChild";
    /**
     * Edited on source and deleted on target
     */
    GitConflictType[GitConflictType["EditDelete"] = 7] = "EditDelete";
    /**
     * Edited on source and target; content differs
     */
    GitConflictType[GitConflictType["EditEdit"] = 8] = "EditEdit";
    /**
     * Path is a file on source and a directory on target
     */
    GitConflictType[GitConflictType["FileDirectory"] = 9] = "FileDirectory";
    /**
     * Same file renamed on both source and target; destination paths differ
     */
    GitConflictType[GitConflictType["Rename1to2"] = 10] = "Rename1to2";
    /**
     * Different files renamed to same destination path on both source and target
     */
    GitConflictType[GitConflictType["Rename2to1"] = 11] = "Rename2to1";
    /**
     * Rename destination on source and new file on target
     */
    GitConflictType[GitConflictType["RenameAdd"] = 12] = "RenameAdd";
    /**
     * Renamed on source and deleted on target
     */
    GitConflictType[GitConflictType["RenameDelete"] = 13] = "RenameDelete";
    /**
     * Rename destination on both source and target; content differs
     */
    GitConflictType[GitConflictType["RenameRename"] = 14] = "RenameRename";
})(GitConflictType = exports.GitConflictType || (exports.GitConflictType = {}));
/**
 * Represents the possible outcomes from a request to update a pull request conflict
 */
var GitConflictUpdateStatus;
(function (GitConflictUpdateStatus) {
    /**
     * Indicates that pull request conflict update request was completed successfully
     */
    GitConflictUpdateStatus[GitConflictUpdateStatus["Succeeded"] = 0] = "Succeeded";
    /**
     * Indicates that the update request did not fit the expected data contract
     */
    GitConflictUpdateStatus[GitConflictUpdateStatus["BadRequest"] = 1] = "BadRequest";
    /**
     * Indicates that the requested resolution was not valid
     */
    GitConflictUpdateStatus[GitConflictUpdateStatus["InvalidResolution"] = 2] = "InvalidResolution";
    /**
     * Indicates that the conflict in the update request was not a supported conflict type
     */
    GitConflictUpdateStatus[GitConflictUpdateStatus["UnsupportedConflictType"] = 3] = "UnsupportedConflictType";
    /**
     * Indicates that the conflict could not be found
     */
    GitConflictUpdateStatus[GitConflictUpdateStatus["NotFound"] = 4] = "NotFound";
})(GitConflictUpdateStatus = exports.GitConflictUpdateStatus || (exports.GitConflictUpdateStatus = {}));
/**
 * Accepted types of version
 */
var GitHistoryMode;
(function (GitHistoryMode) {
    /**
     * The history mode used by `git log`. This is the default.
     */
    GitHistoryMode[GitHistoryMode["SimplifiedHistory"] = 0] = "SimplifiedHistory";
    /**
     * The history mode used by `git log --first-parent`
     */
    GitHistoryMode[GitHistoryMode["FirstParent"] = 1] = "FirstParent";
    /**
     * The history mode used by `git log --full-history`
     */
    GitHistoryMode[GitHistoryMode["FullHistory"] = 2] = "FullHistory";
    /**
     * The history mode used by `git log --full-history --simplify-merges`
     */
    GitHistoryMode[GitHistoryMode["FullHistorySimplifyMerges"] = 3] = "FullHistorySimplifyMerges";
})(GitHistoryMode = exports.GitHistoryMode || (exports.GitHistoryMode = {}));
var GitObjectType;
(function (GitObjectType) {
    GitObjectType[GitObjectType["Bad"] = 0] = "Bad";
    GitObjectType[GitObjectType["Commit"] = 1] = "Commit";
    GitObjectType[GitObjectType["Tree"] = 2] = "Tree";
    GitObjectType[GitObjectType["Blob"] = 3] = "Blob";
    GitObjectType[GitObjectType["Tag"] = 4] = "Tag";
    GitObjectType[GitObjectType["Ext2"] = 5] = "Ext2";
    GitObjectType[GitObjectType["OfsDelta"] = 6] = "OfsDelta";
    GitObjectType[GitObjectType["RefDelta"] = 7] = "RefDelta";
})(GitObjectType = exports.GitObjectType || (exports.GitObjectType = {}));
var GitPathActions;
(function (GitPathActions) {
    GitPathActions[GitPathActions["None"] = 0] = "None";
    GitPathActions[GitPathActions["Edit"] = 1] = "Edit";
    GitPathActions[GitPathActions["Delete"] = 2] = "Delete";
    GitPathActions[GitPathActions["Add"] = 3] = "Add";
    GitPathActions[GitPathActions["Rename"] = 4] = "Rename";
})(GitPathActions = exports.GitPathActions || (exports.GitPathActions = {}));
/**
 * Enumeration of possible merge strategies which can be used to complete a pull request.
 */
var GitPullRequestMergeStrategy;
(function (GitPullRequestMergeStrategy) {
    /**
     * A two-parent, no-fast-forward merge. The source branch is unchanged. This is the default behavior.
     */
    GitPullRequestMergeStrategy[GitPullRequestMergeStrategy["NoFastForward"] = 1] = "NoFastForward";
    /**
     * Put all changes from the pull request into a single-parent commit.
     */
    GitPullRequestMergeStrategy[GitPullRequestMergeStrategy["Squash"] = 2] = "Squash";
    /**
     * Rebase the source branch on top of the target branch HEAD commit, and fast-forward the target branch. The source branch is updated during the rebase operation.
     */
    GitPullRequestMergeStrategy[GitPullRequestMergeStrategy["Rebase"] = 3] = "Rebase";
    /**
     * Rebase the source branch on top of the target branch HEAD commit, and create a two-parent, no-fast-forward merge. The source branch is updated during the rebase operation.
     */
    GitPullRequestMergeStrategy[GitPullRequestMergeStrategy["RebaseMerge"] = 4] = "RebaseMerge";
})(GitPullRequestMergeStrategy = exports.GitPullRequestMergeStrategy || (exports.GitPullRequestMergeStrategy = {}));
/**
 * Accepted types of pull request queries.
 */
var GitPullRequestQueryType;
(function (GitPullRequestQueryType) {
    /**
     * No query type set.
     */
    GitPullRequestQueryType[GitPullRequestQueryType["NotSet"] = 0] = "NotSet";
    /**
     * Search for pull requests that created the supplied merge commits.
     */
    GitPullRequestQueryType[GitPullRequestQueryType["LastMergeCommit"] = 1] = "LastMergeCommit";
    /**
     * Search for pull requests that merged the supplied commits.
     */
    GitPullRequestQueryType[GitPullRequestQueryType["Commit"] = 2] = "Commit";
})(GitPullRequestQueryType = exports.GitPullRequestQueryType || (exports.GitPullRequestQueryType = {}));
var GitPullRequestReviewFileType;
(function (GitPullRequestReviewFileType) {
    GitPullRequestReviewFileType[GitPullRequestReviewFileType["ChangeEntry"] = 0] = "ChangeEntry";
    GitPullRequestReviewFileType[GitPullRequestReviewFileType["Attachment"] = 1] = "Attachment";
})(GitPullRequestReviewFileType = exports.GitPullRequestReviewFileType || (exports.GitPullRequestReviewFileType = {}));
/**
 * Search type on ref name
 */
var GitRefSearchType;
(function (GitRefSearchType) {
    GitRefSearchType[GitRefSearchType["Exact"] = 0] = "Exact";
    GitRefSearchType[GitRefSearchType["StartsWith"] = 1] = "StartsWith";
    GitRefSearchType[GitRefSearchType["Contains"] = 2] = "Contains";
})(GitRefSearchType = exports.GitRefSearchType || (exports.GitRefSearchType = {}));
/**
 * Enumerates the modes under which ref updates can be written to their repositories.
 */
var GitRefUpdateMode;
(function (GitRefUpdateMode) {
    /**
     * Indicates the Git protocol model where any refs that can be updated will be updated, but any failures will not prevent other updates from succeeding.
     */
    GitRefUpdateMode[GitRefUpdateMode["BestEffort"] = 0] = "BestEffort";
    /**
     * Indicates that all ref updates must succeed or none will succeed. All ref updates will be atomically written. If any failure is encountered, previously successful updates will be rolled back and the entire operation will fail.
     */
    GitRefUpdateMode[GitRefUpdateMode["AllOrNone"] = 1] = "AllOrNone";
})(GitRefUpdateMode = exports.GitRefUpdateMode || (exports.GitRefUpdateMode = {}));
/**
 * Represents the possible outcomes from a request to update a ref in a repository.
 */
var GitRefUpdateStatus;
(function (GitRefUpdateStatus) {
    /**
     * Indicates that the ref update request was completed successfully.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["Succeeded"] = 0] = "Succeeded";
    /**
     * Indicates that the ref update request could not be completed because part of the graph would be disconnected by this change, and the caller does not have ForcePush permission on the repository.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["ForcePushRequired"] = 1] = "ForcePushRequired";
    /**
     * Indicates that the ref update request could not be completed because the old object ID presented in the request was not the object ID of the ref when the database attempted the update. The most likely scenario is that the caller lost a race to update the ref.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["StaleOldObjectId"] = 2] = "StaleOldObjectId";
    /**
     * Indicates that the ref update request could not be completed because the ref name presented in the request was not valid.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["InvalidRefName"] = 3] = "InvalidRefName";
    /**
     * The request was not processed
     */
    GitRefUpdateStatus[GitRefUpdateStatus["Unprocessed"] = 4] = "Unprocessed";
    /**
     * The ref update request could not be completed because the new object ID for the ref could not be resolved to a commit object (potentially through any number of tags)
     */
    GitRefUpdateStatus[GitRefUpdateStatus["UnresolvableToCommit"] = 5] = "UnresolvableToCommit";
    /**
     * The ref update request could not be completed because the user lacks write permissions required to write this ref
     */
    GitRefUpdateStatus[GitRefUpdateStatus["WritePermissionRequired"] = 6] = "WritePermissionRequired";
    /**
     * The ref update request could not be completed because the user lacks note creation permissions required to write this note
     */
    GitRefUpdateStatus[GitRefUpdateStatus["ManageNotePermissionRequired"] = 7] = "ManageNotePermissionRequired";
    /**
     * The ref update request could not be completed because the user lacks the permission to create a branch
     */
    GitRefUpdateStatus[GitRefUpdateStatus["CreateBranchPermissionRequired"] = 8] = "CreateBranchPermissionRequired";
    /**
     * The ref update request could not be completed because the user lacks the permission to create a tag
     */
    GitRefUpdateStatus[GitRefUpdateStatus["CreateTagPermissionRequired"] = 9] = "CreateTagPermissionRequired";
    /**
     * The ref update could not be completed because it was rejected by the plugin.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["RejectedByPlugin"] = 10] = "RejectedByPlugin";
    /**
     * The ref update could not be completed because the ref is locked by another user.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["Locked"] = 11] = "Locked";
    /**
     * The ref update could not be completed because, in case-insensitive mode, the ref name conflicts with an existing, differently-cased ref name.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["RefNameConflict"] = 12] = "RefNameConflict";
    /**
     * The ref update could not be completed because it was rejected by policy.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["RejectedByPolicy"] = 13] = "RejectedByPolicy";
    /**
     * Indicates that the ref update request was completed successfully, but the ref doesn't actually exist so no changes were made.  This should only happen during deletes.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["SucceededNonExistentRef"] = 14] = "SucceededNonExistentRef";
    /**
     * Indicates that the ref update request was completed successfully, but the passed-in ref was corrupt - as in, the old object ID was bad.  This should only happen during deletes.
     */
    GitRefUpdateStatus[GitRefUpdateStatus["SucceededCorruptRef"] = 15] = "SucceededCorruptRef";
})(GitRefUpdateStatus = exports.GitRefUpdateStatus || (exports.GitRefUpdateStatus = {}));
/**
 * The type of a merge conflict.
 */
var GitResolutionError;
(function (GitResolutionError) {
    /**
     * No error
     */
    GitResolutionError[GitResolutionError["None"] = 0] = "None";
    /**
     * User set a blob id for resolving a content merge, but blob was not found in repo during application
     */
    GitResolutionError[GitResolutionError["MergeContentNotFound"] = 1] = "MergeContentNotFound";
    /**
     * Attempted to resolve a conflict by moving a file to another path, but path was already in use
     */
    GitResolutionError[GitResolutionError["PathInUse"] = 2] = "PathInUse";
    /**
     * No error
     */
    GitResolutionError[GitResolutionError["InvalidPath"] = 3] = "InvalidPath";
    /**
     * GitResolutionAction was set to an unrecognized value
     */
    GitResolutionError[GitResolutionError["UnknownAction"] = 4] = "UnknownAction";
    /**
     * GitResolutionMergeType was set to an unrecognized value
     */
    GitResolutionError[GitResolutionError["UnknownMergeType"] = 5] = "UnknownMergeType";
    /**
     * Any error for which a more specific code doesn't apply
     */
    GitResolutionError[GitResolutionError["OtherError"] = 255] = "OtherError";
})(GitResolutionError = exports.GitResolutionError || (exports.GitResolutionError = {}));
var GitResolutionMergeType;
(function (GitResolutionMergeType) {
    GitResolutionMergeType[GitResolutionMergeType["Undecided"] = 0] = "Undecided";
    GitResolutionMergeType[GitResolutionMergeType["TakeSourceContent"] = 1] = "TakeSourceContent";
    GitResolutionMergeType[GitResolutionMergeType["TakeTargetContent"] = 2] = "TakeTargetContent";
    GitResolutionMergeType[GitResolutionMergeType["AutoMerged"] = 3] = "AutoMerged";
    GitResolutionMergeType[GitResolutionMergeType["UserMerged"] = 4] = "UserMerged";
})(GitResolutionMergeType = exports.GitResolutionMergeType || (exports.GitResolutionMergeType = {}));
var GitResolutionPathConflictAction;
(function (GitResolutionPathConflictAction) {
    GitResolutionPathConflictAction[GitResolutionPathConflictAction["Undecided"] = 0] = "Undecided";
    GitResolutionPathConflictAction[GitResolutionPathConflictAction["KeepSourceRenameTarget"] = 1] = "KeepSourceRenameTarget";
    GitResolutionPathConflictAction[GitResolutionPathConflictAction["KeepSourceDeleteTarget"] = 2] = "KeepSourceDeleteTarget";
    GitResolutionPathConflictAction[GitResolutionPathConflictAction["KeepTargetRenameSource"] = 3] = "KeepTargetRenameSource";
    GitResolutionPathConflictAction[GitResolutionPathConflictAction["KeepTargetDeleteSource"] = 4] = "KeepTargetDeleteSource";
})(GitResolutionPathConflictAction = exports.GitResolutionPathConflictAction || (exports.GitResolutionPathConflictAction = {}));
var GitResolutionRename1to2Action;
(function (GitResolutionRename1to2Action) {
    GitResolutionRename1to2Action[GitResolutionRename1to2Action["Undecided"] = 0] = "Undecided";
    GitResolutionRename1to2Action[GitResolutionRename1to2Action["KeepSourcePath"] = 1] = "KeepSourcePath";
    GitResolutionRename1to2Action[GitResolutionRename1to2Action["KeepTargetPath"] = 2] = "KeepTargetPath";
    GitResolutionRename1to2Action[GitResolutionRename1to2Action["KeepBothFiles"] = 3] = "KeepBothFiles";
})(GitResolutionRename1to2Action = exports.GitResolutionRename1to2Action || (exports.GitResolutionRename1to2Action = {}));
/**
 * Resolution status of a conflict.
 */
var GitResolutionStatus;
(function (GitResolutionStatus) {
    GitResolutionStatus[GitResolutionStatus["Unresolved"] = 0] = "Unresolved";
    GitResolutionStatus[GitResolutionStatus["PartiallyResolved"] = 1] = "PartiallyResolved";
    GitResolutionStatus[GitResolutionStatus["Resolved"] = 2] = "Resolved";
})(GitResolutionStatus = exports.GitResolutionStatus || (exports.GitResolutionStatus = {}));
var GitResolutionWhichAction;
(function (GitResolutionWhichAction) {
    GitResolutionWhichAction[GitResolutionWhichAction["Undecided"] = 0] = "Undecided";
    GitResolutionWhichAction[GitResolutionWhichAction["PickSourceAction"] = 1] = "PickSourceAction";
    GitResolutionWhichAction[GitResolutionWhichAction["PickTargetAction"] = 2] = "PickTargetAction";
})(GitResolutionWhichAction = exports.GitResolutionWhichAction || (exports.GitResolutionWhichAction = {}));
/**
 * State of the status.
 */
var GitStatusState;
(function (GitStatusState) {
    /**
     * Status state not set. Default state.
     */
    GitStatusState[GitStatusState["NotSet"] = 0] = "NotSet";
    /**
     * Status pending.
     */
    GitStatusState[GitStatusState["Pending"] = 1] = "Pending";
    /**
     * Status succeeded.
     */
    GitStatusState[GitStatusState["Succeeded"] = 2] = "Succeeded";
    /**
     * Status failed.
     */
    GitStatusState[GitStatusState["Failed"] = 3] = "Failed";
    /**
     * Status with an error.
     */
    GitStatusState[GitStatusState["Error"] = 4] = "Error";
    /**
     * Status is not applicable to the target object.
     */
    GitStatusState[GitStatusState["NotApplicable"] = 5] = "NotApplicable";
    /**
     * Status Partially Succeeded, build finished with warnings.
     */
    GitStatusState[GitStatusState["PartiallySucceeded"] = 6] = "PartiallySucceeded";
})(GitStatusState = exports.GitStatusState || (exports.GitStatusState = {}));
/**
 * Accepted types of version options
 */
var GitVersionOptions;
(function (GitVersionOptions) {
    /**
     * Not specified
     */
    GitVersionOptions[GitVersionOptions["None"] = 0] = "None";
    /**
     * Commit that changed item prior to the current version
     */
    GitVersionOptions[GitVersionOptions["PreviousChange"] = 1] = "PreviousChange";
    /**
     * First parent of commit (HEAD^)
     */
    GitVersionOptions[GitVersionOptions["FirstParent"] = 2] = "FirstParent";
})(GitVersionOptions = exports.GitVersionOptions || (exports.GitVersionOptions = {}));
/**
 * Accepted types of version
 */
var GitVersionType;
(function (GitVersionType) {
    /**
     * Interpret the version as a branch name
     */
    GitVersionType[GitVersionType["Branch"] = 0] = "Branch";
    /**
     * Interpret the version as a tag name
     */
    GitVersionType[GitVersionType["Tag"] = 1] = "Tag";
    /**
     * Interpret the version as a commit ID (SHA1)
     */
    GitVersionType[GitVersionType["Commit"] = 2] = "Commit";
})(GitVersionType = exports.GitVersionType || (exports.GitVersionType = {}));
var ItemContentType;
(function (ItemContentType) {
    ItemContentType[ItemContentType["RawText"] = 0] = "RawText";
    ItemContentType[ItemContentType["Base64Encoded"] = 1] = "Base64Encoded";
})(ItemContentType = exports.ItemContentType || (exports.ItemContentType = {}));
/**
 * The reason for which the pull request iteration was created.
 */
var IterationReason;
(function (IterationReason) {
    IterationReason[IterationReason["Push"] = 0] = "Push";
    IterationReason[IterationReason["ForcePush"] = 1] = "ForcePush";
    IterationReason[IterationReason["Create"] = 2] = "Create";
    IterationReason[IterationReason["Rebase"] = 4] = "Rebase";
    IterationReason[IterationReason["Unknown"] = 8] = "Unknown";
    IterationReason[IterationReason["Retarget"] = 16] = "Retarget";
    IterationReason[IterationReason["ResolveConflicts"] = 32] = "ResolveConflicts";
})(IterationReason = exports.IterationReason || (exports.IterationReason = {}));
/**
 * Type of change for a line diff block
 */
var LineDiffBlockChangeType;
(function (LineDiffBlockChangeType) {
    /**
     * No change - both the blocks are identical
     */
    LineDiffBlockChangeType[LineDiffBlockChangeType["None"] = 0] = "None";
    /**
     * Lines were added to the block in the modified file
     */
    LineDiffBlockChangeType[LineDiffBlockChangeType["Add"] = 1] = "Add";
    /**
     * Lines were deleted from the block in the original file
     */
    LineDiffBlockChangeType[LineDiffBlockChangeType["Delete"] = 2] = "Delete";
    /**
     * Lines were modified
     */
    LineDiffBlockChangeType[LineDiffBlockChangeType["Edit"] = 3] = "Edit";
})(LineDiffBlockChangeType = exports.LineDiffBlockChangeType || (exports.LineDiffBlockChangeType = {}));
/**
 * The status of a pull request merge.
 */
var PullRequestAsyncStatus;
(function (PullRequestAsyncStatus) {
    /**
     * Status is not set. Default state.
     */
    PullRequestAsyncStatus[PullRequestAsyncStatus["NotSet"] = 0] = "NotSet";
    /**
     * Pull request merge is queued.
     */
    PullRequestAsyncStatus[PullRequestAsyncStatus["Queued"] = 1] = "Queued";
    /**
     * Pull request merge failed due to conflicts.
     */
    PullRequestAsyncStatus[PullRequestAsyncStatus["Conflicts"] = 2] = "Conflicts";
    /**
     * Pull request merge succeeded.
     */
    PullRequestAsyncStatus[PullRequestAsyncStatus["Succeeded"] = 3] = "Succeeded";
    /**
     * Pull request merge rejected by policy.
     */
    PullRequestAsyncStatus[PullRequestAsyncStatus["RejectedByPolicy"] = 4] = "RejectedByPolicy";
    /**
     * Pull request merge failed.
     */
    PullRequestAsyncStatus[PullRequestAsyncStatus["Failure"] = 5] = "Failure";
})(PullRequestAsyncStatus = exports.PullRequestAsyncStatus || (exports.PullRequestAsyncStatus = {}));
/**
 * The specific type of a pull request merge failure.
 */
var PullRequestMergeFailureType;
(function (PullRequestMergeFailureType) {
    /**
     * Type is not set. Default type.
     */
    PullRequestMergeFailureType[PullRequestMergeFailureType["None"] = 0] = "None";
    /**
     * Pull request merge failure type unknown.
     */
    PullRequestMergeFailureType[PullRequestMergeFailureType["Unknown"] = 1] = "Unknown";
    /**
     * Pull request merge failed due to case mismatch.
     */
    PullRequestMergeFailureType[PullRequestMergeFailureType["CaseSensitive"] = 2] = "CaseSensitive";
    /**
     * Pull request merge failed due to an object being too large.
     */
    PullRequestMergeFailureType[PullRequestMergeFailureType["ObjectTooLarge"] = 3] = "ObjectTooLarge";
})(PullRequestMergeFailureType = exports.PullRequestMergeFailureType || (exports.PullRequestMergeFailureType = {}));
/**
 * Status of a pull request.
 */
var PullRequestStatus;
(function (PullRequestStatus) {
    /**
     * Status not set. Default state.
     */
    PullRequestStatus[PullRequestStatus["NotSet"] = 0] = "NotSet";
    /**
     * Pull request is active.
     */
    PullRequestStatus[PullRequestStatus["Active"] = 1] = "Active";
    /**
     * Pull request is abandoned.
     */
    PullRequestStatus[PullRequestStatus["Abandoned"] = 2] = "Abandoned";
    /**
     * Pull request is completed.
     */
    PullRequestStatus[PullRequestStatus["Completed"] = 3] = "Completed";
    /**
     * Used in pull request search criteria to include all statuses.
     */
    PullRequestStatus[PullRequestStatus["All"] = 4] = "All";
})(PullRequestStatus = exports.PullRequestStatus || (exports.PullRequestStatus = {}));
/**
 * Specifies the desired type of time range for pull requests queries.
 */
var PullRequestTimeRangeType;
(function (PullRequestTimeRangeType) {
    /**
     * The date when the pull request was created.
     */
    PullRequestTimeRangeType[PullRequestTimeRangeType["Created"] = 1] = "Created";
    /**
     * The date when the pull request was closed (completed, abandoned, or merged externally).
     */
    PullRequestTimeRangeType[PullRequestTimeRangeType["Closed"] = 2] = "Closed";
})(PullRequestTimeRangeType = exports.PullRequestTimeRangeType || (exports.PullRequestTimeRangeType = {}));
var RefFavoriteType;
(function (RefFavoriteType) {
    RefFavoriteType[RefFavoriteType["Invalid"] = 0] = "Invalid";
    RefFavoriteType[RefFavoriteType["Folder"] = 1] = "Folder";
    RefFavoriteType[RefFavoriteType["Ref"] = 2] = "Ref";
})(RefFavoriteType = exports.RefFavoriteType || (exports.RefFavoriteType = {}));
/**
 * Enumeration that represents the types of IDEs supported.
 */
var SupportedIdeType;
(function (SupportedIdeType) {
    SupportedIdeType[SupportedIdeType["Unknown"] = 0] = "Unknown";
    SupportedIdeType[SupportedIdeType["AndroidStudio"] = 1] = "AndroidStudio";
    SupportedIdeType[SupportedIdeType["AppCode"] = 2] = "AppCode";
    SupportedIdeType[SupportedIdeType["CLion"] = 3] = "CLion";
    SupportedIdeType[SupportedIdeType["DataGrip"] = 4] = "DataGrip";
    SupportedIdeType[SupportedIdeType["Eclipse"] = 13] = "Eclipse";
    SupportedIdeType[SupportedIdeType["IntelliJ"] = 5] = "IntelliJ";
    SupportedIdeType[SupportedIdeType["MPS"] = 6] = "MPS";
    SupportedIdeType[SupportedIdeType["PhpStorm"] = 7] = "PhpStorm";
    SupportedIdeType[SupportedIdeType["PyCharm"] = 8] = "PyCharm";
    SupportedIdeType[SupportedIdeType["RubyMine"] = 9] = "RubyMine";
    SupportedIdeType[SupportedIdeType["Tower"] = 10] = "Tower";
    SupportedIdeType[SupportedIdeType["VisualStudio"] = 11] = "VisualStudio";
    SupportedIdeType[SupportedIdeType["VSCode"] = 14] = "VSCode";
    SupportedIdeType[SupportedIdeType["WebStorm"] = 12] = "WebStorm";
})(SupportedIdeType = exports.SupportedIdeType || (exports.SupportedIdeType = {}));
/**
 * Options for Version handling.
 */
var TfvcVersionOption;
(function (TfvcVersionOption) {
    /**
     * None.
     */
    TfvcVersionOption[TfvcVersionOption["None"] = 0] = "None";
    /**
     * Return the previous version.
     */
    TfvcVersionOption[TfvcVersionOption["Previous"] = 1] = "Previous";
    /**
     * Only usuable with versiontype MergeSource and integer versions, uses RenameSource identifier instead of Merge identifier.
     */
    TfvcVersionOption[TfvcVersionOption["UseRename"] = 2] = "UseRename";
})(TfvcVersionOption = exports.TfvcVersionOption || (exports.TfvcVersionOption = {}));
/**
 * Type of Version object
 */
var TfvcVersionType;
(function (TfvcVersionType) {
    /**
     * Version is treated as a ChangesetId.
     */
    TfvcVersionType[TfvcVersionType["None"] = 0] = "None";
    /**
     * Version is treated as a ChangesetId.
     */
    TfvcVersionType[TfvcVersionType["Changeset"] = 1] = "Changeset";
    /**
     * Version is treated as a Shelveset name and owner.
     */
    TfvcVersionType[TfvcVersionType["Shelveset"] = 2] = "Shelveset";
    /**
     * Version is treated as a Change.
     */
    TfvcVersionType[TfvcVersionType["Change"] = 3] = "Change";
    /**
     * Version is treated as a Date.
     */
    TfvcVersionType[TfvcVersionType["Date"] = 4] = "Date";
    /**
     * If Version is defined the Latest of that Version will be used, if no version is defined the latest ChangesetId will be used.
     */
    TfvcVersionType[TfvcVersionType["Latest"] = 5] = "Latest";
    /**
     * Version will be treated as a Tip, if no version is defined latest will be used.
     */
    TfvcVersionType[TfvcVersionType["Tip"] = 6] = "Tip";
    /**
     * Version will be treated as a MergeSource.
     */
    TfvcVersionType[TfvcVersionType["MergeSource"] = 7] = "MergeSource";
})(TfvcVersionType = exports.TfvcVersionType || (exports.TfvcVersionType = {}));
var VersionControlChangeType;
(function (VersionControlChangeType) {
    VersionControlChangeType[VersionControlChangeType["None"] = 0] = "None";
    VersionControlChangeType[VersionControlChangeType["Add"] = 1] = "Add";
    VersionControlChangeType[VersionControlChangeType["Edit"] = 2] = "Edit";
    VersionControlChangeType[VersionControlChangeType["Encoding"] = 4] = "Encoding";
    VersionControlChangeType[VersionControlChangeType["Rename"] = 8] = "Rename";
    VersionControlChangeType[VersionControlChangeType["Delete"] = 16] = "Delete";
    VersionControlChangeType[VersionControlChangeType["Undelete"] = 32] = "Undelete";
    VersionControlChangeType[VersionControlChangeType["Branch"] = 64] = "Branch";
    VersionControlChangeType[VersionControlChangeType["Merge"] = 128] = "Merge";
    VersionControlChangeType[VersionControlChangeType["Lock"] = 256] = "Lock";
    VersionControlChangeType[VersionControlChangeType["Rollback"] = 512] = "Rollback";
    VersionControlChangeType[VersionControlChangeType["SourceRename"] = 1024] = "SourceRename";
    VersionControlChangeType[VersionControlChangeType["TargetRename"] = 2048] = "TargetRename";
    VersionControlChangeType[VersionControlChangeType["Property"] = 4096] = "Property";
    VersionControlChangeType[VersionControlChangeType["All"] = 8191] = "All";
})(VersionControlChangeType = exports.VersionControlChangeType || (exports.VersionControlChangeType = {}));
var VersionControlRecursionType;
(function (VersionControlRecursionType) {
    /**
     * Only return the specified item.
     */
    VersionControlRecursionType[VersionControlRecursionType["None"] = 0] = "None";
    /**
     * Return the specified item and its direct children.
     */
    VersionControlRecursionType[VersionControlRecursionType["OneLevel"] = 1] = "OneLevel";
    /**
     * Return the specified item and its direct children, as well as recursive chains of nested child folders that only contain a single folder.
     */
    VersionControlRecursionType[VersionControlRecursionType["OneLevelPlusNestedEmptyFolders"] = 4] = "OneLevelPlusNestedEmptyFolders";
    /**
     * Return specified item and all descendants
     */
    VersionControlRecursionType[VersionControlRecursionType["Full"] = 120] = "Full";
})(VersionControlRecursionType = exports.VersionControlRecursionType || (exports.VersionControlRecursionType = {}));
exports.TypeInfo = {
    AdvSecEnablementStatus: {},
    Attachment: {},
    BillableCommitterDetail: {},
    Change: {},
    ChangeList: {},
    Comment: {},
    CommentThread: {},
    CommentThreadStatus: {
        enumValues: {
            "unknown": 0,
            "active": 1,
            "fixed": 2,
            "wontFix": 3,
            "closed": 4,
            "byDesign": 5,
            "pending": 6
        }
    },
    CommentType: {
        enumValues: {
            "unknown": 0,
            "text": 1,
            "codeChange": 2,
            "system": 3
        }
    },
    FileDiff: {},
    GitAnnotatedTag: {},
    GitAsyncOperationStatus: {
        enumValues: {
            "queued": 1,
            "inProgress": 2,
            "completed": 3,
            "failed": 4,
            "abandoned": 5
        }
    },
    GitAsyncRefOperation: {},
    GitAsyncRefOperationDetail: {},
    GitAsyncRefOperationFailureStatus: {
        enumValues: {
            "none": 0,
            "invalidRefName": 1,
            "refNameConflict": 2,
            "createBranchPermissionRequired": 3,
            "writePermissionRequired": 4,
            "targetBranchDeleted": 5,
            "gitObjectTooLarge": 6,
            "operationIndentityNotFound": 7,
            "asyncOperationNotFound": 8,
            "other": 9,
            "emptyCommitterSignature": 10
        }
    },
    GitAsyncRefOperationParameters: {},
    GitAsyncRefOperationSource: {},
    GitBaseVersionDescriptor: {},
    GitBranchStats: {},
    GitChange: {},
    GitCherryPick: {},
    GitCommit: {},
    GitCommitChanges: {},
    GitCommitDiffs: {},
    GitCommitRef: {},
    GitCommitToCreate: {},
    GitConflict: {},
    GitConflictAddAdd: {},
    GitConflictAddRename: {},
    GitConflictDeleteEdit: {},
    GitConflictDeleteRename: {},
    GitConflictDirectoryFile: {},
    GitConflictEditDelete: {},
    GitConflictEditEdit: {},
    GitConflictFileDirectory: {},
    GitConflictRename1to2: {},
    GitConflictRename2to1: {},
    GitConflictRenameAdd: {},
    GitConflictRenameDelete: {},
    GitConflictRenameRename: {},
    GitConflictType: {
        enumValues: {
            "none": 0,
            "addAdd": 1,
            "addRename": 2,
            "deleteEdit": 3,
            "deleteRename": 4,
            "directoryFile": 5,
            "directoryChild": 6,
            "editDelete": 7,
            "editEdit": 8,
            "fileDirectory": 9,
            "rename1to2": 10,
            "rename2to1": 11,
            "renameAdd": 12,
            "renameDelete": 13,
            "renameRename": 14
        }
    },
    GitConflictUpdateResult: {},
    GitConflictUpdateStatus: {
        enumValues: {
            "succeeded": 0,
            "badRequest": 1,
            "invalidResolution": 2,
            "unsupportedConflictType": 3,
            "notFound": 4
        }
    },
    GitDeletedRepository: {},
    GitForkRef: {},
    GitForkSyncRequest: {},
    GitForkTeamProjectReference: {},
    GitHistoryMode: {
        enumValues: {
            "simplifiedHistory": 0,
            "firstParent": 1,
            "fullHistory": 2,
            "fullHistorySimplifyMerges": 3
        }
    },
    GitImportFailedEvent: {},
    GitImportRequest: {},
    GitImportSucceededEvent: {},
    GitItem: {},
    GitItemDescriptor: {},
    GitItemRequestData: {},
    GitLastChangeTreeItems: {},
    GitMerge: {},
    GitObject: {},
    GitObjectType: {
        enumValues: {
            "bad": 0,
            "commit": 1,
            "tree": 2,
            "blob": 3,
            "tag": 4,
            "ext2": 5,
            "ofsDelta": 6,
            "refDelta": 7
        }
    },
    GitPathAction: {},
    GitPathActions: {
        enumValues: {
            "none": 0,
            "edit": 1,
            "delete": 2,
            "add": 3,
            "rename": 4
        }
    },
    GitPathToItemsCollection: {},
    GitPolicyConfigurationResponse: {},
    GitPullRequest: {},
    GitPullRequestChange: {},
    GitPullRequestCommentThread: {},
    GitPullRequestCompletionOptions: {},
    GitPullRequestIteration: {},
    GitPullRequestIterationChanges: {},
    GitPullRequestMergeStrategy: {
        enumValues: {
            "noFastForward": 1,
            "squash": 2,
            "rebase": 3,
            "rebaseMerge": 4
        }
    },
    GitPullRequestQuery: {},
    GitPullRequestQueryInput: {},
    GitPullRequestQueryType: {
        enumValues: {
            "notSet": 0,
            "lastMergeCommit": 1,
            "commit": 2
        }
    },
    GitPullRequestReviewFileType: {
        enumValues: {
            "changeEntry": 0,
            "attachment": 1
        }
    },
    GitPullRequestSearchCriteria: {},
    GitPullRequestStatus: {},
    GitPush: {},
    GitPushEventData: {},
    GitPushRef: {},
    GitPushSearchCriteria: {},
    GitQueryBranchStatsCriteria: {},
    GitQueryCommitsCriteria: {},
    GitQueryRefsCriteria: {},
    GitRef: {},
    GitRefFavorite: {},
    GitRefSearchType: {
        enumValues: {
            "exact": 0,
            "startsWith": 1,
            "contains": 2
        }
    },
    GitRefUpdateMode: {
        enumValues: {
            "bestEffort": 0,
            "allOrNone": 1
        }
    },
    GitRefUpdateResult: {},
    GitRefUpdateStatus: {
        enumValues: {
            "succeeded": 0,
            "forcePushRequired": 1,
            "staleOldObjectId": 2,
            "invalidRefName": 3,
            "unprocessed": 4,
            "unresolvableToCommit": 5,
            "writePermissionRequired": 6,
            "manageNotePermissionRequired": 7,
            "createBranchPermissionRequired": 8,
            "createTagPermissionRequired": 9,
            "rejectedByPlugin": 10,
            "locked": 11,
            "refNameConflict": 12,
            "rejectedByPolicy": 13,
            "succeededNonExistentRef": 14,
            "succeededCorruptRef": 15
        }
    },
    GitRepository: {},
    GitRepositoryCreateOptions: {},
    GitRepositoryRef: {},
    GitResolutionError: {
        enumValues: {
            "none": 0,
            "mergeContentNotFound": 1,
            "pathInUse": 2,
            "invalidPath": 3,
            "unknownAction": 4,
            "unknownMergeType": 5,
            "otherError": 255
        }
    },
    GitResolutionMergeContent: {},
    GitResolutionMergeType: {
        enumValues: {
            "undecided": 0,
            "takeSourceContent": 1,
            "takeTargetContent": 2,
            "autoMerged": 3,
            "userMerged": 4
        }
    },
    GitResolutionPathConflict: {},
    GitResolutionPathConflictAction: {
        enumValues: {
            "undecided": 0,
            "keepSourceRenameTarget": 1,
            "keepSourceDeleteTarget": 2,
            "keepTargetRenameSource": 3,
            "keepTargetDeleteSource": 4
        }
    },
    GitResolutionPickOneAction: {},
    GitResolutionRename1to2: {},
    GitResolutionRename1to2Action: {
        enumValues: {
            "undecided": 0,
            "keepSourcePath": 1,
            "keepTargetPath": 2,
            "keepBothFiles": 3
        }
    },
    GitResolutionStatus: {
        enumValues: {
            "unresolved": 0,
            "partiallyResolved": 1,
            "resolved": 2
        }
    },
    GitResolutionWhichAction: {
        enumValues: {
            "undecided": 0,
            "pickSourceAction": 1,
            "pickTargetAction": 2
        }
    },
    GitRevert: {},
    GitStatus: {},
    GitStatusState: {
        enumValues: {
            "notSet": 0,
            "pending": 1,
            "succeeded": 2,
            "failed": 3,
            "error": 4,
            "notApplicable": 5,
            "partiallySucceeded": 6
        }
    },
    GitTargetVersionDescriptor: {},
    GitTreeDiff: {},
    GitTreeDiffEntry: {},
    GitTreeDiffResponse: {},
    GitTreeEntryRef: {},
    GitTreeRef: {},
    GitUserDate: {},
    GitVersionDescriptor: {},
    GitVersionOptions: {
        enumValues: {
            "none": 0,
            "previousChange": 1,
            "firstParent": 2
        }
    },
    GitVersionType: {
        enumValues: {
            "branch": 0,
            "tag": 1,
            "commit": 2
        }
    },
    HistoryEntry: {},
    IncludedGitCommit: {},
    ItemContent: {},
    ItemContentType: {
        enumValues: {
            "rawText": 0,
            "base64Encoded": 1
        }
    },
    ItemDetailsOptions: {},
    IterationReason: {
        enumValues: {
            "push": 0,
            "forcePush": 1,
            "create": 2,
            "rebase": 4,
            "unknown": 8,
            "retarget": 16,
            "resolveConflicts": 32
        }
    },
    LineDiffBlock: {},
    LineDiffBlockChangeType: {
        enumValues: {
            "none": 0,
            "add": 1,
            "delete": 2,
            "edit": 3
        }
    },
    PullRequestAsyncStatus: {
        enumValues: {
            "notSet": 0,
            "queued": 1,
            "conflicts": 2,
            "succeeded": 3,
            "rejectedByPolicy": 4,
            "failure": 5
        }
    },
    PullRequestMergeFailureType: {
        enumValues: {
            "none": 0,
            "unknown": 1,
            "caseSensitive": 2,
            "objectTooLarge": 3
        }
    },
    PullRequestStatus: {
        enumValues: {
            "notSet": 0,
            "active": 1,
            "abandoned": 2,
            "completed": 3,
            "all": 4
        }
    },
    PullRequestTimeRangeType: {
        enumValues: {
            "created": 1,
            "closed": 2
        }
    },
    RefFavoriteType: {
        enumValues: {
            "invalid": 0,
            "folder": 1,
            "ref": 2
        }
    },
    SupportedIde: {},
    SupportedIdeType: {
        enumValues: {
            "unknown": 0,
            "androidStudio": 1,
            "appCode": 2,
            "cLion": 3,
            "dataGrip": 4,
            "eclipse": 13,
            "intelliJ": 5,
            "mps": 6,
            "phpStorm": 7,
            "pyCharm": 8,
            "rubyMine": 9,
            "tower": 10,
            "visualStudio": 11,
            "vsCode": 14,
            "webStorm": 12
        }
    },
    TfvcBranch: {},
    TfvcBranchRef: {},
    TfvcChange: {},
    TfvcChangeset: {},
    TfvcChangesetRef: {},
    TfvcCheckinEventData: {},
    TfvcHistoryEntry: {},
    TfvcItem: {},
    TfvcItemDescriptor: {},
    TfvcItemPreviousHash: {},
    TfvcItemRequestData: {},
    TfvcLabel: {},
    TfvcLabelRef: {},
    TfvcShelveset: {},
    TfvcShelvesetRef: {},
    TfvcVersionDescriptor: {},
    TfvcVersionOption: {
        enumValues: {
            "none": 0,
            "previous": 1,
            "useRename": 2
        }
    },
    TfvcVersionType: {
        enumValues: {
            "none": 0,
            "changeset": 1,
            "shelveset": 2,
            "change": 3,
            "date": 4,
            "latest": 5,
            "tip": 6,
            "mergeSource": 7
        }
    },
    UpdateRefsRequest: {},
    VersionControlChangeType: {
        enumValues: {
            "none": 0,
            "add": 1,
            "edit": 2,
            "encoding": 4,
            "rename": 8,
            "delete": 16,
            "undelete": 32,
            "branch": 64,
            "merge": 128,
            "lock": 256,
            "rollback": 512,
            "sourceRename": 1024,
            "targetRename": 2048,
            "property": 4096,
            "all": 8191
        }
    },
    VersionControlProjectInfo: {},
    VersionControlRecursionType: {
        enumValues: {
            "none": 0,
            "oneLevel": 1,
            "oneLevelPlusNestedEmptyFolders": 4,
            "full": 120
        }
    },
};
exports.TypeInfo.AdvSecEnablementStatus.fields = {
    changedOnDate: {
        isDate: true,
    },
    enabledChangedOnDate: {
        isDate: true,
    }
};
exports.TypeInfo.Attachment.fields = {
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.BillableCommitterDetail.fields = {
    commitTime: {
        isDate: true,
    },
    pushedTime: {
        isDate: true,
    }
};
exports.TypeInfo.Change.fields = {
    changeType: {
        enumType: exports.TypeInfo.VersionControlChangeType
    },
    newContent: {
        typeInfo: exports.TypeInfo.ItemContent
    }
};
exports.TypeInfo.ChangeList.fields = {
    changeCounts: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.VersionControlChangeType,
    },
    creationDate: {
        isDate: true,
    },
    sortDate: {
        isDate: true,
    }
};
exports.TypeInfo.Comment.fields = {
    commentType: {
        enumType: exports.TypeInfo.CommentType
    },
    lastContentUpdatedDate: {
        isDate: true,
    },
    lastUpdatedDate: {
        isDate: true,
    },
    publishedDate: {
        isDate: true,
    }
};
exports.TypeInfo.CommentThread.fields = {
    comments: {
        isArray: true,
        typeInfo: exports.TypeInfo.Comment
    },
    lastUpdatedDate: {
        isDate: true,
    },
    publishedDate: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.CommentThreadStatus
    }
};
exports.TypeInfo.FileDiff.fields = {
    lineDiffBlocks: {
        isArray: true,
        typeInfo: exports.TypeInfo.LineDiffBlock
    }
};
exports.TypeInfo.GitAnnotatedTag.fields = {
    taggedBy: {
        typeInfo: exports.TypeInfo.GitUserDate
    },
    taggedObject: {
        typeInfo: exports.TypeInfo.GitObject
    }
};
exports.TypeInfo.GitAsyncRefOperation.fields = {
    detailedStatus: {
        typeInfo: exports.TypeInfo.GitAsyncRefOperationDetail
    },
    parameters: {
        typeInfo: exports.TypeInfo.GitAsyncRefOperationParameters
    },
    status: {
        enumType: exports.TypeInfo.GitAsyncOperationStatus
    }
};
exports.TypeInfo.GitAsyncRefOperationDetail.fields = {
    status: {
        enumType: exports.TypeInfo.GitAsyncRefOperationFailureStatus
    }
};
exports.TypeInfo.GitAsyncRefOperationParameters.fields = {
    repository: {
        typeInfo: exports.TypeInfo.GitRepository
    },
    source: {
        typeInfo: exports.TypeInfo.GitAsyncRefOperationSource
    }
};
exports.TypeInfo.GitAsyncRefOperationSource.fields = {
    commitList: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitCommitRef
    }
};
exports.TypeInfo.GitBaseVersionDescriptor.fields = {
    baseVersionOptions: {
        enumType: exports.TypeInfo.GitVersionOptions
    },
    baseVersionType: {
        enumType: exports.TypeInfo.GitVersionType
    },
    versionOptions: {
        enumType: exports.TypeInfo.GitVersionOptions
    },
    versionType: {
        enumType: exports.TypeInfo.GitVersionType
    }
};
exports.TypeInfo.GitBranchStats.fields = {
    commit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    }
};
exports.TypeInfo.GitChange.fields = {
    changeType: {
        enumType: exports.TypeInfo.VersionControlChangeType
    },
    newContent: {
        typeInfo: exports.TypeInfo.ItemContent
    }
};
exports.TypeInfo.GitCherryPick.fields = {
    detailedStatus: {
        typeInfo: exports.TypeInfo.GitAsyncRefOperationDetail
    },
    parameters: {
        typeInfo: exports.TypeInfo.GitAsyncRefOperationParameters
    },
    status: {
        enumType: exports.TypeInfo.GitAsyncOperationStatus
    }
};
exports.TypeInfo.GitCommit.fields = {
    author: {
        typeInfo: exports.TypeInfo.GitUserDate
    },
    changes: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitChange
    },
    committer: {
        typeInfo: exports.TypeInfo.GitUserDate
    },
    push: {
        typeInfo: exports.TypeInfo.GitPushRef
    },
    statuses: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitStatus
    }
};
exports.TypeInfo.GitCommitChanges.fields = {
    changes: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitChange
    }
};
exports.TypeInfo.GitCommitDiffs.fields = {
    changeCounts: {
        isDictionary: true,
        dictionaryKeyEnumType: exports.TypeInfo.VersionControlChangeType,
    },
    changes: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitChange
    }
};
exports.TypeInfo.GitCommitRef.fields = {
    author: {
        typeInfo: exports.TypeInfo.GitUserDate
    },
    changes: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitChange
    },
    committer: {
        typeInfo: exports.TypeInfo.GitUserDate
    },
    push: {
        typeInfo: exports.TypeInfo.GitPushRef
    },
    statuses: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitStatus
    }
};
exports.TypeInfo.GitCommitToCreate.fields = {
    baseRef: {
        typeInfo: exports.TypeInfo.GitRef
    },
    pathActions: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitPathAction
    }
};
exports.TypeInfo.GitConflict.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictAddAdd.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionMergeContent
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictAddRename.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPathConflict
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictDeleteEdit.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPickOneAction
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictDeleteRename.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPickOneAction
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictDirectoryFile.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPathConflict
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    },
    sourceTree: {
        typeInfo: exports.TypeInfo.GitTreeRef
    }
};
exports.TypeInfo.GitConflictEditDelete.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPickOneAction
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictEditEdit.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionMergeContent
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictFileDirectory.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPathConflict
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    },
    targetTree: {
        typeInfo: exports.TypeInfo.GitTreeRef
    }
};
exports.TypeInfo.GitConflictRename1to2.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionRename1to2
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictRename2to1.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPathConflict
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictRenameAdd.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPathConflict
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictRenameDelete.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionPickOneAction
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictRenameRename.fields = {
    conflictType: {
        enumType: exports.TypeInfo.GitConflictType
    },
    mergeBaseCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    resolution: {
        typeInfo: exports.TypeInfo.GitResolutionMergeContent
    },
    resolutionError: {
        enumType: exports.TypeInfo.GitResolutionError
    },
    resolutionStatus: {
        enumType: exports.TypeInfo.GitResolutionStatus
    },
    resolvedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitConflictUpdateResult.fields = {
    updatedConflict: {
        typeInfo: exports.TypeInfo.GitConflict
    },
    updateStatus: {
        enumType: exports.TypeInfo.GitConflictUpdateStatus
    }
};
exports.TypeInfo.GitDeletedRepository.fields = {
    createdDate: {
        isDate: true,
    },
    deletedDate: {
        isDate: true,
    },
    project: {
        typeInfo: TfsCoreInterfaces.TypeInfo.TeamProjectReference
    }
};
exports.TypeInfo.GitForkRef.fields = {
    repository: {
        typeInfo: exports.TypeInfo.GitRepository
    },
    statuses: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitStatus
    }
};
exports.TypeInfo.GitForkSyncRequest.fields = {
    status: {
        enumType: exports.TypeInfo.GitAsyncOperationStatus
    }
};
exports.TypeInfo.GitForkTeamProjectReference.fields = {
    lastUpdateTime: {
        isDate: true,
    },
    visibility: {
        enumType: TfsCoreInterfaces.TypeInfo.ProjectVisibility
    }
};
exports.TypeInfo.GitImportFailedEvent.fields = {
    targetRepository: {
        typeInfo: exports.TypeInfo.GitRepository
    }
};
exports.TypeInfo.GitImportRequest.fields = {
    repository: {
        typeInfo: exports.TypeInfo.GitRepository
    },
    status: {
        enumType: exports.TypeInfo.GitAsyncOperationStatus
    }
};
exports.TypeInfo.GitImportSucceededEvent.fields = {
    targetRepository: {
        typeInfo: exports.TypeInfo.GitRepository
    }
};
exports.TypeInfo.GitItem.fields = {
    gitObjectType: {
        enumType: exports.TypeInfo.GitObjectType
    },
    latestProcessedChange: {
        typeInfo: exports.TypeInfo.GitCommitRef
    }
};
exports.TypeInfo.GitItemDescriptor.fields = {
    recursionLevel: {
        enumType: exports.TypeInfo.VersionControlRecursionType
    },
    versionOptions: {
        enumType: exports.TypeInfo.GitVersionOptions
    },
    versionType: {
        enumType: exports.TypeInfo.GitVersionType
    }
};
exports.TypeInfo.GitItemRequestData.fields = {
    itemDescriptors: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitItemDescriptor
    }
};
exports.TypeInfo.GitLastChangeTreeItems.fields = {
    commits: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    lastExploredTime: {
        isDate: true,
    }
};
exports.TypeInfo.GitMerge.fields = {
    status: {
        enumType: exports.TypeInfo.GitAsyncOperationStatus
    }
};
exports.TypeInfo.GitObject.fields = {
    objectType: {
        enumType: exports.TypeInfo.GitObjectType
    }
};
exports.TypeInfo.GitPathAction.fields = {
    action: {
        enumType: exports.TypeInfo.GitPathActions
    }
};
exports.TypeInfo.GitPathToItemsCollection.fields = {
    items: {
        isDictionary: true,
        dictionaryValueFieldInfo: {
            isArray: true,
            typeInfo: exports.TypeInfo.GitItem
        }
    }
};
exports.TypeInfo.GitPolicyConfigurationResponse.fields = {
    policyConfigurations: {
        isArray: true,
        typeInfo: PolicyInterfaces.TypeInfo.PolicyConfiguration
    }
};
exports.TypeInfo.GitPullRequest.fields = {
    closedDate: {
        isDate: true,
    },
    commits: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    completionOptions: {
        typeInfo: exports.TypeInfo.GitPullRequestCompletionOptions
    },
    completionQueueTime: {
        isDate: true,
    },
    creationDate: {
        isDate: true,
    },
    forkSource: {
        typeInfo: exports.TypeInfo.GitForkRef
    },
    lastMergeCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    lastMergeSourceCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    lastMergeTargetCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    mergeFailureType: {
        enumType: exports.TypeInfo.PullRequestMergeFailureType
    },
    mergeStatus: {
        enumType: exports.TypeInfo.PullRequestAsyncStatus
    },
    repository: {
        typeInfo: exports.TypeInfo.GitRepository
    },
    status: {
        enumType: exports.TypeInfo.PullRequestStatus
    }
};
exports.TypeInfo.GitPullRequestChange.fields = {
    changeType: {
        enumType: exports.TypeInfo.VersionControlChangeType
    },
    newContent: {
        typeInfo: exports.TypeInfo.ItemContent
    }
};
exports.TypeInfo.GitPullRequestCommentThread.fields = {
    comments: {
        isArray: true,
        typeInfo: exports.TypeInfo.Comment
    },
    lastUpdatedDate: {
        isDate: true,
    },
    publishedDate: {
        isDate: true,
    },
    status: {
        enumType: exports.TypeInfo.CommentThreadStatus
    }
};
exports.TypeInfo.GitPullRequestCompletionOptions.fields = {
    mergeStrategy: {
        enumType: exports.TypeInfo.GitPullRequestMergeStrategy
    }
};
exports.TypeInfo.GitPullRequestIteration.fields = {
    changeList: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitPullRequestChange
    },
    commits: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    commonRefCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    createdDate: {
        isDate: true,
    },
    push: {
        typeInfo: exports.TypeInfo.GitPushRef
    },
    reason: {
        enumType: exports.TypeInfo.IterationReason
    },
    sourceRefCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    targetRefCommit: {
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    updatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitPullRequestIterationChanges.fields = {
    changeEntries: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitPullRequestChange
    }
};
exports.TypeInfo.GitPullRequestQuery.fields = {
    queries: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitPullRequestQueryInput
    },
};
exports.TypeInfo.GitPullRequestQueryInput.fields = {
    type: {
        enumType: exports.TypeInfo.GitPullRequestQueryType
    }
};
exports.TypeInfo.GitPullRequestSearchCriteria.fields = {
    maxTime: {
        isDate: true,
    },
    minTime: {
        isDate: true,
    },
    queryTimeRangeType: {
        enumType: exports.TypeInfo.PullRequestTimeRangeType
    },
    status: {
        enumType: exports.TypeInfo.PullRequestStatus
    }
};
exports.TypeInfo.GitPullRequestStatus.fields = {
    creationDate: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.GitStatusState
    },
    updatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitPush.fields = {
    commits: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitCommitRef
    },
    date: {
        isDate: true,
    },
    repository: {
        typeInfo: exports.TypeInfo.GitRepository
    }
};
exports.TypeInfo.GitPushEventData.fields = {
    commits: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitCommit
    },
    repository: {
        typeInfo: exports.TypeInfo.GitRepository
    }
};
exports.TypeInfo.GitPushRef.fields = {
    date: {
        isDate: true,
    }
};
exports.TypeInfo.GitPushSearchCriteria.fields = {
    fromDate: {
        isDate: true,
    },
    toDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitQueryBranchStatsCriteria.fields = {
    baseCommit: {
        typeInfo: exports.TypeInfo.GitVersionDescriptor
    },
    targetCommits: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitVersionDescriptor
    }
};
exports.TypeInfo.GitQueryCommitsCriteria.fields = {
    compareVersion: {
        typeInfo: exports.TypeInfo.GitVersionDescriptor
    },
    historyMode: {
        enumType: exports.TypeInfo.GitHistoryMode
    },
    itemVersion: {
        typeInfo: exports.TypeInfo.GitVersionDescriptor
    }
};
exports.TypeInfo.GitQueryRefsCriteria.fields = {
    searchType: {
        enumType: exports.TypeInfo.GitRefSearchType
    }
};
exports.TypeInfo.GitRef.fields = {
    statuses: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitStatus
    }
};
exports.TypeInfo.GitRefFavorite.fields = {
    type: {
        enumType: exports.TypeInfo.RefFavoriteType
    }
};
exports.TypeInfo.GitRefUpdateResult.fields = {
    updateStatus: {
        enumType: exports.TypeInfo.GitRefUpdateStatus
    }
};
exports.TypeInfo.GitRepository.fields = {
    parentRepository: {
        typeInfo: exports.TypeInfo.GitRepositoryRef
    },
    project: {
        typeInfo: TfsCoreInterfaces.TypeInfo.TeamProjectReference
    }
};
exports.TypeInfo.GitRepositoryCreateOptions.fields = {
    parentRepository: {
        typeInfo: exports.TypeInfo.GitRepositoryRef
    },
    project: {
        typeInfo: TfsCoreInterfaces.TypeInfo.TeamProjectReference
    }
};
exports.TypeInfo.GitRepositoryRef.fields = {
    project: {
        typeInfo: TfsCoreInterfaces.TypeInfo.TeamProjectReference
    }
};
exports.TypeInfo.GitResolutionMergeContent.fields = {
    mergeType: {
        enumType: exports.TypeInfo.GitResolutionMergeType
    }
};
exports.TypeInfo.GitResolutionPathConflict.fields = {
    action: {
        enumType: exports.TypeInfo.GitResolutionPathConflictAction
    }
};
exports.TypeInfo.GitResolutionPickOneAction.fields = {
    action: {
        enumType: exports.TypeInfo.GitResolutionWhichAction
    }
};
exports.TypeInfo.GitResolutionRename1to2.fields = {
    action: {
        enumType: exports.TypeInfo.GitResolutionRename1to2Action
    },
    mergeType: {
        enumType: exports.TypeInfo.GitResolutionMergeType
    }
};
exports.TypeInfo.GitRevert.fields = {
    detailedStatus: {
        typeInfo: exports.TypeInfo.GitAsyncRefOperationDetail
    },
    parameters: {
        typeInfo: exports.TypeInfo.GitAsyncRefOperationParameters
    },
    status: {
        enumType: exports.TypeInfo.GitAsyncOperationStatus
    }
};
exports.TypeInfo.GitStatus.fields = {
    creationDate: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.GitStatusState
    },
    updatedDate: {
        isDate: true,
    }
};
exports.TypeInfo.GitTargetVersionDescriptor.fields = {
    targetVersionOptions: {
        enumType: exports.TypeInfo.GitVersionOptions
    },
    targetVersionType: {
        enumType: exports.TypeInfo.GitVersionType
    },
    versionOptions: {
        enumType: exports.TypeInfo.GitVersionOptions
    },
    versionType: {
        enumType: exports.TypeInfo.GitVersionType
    }
};
exports.TypeInfo.GitTreeDiff.fields = {
    diffEntries: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitTreeDiffEntry
    }
};
exports.TypeInfo.GitTreeDiffEntry.fields = {
    changeType: {
        enumType: exports.TypeInfo.VersionControlChangeType
    },
    objectType: {
        enumType: exports.TypeInfo.GitObjectType
    }
};
exports.TypeInfo.GitTreeDiffResponse.fields = {
    treeDiff: {
        typeInfo: exports.TypeInfo.GitTreeDiff
    }
};
exports.TypeInfo.GitTreeEntryRef.fields = {
    gitObjectType: {
        enumType: exports.TypeInfo.GitObjectType
    }
};
exports.TypeInfo.GitTreeRef.fields = {
    treeEntries: {
        isArray: true,
        typeInfo: exports.TypeInfo.GitTreeEntryRef
    }
};
exports.TypeInfo.GitUserDate.fields = {
    date: {
        isDate: true,
    }
};
exports.TypeInfo.GitVersionDescriptor.fields = {
    versionOptions: {
        enumType: exports.TypeInfo.GitVersionOptions
    },
    versionType: {
        enumType: exports.TypeInfo.GitVersionType
    }
};
exports.TypeInfo.HistoryEntry.fields = {
    itemChangeType: {
        enumType: exports.TypeInfo.VersionControlChangeType
    }
};
exports.TypeInfo.IncludedGitCommit.fields = {
    commitTime: {
        isDate: true,
    }
};
exports.TypeInfo.ItemContent.fields = {
    contentType: {
        enumType: exports.TypeInfo.ItemContentType
    }
};
exports.TypeInfo.ItemDetailsOptions.fields = {
    recursionLevel: {
        enumType: exports.TypeInfo.VersionControlRecursionType
    }
};
exports.TypeInfo.LineDiffBlock.fields = {
    changeType: {
        enumType: exports.TypeInfo.LineDiffBlockChangeType
    }
};
exports.TypeInfo.SupportedIde.fields = {
    ideType: {
        enumType: exports.TypeInfo.SupportedIdeType
    }
};
exports.TypeInfo.TfvcBranch.fields = {
    children: {
        isArray: true,
        typeInfo: exports.TypeInfo.TfvcBranch
    },
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcBranchRef.fields = {
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcChange.fields = {
    changeType: {
        enumType: exports.TypeInfo.VersionControlChangeType
    },
    newContent: {
        typeInfo: exports.TypeInfo.ItemContent
    }
};
exports.TypeInfo.TfvcChangeset.fields = {
    changes: {
        isArray: true,
        typeInfo: exports.TypeInfo.TfvcChange
    },
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcChangesetRef.fields = {
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcCheckinEventData.fields = {
    changeset: {
        typeInfo: exports.TypeInfo.TfvcChangeset
    },
    project: {
        typeInfo: TfsCoreInterfaces.TypeInfo.TeamProjectReference
    }
};
exports.TypeInfo.TfvcHistoryEntry.fields = {
    itemChangeType: {
        enumType: exports.TypeInfo.VersionControlChangeType
    }
};
exports.TypeInfo.TfvcItem.fields = {
    changeDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcItemDescriptor.fields = {
    recursionLevel: {
        enumType: exports.TypeInfo.VersionControlRecursionType
    },
    versionOption: {
        enumType: exports.TypeInfo.TfvcVersionOption
    },
    versionType: {
        enumType: exports.TypeInfo.TfvcVersionType
    }
};
exports.TypeInfo.TfvcItemPreviousHash.fields = {
    changeDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcItemRequestData.fields = {
    itemDescriptors: {
        isArray: true,
        typeInfo: exports.TypeInfo.TfvcItemDescriptor
    }
};
exports.TypeInfo.TfvcLabel.fields = {
    items: {
        isArray: true,
        typeInfo: exports.TypeInfo.TfvcItem
    },
    modifiedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcLabelRef.fields = {
    modifiedDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcShelveset.fields = {
    changes: {
        isArray: true,
        typeInfo: exports.TypeInfo.TfvcChange
    },
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcShelvesetRef.fields = {
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.TfvcVersionDescriptor.fields = {
    versionOption: {
        enumType: exports.TypeInfo.TfvcVersionOption
    },
    versionType: {
        enumType: exports.TypeInfo.TfvcVersionType
    }
};
exports.TypeInfo.UpdateRefsRequest.fields = {
    updateMode: {
        enumType: exports.TypeInfo.GitRefUpdateMode
    }
};
exports.TypeInfo.VersionControlProjectInfo.fields = {
    defaultSourceControlType: {
        enumType: TfsCoreInterfaces.TypeInfo.SourceControlTypes
    },
    project: {
        typeInfo: TfsCoreInterfaces.TypeInfo.TeamProjectReference
    }
};
