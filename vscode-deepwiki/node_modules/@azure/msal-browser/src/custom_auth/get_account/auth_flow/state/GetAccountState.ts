/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../../core/auth_flow/AuthFlowState.js";

/**
 * The completed state of the get account flow.
 */
export class GetAccountCompletedState extends AuthFlowStateBase {}

/**
 * The failed state of the get account flow.
 */
export class GetAccountFailedState extends AuthFlowStateBase {}
