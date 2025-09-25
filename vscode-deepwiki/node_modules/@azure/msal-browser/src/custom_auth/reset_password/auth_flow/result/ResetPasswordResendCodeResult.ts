/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordResendCodeError } from "../error_type/ResetPasswordError.js";
import type { ResetPasswordCodeRequiredState } from "../state/ResetPasswordCodeRequiredState.js";
import { ResetPasswordFailedState } from "../state/ResetPasswordFailedState.js";

/*
 * Result of resending code in a reset password operation.
 */
export class ResetPasswordResendCodeResult extends AuthFlowResultBase<
    ResetPasswordResendCodeResultState,
    ResetPasswordResendCodeError,
    void
> {
    /**
     * Creates a new instance of ResetPasswordResendCodeResult.
     * @param state The state of the result.
     */
    constructor(state: ResetPasswordResendCodeResultState) {
        super(state);
    }

    /**
     * Creates a new instance of ResetPasswordResendCodeResult with an error.
     * @param error The error that occurred.
     * @returns {ResetPasswordResendCodeResult} A new instance of ResetPasswordResendCodeResult with the error set.
     */
    static createWithError(error: unknown): ResetPasswordResendCodeResult {
        const result = new ResetPasswordResendCodeResult(
            new ResetPasswordFailedState()
        );
        result.error = new ResetPasswordResendCodeError(
            ResetPasswordResendCodeResult.createErrorData(error)
        );

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is ResetPasswordResendCodeResult & {
        state: ResetPasswordFailedState;
    } {
        return this.state instanceof ResetPasswordFailedState;
    }

    /**
     * Checks if the result is in a code required state.
     */
    isCodeRequired(): this is ResetPasswordResendCodeResult & {
        state: ResetPasswordCodeRequiredState;
    } {
        /*
         * The instanceof operator couldn't be used here to check the state type since the circular dependency issue.
         * So we are using the constructor name to check the state type.
         */
        return (
            this.state.constructor?.name === "ResetPasswordCodeRequiredState"
        );
    }
}

/**
 * The possible states for the ResetPasswordResendCodeResult.
 * This includes:
 * - ResetPasswordCodeRequiredState: The reset password process requires a code.
 * - ResetPasswordFailedState: The reset password process has failed.
 */
export type ResetPasswordResendCodeResultState =
    | ResetPasswordCodeRequiredState
    | ResetPasswordFailedState;
