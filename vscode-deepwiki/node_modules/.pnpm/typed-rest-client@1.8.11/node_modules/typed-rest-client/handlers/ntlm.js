"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const https = require("https");
const _ = require("underscore");
const ntlm = require("../opensource/Node-SMB/lib/ntlm");
class NtlmCredentialHandler {
    constructor(username, password, workstation, domain) {
        this._ntlmOptions = {};
        this._ntlmOptions.username = username;
        this._ntlmOptions.password = password;
        this._ntlmOptions.domain = domain || '';
        this._ntlmOptions.workstation = workstation || '';
    }
    prepareRequest(options) {
        // No headers or options need to be set.  We keep the credentials on the handler itself.
        // If a (proxy) agent is set, remove it as we don't support proxy for NTLM at this time
        if (options.agent) {
            delete options.agent;
        }
    }
    canHandleAuthentication(response) {
        if (response && response.message && response.message.statusCode === 401) {
            // Ensure that we're talking NTLM here
            // Once we have the www-authenticate header, split it so we can ensure we can talk NTLM
            const wwwAuthenticate = response.message.headers['www-authenticate'];
            return wwwAuthenticate && (wwwAuthenticate.split(', ').indexOf("NTLM") >= 0);
        }
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return new Promise((resolve, reject) => {
            const callbackForResult = function (err, res) {
                if (err) {
                    reject(err);
                }
                // We have to readbody on the response before continuing otherwise there is a hang.
                res.readBody().then(() => {
                    resolve(res);
                });
            };
            this.handleAuthenticationPrivate(httpClient, requestInfo, objs, callbackForResult);
        });
    }
    handleAuthenticationPrivate(httpClient, requestInfo, objs, finalCallback) {
        // Set up the headers for NTLM authentication
        requestInfo.options = _.extend(requestInfo.options, {
            username: this._ntlmOptions.username,
            password: this._ntlmOptions.password,
            domain: this._ntlmOptions.domain,
            workstation: this._ntlmOptions.workstation
        });
        requestInfo.options.agent = httpClient.isSsl ?
            new https.Agent({ keepAlive: true }) :
            new http.Agent({ keepAlive: true });
        let self = this;
        // The following pattern of sending the type1 message following immediately (in a setImmediate) is
        // critical for the NTLM exchange to happen.  If we removed setImmediate (or call in a different manner)
        // the NTLM exchange will always fail with a 401.
        this.sendType1Message(httpClient, requestInfo, objs, function (err, res) {
            if (err) {
                return finalCallback(err, null, null);
            }
            /// We have to readbody on the response before continuing otherwise there is a hang.
            res.readBody().then(() => {
                // It is critical that we have setImmediate here due to how connection requests are queued.
                // If setImmediate is removed then the NTLM handshake will not work.
                // setImmediate allows us to queue a second request on the same connection. If this second
                // request is not queued on the connection when the first request finishes then node closes
                // the connection. NTLM requires both requests to be on the same connection so we need this.
                setImmediate(function () {
                    self.sendType3Message(httpClient, requestInfo, objs, res, finalCallback);
                });
            });
        });
    }
    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    sendType1Message(httpClient, requestInfo, objs, finalCallback) {
        const type1HexBuffer = ntlm.encodeType1(this._ntlmOptions.workstation, this._ntlmOptions.domain);
        const type1msg = `NTLM ${type1HexBuffer.toString('base64')}`;
        const type1options = {
            headers: {
                'Connection': 'keep-alive',
                'Authorization': type1msg
            },
            timeout: requestInfo.options.timeout || 0,
            agent: requestInfo.httpModule,
        };
        const type1info = {};
        type1info.httpModule = requestInfo.httpModule;
        type1info.parsedUrl = requestInfo.parsedUrl;
        type1info.options = _.extend(type1options, _.omit(requestInfo.options, 'headers'));
        return httpClient.requestRawWithCallback(type1info, objs, finalCallback);
    }
    // The following method is an adaptation of code found at https://github.com/SamDecrock/node-http-ntlm/blob/master/httpntlm.js
    sendType3Message(httpClient, requestInfo, objs, res, callback) {
        if (!res.message.headers && !res.message.headers['www-authenticate']) {
            throw new Error('www-authenticate not found on response of second request');
        }
        /**
         * Server will respond with challenge/nonce
         * assigned to response's "WWW-AUTHENTICATE" header
         * and should adhere to RegExp /^NTLM\s+(.+?)(,|\s+|$)/
         */
        const serverNonceRegex = /^NTLM\s+(.+?)(,|\s+|$)/;
        const serverNonce = Buffer.from((res.message.headers['www-authenticate'].match(serverNonceRegex) || [])[1], 'base64');
        let type2msg;
        /**
         * Wrap decoding the Server's challenge/nonce in
         * try-catch block to throw more comprehensive
         * Error with clear message to consumer
         */
        try {
            type2msg = ntlm.decodeType2(serverNonce);
        }
        catch (error) {
            throw new Error(`Decoding Server's Challenge to Obtain Type2Message failed with error: ${error.message}`);
        }
        const type3msg = ntlm.encodeType3(this._ntlmOptions.username, this._ntlmOptions.workstation, this._ntlmOptions.domain, type2msg, this._ntlmOptions.password).toString('base64');
        const type3options = {
            headers: {
                'Authorization': `NTLM ${type3msg}`,
                'Connection': 'Close'
            },
            agent: requestInfo.httpModule,
        };
        const type3info = {};
        type3info.httpModule = requestInfo.httpModule;
        type3info.parsedUrl = requestInfo.parsedUrl;
        type3options.headers = _.extend(type3options.headers, requestInfo.options.headers);
        type3info.options = _.extend(type3options, _.omit(requestInfo.options, 'headers'));
        return httpClient.requestRawWithCallback(type3info, objs, callback);
    }
}
exports.NtlmCredentialHandler = NtlmCredentialHandler;
