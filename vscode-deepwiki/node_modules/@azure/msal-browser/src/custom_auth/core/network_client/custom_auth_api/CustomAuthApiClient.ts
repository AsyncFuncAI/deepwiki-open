/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordApiClient } from "./ResetPasswordApiClient.js";
import { SignupApiClient } from "./SignupApiClient.js";
import { SignInApiClient } from "./SignInApiClient.js";
import { ICustomAuthApiClient } from "./ICustomAuthApiClient.js";
import { IHttpClient } from "../http_client/IHttpClient.js";

export class CustomAuthApiClient implements ICustomAuthApiClient {
    signInApi: SignInApiClient;
    signUpApi: SignupApiClient;
    resetPasswordApi: ResetPasswordApiClient;

    constructor(
        customAuthApiBaseUrl: string,
        clientId: string,
        httpClient: IHttpClient
    ) {
        this.signInApi = new SignInApiClient(
            customAuthApiBaseUrl,
            clientId,
            httpClient
        );
        this.signUpApi = new SignupApiClient(
            customAuthApiBaseUrl,
            clientId,
            httpClient
        );
        this.resetPasswordApi = new ResetPasswordApiClient(
            customAuthApiBaseUrl,
            clientId,
            httpClient
        );
    }
}
