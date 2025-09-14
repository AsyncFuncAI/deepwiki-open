/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordClient } from "../../interaction_client/ResetPasswordClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { AuthFlowActionRequiredStateParameters } from "../../../core/auth_flow/AuthFlowState.js";

export interface ResetPasswordStateParameters
    extends AuthFlowActionRequiredStateParameters {
    username: string;
    resetPasswordClient: ResetPasswordClient;
    signInClient: SignInClient;
    cacheClient: CustomAuthSilentCacheClient;
}

export type ResetPasswordPasswordRequiredStateParameters =
    ResetPasswordStateParameters;

export interface ResetPasswordCodeRequiredStateParameters
    extends ResetPasswordStateParameters {
    codeLength: number;
}
