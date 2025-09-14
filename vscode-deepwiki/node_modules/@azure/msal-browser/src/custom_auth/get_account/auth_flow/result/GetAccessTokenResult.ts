/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../../../response/AuthenticationResult.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { GetCurrentAccountAccessTokenError } from "../error_type/GetAccountError.js";
import {
    GetAccessTokenCompletedState,
    GetAccessTokenFailedState,
} from "../state/GetAccessTokenState.js";

/*
 * Result of getting an access token.
 */
export class GetAccessTokenResult extends AuthFlowResultBase<
    GetAccessTokenResultState,
    GetCurrentAccountAccessTokenError,
    AuthenticationResult
> {
    /**
     * Creates a new instance of GetAccessTokenResult.
     * @param resultData The result data of the access token.
     */
    constructor(resultData?: AuthenticationResult) {
        super(new GetAccessTokenCompletedState(), resultData);
    }

    /**
     * Creates a new instance of GetAccessTokenResult with an error.
     * @param error The error that occurred.
     * @return {GetAccessTokenResult} The result with the error.
     */
    static createWithError(error: unknown): GetAccessTokenResult {
        const result = new GetAccessTokenResult();
        result.error = new GetCurrentAccountAccessTokenError(
            GetAccessTokenResult.createErrorData(error)
        );
        result.state = new GetAccessTokenFailedState();

        return result;
    }

    /**
     * Checks if the result is completed.
     */
    isCompleted(): this is GetAccessTokenResult & {
        state: GetAccessTokenCompletedState;
    } {
        return this.state instanceof GetAccessTokenCompletedState;
    }

    /**
     * Checks if the result is failed.
     */
    isFailed(): this is GetAccessTokenResult & {
        state: GetAccessTokenFailedState;
    } {
        return this.state instanceof GetAccessTokenFailedState;
    }
}

/**
 * The possible states for the GetAccessTokenResult.
 * This includes:
 * - GetAccessTokenCompletedState: The access token was successfully retrieved.
 * - GetAccessTokenFailedState: The access token retrieval failed.
 */
export type GetAccessTokenResultState =
    | GetAccessTokenCompletedState
    | GetAccessTokenFailedState;
