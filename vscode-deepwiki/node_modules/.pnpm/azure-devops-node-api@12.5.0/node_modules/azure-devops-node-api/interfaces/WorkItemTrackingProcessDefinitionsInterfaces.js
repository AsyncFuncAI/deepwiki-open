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
 * Enum for the type of a field.
 */
var FieldType;
(function (FieldType) {
    /**
     * String field type.
     */
    FieldType[FieldType["String"] = 1] = "String";
    /**
     * Integer field type.
     */
    FieldType[FieldType["Integer"] = 2] = "Integer";
    /**
     * Datetime field type.
     */
    FieldType[FieldType["DateTime"] = 3] = "DateTime";
    /**
     * Plain Text field type.
     */
    FieldType[FieldType["PlainText"] = 5] = "PlainText";
    /**
     * HTML (Multiline) field type.
     */
    FieldType[FieldType["Html"] = 7] = "Html";
    /**
     * Treepath field type.
     */
    FieldType[FieldType["TreePath"] = 8] = "TreePath";
    /**
     * History field type.
     */
    FieldType[FieldType["History"] = 9] = "History";
    /**
     * Double field type.
     */
    FieldType[FieldType["Double"] = 10] = "Double";
    /**
     * Guid field type.
     */
    FieldType[FieldType["Guid"] = 11] = "Guid";
    /**
     * Boolean field type.
     */
    FieldType[FieldType["Boolean"] = 12] = "Boolean";
    /**
     * Identity field type.
     */
    FieldType[FieldType["Identity"] = 13] = "Identity";
    /**
     * Integer picklist field type.
     */
    FieldType[FieldType["PicklistInteger"] = 14] = "PicklistInteger";
    /**
     * String picklist field type.
     */
    FieldType[FieldType["PicklistString"] = 15] = "PicklistString";
    /**
     * Double picklist field type.
     */
    FieldType[FieldType["PicklistDouble"] = 16] = "PicklistDouble";
})(FieldType = exports.FieldType || (exports.FieldType = {}));
var GetWorkItemTypeExpand;
(function (GetWorkItemTypeExpand) {
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["None"] = 0] = "None";
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["States"] = 1] = "States";
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["Behaviors"] = 2] = "Behaviors";
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["Layout"] = 4] = "Layout";
})(GetWorkItemTypeExpand = exports.GetWorkItemTypeExpand || (exports.GetWorkItemTypeExpand = {}));
/**
 * Type of page
 */
var PageType;
(function (PageType) {
    PageType[PageType["Custom"] = 1] = "Custom";
    PageType[PageType["History"] = 2] = "History";
    PageType[PageType["Links"] = 3] = "Links";
    PageType[PageType["Attachments"] = 4] = "Attachments";
})(PageType = exports.PageType || (exports.PageType = {}));
/**
 * Work item type classes'
 */
var WorkItemTypeClass;
(function (WorkItemTypeClass) {
    WorkItemTypeClass[WorkItemTypeClass["System"] = 0] = "System";
    WorkItemTypeClass[WorkItemTypeClass["Derived"] = 1] = "Derived";
    WorkItemTypeClass[WorkItemTypeClass["Custom"] = 2] = "Custom";
})(WorkItemTypeClass = exports.WorkItemTypeClass || (exports.WorkItemTypeClass = {}));
exports.TypeInfo = {
    FieldModel: {},
    FieldType: {
        enumValues: {
            "string": 1,
            "integer": 2,
            "dateTime": 3,
            "plainText": 5,
            "html": 7,
            "treePath": 8,
            "history": 9,
            "double": 10,
            "guid": 11,
            "boolean": 12,
            "identity": 13,
            "picklistInteger": 14,
            "picklistString": 15,
            "picklistDouble": 16
        }
    },
    FormLayout: {},
    GetWorkItemTypeExpand: {
        enumValues: {
            "none": 0,
            "states": 1,
            "behaviors": 2,
            "layout": 4
        }
    },
    Page: {},
    PageType: {
        enumValues: {
            "custom": 1,
            "history": 2,
            "links": 3,
            "attachments": 4
        }
    },
    WorkItemTypeClass: {
        enumValues: {
            "system": 0,
            "derived": 1,
            "custom": 2
        }
    },
    WorkItemTypeFieldModel: {},
    WorkItemTypeFieldModel2: {},
    WorkItemTypeModel: {},
};
exports.TypeInfo.FieldModel.fields = {
    type: {
        enumType: exports.TypeInfo.FieldType
    }
};
exports.TypeInfo.FormLayout.fields = {
    pages: {
        isArray: true,
        typeInfo: exports.TypeInfo.Page
    }
};
exports.TypeInfo.Page.fields = {
    pageType: {
        enumType: exports.TypeInfo.PageType
    }
};
exports.TypeInfo.WorkItemTypeFieldModel.fields = {
    type: {
        enumType: exports.TypeInfo.FieldType
    }
};
exports.TypeInfo.WorkItemTypeFieldModel2.fields = {
    type: {
        enumType: exports.TypeInfo.FieldType
    }
};
exports.TypeInfo.WorkItemTypeModel.fields = {
    class: {
        enumType: exports.TypeInfo.WorkItemTypeClass
    },
    layout: {
        typeInfo: exports.TypeInfo.FormLayout
    }
};
