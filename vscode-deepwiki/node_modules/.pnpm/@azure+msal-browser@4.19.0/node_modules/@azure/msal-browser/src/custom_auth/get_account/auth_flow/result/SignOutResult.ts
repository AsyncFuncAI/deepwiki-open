/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignOutError } from "../error_type/GetAccountError.js";
import {
    SignOutCompletedState,
    SignOutFailedState,
} from "../state/SignOutState.js";

/*
 * Result of a sign-out operation.
 */
export class SignOutResult extends AuthFlowResultBase<
    SignOutResultState,
    SignOutError,
    void
> {
    /**
     * Creates a new instance of SignOutResult.
     * @param state The state of the result.
     */
    constructor() {
        super(new SignOutCompletedState());
    }

    /**
     * Creates a new instance of SignOutResult with an error.
     * @param error The error that occurred during the sign-out operation.
     */
    static createWithError(error: unknown): SignOutResult {
        const result = new SignOutResult();
        result.error = new SignOutError(SignOutResult.createErrorData(error));
        result.state = new SignOutFailedState();

        return result;
    }

    /**
     * Checks if the sign-out operation is completed.
     */
    isCompleted(): this is SignOutResult & { state: SignOutCompletedState } {
        return this.state instanceof SignOutCompletedState;
    }

    /**
     * Checks if the sign-out operation failed.
     */
    isFailed(): this is SignOutResult & { state: SignOutFailedState } {
        return this.state instanceof SignOutFailedState;
    }
}

/**
 * The possible states for the SignOutResult.
 * This includes:
 * - SignOutCompletedState: The sign-out operation was successful.
 * - SignOutFailedState: The sign-out operation failed.
 */
export type SignOutResultState = SignOutCompletedState | SignOutFailedState;
