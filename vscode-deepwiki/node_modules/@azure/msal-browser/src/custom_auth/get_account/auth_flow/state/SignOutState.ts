/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../../core/auth_flow/AuthFlowState.js";

/**
 * The completed state of the sign-out flow.
 */
export class SignOutCompletedState extends AuthFlowStateBase {}

/**
 * The failed state of the sign-out flow.
 */
export class SignOutFailedState extends AuthFlowStateBase {}
