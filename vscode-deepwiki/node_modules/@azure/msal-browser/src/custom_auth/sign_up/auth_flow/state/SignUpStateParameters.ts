/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpClient } from "../../interaction_client/SignUpClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { AuthFlowActionRequiredStateParameters } from "../../../core/auth_flow/AuthFlowState.js";
import { UserAttribute } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

export interface SignUpStateParameters
    extends AuthFlowActionRequiredStateParameters {
    username: string;
    signUpClient: SignUpClient;
    signInClient: SignInClient;
    cacheClient: CustomAuthSilentCacheClient;
}

export type SignUpPasswordRequiredStateParameters = SignUpStateParameters;

export interface SignUpCodeRequiredStateParameters
    extends SignUpStateParameters {
    codeLength: number;
    codeResendInterval: number;
}

export interface SignUpAttributesRequiredStateParameters
    extends SignUpStateParameters {
    requiredAttributes: Array<UserAttribute>;
}
