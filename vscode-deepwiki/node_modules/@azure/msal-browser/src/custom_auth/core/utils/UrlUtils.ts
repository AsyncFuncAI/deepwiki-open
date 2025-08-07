/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ParsedUrlError } from "../error/ParsedUrlError.js";
import { InvalidUrl } from "../error/ParsedUrlErrorCodes.js";

export function parseUrl(url: string): URL {
    try {
        return new URL(url);
    } catch (e) {
        throw new ParsedUrlError(
            InvalidUrl,
            `The URL "${url}" is invalid: ${e}`
        );
    }
}

export function buildUrl(baseUrl: string, path: string): URL {
    const newBaseUrl = !baseUrl.endsWith("/") ? `${baseUrl}/` : baseUrl;
    const newPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(newPath, newBaseUrl);
    return url;
}
