/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitPasswordError } from "../error_type/SignInError.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { SignInSubmitCredentialResult } from "./SignInSubmitCredentialResult.js";

/*
 * Result of a sign-in submit password operation.
 */
export class SignInSubmitPasswordResult extends SignInSubmitCredentialResult<SignInSubmitPasswordError> {
    static createWithError(error: unknown): SignInSubmitPasswordResult {
        const result = new SignInSubmitPasswordResult(new SignInFailedState());
        result.error = new SignInSubmitPasswordError(
            SignInSubmitPasswordResult.createErrorData(error)
        );

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignInSubmitPasswordResult & {
        state: SignInFailedState;
    } {
        return this.state instanceof SignInFailedState;
    }

    /**
     * Checks if the result is in a completed state.
     */
    isCompleted(): this is SignInSubmitPasswordResult & {
        state: SignInCompletedState;
    } {
        return this.state instanceof SignInCompletedState;
    }
}
