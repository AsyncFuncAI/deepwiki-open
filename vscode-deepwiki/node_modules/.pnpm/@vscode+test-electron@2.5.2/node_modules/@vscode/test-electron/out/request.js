"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.TimeoutController = void 0;
exports.getStream = getStream;
exports.getJSON = getJSON;
const https = __importStar(require("https"));
const util_1 = require("./util");
async function getStream(api, timeout) {
    const ctrl = new TimeoutController(timeout);
    return new Promise((resolve, reject) => {
        ctrl.signal.addEventListener('abort', () => {
            reject(new TimeoutError(timeout));
            req.destroy();
        });
        const req = https.get(api, (0, util_1.urlToOptions)(api), (res) => resolve(res)).on('error', reject);
    }).finally(() => ctrl.dispose());
}
async function getJSON(api, timeout) {
    const ctrl = new TimeoutController(timeout);
    return new Promise((resolve, reject) => {
        ctrl.signal.addEventListener('abort', () => {
            reject(new TimeoutError(timeout));
            req.destroy();
        });
        const req = https
            .get(api, (0, util_1.urlToOptions)(api), (res) => {
            if (res.statusCode !== 200) {
                reject('Failed to get JSON');
            }
            let data = '';
            res.on('data', (chunk) => {
                ctrl.touch();
                data += chunk;
            });
            res.on('end', () => {
                ctrl.dispose();
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                }
                catch (err) {
                    console.error(`Failed to parse response from ${api} as JSON`);
                    reject(err);
                }
            });
            res.on('error', reject);
        })
            .on('error', reject);
    }).finally(() => ctrl.dispose());
}
class TimeoutController {
    get signal() {
        return this.ctrl.signal;
    }
    constructor(timeout) {
        this.timeout = timeout;
        this.ctrl = new AbortController();
        this.reject = () => {
            this.ctrl.abort();
        };
        this.handle = setTimeout(this.reject, timeout);
    }
    touch() {
        clearTimeout(this.handle);
        this.handle = setTimeout(this.reject, this.timeout);
    }
    dispose() {
        clearTimeout(this.handle);
    }
}
exports.TimeoutController = TimeoutController;
class TimeoutError extends Error {
    constructor(duration) {
        super(`@vscode/test-electron request timeout out after ${duration}ms`);
    }
}
exports.TimeoutError = TimeoutError;
