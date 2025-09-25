/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../core/auth_flow/AuthFlowState.js";
import { ensureArgumentIsNotEmptyString } from "../../../core/utils/ArgumentValidator.js";
import { SignInStateParameters } from "./SignInStateParameters.js";

/*
 * Base state handler for sign-in flow.
 */
export abstract class SignInState<
    TParameters extends SignInStateParameters
> extends AuthFlowActionRequiredStateBase<TParameters> {
    /*
     * Creates a new SignInState.
     * @param stateParameters - The state parameters for sign-in.
     */
    constructor(stateParameters: TParameters) {
        super(stateParameters);

        ensureArgumentIsNotEmptyString(
            "username",
            stateParameters.username,
            stateParameters.correlationId
        );
        ensureArgumentIsNotEmptyString(
            "continuationToken",
            stateParameters.continuationToken,
            stateParameters.correlationId
        );
    }
}
