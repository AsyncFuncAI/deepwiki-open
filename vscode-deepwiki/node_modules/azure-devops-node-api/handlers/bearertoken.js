"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
const resthandlers = require("typed-rest-client/Handlers");
class BearerCredentialHandler extends resthandlers.BearerCredentialHandler {
    constructor(token, allowCrossOriginAuthentication = true) {
        super(token, allowCrossOriginAuthentication);
    }
}
exports.BearerCredentialHandler = BearerCredentialHandler;
