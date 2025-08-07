/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitCodeError } from "../error_type/SignInError.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { SignInSubmitCredentialResult } from "./SignInSubmitCredentialResult.js";

/*
 * Result of a sign-in submit code operation.
 */
export class SignInSubmitCodeResult extends SignInSubmitCredentialResult<SignInSubmitCodeError> {
    /**
     * Creates a new instance of SignInSubmitCodeResult with error data.
     * @param error The error that occurred.
     * @returns {SignInSubmitCodeResult} A new instance of SignInSubmitCodeResult with the error set.
     */
    static createWithError(error: unknown): SignInSubmitCodeResult {
        const result = new SignInSubmitCodeResult(new SignInFailedState());
        result.error = new SignInSubmitCodeError(
            SignInSubmitCodeResult.createErrorData(error)
        );

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignInSubmitCodeResult & { state: SignInFailedState } {
        return this.state instanceof SignInFailedState;
    }

    /**
     * Checks if the result is in a completed state.
     */
    isCompleted(): this is SignInSubmitCodeResult & {
        state: SignInCompletedState;
    } {
        return this.state instanceof SignInCompletedState;
    }
}
