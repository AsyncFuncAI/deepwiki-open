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
/**
 * Specifies the additional data retrieval options for comments.
 */
var CommentExpandOptions;
(function (CommentExpandOptions) {
    /**
     * Include comments only, no mentions, reactions or rendered text
     */
    CommentExpandOptions[CommentExpandOptions["None"] = 0] = "None";
    /**
     * Include comment reactions
     */
    CommentExpandOptions[CommentExpandOptions["Reactions"] = 1] = "Reactions";
    /**
     * Include the rendered text (html) in addition to markdown text
     */
    CommentExpandOptions[CommentExpandOptions["RenderedText"] = 8] = "RenderedText";
    /**
     * If specified, then ONLY rendered text (html) will be returned, w/o markdown. Supposed to be used internally from data provides for optimization purposes.
     */
    CommentExpandOptions[CommentExpandOptions["RenderedTextOnly"] = 16] = "RenderedTextOnly";
    /**
     * If specified, then responses will be expanded in the results
     */
    CommentExpandOptions[CommentExpandOptions["Children"] = 32] = "Children";
    /**
     * Expand everything including Reactions, Mentions and also include RenderedText (HTML) for markdown comments
     */
    CommentExpandOptions[CommentExpandOptions["All"] = -17] = "All";
})(CommentExpandOptions = exports.CommentExpandOptions || (exports.CommentExpandOptions = {}));
/**
 * Format of the comment. Ex. Markdown, Html.
 */
var CommentFormat;
(function (CommentFormat) {
    CommentFormat[CommentFormat["Markdown"] = 0] = "Markdown";
    CommentFormat[CommentFormat["Html"] = 1] = "Html";
})(CommentFormat = exports.CommentFormat || (exports.CommentFormat = {}));
var CommentMentionType;
(function (CommentMentionType) {
    /**
     * An identity was mentioned by using the format @{VSID}
     */
    CommentMentionType[CommentMentionType["Person"] = 0] = "Person";
    /**
     * A work item was mentioned by using the format #{Work Item ID}
     */
    CommentMentionType[CommentMentionType["WorkItem"] = 1] = "WorkItem";
    /**
     * A Pull Request was mentioned by using the format !{PR Number}
     */
    CommentMentionType[CommentMentionType["PullRequest"] = 2] = "PullRequest";
})(CommentMentionType = exports.CommentMentionType || (exports.CommentMentionType = {}));
/**
 * Represents different reaction types for a comment
 */
var CommentReactionType;
(function (CommentReactionType) {
    CommentReactionType[CommentReactionType["Like"] = 0] = "Like";
    CommentReactionType[CommentReactionType["Dislike"] = 1] = "Dislike";
    CommentReactionType[CommentReactionType["Heart"] = 2] = "Heart";
    CommentReactionType[CommentReactionType["Hooray"] = 3] = "Hooray";
    CommentReactionType[CommentReactionType["Smile"] = 4] = "Smile";
    CommentReactionType[CommentReactionType["Confused"] = 5] = "Confused";
})(CommentReactionType = exports.CommentReactionType || (exports.CommentReactionType = {}));
var CommentSortOrder;
(function (CommentSortOrder) {
    /**
     * The results will be sorted in Ascending order.
     */
    CommentSortOrder[CommentSortOrder["Asc"] = 1] = "Asc";
    /**
     * The results will be sorted in Descending order.
     */
    CommentSortOrder[CommentSortOrder["Desc"] = 2] = "Desc";
})(CommentSortOrder = exports.CommentSortOrder || (exports.CommentSortOrder = {}));
/**
 * Represents the possible comment states.
 */
var CommentState;
(function (CommentState) {
    CommentState[CommentState["Active"] = 0] = "Active";
    CommentState[CommentState["Resolved"] = 1] = "Resolved";
    CommentState[CommentState["Closed"] = 2] = "Closed";
})(CommentState = exports.CommentState || (exports.CommentState = {}));
exports.TypeInfo = {
    Comment: {},
    CommentAttachment: {},
    CommentExpandOptions: {
        enumValues: {
            "none": 0,
            "reactions": 1,
            "renderedText": 8,
            "renderedTextOnly": 16,
            "children": 32,
            "all": -17
        }
    },
    CommentFormat: {
        enumValues: {
            "markdown": 0,
            "html": 1
        }
    },
    CommentList: {},
    CommentMention: {},
    CommentMentionType: {
        enumValues: {
            "person": 0,
            "workItem": 1,
            "pullRequest": 2
        }
    },
    CommentReaction: {},
    CommentReactionType: {
        enumValues: {
            "like": 0,
            "dislike": 1,
            "heart": 2,
            "hooray": 3,
            "smile": 4,
            "confused": 5
        }
    },
    CommentSortOrder: {
        enumValues: {
            "asc": 1,
            "desc": 2
        }
    },
    CommentState: {
        enumValues: {
            "active": 0,
            "resolved": 1,
            "closed": 2
        }
    },
    CommentUpdateParameters: {},
    CommentVersion: {},
};
exports.TypeInfo.Comment.fields = {
    createdDate: {
        isDate: true,
    },
    mentions: {
        isArray: true,
        typeInfo: exports.TypeInfo.CommentMention
    },
    modifiedDate: {
        isDate: true,
    },
    reactions: {
        isArray: true,
        typeInfo: exports.TypeInfo.CommentReaction
    },
    replies: {
        typeInfo: exports.TypeInfo.CommentList
    },
    state: {
        enumType: exports.TypeInfo.CommentState
    }
};
exports.TypeInfo.CommentAttachment.fields = {
    createdDate: {
        isDate: true,
    }
};
exports.TypeInfo.CommentList.fields = {
    comments: {
        isArray: true,
        typeInfo: exports.TypeInfo.Comment
    }
};
exports.TypeInfo.CommentMention.fields = {
    type: {
        enumType: exports.TypeInfo.CommentMentionType
    }
};
exports.TypeInfo.CommentReaction.fields = {
    type: {
        enumType: exports.TypeInfo.CommentReactionType
    }
};
exports.TypeInfo.CommentUpdateParameters.fields = {
    state: {
        enumType: exports.TypeInfo.CommentState
    }
};
exports.TypeInfo.CommentVersion.fields = {
    createdDate: {
        isDate: true,
    },
    modifiedDate: {
        isDate: true,
    },
    state: {
        enumType: exports.TypeInfo.CommentState
    }
};
