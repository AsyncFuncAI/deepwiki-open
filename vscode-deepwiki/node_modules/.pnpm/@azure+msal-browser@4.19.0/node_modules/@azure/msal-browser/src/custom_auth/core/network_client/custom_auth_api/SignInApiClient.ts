/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-common/browser";
import { GrantType } from "../../../CustomAuthConstants.js";
import { CustomAuthApiError } from "../../error/CustomAuthApiError.js";
import { BaseApiClient } from "./BaseApiClient.js";
import * as CustomAuthApiEndpoint from "./CustomAuthApiEndpoint.js";
import * as CustomAuthApiErrorCode from "./types/ApiErrorCodes.js";
import {
    SignInChallengeRequest,
    SignInContinuationTokenRequest,
    SignInInitiateRequest,
    SignInOobTokenRequest,
    SignInPasswordTokenRequest,
} from "./types/ApiRequestTypes.js";
import {
    SignInChallengeResponse,
    SignInInitiateResponse,
    SignInTokenResponse,
} from "./types/ApiResponseTypes.js";

export class SignInApiClient extends BaseApiClient {
    /**
     * Initiates the sign-in flow
     * @param username User's email
     * @param authMethod 'email-otp' | 'email-password'
     */
    async initiate(
        params: SignInInitiateRequest
    ): Promise<SignInInitiateResponse> {
        const result = await this.request<SignInInitiateResponse>(
            CustomAuthApiEndpoint.SIGNIN_INITIATE,
            {
                username: params.username,
                challenge_type: params.challenge_type,
            },
            params.telemetryManager,
            params.correlationId
        );

        this.ensureContinuationTokenIsValid(
            result.continuation_token,
            params.correlationId
        );

        return result;
    }

    /**
     * Requests authentication challenge (OTP or password validation)
     * @param continuationToken Token from initiate response
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestChallenge(
        params: SignInChallengeRequest
    ): Promise<SignInChallengeResponse> {
        const result = await this.request<SignInChallengeResponse>(
            CustomAuthApiEndpoint.SIGNIN_CHALLENGE,
            {
                continuation_token: params.continuation_token,
                challenge_type: params.challenge_type,
            },
            params.telemetryManager,
            params.correlationId
        );

        this.ensureContinuationTokenIsValid(
            result.continuation_token,
            params.correlationId
        );

        return result;
    }

    /**
     * Requests security tokens using either password or OTP
     * @param continuationToken Token from challenge response
     * @param credentials Password or OTP
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestTokensWithPassword(
        params: SignInPasswordTokenRequest
    ): Promise<SignInTokenResponse> {
        return this.requestTokens(
            {
                continuation_token: params.continuation_token,
                grant_type: GrantType.PASSWORD,
                scope: params.scope,
                password: params.password,
                ...(params.claims && { claims: params.claims }),
            },
            params.telemetryManager,
            params.correlationId
        );
    }

    async requestTokensWithOob(
        params: SignInOobTokenRequest
    ): Promise<SignInTokenResponse> {
        return this.requestTokens(
            {
                continuation_token: params.continuation_token,
                scope: params.scope,
                oob: params.oob,
                grant_type: GrantType.OOB,
                ...(params.claims && { claims: params.claims }),
            },
            params.telemetryManager,
            params.correlationId
        );
    }

    async requestTokenWithContinuationToken(
        params: SignInContinuationTokenRequest
    ): Promise<SignInTokenResponse> {
        return this.requestTokens(
            {
                continuation_token: params.continuation_token,
                username: params.username,
                scope: params.scope,
                grant_type: GrantType.CONTINUATION_TOKEN,
                client_info: true,
                ...(params.claims && { claims: params.claims }),
            },
            params.telemetryManager,
            params.correlationId
        );
    }

    private async requestTokens(
        requestData: Record<string, string | boolean>,
        telemetryManager: ServerTelemetryManager,
        correlationId: string
    ): Promise<SignInTokenResponse> {
        // The client_info parameter is required for MSAL to return the uid and utid in the response.
        requestData.client_info = true;

        const result = await this.request<SignInTokenResponse>(
            CustomAuthApiEndpoint.SIGNIN_TOKEN,
            requestData,
            telemetryManager,
            correlationId
        );

        SignInApiClient.ensureTokenResponseIsValid(result);

        return result;
    }

    private static ensureTokenResponseIsValid(
        tokenResponse: SignInTokenResponse
    ): void {
        let errorCode = "";
        let errorDescription = "";

        if (!tokenResponse.access_token) {
            errorCode = CustomAuthApiErrorCode.ACCESS_TOKEN_MISSING;
            errorDescription = "Access token is missing in the response body";
        } else if (!tokenResponse.id_token) {
            errorCode = CustomAuthApiErrorCode.ID_TOKEN_MISSING;
            errorDescription = "Id token is missing in the response body";
        } else if (!tokenResponse.refresh_token) {
            errorCode = CustomAuthApiErrorCode.REFRESH_TOKEN_MISSING;
            errorDescription = "Refresh token is missing in the response body";
        } else if (!tokenResponse.expires_in || tokenResponse.expires_in <= 0) {
            errorCode = CustomAuthApiErrorCode.INVALID_EXPIRES_IN;
            errorDescription = "Expires in is invalid in the response body";
        } else if (tokenResponse.token_type !== "Bearer") {
            errorCode = CustomAuthApiErrorCode.INVALID_TOKEN_TYPE;
            errorDescription = `Token type '${tokenResponse.token_type}' is invalid in the response body`;
        } else if (!tokenResponse.client_info) {
            errorCode = CustomAuthApiErrorCode.CLIENT_INFO_MISSING;
            errorDescription = "Client info is missing in the response body";
        }

        if (!errorCode && !errorDescription) {
            return;
        }

        throw new CustomAuthApiError(
            errorCode,
            errorDescription,
            tokenResponse.correlation_id
        );
    }
}
