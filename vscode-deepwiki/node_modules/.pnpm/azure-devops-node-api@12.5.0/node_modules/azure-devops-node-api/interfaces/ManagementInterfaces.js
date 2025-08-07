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
var BillingMode;
(function (BillingMode) {
    /**
     * None implies the organization is not billable because no Azure Subscription has been set.
     */
    BillingMode[BillingMode["None"] = 0] = "None";
    /**
     * When an organization is the only organization mapped to an Azure Subscription.
     */
    BillingMode[BillingMode["SingleOrg"] = 1] = "SingleOrg";
    /**
     * When an organization is mapped to an Azure Subscription to which at least one other org is mapped.
     */
    BillingMode[BillingMode["MultiOrg"] = 2] = "MultiOrg";
})(BillingMode = exports.BillingMode || (exports.BillingMode = {}));
exports.TypeInfo = {
    AdvSecEnablementSettings: {},
    AdvSecEnablementStatus: {},
    BillableCommitterDetails: {},
    BillingInfo: {},
    BillingMode: {
        enumValues: {
            "none": 0,
            "singleOrg": 1,
            "multiOrg": 2
        }
    },
    MeterUsage: {},
};
exports.TypeInfo.AdvSecEnablementSettings.fields = {
    reposEnablementStatus: {
        isArray: true,
        typeInfo: exports.TypeInfo.AdvSecEnablementStatus
    }
};
exports.TypeInfo.AdvSecEnablementStatus.fields = {
    advSecEnablementLastChangedDate: {
        isDate: true,
    }
};
exports.TypeInfo.BillableCommitterDetails.fields = {
    commitTime: {
        isDate: true,
    },
    pushedTime: {
        isDate: true,
    }
};
exports.TypeInfo.BillingInfo.fields = {
    advSecEnabledChangedOnDate: {
        isDate: true,
    },
    advSecEnabledFirstChangedOnDate: {
        isDate: true,
    },
    billingMode: {
        enumType: exports.TypeInfo.BillingMode
    }
};
exports.TypeInfo.MeterUsage.fields = {
    billingDate: {
        isDate: true,
    }
};
