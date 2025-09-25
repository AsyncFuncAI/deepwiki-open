/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthError } from "./CustomAuthError.js";

export class MsalCustomAuthError extends CustomAuthError {
    subError: string | undefined;

    constructor(
        error: string,
        errorDescription?: string,
        subError?: string,
        correlationId?: string
    ) {
        super(error, errorDescription, correlationId);
        Object.setPrototypeOf(this, MsalCustomAuthError.prototype);

        this.subError = subError || "";
    }
}
