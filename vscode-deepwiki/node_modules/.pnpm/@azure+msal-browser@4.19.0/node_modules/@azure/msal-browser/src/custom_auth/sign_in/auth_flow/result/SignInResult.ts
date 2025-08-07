/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInError } from "../error_type/SignInError.js";
import { SignInCodeRequiredState } from "../state/SignInCodeRequiredState.js";
import { SignInPasswordRequiredState } from "../state/SignInPasswordRequiredState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";

/*
 * Result of a sign-in operation.
 */
export class SignInResult extends AuthFlowResultBase<
    SignInResultState,
    SignInError,
    CustomAuthAccountData
> {
    /**
     * Creates a new instance of SignInResultState.
     * @param state The state of the result.
     */
    constructor(state: SignInResultState, resultData?: CustomAuthAccountData) {
        super(state, resultData);
    }

    /**
     * Creates a new instance of SignInResult with an error.
     * @param error The error that occurred.
     * @returns {SignInResult} A new instance of SignInResult with the error set.
     */
    static createWithError(error: unknown): SignInResult {
        const result = new SignInResult(new SignInFailedState());
        result.error = new SignInError(SignInResult.createErrorData(error));

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignInResult & { state: SignInFailedState } {
        return this.state instanceof SignInFailedState;
    }

    /**
     * Checks if the result is in a code required state.
     */
    isCodeRequired(): this is SignInResult & {
        state: SignInCodeRequiredState;
    } {
        return this.state instanceof SignInCodeRequiredState;
    }

    /**
     * Checks if the result is in a password required state.
     */
    isPasswordRequired(): this is SignInResult & {
        state: SignInPasswordRequiredState;
    } {
        return this.state instanceof SignInPasswordRequiredState;
    }

    /**
     * Checks if the result is in a completed state.
     */
    isCompleted(): this is SignInResult & { state: SignInCompletedState } {
        return this.state instanceof SignInCompletedState;
    }
}

/**
 * The possible states for the SignInResult.
 * This includes:
 * - SignInCodeRequiredState: The sign-in process requires a code.
 * - SignInPasswordRequiredState: The sign-in process requires a password.
 * - SignInFailedState: The sign-in process has failed.
 * - SignInCompletedState: The sign-in process is completed.
 */
export type SignInResultState =
    | SignInCodeRequiredState
    | SignInPasswordRequiredState
    | SignInFailedState
    | SignInCompletedState;
