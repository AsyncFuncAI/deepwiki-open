/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpResendCodeError } from "../error_type/SignUpError.js";
import type { SignUpCodeRequiredState } from "../state/SignUpCodeRequiredState.js";
import { SignUpFailedState } from "../state/SignUpFailedState.js";

/*
 * Result of resending code in a sign-up operation.
 */
export class SignUpResendCodeResult extends AuthFlowResultBase<
    SignUpResendCodeResultState,
    SignUpResendCodeError,
    void
> {
    /**
     * Creates a new instance of SignUpResendCodeResult.
     * @param state The state of the result.
     */
    constructor(state: SignUpResendCodeResultState) {
        super(state);
    }

    /**
     * Creates a new instance of SignUpResendCodeResult with an error.
     * @param error The error that occurred.
     * @returns {SignUpResendCodeResult} A new instance of SignUpResendCodeResult with the error set.
     */
    static createWithError(error: unknown): SignUpResendCodeResult {
        const result = new SignUpResendCodeResult(new SignUpFailedState());
        result.error = new SignUpResendCodeError(
            SignUpResendCodeResult.createErrorData(error)
        );

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignUpResendCodeResult & { state: SignUpFailedState } {
        return this.state instanceof SignUpFailedState;
    }

    /**
     * Checks if the result is in a code required state.
     */
    isCodeRequired(): this is SignUpResendCodeResult & {
        state: SignUpCodeRequiredState;
    } {
        /*
         * The instanceof operator couldn't be used here to check the state type since the circular dependency issue.
         * So we are using the constructor name to check the state type.
         */
        return this.state.constructor?.name === "SignUpCodeRequiredState";
    }
}

/**
 * The possible states for the SignUpResendCodeResult.
 * This includes:
 * - SignUpCodeRequiredState: The sign-up process requires a code.
 * - SignUpFailedState: The sign-up process has failed.
 */
export type SignUpResendCodeResultState =
    | SignUpCodeRequiredState
    | SignUpFailedState;
