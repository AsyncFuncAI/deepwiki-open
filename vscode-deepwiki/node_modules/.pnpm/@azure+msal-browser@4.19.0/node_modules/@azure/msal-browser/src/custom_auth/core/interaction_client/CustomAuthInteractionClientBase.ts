/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICustomAuthApiClient } from "../network_client/custom_auth_api/ICustomAuthApiClient.js";
import { MethodNotImplementedError } from "../error/MethodNotImplementedError.js";
import { CustomAuthAuthority } from "../CustomAuthAuthority.js";
import { ChallengeType } from "../../CustomAuthConstants.js";
import { StandardInteractionClient } from "../../../interaction_client/StandardInteractionClient.js";
import { BrowserConfiguration } from "../../../config/Configuration.js";
import { BrowserCacheManager } from "../../../cache/BrowserCacheManager.js";
import {
    Constants,
    ICrypto,
    IPerformanceClient,
    Logger,
} from "@azure/msal-common/browser";
import { EventHandler } from "../../../event/EventHandler.js";
import { INavigationClient } from "../../../navigation/INavigationClient.js";
import { RedirectRequest } from "../../../request/RedirectRequest.js";
import { PopupRequest } from "../../../request/PopupRequest.js";
import { SsoSilentRequest } from "../../../request/SsoSilentRequest.js";
import { EndSessionRequest } from "../../../request/EndSessionRequest.js";
import { ClearCacheRequest } from "../../../request/ClearCacheRequest.js";
import { AuthenticationResult } from "../../../response/AuthenticationResult.js";

export abstract class CustomAuthInteractionClientBase extends StandardInteractionClient {
    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        protected customAuthApiClient: ICustomAuthApiClient,
        protected customAuthAuthority: CustomAuthAuthority
    ) {
        super(
            config,
            storageImpl,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient
        );
    }

    protected getChallengeTypes(
        configuredChallengeTypes: string[] | undefined
    ): string {
        const challengeType = configuredChallengeTypes ?? [];
        if (
            !challengeType.some(
                (type) => type.toLowerCase() === ChallengeType.REDIRECT
            )
        ) {
            challengeType.push(ChallengeType.REDIRECT);
        }
        return challengeType.join(" ");
    }

    protected getScopes(scopes: string[] | undefined): string[] {
        if (!!scopes && scopes.length > 0) {
            scopes;
        }

        return [
            Constants.OPENID_SCOPE,
            Constants.PROFILE_SCOPE,
            Constants.OFFLINE_ACCESS_SCOPE,
        ];
    }

    // It is not necessary to implement this method from base class.
    acquireToken(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): Promise<AuthenticationResult | void> {
        throw new MethodNotImplementedError("SignInClient.acquireToken");
    }

    // It is not necessary to implement this method from base class.
    logout(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void> {
        throw new MethodNotImplementedError("SignInClient.logout");
    }
}
