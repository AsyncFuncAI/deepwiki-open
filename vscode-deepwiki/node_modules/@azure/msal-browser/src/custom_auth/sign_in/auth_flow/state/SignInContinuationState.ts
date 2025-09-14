/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { SignInContinuationTokenParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInResult } from "../result/SignInResult.js";
import { SignInWithContinuationTokenInputs } from "../../../CustomAuthActionInputs.js";
import { SignInContinuationStateParameters } from "./SignInStateParameters.js";
import { SignInState } from "./SignInState.js";
import { SignInCompletedState } from "./SignInCompletedState.js";
import * as ArgumentValidator from "../../../core/utils/ArgumentValidator.js";

/*
 * Sign-in continuation state.
 */
export class SignInContinuationState extends SignInState<SignInContinuationStateParameters> {
    /**
     * Initiates the sign-in flow with continuation token.
     * @param {SignInWithContinuationTokenInputs} signInWithContinuationTokenInputs - The result of the operation.
     * @returns {Promise<SignInResult>} The result of the operation.
     */
    async signIn(
        signInWithContinuationTokenInputs?: SignInWithContinuationTokenInputs
    ): Promise<SignInResult> {
        try {
            if (signInWithContinuationTokenInputs?.claims) {
                ArgumentValidator.ensureArgumentIsJSONString(
                    "signInWithContinuationTokenInputs.claims",
                    signInWithContinuationTokenInputs.claims,
                    this.stateParameters.correlationId
                );
            }

            const continuationTokenParams: SignInContinuationTokenParams = {
                clientId: this.stateParameters.config.auth.clientId,
                correlationId: this.stateParameters.correlationId,
                challengeType:
                    this.stateParameters.config.customAuth.challengeTypes ?? [],
                scopes: signInWithContinuationTokenInputs?.scopes ?? [],
                continuationToken: this.stateParameters.continuationToken ?? "",
                username: this.stateParameters.username,
                signInScenario: this.stateParameters.signInScenario,
                claims: signInWithContinuationTokenInputs?.claims,
            };

            this.stateParameters.logger.verbose(
                "Signing in with continuation token.",
                this.stateParameters.correlationId
            );

            const completedResult =
                await this.stateParameters.signInClient.signInWithContinuationToken(
                    continuationTokenParams
                );

            this.stateParameters.logger.verbose(
                "Signed in with continuation token.",
                this.stateParameters.correlationId
            );

            const accountInfo = new CustomAuthAccountData(
                completedResult.authenticationResult.account,
                this.stateParameters.config,
                this.stateParameters.cacheClient,
                this.stateParameters.logger,
                this.stateParameters.correlationId
            );

            return new SignInResult(new SignInCompletedState(), accountInfo);
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to sign in with continuation token. Error: ${error}.`,
                this.stateParameters.correlationId
            );

            return SignInResult.createWithError(error);
        }
    }
}
