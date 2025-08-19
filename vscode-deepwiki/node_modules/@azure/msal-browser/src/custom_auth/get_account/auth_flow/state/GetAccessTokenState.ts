/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../../core/auth_flow/AuthFlowState.js";

/**
 * The completed state of the get access token flow.
 */
export class GetAccessTokenCompletedState extends AuthFlowStateBase {}

/**
 * The failed state of the get access token flow.
 */
export class GetAccessTokenFailedState extends AuthFlowStateBase {}
