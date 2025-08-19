import VSSInterfaces = require("../interfaces/common/VSSInterfaces");
/**
 * Comment on an artifact like Work Item or Wiki, etc.
 */
export interface Comment extends CommentResourceReference {
    /**
     * The id of the artifact this comment belongs to
     */
    artifactId?: string;
    /**
     * IdentityRef of the creator of the comment.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * The creation date of the comment.
     */
    createdDate?: Date;
    /**
     * The id assigned to the comment.
     */
    id?: number;
    /**
     * Indicates if the comment has been deleted.
     */
    isDeleted?: boolean;
    /**
     * The mentions of the comment.
     */
    mentions?: CommentMention[];
    /**
     * IdentityRef of the user who last modified the comment.
     */
    modifiedBy?: VSSInterfaces.IdentityRef;
    /**
     * The last modification date of the comment.
     */
    modifiedDate?: Date;
    /**
     * The comment id of the parent comment, if any
     */
    parentId?: number;
    /**
     * The reactions on the comment.
     */
    reactions?: CommentReaction[];
    /**
     * The rendered text of the comment
     */
    renderedText?: string;
    /**
     * Replies for this comment
     */
    replies?: CommentList;
    /**
     * Indicates the current state of the comment
     */
    state?: CommentState;
    /**
     * The plaintext/markdown version of the comment
     */
    text?: string;
    /**
     * The current version of the comment
     */
    version?: number;
}
/**
 * Represents an attachment to a comment.
 */
export interface CommentAttachment extends CommentResourceReference {
    /**
     * IdentityRef of the creator of the attachment.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * The creation date of the attachment.
     */
    createdDate?: Date;
    /**
     * Unique Id of the attachment.
     */
    id?: string;
}
/**
 * Represents a request to create a work item comment.
 */
export interface CommentCreateParameters {
    /**
     * Optional CommentId of the parent in order to add a reply for an existing comment
     */
    parentId?: number;
    /**
     * Text of the comment
     */
    text: string;
}
/**
 * Specifies the additional data retrieval options for comments.
 */
export declare enum CommentExpandOptions {
    /**
     * Include comments only, no mentions, reactions or rendered text
     */
    None = 0,
    /**
     * Include comment reactions
     */
    Reactions = 1,
    /**
     * Include the rendered text (html) in addition to markdown text
     */
    RenderedText = 8,
    /**
     * If specified, then ONLY rendered text (html) will be returned, w/o markdown. Supposed to be used internally from data provides for optimization purposes.
     */
    RenderedTextOnly = 16,
    /**
     * If specified, then responses will be expanded in the results
     */
    Children = 32,
    /**
     * Expand everything including Reactions, Mentions and also include RenderedText (HTML) for markdown comments
     */
    All = -17
}
/**
 * Format of the comment. Ex. Markdown, Html.
 */
export declare enum CommentFormat {
    Markdown = 0,
    Html = 1
}
/**
 * Represents a list of comments.
 */
export interface CommentList extends CommentResourceReference {
    /**
     * List of comments in the current batch.
     */
    comments?: Comment[];
    /**
     * A string token that can be used to retrieving next page of comments if available. Otherwise null.
     */
    continuationToken?: string;
    /**
     * The count of comments in the current batch.
     */
    count?: number;
    /**
     * Uri to the next page of comments if it is available. Otherwise null.
     */
    nextPage?: string;
    /**
     * Total count of comments on a work item.
     */
    totalCount?: number;
}
/**
 * Contains information about various artifacts mentioned in the comment
 */
export interface CommentMention extends CommentResourceReference {
    /**
     * Id of the artifact this mention belongs to
     */
    artifactId?: string;
    /**
     * Id of the comment associated with this mention. Nullable to support legacy mentions which can potentially have null commentId
     */
    commentId?: number;
    /**
     * Value of the mentioned artifact. Expected Value varies by CommentMentionType: Person:         VSID associated with the identity Work Item:      ID of the work item Pull Request:   ID of the Pull Request
     */
    mentionedArtifact?: string;
    /**
     * The context which represent where this mentioned was parsed from
     */
    type?: CommentMentionType;
}
export declare enum CommentMentionType {
    /**
     * An identity was mentioned by using the format @{VSID}
     */
    Person = 0,
    /**
     * A work item was mentioned by using the format #{Work Item ID}
     */
    WorkItem = 1,
    /**
     * A Pull Request was mentioned by using the format !{PR Number}
     */
    PullRequest = 2
}
/**
 * Contains information about comment reaction for a particular reaction type.
 */
export interface CommentReaction extends CommentResourceReference {
    /**
     * The id of the comment this reaction belongs to.
     */
    commentId?: number;
    /**
     * Total number of reactions for the CommentReactionType.
     */
    count?: number;
    /**
     * Flag to indicate if the current user has engaged on this particular EngagementType (e.g. if they liked the associated comment).
     */
    isCurrentUserEngaged?: boolean;
    /**
     * Type of the reaction.
     */
    type?: CommentReactionType;
}
/**
 * Represents different reaction types for a comment
 */
export declare enum CommentReactionType {
    Like = 0,
    Dislike = 1,
    Heart = 2,
    Hooray = 3,
    Smile = 4,
    Confused = 5
}
/**
 * Base class for comment resource references
 */
export interface CommentResourceReference {
    /**
     * REST URL for the resource.
     */
    url?: string;
}
export declare enum CommentSortOrder {
    /**
     * The results will be sorted in Ascending order.
     */
    Asc = 1,
    /**
     * The results will be sorted in Descending order.
     */
    Desc = 2
}
/**
 * Represents the possible comment states.
 */
export declare enum CommentState {
    Active = 0,
    Resolved = 1,
    Closed = 2
}
/**
 * Represents a request to update a comment.
 */
export interface CommentUpdateParameters {
    /**
     * Set the current state of the comment
     */
    state?: CommentState;
    /**
     * The updated text of the comment
     */
    text: string;
}
/**
 * Represents a specific version of a comment on a work item.
 */
export interface CommentVersion extends CommentResourceReference {
    /**
     * IdentityRef of the creator of the comment.
     */
    createdBy?: VSSInterfaces.IdentityRef;
    /**
     * The creation date of the comment.
     */
    createdDate?: Date;
    /**
     * The id assigned to the comment.
     */
    id?: number;
    /**
     * Indicates if the comment has been deleted at this version.
     */
    isDeleted?: boolean;
    /**
     * IdentityRef of the user who modified the comment at this version.
     */
    modifiedBy?: VSSInterfaces.IdentityRef;
    /**
     * The modification date of the comment for this version.
     */
    modifiedDate?: Date;
    /**
     * The rendered content of the comment at this version.
     */
    renderedText?: string;
    /**
     * Indicates the current state of the comment
     */
    state?: CommentState;
    /**
     * The text of the comment at this version.
     */
    text?: string;
    /**
     * The version number.
     */
    version?: number;
}
export declare var TypeInfo: {
    Comment: any;
    CommentAttachment: any;
    CommentExpandOptions: {
        enumValues: {
            "none": number;
            "reactions": number;
            "renderedText": number;
            "renderedTextOnly": number;
            "children": number;
            "all": number;
        };
    };
    CommentFormat: {
        enumValues: {
            "markdown": number;
            "html": number;
        };
    };
    CommentList: any;
    CommentMention: any;
    CommentMentionType: {
        enumValues: {
            "person": number;
            "workItem": number;
            "pullRequest": number;
        };
    };
    CommentReaction: any;
    CommentReactionType: {
        enumValues: {
            "like": number;
            "dislike": number;
            "heart": number;
            "hooray": number;
            "smile": number;
            "confused": number;
        };
    };
    CommentSortOrder: {
        enumValues: {
            "asc": number;
            "desc": number;
        };
    };
    CommentState: {
        enumValues: {
            "active": number;
            "resolved": number;
            "closed": number;
        };
    };
    CommentUpdateParameters: any;
    CommentVersion: any;
};
