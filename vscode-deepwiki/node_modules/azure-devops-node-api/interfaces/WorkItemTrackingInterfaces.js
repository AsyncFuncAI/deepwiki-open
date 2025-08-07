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
 * Flag to control error policy in a batch classification nodes get request.
 */
var ClassificationNodesErrorPolicy;
(function (ClassificationNodesErrorPolicy) {
    ClassificationNodesErrorPolicy[ClassificationNodesErrorPolicy["Fail"] = 1] = "Fail";
    ClassificationNodesErrorPolicy[ClassificationNodesErrorPolicy["Omit"] = 2] = "Omit";
})(ClassificationNodesErrorPolicy = exports.ClassificationNodesErrorPolicy || (exports.ClassificationNodesErrorPolicy = {}));
/**
 * Specifies the additional data retrieval options for work item comments.
 */
var CommentExpandOptions;
(function (CommentExpandOptions) {
    CommentExpandOptions[CommentExpandOptions["None"] = 0] = "None";
    /**
     * Include comment reactions.
     */
    CommentExpandOptions[CommentExpandOptions["Reactions"] = 1] = "Reactions";
    /**
     * Include the rendered text (html) in addition to MD text.
     */
    CommentExpandOptions[CommentExpandOptions["RenderedText"] = 8] = "RenderedText";
    /**
     * If specified, then ONLY rendered text (html) will be returned, w/o markdown. Supposed to be used internally from data provides for optimization purposes.
     */
    CommentExpandOptions[CommentExpandOptions["RenderedTextOnly"] = 16] = "RenderedTextOnly";
    CommentExpandOptions[CommentExpandOptions["All"] = -17] = "All";
})(CommentExpandOptions = exports.CommentExpandOptions || (exports.CommentExpandOptions = {}));
/**
 * Represents the possible types for the comment format. Should be in sync with WorkItemCommentFormat.cs
 */
var CommentFormat;
(function (CommentFormat) {
    CommentFormat[CommentFormat["Markdown"] = 0] = "Markdown";
    CommentFormat[CommentFormat["Html"] = 1] = "Html";
})(CommentFormat = exports.CommentFormat || (exports.CommentFormat = {}));
/**
 * Represents different reaction types for a work item comment.
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
 * Enum for field types.
 */
var FieldType;
(function (FieldType) {
    /**
     * String field type.
     */
    FieldType[FieldType["String"] = 0] = "String";
    /**
     * Integer field type.
     */
    FieldType[FieldType["Integer"] = 1] = "Integer";
    /**
     * Datetime field type.
     */
    FieldType[FieldType["DateTime"] = 2] = "DateTime";
    /**
     * Plain text field type.
     */
    FieldType[FieldType["PlainText"] = 3] = "PlainText";
    /**
     * HTML (Multiline) field type.
     */
    FieldType[FieldType["Html"] = 4] = "Html";
    /**
     * Treepath field type.
     */
    FieldType[FieldType["TreePath"] = 5] = "TreePath";
    /**
     * History field type.
     */
    FieldType[FieldType["History"] = 6] = "History";
    /**
     * Double field type.
     */
    FieldType[FieldType["Double"] = 7] = "Double";
    /**
     * Guid field type.
     */
    FieldType[FieldType["Guid"] = 8] = "Guid";
    /**
     * Boolean field type.
     */
    FieldType[FieldType["Boolean"] = 9] = "Boolean";
    /**
     * Identity field type.
     */
    FieldType[FieldType["Identity"] = 10] = "Identity";
    /**
     * String picklist field type. When creating a string picklist field from REST API, use "String" FieldType.
     */
    FieldType[FieldType["PicklistString"] = 11] = "PicklistString";
    /**
     * Integer picklist field type. When creating a integer picklist field from REST API, use "Integer" FieldType.
     */
    FieldType[FieldType["PicklistInteger"] = 12] = "PicklistInteger";
    /**
     * Double picklist field type. When creating a double picklist field from REST API, use "Double" FieldType.
     */
    FieldType[FieldType["PicklistDouble"] = 13] = "PicklistDouble";
})(FieldType = exports.FieldType || (exports.FieldType = {}));
/**
 * Enum for field usages.
 */
var FieldUsage;
(function (FieldUsage) {
    /**
     * Empty usage.
     */
    FieldUsage[FieldUsage["None"] = 0] = "None";
    /**
     * Work item field usage.
     */
    FieldUsage[FieldUsage["WorkItem"] = 1] = "WorkItem";
    /**
     * Work item link field usage.
     */
    FieldUsage[FieldUsage["WorkItemLink"] = 2] = "WorkItemLink";
    /**
     * Treenode field usage.
     */
    FieldUsage[FieldUsage["Tree"] = 3] = "Tree";
    /**
     * Work Item Type Extension usage.
     */
    FieldUsage[FieldUsage["WorkItemTypeExtension"] = 4] = "WorkItemTypeExtension";
})(FieldUsage = exports.FieldUsage || (exports.FieldUsage = {}));
/**
 * Flag to expand types of fields.
 */
var GetFieldsExpand;
(function (GetFieldsExpand) {
    /**
     * Default behavior.
     */
    GetFieldsExpand[GetFieldsExpand["None"] = 0] = "None";
    /**
     * Adds extension fields to the response.
     */
    GetFieldsExpand[GetFieldsExpand["ExtensionFields"] = 1] = "ExtensionFields";
    /**
     * Includes fields that have been deleted.
     */
    GetFieldsExpand[GetFieldsExpand["IncludeDeleted"] = 2] = "IncludeDeleted";
})(GetFieldsExpand = exports.GetFieldsExpand || (exports.GetFieldsExpand = {}));
/**
 * The link query mode which determines the behavior of the query.
 */
var LinkQueryMode;
(function (LinkQueryMode) {
    /**
     * Returns flat list of work items.
     */
    LinkQueryMode[LinkQueryMode["WorkItems"] = 0] = "WorkItems";
    /**
     * Returns work items where the source, target, and link criteria are all satisfied.
     */
    LinkQueryMode[LinkQueryMode["LinksOneHopMustContain"] = 1] = "LinksOneHopMustContain";
    /**
     * Returns work items that satisfy the source and link criteria, even if no linked work item satisfies the target criteria.
     */
    LinkQueryMode[LinkQueryMode["LinksOneHopMayContain"] = 2] = "LinksOneHopMayContain";
    /**
     * Returns work items that satisfy the source, only if no linked work item satisfies the link and target criteria.
     */
    LinkQueryMode[LinkQueryMode["LinksOneHopDoesNotContain"] = 3] = "LinksOneHopDoesNotContain";
    LinkQueryMode[LinkQueryMode["LinksRecursiveMustContain"] = 4] = "LinksRecursiveMustContain";
    /**
     * Returns work items a hierarchy of work items that by default satisfy the source
     */
    LinkQueryMode[LinkQueryMode["LinksRecursiveMayContain"] = 5] = "LinksRecursiveMayContain";
    LinkQueryMode[LinkQueryMode["LinksRecursiveDoesNotContain"] = 6] = "LinksRecursiveDoesNotContain";
})(LinkQueryMode = exports.LinkQueryMode || (exports.LinkQueryMode = {}));
var LogicalOperation;
(function (LogicalOperation) {
    LogicalOperation[LogicalOperation["NONE"] = 0] = "NONE";
    LogicalOperation[LogicalOperation["AND"] = 1] = "AND";
    LogicalOperation[LogicalOperation["OR"] = 2] = "OR";
})(LogicalOperation = exports.LogicalOperation || (exports.LogicalOperation = {}));
/**
 * Enumerates the possible provisioning actions that can be triggered on process template update.
 */
var ProvisioningActionType;
(function (ProvisioningActionType) {
    ProvisioningActionType[ProvisioningActionType["Import"] = 0] = "Import";
    ProvisioningActionType[ProvisioningActionType["Validate"] = 1] = "Validate";
})(ProvisioningActionType = exports.ProvisioningActionType || (exports.ProvisioningActionType = {}));
/**
 * Enum to control error policy in a query batch request.
 */
var QueryErrorPolicy;
(function (QueryErrorPolicy) {
    QueryErrorPolicy[QueryErrorPolicy["Fail"] = 1] = "Fail";
    QueryErrorPolicy[QueryErrorPolicy["Omit"] = 2] = "Omit";
})(QueryErrorPolicy = exports.QueryErrorPolicy || (exports.QueryErrorPolicy = {}));
/**
 * Determines which set of additional query properties to display
 */
var QueryExpand;
(function (QueryExpand) {
    /**
     * Expands Columns, Links and ChangeInfo
     */
    QueryExpand[QueryExpand["None"] = 0] = "None";
    /**
     * Expands Columns, Links,  ChangeInfo and WIQL text
     */
    QueryExpand[QueryExpand["Wiql"] = 1] = "Wiql";
    /**
     * Expands Columns, Links, ChangeInfo, WIQL text and clauses
     */
    QueryExpand[QueryExpand["Clauses"] = 2] = "Clauses";
    /**
     * Expands all properties
     */
    QueryExpand[QueryExpand["All"] = 3] = "All";
    /**
     * Displays minimal properties and the WIQL text
     */
    QueryExpand[QueryExpand["Minimal"] = 4] = "Minimal";
})(QueryExpand = exports.QueryExpand || (exports.QueryExpand = {}));
var QueryOption;
(function (QueryOption) {
    QueryOption[QueryOption["Doing"] = 1] = "Doing";
    QueryOption[QueryOption["Done"] = 2] = "Done";
    QueryOption[QueryOption["Followed"] = 3] = "Followed";
})(QueryOption = exports.QueryOption || (exports.QueryOption = {}));
/**
 * Determines whether a tree query matches parents or children first.
 */
var QueryRecursionOption;
(function (QueryRecursionOption) {
    /**
     * Returns work items that satisfy the source, even if no linked work item satisfies the target and link criteria.
     */
    QueryRecursionOption[QueryRecursionOption["ParentFirst"] = 0] = "ParentFirst";
    /**
     * Returns work items that satisfy the target criteria, even if no work item satisfies the source and link criteria.
     */
    QueryRecursionOption[QueryRecursionOption["ChildFirst"] = 1] = "ChildFirst";
})(QueryRecursionOption = exports.QueryRecursionOption || (exports.QueryRecursionOption = {}));
/**
 * The query result type
 */
var QueryResultType;
(function (QueryResultType) {
    /**
     * A list of work items (for flat queries).
     */
    QueryResultType[QueryResultType["WorkItem"] = 1] = "WorkItem";
    /**
     * A list of work item links (for OneHop and Tree queries).
     */
    QueryResultType[QueryResultType["WorkItemLink"] = 2] = "WorkItemLink";
})(QueryResultType = exports.QueryResultType || (exports.QueryResultType = {}));
/**
 * The type of query.
 */
var QueryType;
(function (QueryType) {
    /**
     * Gets a flat list of work items.
     */
    QueryType[QueryType["Flat"] = 1] = "Flat";
    /**
     * Gets a tree of work items showing their link hierarchy.
     */
    QueryType[QueryType["Tree"] = 2] = "Tree";
    /**
     * Gets a list of work items and their direct links.
     */
    QueryType[QueryType["OneHop"] = 3] = "OneHop";
})(QueryType = exports.QueryType || (exports.QueryType = {}));
/**
 * The reporting revision expand level.
 */
var ReportingRevisionsExpand;
(function (ReportingRevisionsExpand) {
    /**
     * Default behavior.
     */
    ReportingRevisionsExpand[ReportingRevisionsExpand["None"] = 0] = "None";
    /**
     * Add fields to the response.
     */
    ReportingRevisionsExpand[ReportingRevisionsExpand["Fields"] = 1] = "Fields";
})(ReportingRevisionsExpand = exports.ReportingRevisionsExpand || (exports.ReportingRevisionsExpand = {}));
/**
 * Enumerates types of supported xml templates used for customization.
 */
var TemplateType;
(function (TemplateType) {
    TemplateType[TemplateType["WorkItemType"] = 0] = "WorkItemType";
    TemplateType[TemplateType["GlobalWorkflow"] = 1] = "GlobalWorkflow";
})(TemplateType = exports.TemplateType || (exports.TemplateType = {}));
/**
 * Types of tree node structures.
 */
var TreeNodeStructureType;
(function (TreeNodeStructureType) {
    /**
     * Area type.
     */
    TreeNodeStructureType[TreeNodeStructureType["Area"] = 0] = "Area";
    /**
     * Iteration type.
     */
    TreeNodeStructureType[TreeNodeStructureType["Iteration"] = 1] = "Iteration";
})(TreeNodeStructureType = exports.TreeNodeStructureType || (exports.TreeNodeStructureType = {}));
/**
 * Types of tree structures groups.
 */
var TreeStructureGroup;
(function (TreeStructureGroup) {
    TreeStructureGroup[TreeStructureGroup["Areas"] = 0] = "Areas";
    TreeStructureGroup[TreeStructureGroup["Iterations"] = 1] = "Iterations";
})(TreeStructureGroup = exports.TreeStructureGroup || (exports.TreeStructureGroup = {}));
/**
 * Enum to control error policy in a bulk get work items request.
 */
var WorkItemErrorPolicy;
(function (WorkItemErrorPolicy) {
    /**
     * Fail work error policy.
     */
    WorkItemErrorPolicy[WorkItemErrorPolicy["Fail"] = 1] = "Fail";
    /**
     * Omit work error policy.
     */
    WorkItemErrorPolicy[WorkItemErrorPolicy["Omit"] = 2] = "Omit";
})(WorkItemErrorPolicy = exports.WorkItemErrorPolicy || (exports.WorkItemErrorPolicy = {}));
/**
 * Flag to control payload properties from get work item command.
 */
var WorkItemExpand;
(function (WorkItemExpand) {
    /**
     * Default behavior.
     */
    WorkItemExpand[WorkItemExpand["None"] = 0] = "None";
    /**
     * Relations work item expand.
     */
    WorkItemExpand[WorkItemExpand["Relations"] = 1] = "Relations";
    /**
     * Fields work item expand.
     */
    WorkItemExpand[WorkItemExpand["Fields"] = 2] = "Fields";
    /**
     * Links work item expand.
     */
    WorkItemExpand[WorkItemExpand["Links"] = 3] = "Links";
    /**
     * Expands all.
     */
    WorkItemExpand[WorkItemExpand["All"] = 4] = "All";
})(WorkItemExpand = exports.WorkItemExpand || (exports.WorkItemExpand = {}));
/**
 * Type of the activity
 */
var WorkItemRecentActivityType;
(function (WorkItemRecentActivityType) {
    WorkItemRecentActivityType[WorkItemRecentActivityType["Visited"] = 0] = "Visited";
    WorkItemRecentActivityType[WorkItemRecentActivityType["Edited"] = 1] = "Edited";
    WorkItemRecentActivityType[WorkItemRecentActivityType["Deleted"] = 2] = "Deleted";
    WorkItemRecentActivityType[WorkItemRecentActivityType["Restored"] = 3] = "Restored";
})(WorkItemRecentActivityType = exports.WorkItemRecentActivityType || (exports.WorkItemRecentActivityType = {}));
/**
 * Expand options for the work item field(s) request.
 */
var WorkItemTypeFieldsExpandLevel;
(function (WorkItemTypeFieldsExpandLevel) {
    /**
     * Includes only basic properties of the field.
     */
    WorkItemTypeFieldsExpandLevel[WorkItemTypeFieldsExpandLevel["None"] = 0] = "None";
    /**
     * Includes allowed values for the field.
     */
    WorkItemTypeFieldsExpandLevel[WorkItemTypeFieldsExpandLevel["AllowedValues"] = 1] = "AllowedValues";
    /**
     * Includes dependent fields of the field.
     */
    WorkItemTypeFieldsExpandLevel[WorkItemTypeFieldsExpandLevel["DependentFields"] = 2] = "DependentFields";
    /**
     * Includes allowed values and dependent fields of the field.
     */
    WorkItemTypeFieldsExpandLevel[WorkItemTypeFieldsExpandLevel["All"] = 3] = "All";
})(WorkItemTypeFieldsExpandLevel = exports.WorkItemTypeFieldsExpandLevel || (exports.WorkItemTypeFieldsExpandLevel = {}));
exports.TypeInfo = {
    AccountMyWorkResult: {},
    AccountRecentActivityWorkItemModel: {},
    AccountRecentActivityWorkItemModel2: {},
    AccountRecentActivityWorkItemModelBase: {},
    AccountRecentMentionWorkItemModel: {},
    AccountWorkWorkItemModel: {},
    ClassificationNodesErrorPolicy: {
        enumValues: {
            "fail": 1,
            "omit": 2
        }
    },
    Comment: {},
    CommentExpandOptions: {
        enumValues: {
            "none": 0,
            "reactions": 1,
            "renderedText": 8,
            "renderedTextOnly": 16,
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
    CommentVersion: {},
    ExternalDeployment: {},
    FieldType: {
        enumValues: {
            "string": 0,
            "integer": 1,
            "dateTime": 2,
            "plainText": 3,
            "html": 4,
            "treePath": 5,
            "history": 6,
            "double": 7,
            "guid": 8,
            "boolean": 9,
            "identity": 10,
            "picklistString": 11,
            "picklistInteger": 12,
            "picklistDouble": 13
        }
    },
    FieldUsage: {
        enumValues: {
            "none": 0,
            "workItem": 1,
            "workItemLink": 2,
            "tree": 3,
            "workItemTypeExtension": 4
        }
    },
    GetFieldsExpand: {
        enumValues: {
            "none": 0,
            "extensionFields": 1,
            "includeDeleted": 2
        }
    },
    LinkQueryMode: {
        enumValues: {
            "workItems": 0,
            "linksOneHopMustContain": 1,
            "linksOneHopMayContain": 2,
            "linksOneHopDoesNotContain": 3,
            "linksRecursiveMustContain": 4,
            "linksRecursiveMayContain": 5,
            "linksRecursiveDoesNotContain": 6
        }
    },
    LogicalOperation: {
        enumValues: {
            "none": 0,
            "and": 1,
            "or": 2
        }
    },
    ProvisioningActionType: {
        enumValues: {
            "import": 0,
            "validate": 1
        }
    },
    QueryBatchGetRequest: {},
    QueryErrorPolicy: {
        enumValues: {
            "fail": 1,
            "omit": 2
        }
    },
    QueryExpand: {
        enumValues: {
            "none": 0,
            "wiql": 1,
            "clauses": 2,
            "all": 3,
            "minimal": 4
        }
    },
    QueryHierarchyItem: {},
    QueryHierarchyItemsResult: {},
    QueryOption: {
        enumValues: {
            "doing": 1,
            "done": 2,
            "followed": 3
        }
    },
    QueryRecursionOption: {
        enumValues: {
            "parentFirst": 0,
            "childFirst": 1
        }
    },
    QueryResultType: {
        enumValues: {
            "workItem": 1,
            "workItemLink": 2
        }
    },
    QueryType: {
        enumValues: {
            "flat": 1,
            "tree": 2,
            "oneHop": 3
        }
    },
    ReportingRevisionsExpand: {
        enumValues: {
            "none": 0,
            "fields": 1
        }
    },
    TemplateType: {
        enumValues: {
            "workItemType": 0,
            "globalWorkflow": 1
        }
    },
    TreeNodeStructureType: {
        enumValues: {
            "area": 0,
            "iteration": 1
        }
    },
    TreeStructureGroup: {
        enumValues: {
            "areas": 0,
            "iterations": 1
        }
    },
    WorkItemBatchGetRequest: {},
    WorkItemClassificationNode: {},
    WorkItemComment: {},
    WorkItemComments: {},
    WorkItemErrorPolicy: {
        enumValues: {
            "fail": 1,
            "omit": 2
        }
    },
    WorkItemExpand: {
        enumValues: {
            "none": 0,
            "relations": 1,
            "fields": 2,
            "links": 3,
            "all": 4
        }
    },
    WorkItemField: {},
    WorkItemField2: {},
    WorkItemHistory: {},
    WorkItemQueryClause: {},
    WorkItemQueryResult: {},
    WorkItemRecentActivityType: {
        enumValues: {
            "visited": 0,
            "edited": 1,
            "deleted": 2,
            "restored": 3
        }
    },
    WorkItemTagDefinition: {},
    WorkItemTypeFieldsExpandLevel: {
        enumValues: {
            "none": 0,
            "allowedValues": 1,
            "dependentFields": 2,
            "all": 3
        }
    },
    WorkItemTypeTemplateUpdateModel: {},
    WorkItemUpdate: {},
};
exports.TypeInfo.AccountMyWorkResult.fields = {
    workItemDetails: {
        isArray: true,
        typeInfo: exports.TypeInfo.AccountWorkWorkItemModel
    }
};
exports.TypeInfo.AccountRecentActivityWorkItemModel.fields = {
    activityDate: {
        isDate: true,
    },
    activityType: {
        enumType: exports.TypeInfo.WorkItemRecentActivityType
    },
    changedDate: {
        isDate: true,
    }
};
exports.TypeInfo.AccountRecentActivityWorkItemModel2.fields = {
    activityDate: {
        isDate: true,
    },
    activityType: {
        enumType: exports.TypeInfo.WorkItemRecentActivityType
    },
    changedDate: {
        isDate: true,
    }
};
exports.TypeInfo.AccountRecentActivityWorkItemModelBase.fields = {
    activityDate: {
        isDate: true,
    },
    activityType: {
        enumType: exports.TypeInfo.WorkItemRecentActivityType
    },
    changedDate: {
        isDate: true,
    }
};
exports.TypeInfo.AccountRecentMentionWorkItemModel.fields = {
    mentionedDateField: {
        isDate: true,
    }
};
exports.TypeInfo.AccountWorkWorkItemModel.fields = {
    changedDate: {
        isDate: true,
    }
};
exports.TypeInfo.Comment.fields = {
    createdDate: {
        isDate: true,
    },
    createdOnBehalfDate: {
        isDate: true,
    },
    format: {
        enumType: exports.TypeInfo.CommentFormat
    },
    modifiedDate: {
        isDate: true,
    },
    reactions: {
        isArray: true,
        typeInfo: exports.TypeInfo.CommentReaction
    }
};
exports.TypeInfo.CommentList.fields = {
    comments: {
        isArray: true,
        typeInfo: exports.TypeInfo.Comment
    }
};
exports.TypeInfo.CommentReaction.fields = {
    type: {
        enumType: exports.TypeInfo.CommentReactionType
    }
};
exports.TypeInfo.CommentVersion.fields = {
    createdDate: {
        isDate: true,
    },
    createdOnBehalfDate: {
        isDate: true,
    },
    modifiedDate: {
        isDate: true,
    }
};
exports.TypeInfo.ExternalDeployment.fields = {
    statusDate: {
        isDate: true,
    }
};
exports.TypeInfo.QueryBatchGetRequest.fields = {
    $expand: {
        enumType: exports.TypeInfo.QueryExpand
    },
    errorPolicy: {
        enumType: exports.TypeInfo.QueryErrorPolicy
    }
};
exports.TypeInfo.QueryHierarchyItem.fields = {
    children: {
        isArray: true,
        typeInfo: exports.TypeInfo.QueryHierarchyItem
    },
    clauses: {
        typeInfo: exports.TypeInfo.WorkItemQueryClause
    },
    createdDate: {
        isDate: true,
    },
    filterOptions: {
        enumType: exports.TypeInfo.LinkQueryMode
    },
    lastExecutedDate: {
        isDate: true,
    },
    lastModifiedDate: {
        isDate: true,
    },
    linkClauses: {
        typeInfo: exports.TypeInfo.WorkItemQueryClause
    },
    queryRecursionOption: {
        enumType: exports.TypeInfo.QueryRecursionOption
    },
    queryType: {
        enumType: exports.TypeInfo.QueryType
    },
    sourceClauses: {
        typeInfo: exports.TypeInfo.WorkItemQueryClause
    },
    targetClauses: {
        typeInfo: exports.TypeInfo.WorkItemQueryClause
    }
};
exports.TypeInfo.QueryHierarchyItemsResult.fields = {
    value: {
        isArray: true,
        typeInfo: exports.TypeInfo.QueryHierarchyItem
    }
};
exports.TypeInfo.WorkItemBatchGetRequest.fields = {
    $expand: {
        enumType: exports.TypeInfo.WorkItemExpand
    },
    asOf: {
        isDate: true,
    },
    errorPolicy: {
        enumType: exports.TypeInfo.WorkItemErrorPolicy
    }
};
exports.TypeInfo.WorkItemClassificationNode.fields = {
    children: {
        isArray: true,
        typeInfo: exports.TypeInfo.WorkItemClassificationNode
    },
    structureType: {
        enumType: exports.TypeInfo.TreeNodeStructureType
    }
};
exports.TypeInfo.WorkItemComment.fields = {
    format: {
        enumType: exports.TypeInfo.CommentFormat
    },
    revisedDate: {
        isDate: true,
    }
};
exports.TypeInfo.WorkItemComments.fields = {
    comments: {
        isArray: true,
        typeInfo: exports.TypeInfo.WorkItemComment
    }
};
exports.TypeInfo.WorkItemField.fields = {
    type: {
        enumType: exports.TypeInfo.FieldType
    },
    usage: {
        enumType: exports.TypeInfo.FieldUsage
    }
};
exports.TypeInfo.WorkItemField2.fields = {
    type: {
        enumType: exports.TypeInfo.FieldType
    },
    usage: {
        enumType: exports.TypeInfo.FieldUsage
    }
};
exports.TypeInfo.WorkItemHistory.fields = {
    revisedDate: {
        isDate: true,
    }
};
exports.TypeInfo.WorkItemQueryClause.fields = {
    clauses: {
        isArray: true,
        typeInfo: exports.TypeInfo.WorkItemQueryClause
    },
    logicalOperator: {
        enumType: exports.TypeInfo.LogicalOperation
    }
};
exports.TypeInfo.WorkItemQueryResult.fields = {
    asOf: {
        isDate: true,
    },
    queryResultType: {
        enumType: exports.TypeInfo.QueryResultType
    },
    queryType: {
        enumType: exports.TypeInfo.QueryType
    }
};
exports.TypeInfo.WorkItemTagDefinition.fields = {
    lastUpdated: {
        isDate: true,
    }
};
exports.TypeInfo.WorkItemTypeTemplateUpdateModel.fields = {
    actionType: {
        enumType: exports.TypeInfo.ProvisioningActionType
    },
    templateType: {
        enumType: exports.TypeInfo.TemplateType
    }
};
exports.TypeInfo.WorkItemUpdate.fields = {
    revisedDate: {
        isDate: true,
    }
};
