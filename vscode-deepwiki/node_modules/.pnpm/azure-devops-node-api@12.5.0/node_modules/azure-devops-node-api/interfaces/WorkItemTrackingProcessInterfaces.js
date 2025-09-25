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
 * Indicates the customization-type. Customization-type is System if is system generated or by default. Customization-type is Inherited if the existing workitemtype of inherited process is customized. Customization-type is Custom if the newly created workitemtype is customized.
 */
var CustomizationType;
(function (CustomizationType) {
    /**
     * Customization-type is System if is system generated workitemtype.
     */
    CustomizationType[CustomizationType["System"] = 1] = "System";
    /**
     * Customization-type is Inherited if the existing workitemtype of inherited process is customized.
     */
    CustomizationType[CustomizationType["Inherited"] = 2] = "Inherited";
    /**
     * Customization-type is Custom if the newly created workitemtype is customized.
     */
    CustomizationType[CustomizationType["Custom"] = 3] = "Custom";
})(CustomizationType = exports.CustomizationType || (exports.CustomizationType = {}));
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
     * DateTime field type.
     */
    FieldType[FieldType["DateTime"] = 3] = "DateTime";
    /**
     * Plain text field type.
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
/**
 * Expand options to fetch fields for behaviors API.
 */
var GetBehaviorsExpand;
(function (GetBehaviorsExpand) {
    /**
     * Default none option.
     */
    GetBehaviorsExpand[GetBehaviorsExpand["None"] = 0] = "None";
    /**
     * This option returns fields associated with a behavior.
     */
    GetBehaviorsExpand[GetBehaviorsExpand["Fields"] = 1] = "Fields";
    /**
     * This option returns fields associated with this behavior and all behaviors from which it inherits.
     */
    GetBehaviorsExpand[GetBehaviorsExpand["CombinedFields"] = 2] = "CombinedFields";
})(GetBehaviorsExpand = exports.GetBehaviorsExpand || (exports.GetBehaviorsExpand = {}));
/**
 * The expand level of returned processes.
 */
var GetProcessExpandLevel;
(function (GetProcessExpandLevel) {
    /**
     * No expand level.
     */
    GetProcessExpandLevel[GetProcessExpandLevel["None"] = 0] = "None";
    /**
     * Projects expand level.
     */
    GetProcessExpandLevel[GetProcessExpandLevel["Projects"] = 1] = "Projects";
})(GetProcessExpandLevel = exports.GetProcessExpandLevel || (exports.GetProcessExpandLevel = {}));
/**
 * Flag to define what properties to return in get work item type response.
 */
var GetWorkItemTypeExpand;
(function (GetWorkItemTypeExpand) {
    /**
     * Returns no properties in get work item type response.
     */
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["None"] = 0] = "None";
    /**
     * Returns states property in get work item type response.
     */
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["States"] = 1] = "States";
    /**
     * Returns behaviors property in get work item type response.
     */
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["Behaviors"] = 2] = "Behaviors";
    /**
     * Returns layout property in get work item type response.
     */
    GetWorkItemTypeExpand[GetWorkItemTypeExpand["Layout"] = 4] = "Layout";
})(GetWorkItemTypeExpand = exports.GetWorkItemTypeExpand || (exports.GetWorkItemTypeExpand = {}));
/**
 * Enum for the types of pages in the work item form layout
 */
var PageType;
(function (PageType) {
    /**
     * Custom page type.
     */
    PageType[PageType["Custom"] = 1] = "Custom";
    /**
     * History page type.
     */
    PageType[PageType["History"] = 2] = "History";
    /**
     * Link page type.
     */
    PageType[PageType["Links"] = 3] = "Links";
    /**
     * Attachment page type.
     */
    PageType[PageType["Attachments"] = 4] = "Attachments";
})(PageType = exports.PageType || (exports.PageType = {}));
var ProcessClass;
(function (ProcessClass) {
    ProcessClass[ProcessClass["System"] = 0] = "System";
    ProcessClass[ProcessClass["Derived"] = 1] = "Derived";
    ProcessClass[ProcessClass["Custom"] = 2] = "Custom";
})(ProcessClass = exports.ProcessClass || (exports.ProcessClass = {}));
/**
 * Expand options for the work item field(s) request.
 */
var ProcessWorkItemTypeFieldsExpandLevel;
(function (ProcessWorkItemTypeFieldsExpandLevel) {
    /**
     * Includes only basic properties of the field.
     */
    ProcessWorkItemTypeFieldsExpandLevel[ProcessWorkItemTypeFieldsExpandLevel["None"] = 0] = "None";
    /**
     * Includes allowed values for the field.
     */
    ProcessWorkItemTypeFieldsExpandLevel[ProcessWorkItemTypeFieldsExpandLevel["AllowedValues"] = 1] = "AllowedValues";
    /**
     * Includes allowed values and dependent fields of the field.
     */
    ProcessWorkItemTypeFieldsExpandLevel[ProcessWorkItemTypeFieldsExpandLevel["All"] = 2] = "All";
})(ProcessWorkItemTypeFieldsExpandLevel = exports.ProcessWorkItemTypeFieldsExpandLevel || (exports.ProcessWorkItemTypeFieldsExpandLevel = {}));
/**
 * Type of action to take when the rule is triggered.
 */
var RuleActionType;
(function (RuleActionType) {
    /**
     * Make the target field required. Example : {"actionType":"$makeRequired","targetField":"Microsoft.VSTS.Common.Activity","value":""}
     */
    RuleActionType[RuleActionType["MakeRequired"] = 1] = "MakeRequired";
    /**
     * Make the target field read-only. Example : {"actionType":"$makeReadOnly","targetField":"Microsoft.VSTS.Common.Activity","value":""}
     */
    RuleActionType[RuleActionType["MakeReadOnly"] = 2] = "MakeReadOnly";
    /**
     * Set a default value on the target field. This is used if the user creates a integer/string field and sets a default value of this field.
     */
    RuleActionType[RuleActionType["SetDefaultValue"] = 3] = "SetDefaultValue";
    /**
     * Set the default value on the target field from server clock. This is used if user creates the field like Date/Time and uses default value.
     */
    RuleActionType[RuleActionType["SetDefaultFromClock"] = 4] = "SetDefaultFromClock";
    /**
     * Set the default current user value on the target field. This is used if the user creates the field of type identity and uses default value.
     */
    RuleActionType[RuleActionType["SetDefaultFromCurrentUser"] = 5] = "SetDefaultFromCurrentUser";
    /**
     * Set the default value on from existing field to the target field.  This used wants to set a existing field value to the current field.
     */
    RuleActionType[RuleActionType["SetDefaultFromField"] = 6] = "SetDefaultFromField";
    /**
     * Set the value of target field to given value. Example : {actionType: "$copyValue", targetField: "ScrumInherited.mypicklist", value: "samplevalue"}
     */
    RuleActionType[RuleActionType["CopyValue"] = 7] = "CopyValue";
    /**
     * Set the value from clock.
     */
    RuleActionType[RuleActionType["CopyFromClock"] = 8] = "CopyFromClock";
    /**
     * Set the current user to the target field. Example : {"actionType":"$copyFromCurrentUser","targetField":"System.AssignedTo","value":""}.
     */
    RuleActionType[RuleActionType["CopyFromCurrentUser"] = 9] = "CopyFromCurrentUser";
    /**
     * Copy the value from a specified field and set to target field. Example : {actionType: "$copyFromField", targetField: "System.AssignedTo", value:"System.ChangedBy"}. Here, value is copied from "System.ChangedBy" and set to "System.AssingedTo" field.
     */
    RuleActionType[RuleActionType["CopyFromField"] = 10] = "CopyFromField";
    /**
     * Set the value of the target field to empty.
     */
    RuleActionType[RuleActionType["SetValueToEmpty"] = 11] = "SetValueToEmpty";
    /**
     * Use the current time to set the value of the target field. Example : {actionType: "$copyFromServerClock", targetField: "System.CreatedDate", value: ""}
     */
    RuleActionType[RuleActionType["CopyFromServerClock"] = 12] = "CopyFromServerClock";
    /**
     * Use the current user to set the value of the target field.
     */
    RuleActionType[RuleActionType["CopyFromServerCurrentUser"] = 13] = "CopyFromServerCurrentUser";
    /**
     * Hides target field from the form. This is a server side only action.
     */
    RuleActionType[RuleActionType["HideTargetField"] = 14] = "HideTargetField";
    /**
     * Disallows a field from being set to a specific value.
     */
    RuleActionType[RuleActionType["DisallowValue"] = 15] = "DisallowValue";
})(RuleActionType = exports.RuleActionType || (exports.RuleActionType = {}));
/**
 * Type of rule condition.
 */
var RuleConditionType;
(function (RuleConditionType) {
    /**
     * $When. This condition limits the execution of its children to cases when another field has a particular value, i.e. when the Is value of the referenced field is equal to the given literal value.
     */
    RuleConditionType[RuleConditionType["When"] = 1] = "When";
    /**
     * $WhenNot.This condition limits the execution of its children to cases when another field does not have a particular value, i.e.when the Is value of the referenced field is not equal to the given literal value.
     */
    RuleConditionType[RuleConditionType["WhenNot"] = 2] = "WhenNot";
    /**
     * $WhenChanged.This condition limits the execution of its children to cases when another field has changed, i.e.when the Is value of the referenced field is not equal to the Was value of that field.
     */
    RuleConditionType[RuleConditionType["WhenChanged"] = 3] = "WhenChanged";
    /**
     * $WhenNotChanged.This condition limits the execution of its children to cases when another field has not changed, i.e.when the Is value of the referenced field is equal to the Was value of that field.
     */
    RuleConditionType[RuleConditionType["WhenNotChanged"] = 4] = "WhenNotChanged";
    /**
     * $WhenWas. This condition limits the execution of its children to cases when another field value is changed from one value to another. e.g. If the condition is : When the work item state changes from New to Approved, here $WhenWas clause defines the "New" state of the workitem and $When clause defines "Approved" state.
     */
    RuleConditionType[RuleConditionType["WhenWas"] = 5] = "WhenWas";
    RuleConditionType[RuleConditionType["WhenStateChangedTo"] = 6] = "WhenStateChangedTo";
    RuleConditionType[RuleConditionType["WhenStateChangedFromAndTo"] = 7] = "WhenStateChangedFromAndTo";
    RuleConditionType[RuleConditionType["WhenWorkItemIsCreated"] = 8] = "WhenWorkItemIsCreated";
    RuleConditionType[RuleConditionType["WhenValueIsDefined"] = 9] = "WhenValueIsDefined";
    RuleConditionType[RuleConditionType["WhenValueIsNotDefined"] = 10] = "WhenValueIsNotDefined";
    /**
     * This condition checks if current user is member of a particular group. This condition does not have any 1:1 mapping with any server side rule condition, rather this is a dummy condition added for customer simplicity of understanding. This condition is later translated to a FOR membership filter . e.g. If the condition is : WhenCurrentUserIsMemberOfGroup "Approvers" then "MakeRequired" Field1.Here it translates to a For rule , "MakeRequired" for "Approvers"
     */
    RuleConditionType[RuleConditionType["WhenCurrentUserIsMemberOfGroup"] = 11] = "WhenCurrentUserIsMemberOfGroup";
    /**
     * This condition checks if current user is not member of a particular group. This condition does not have any 1:1 mapping with any server side rule condition, rather this is a dummy condition added for customer simplicity of understanding. This condition is later translated to a NOT membership filter . e.g. If the condition is : WhenCurrentUserIsNotMemberOfGroup "Approvers" then "MakeRequired" Field1.Here it translates to a Not rule , "MakeRequired" not "Approvers"
     */
    RuleConditionType[RuleConditionType["WhenCurrentUserIsNotMemberOfGroup"] = 12] = "WhenCurrentUserIsNotMemberOfGroup";
})(RuleConditionType = exports.RuleConditionType || (exports.RuleConditionType = {}));
var WorkItemTypeClass;
(function (WorkItemTypeClass) {
    WorkItemTypeClass[WorkItemTypeClass["System"] = 0] = "System";
    WorkItemTypeClass[WorkItemTypeClass["Derived"] = 1] = "Derived";
    WorkItemTypeClass[WorkItemTypeClass["Custom"] = 2] = "Custom";
})(WorkItemTypeClass = exports.WorkItemTypeClass || (exports.WorkItemTypeClass = {}));
exports.TypeInfo = {
    CreateProcessRuleRequest: {},
    CustomizationType: {
        enumValues: {
            "system": 1,
            "inherited": 2,
            "custom": 3
        }
    },
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
    GetBehaviorsExpand: {
        enumValues: {
            "none": 0,
            "fields": 1,
            "combinedFields": 2
        }
    },
    GetProcessExpandLevel: {
        enumValues: {
            "none": 0,
            "projects": 1
        }
    },
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
    ProcessBehavior: {},
    ProcessClass: {
        enumValues: {
            "system": 0,
            "derived": 1,
            "custom": 2
        }
    },
    ProcessInfo: {},
    ProcessModel: {},
    ProcessProperties: {},
    ProcessRule: {},
    ProcessWorkItemType: {},
    ProcessWorkItemTypeField: {},
    ProcessWorkItemTypeFieldsExpandLevel: {
        enumValues: {
            "none": 0,
            "allowedValues": 1,
            "all": 2
        }
    },
    RuleAction: {},
    RuleActionType: {
        enumValues: {
            "makeRequired": 1,
            "makeReadOnly": 2,
            "setDefaultValue": 3,
            "setDefaultFromClock": 4,
            "setDefaultFromCurrentUser": 5,
            "setDefaultFromField": 6,
            "copyValue": 7,
            "copyFromClock": 8,
            "copyFromCurrentUser": 9,
            "copyFromField": 10,
            "setValueToEmpty": 11,
            "copyFromServerClock": 12,
            "copyFromServerCurrentUser": 13,
            "hideTargetField": 14,
            "disallowValue": 15
        }
    },
    RuleCondition: {},
    RuleConditionType: {
        enumValues: {
            "when": 1,
            "whenNot": 2,
            "whenChanged": 3,
            "whenNotChanged": 4,
            "whenWas": 5,
            "whenStateChangedTo": 6,
            "whenStateChangedFromAndTo": 7,
            "whenWorkItemIsCreated": 8,
            "whenValueIsDefined": 9,
            "whenValueIsNotDefined": 10,
            "whenCurrentUserIsMemberOfGroup": 11,
            "whenCurrentUserIsNotMemberOfGroup": 12
        }
    },
    UpdateProcessRuleRequest: {},
    WorkItemStateResultModel: {},
    WorkItemTypeClass: {
        enumValues: {
            "system": 0,
            "derived": 1,
            "custom": 2
        }
    },
    WorkItemTypeModel: {},
};
exports.TypeInfo.CreateProcessRuleRequest.fields = {
    actions: {
        isArray: true,
        typeInfo: exports.TypeInfo.RuleAction
    },
    conditions: {
        isArray: true,
        typeInfo: exports.TypeInfo.RuleCondition
    }
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
exports.TypeInfo.ProcessBehavior.fields = {
    customization: {
        enumType: exports.TypeInfo.CustomizationType
    }
};
exports.TypeInfo.ProcessInfo.fields = {
    customizationType: {
        enumType: exports.TypeInfo.CustomizationType
    }
};
exports.TypeInfo.ProcessModel.fields = {
    properties: {
        typeInfo: exports.TypeInfo.ProcessProperties
    }
};
exports.TypeInfo.ProcessProperties.fields = {
    class: {
        enumType: exports.TypeInfo.ProcessClass
    }
};
exports.TypeInfo.ProcessRule.fields = {
    actions: {
        isArray: true,
        typeInfo: exports.TypeInfo.RuleAction
    },
    conditions: {
        isArray: true,
        typeInfo: exports.TypeInfo.RuleCondition
    },
    customizationType: {
        enumType: exports.TypeInfo.CustomizationType
    }
};
exports.TypeInfo.ProcessWorkItemType.fields = {
    customization: {
        enumType: exports.TypeInfo.CustomizationType
    },
    layout: {
        typeInfo: exports.TypeInfo.FormLayout
    },
    states: {
        isArray: true,
        typeInfo: exports.TypeInfo.WorkItemStateResultModel
    }
};
exports.TypeInfo.ProcessWorkItemTypeField.fields = {
    customization: {
        enumType: exports.TypeInfo.CustomizationType
    },
    type: {
        enumType: exports.TypeInfo.FieldType
    }
};
exports.TypeInfo.RuleAction.fields = {
    actionType: {
        enumType: exports.TypeInfo.RuleActionType
    }
};
exports.TypeInfo.RuleCondition.fields = {
    conditionType: {
        enumType: exports.TypeInfo.RuleConditionType
    }
};
exports.TypeInfo.UpdateProcessRuleRequest.fields = {
    actions: {
        isArray: true,
        typeInfo: exports.TypeInfo.RuleAction
    },
    conditions: {
        isArray: true,
        typeInfo: exports.TypeInfo.RuleCondition
    }
};
exports.TypeInfo.WorkItemStateResultModel.fields = {
    customizationType: {
        enumType: exports.TypeInfo.CustomizationType
    }
};
exports.TypeInfo.WorkItemTypeModel.fields = {
    class: {
        enumType: exports.TypeInfo.WorkItemTypeClass
    },
    layout: {
        typeInfo: exports.TypeInfo.FormLayout
    },
    states: {
        isArray: true,
        typeInfo: exports.TypeInfo.WorkItemStateResultModel
    }
};
