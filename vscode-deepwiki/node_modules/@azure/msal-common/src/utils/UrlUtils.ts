/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizeResponse } from "../response/AuthorizeResponse.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import { StringDict } from "./MsalTypes.js";

/**
 * Parses hash string from given string. Returns empty string if no hash symbol is found.
 * @param hashString
 */
export function stripLeadingHashOrQuery(responseString: string): string {
    if (responseString.startsWith("#/")) {
        return responseString.substring(2);
    } else if (
        responseString.startsWith("#") ||
        responseString.startsWith("?")
    ) {
        return responseString.substring(1);
    }

    return responseString;
}

/**
 * Returns URL hash as server auth code response object.
 */
export function getDeserializedResponse(
    responseString: string
): AuthorizeResponse | null {
    // Check if given hash is empty
    if (!responseString || responseString.indexOf("=") < 0) {
        return null;
    }
    try {
        // Strip the # or ? symbol if present
        const normalizedResponse = stripLeadingHashOrQuery(responseString);
        // If # symbol was not present, above will return empty string, so give original hash value
        const deserializedHash: AuthorizeResponse = Object.fromEntries(
            new URLSearchParams(normalizedResponse)
        );

        // Check for known response properties
        if (
            deserializedHash.code ||
            deserializedHash.ear_jwe ||
            deserializedHash.error ||
            deserializedHash.error_description ||
            deserializedHash.state
        ) {
            return deserializedHash;
        }
    } catch (e) {
        throw createClientAuthError(ClientAuthErrorCodes.hashNotDeserialized);
    }

    return null;
}

/**
 * Utility to create a URL from the params map
 */
export function mapToQueryString(
    parameters: Map<string, string>,
    encodeExtraParams: boolean = true,
    extraQueryParameters?: StringDict
): string {
    const queryParameterArray: Array<string> = new Array<string>();

    parameters.forEach((value, key) => {
        if (
            !encodeExtraParams &&
            extraQueryParameters &&
            key in extraQueryParameters
        ) {
            queryParameterArray.push(`${key}=${value}`);
        } else {
            queryParameterArray.push(`${key}=${encodeURIComponent(value)}`);
        }
    });

    return queryParameterArray.join("&");
}
