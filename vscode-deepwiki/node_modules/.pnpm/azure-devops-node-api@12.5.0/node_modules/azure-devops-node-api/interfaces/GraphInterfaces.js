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
const IdentitiesInterfaces = require("../interfaces/IdentitiesInterfaces");
var GraphTraversalDirection;
(function (GraphTraversalDirection) {
    GraphTraversalDirection[GraphTraversalDirection["Unknown"] = 0] = "Unknown";
    GraphTraversalDirection[GraphTraversalDirection["Down"] = 1] = "Down";
    GraphTraversalDirection[GraphTraversalDirection["Up"] = 2] = "Up";
})(GraphTraversalDirection = exports.GraphTraversalDirection || (exports.GraphTraversalDirection = {}));
exports.TypeInfo = {
    AadGraphMember: {},
    GraphScope: {},
    GraphScopeCreationContext: {},
    GraphServicePrincipal: {},
    GraphTraversalDirection: {
        enumValues: {
            "unknown": 0,
            "down": 1,
            "up": 2
        }
    },
    GraphUser: {},
    PagedGraphServicePrincipals: {},
    PagedGraphUsers: {},
};
exports.TypeInfo.AadGraphMember.fields = {
    metadataUpdateDate: {
        isDate: true,
    }
};
exports.TypeInfo.GraphScope.fields = {
    scopeType: {
        enumType: IdentitiesInterfaces.TypeInfo.GroupScopeType
    }
};
exports.TypeInfo.GraphScopeCreationContext.fields = {
    scopeType: {
        enumType: IdentitiesInterfaces.TypeInfo.GroupScopeType
    }
};
exports.TypeInfo.GraphServicePrincipal.fields = {
    metadataUpdateDate: {
        isDate: true,
    }
};
exports.TypeInfo.GraphUser.fields = {
    metadataUpdateDate: {
        isDate: true,
    }
};
exports.TypeInfo.PagedGraphServicePrincipals.fields = {
    graphServicePrincipals: {
        isArray: true,
        typeInfo: exports.TypeInfo.GraphServicePrincipal
    }
};
exports.TypeInfo.PagedGraphUsers.fields = {
    graphUsers: {
        isArray: true,
        typeInfo: exports.TypeInfo.GraphUser
    }
};
