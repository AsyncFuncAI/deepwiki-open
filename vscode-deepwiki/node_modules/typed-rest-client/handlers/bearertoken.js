"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
class BearerCredentialHandler {
    constructor(token, allowCrossOriginAuthentication) {
        this.token = token;
        this.allowCrossOriginAuthentication = allowCrossOriginAuthentication;
    }
    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options) {
        if (!this.origin) {
            this.origin = options.host;
        }
        // If this is a redirection, don't set the Authorization header
        if (this.origin === options.host || this.allowCrossOriginAuthentication) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }
        options.headers['X-TFS-FedAuthRedirect'] = 'Suppress';
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.BearerCredentialHandler = BearerCredentialHandler;
