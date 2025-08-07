/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";

/*
 * Result of a sign-in submit credential operation.
 */
export abstract class SignInSubmitCredentialResult<
    TError extends AuthFlowErrorBase
> extends AuthFlowResultBase<
    SignInSubmitCredentialResultState,
    TError,
    CustomAuthAccountData
> {
    /**
     * Creates a new instance of SignInSubmitCredentialResult.
     * @param state The state of the result.
     * @param resultData The result data.
     */
    constructor(
        state: SignInSubmitCredentialResultState,
        resultData?: CustomAuthAccountData
    ) {
        super(state, resultData);
    }
}

/**
 * The possible states of the SignInSubmitCredentialResult.
 * This includes:
 * - SignInCompletedState: The sign-in process has completed successfully.
 * - SignInFailedState: The sign-in process has failed.
 */
export type SignInSubmitCredentialResultState =
    | SignInCompletedState
    | SignInFailedState;
