/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../../../response/AuthenticationResult.js";

interface SignInActionResult {
    type: string;
    correlationId: string;
}

interface SignInContinuationTokenResult extends SignInActionResult {
    continuationToken: string;
}

export interface SignInCompletedResult extends SignInActionResult {
    type: typeof SIGN_IN_COMPLETED_RESULT_TYPE;
    authenticationResult: AuthenticationResult;
}

export interface SignInPasswordRequiredResult
    extends SignInContinuationTokenResult {
    type: typeof SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE;
}

export interface SignInCodeSendResult extends SignInContinuationTokenResult {
    type: typeof SIGN_IN_CODE_SEND_RESULT_TYPE;
    challengeChannel: string;
    challengeTargetLabel: string;
    codeLength: number;
    bindingMethod: string;
}

export const SIGN_IN_CODE_SEND_RESULT_TYPE = "SignInCodeSendResult";
export const SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE =
    "SignInPasswordRequiredResult";
export const SIGN_IN_COMPLETED_RESULT_TYPE = "SignInCompletedResult";

export function createSignInCompleteResult(
    input: Omit<SignInCompletedResult, "type">
): SignInCompletedResult {
    return {
        type: SIGN_IN_COMPLETED_RESULT_TYPE,
        ...input,
    };
}

export function createSignInPasswordRequiredResult(
    input: Omit<SignInPasswordRequiredResult, "type">
): SignInPasswordRequiredResult {
    return {
        type: SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE,
        ...input,
    };
}

export function createSignInCodeSendResult(
    input: Omit<SignInCodeSendResult, "type">
): SignInCodeSendResult {
    return {
        type: SIGN_IN_CODE_SEND_RESULT_TYPE,
        ...input,
    };
}
