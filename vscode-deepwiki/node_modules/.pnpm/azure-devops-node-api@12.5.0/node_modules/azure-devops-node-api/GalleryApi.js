"use strict";
/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 *
 * ---------------------------------------------------------
 * Generated file, DO NOT EDIT
 * ---------------------------------------------------------
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const compatBase = require("././GalleryCompatHttpClientBase");
const GalleryInterfaces = require("./interfaces/GalleryInterfaces");
class GalleryApi extends compatBase.GalleryCompatHttpClientBase {
    constructor(baseUrl, handlers, options) {
        super(baseUrl, handlers, 'node-Gallery-api', options);
    }
    /**
     * @param {string} extensionId
     * @param {string} accountName
     */
    shareExtensionById(extensionId, accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    extensionId: extensionId,
                    accountName: accountName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "1f19631b-a0b4-4a03-89c2-d79785d24360", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} extensionId
     * @param {string} accountName
     */
    unshareExtensionById(extensionId, accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    extensionId: extensionId,
                    accountName: accountName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "1f19631b-a0b4-4a03-89c2-d79785d24360", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     */
    shareExtension(publisherName, extensionName, accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    accountName: accountName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "a1e66d8f-f5de-4d16-8309-91a4e015ee46", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     */
    unshareExtension(publisherName, extensionName, accountName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    accountName: accountName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "a1e66d8f-f5de-4d16-8309-91a4e015ee46", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} itemId
     * @param {string} installationTarget
     * @param {boolean} testCommerce
     * @param {boolean} isFreeOrTrialInstall
     */
    getAcquisitionOptions(itemId, installationTarget, testCommerce, isFreeOrTrialInstall) {
        return __awaiter(this, void 0, void 0, function* () {
            if (installationTarget == null) {
                throw new TypeError('installationTarget can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    itemId: itemId
                };
                let queryValues = {
                    installationTarget: installationTarget,
                    testCommerce: testCommerce,
                    isFreeOrTrialInstall: isFreeOrTrialInstall,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "9d0a0105-075e-4760-aa15-8bcf54d1bd7d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.AcquisitionOptions, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.ExtensionAcquisitionRequest} acquisitionRequest
     */
    requestAcquisition(acquisitionRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "3adb1f2d-e328-446e-be73-9f6d98071c45", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, acquisitionRequest, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionAcquisitionRequest, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getAssetByName(customHeaders, publisherName, extensionName, version, assetType, accountToken, acceptDefault, accountTokenHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version,
                    assetType: assetType
                };
                let queryValues = {
                    accountToken: accountToken,
                    acceptDefault: acceptDefault,
                };
                customHeaders = customHeaders || {};
                customHeaders["X-Market-AccountToken"] = "accountTokenHeader";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "7529171f-a002-4180-93ba-685f358a0482", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} extensionId
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getAsset(customHeaders, extensionId, version, assetType, accountToken, acceptDefault, accountTokenHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    extensionId: extensionId,
                    version: version,
                    assetType: assetType
                };
                let queryValues = {
                    accountToken: accountToken,
                    acceptDefault: acceptDefault,
                };
                customHeaders = customHeaders || {};
                customHeaders["X-Market-AccountToken"] = "accountTokenHeader";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "5d545f3d-ef47-488b-8be3-f5ee1517856c", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getAssetAuthenticated(customHeaders, publisherName, extensionName, version, assetType, accountToken, accountTokenHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version,
                    assetType: assetType
                };
                let queryValues = {
                    accountToken: accountToken,
                };
                customHeaders = customHeaders || {};
                customHeaders["X-Market-AccountToken"] = "accountTokenHeader";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "506aff36-2622-4f70-8063-77cce6366d20", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} azurePublisherId
     */
    associateAzurePublisher(publisherName, azurePublisherId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (azurePublisherId == null) {
                throw new TypeError('azurePublisherId can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                let queryValues = {
                    azurePublisherId: azurePublisherId,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "efd202a6-9d87-4ebc-9229-d2b8ae2fdb6d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     */
    queryAssociatedAzurePublisher(publisherName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "efd202a6-9d87-4ebc-9229-d2b8ae2fdb6d", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} languages
     */
    getCategories(languages) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    languages: languages,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "e0a5a71e-3ac3-43a0-ae7d-0bb5c3046a2a", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} categoryName
     * @param {string} languages
     * @param {string} product
     */
    getCategoryDetails(categoryName, languages, product) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    categoryName: categoryName
                };
                let queryValues = {
                    languages: languages,
                    product: product,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "75d3c04d-84d2-4973-acd2-22627587dabc", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} product
     * @param {string} categoryId
     * @param {number} lcid
     * @param {string} source
     * @param {string} productVersion
     * @param {string} skus
     * @param {string} subSkus
     * @param {string} productArchitecture
     */
    getCategoryTree(product, categoryId, lcid, source, productVersion, skus, subSkus, productArchitecture) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    product: product,
                    categoryId: categoryId
                };
                let queryValues = {
                    lcid: lcid,
                    source: source,
                    productVersion: productVersion,
                    skus: skus,
                    subSkus: subSkus,
                    productArchitecture: productArchitecture,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "1102bb42-82b0-4955-8d8a-435d6b4cedd3", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} product
     * @param {number} lcid
     * @param {string} source
     * @param {string} productVersion
     * @param {string} skus
     * @param {string} subSkus
     */
    getRootCategories(product, lcid, source, productVersion, skus, subSkus) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    product: product
                };
                let queryValues = {
                    lcid: lcid,
                    source: source,
                    productVersion: productVersion,
                    skus: skus,
                    subSkus: subSkus,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "31fba831-35b2-46f6-a641-d05de5a877d8", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     */
    getCertificate(publisherName, extensionName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "e905ad6a-3f1f-4d08-9f6d-7d357ff8b7d0", routeValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     */
    getContentVerificationLog(publisherName, extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "c0f1c7c4-3557-4ffb-b774-1e48c4865e99", routeValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.CustomerSupportRequest} customerSupportRequest
     */
    createSupportRequest(customerSupportRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "8eded385-026a-4c15-b810-b8eb402771f1", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, customerSupportRequest, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     */
    createDraftForEditExtension(publisherName, extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "02b33873-4e61-496e-83a2-59d1df46b7d8", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDraft, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.ExtensionDraftPatch} draftPatch
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} draftId
     */
    performEditExtensionDraftOperation(draftPatch, publisherName, extensionName, draftId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    draftId: draftId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "02b33873-4e61-496e-83a2-59d1df46b7d8", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, draftPatch, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDraft, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} draftId
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    updatePayloadInDraftForEditExtension(customHeaders, contentStream, publisherName, extensionName, draftId, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    draftId: draftId
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                customHeaders["X-Market-UploadFileName"] = "fileName";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "02b33873-4e61-496e-83a2-59d1df46b7d8", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDraft, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} draftId
     * @param {string} assetType
     */
    addAssetForEditExtensionDraft(customHeaders, contentStream, publisherName, extensionName, draftId, assetType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    draftId: draftId,
                    assetType: assetType
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "f1db9c47-6619-4998-a7e5-d7f9f41a4617", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {String} product - Header to pass the product type of the payload file
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    createDraftForNewExtension(customHeaders, contentStream, publisherName, product, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                customHeaders["X-Market-UploadFileProduct"] = "product";
                customHeaders["X-Market-UploadFileName"] = "fileName";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "b3ab127d-ebb9-4d22-b611-4e09593c8d79", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("POST", url, contentStream, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDraft, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.ExtensionDraftPatch} draftPatch
     * @param {string} publisherName
     * @param {string} draftId
     */
    performNewExtensionDraftOperation(draftPatch, publisherName, draftId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    draftId: draftId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "b3ab127d-ebb9-4d22-b611-4e09593c8d79", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, draftPatch, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDraft, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} draftId
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    updatePayloadInDraftForNewExtension(customHeaders, contentStream, publisherName, draftId, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    draftId: draftId
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                customHeaders["X-Market-UploadFileName"] = "fileName";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "b3ab127d-ebb9-4d22-b611-4e09593c8d79", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDraft, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} draftId
     * @param {string} assetType
     */
    addAssetForNewExtensionDraft(customHeaders, contentStream, publisherName, draftId, assetType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    draftId: draftId,
                    assetType: assetType
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "88c0b1c8-b4f1-498a-9b2a-8446ef9f32e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} draftId
     * @param {string} assetType
     * @param {string} extensionName
     */
    getAssetFromEditExtensionDraft(publisherName, draftId, assetType, extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (extensionName == null) {
                throw new TypeError('extensionName can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    draftId: draftId,
                    assetType: assetType
                };
                let queryValues = {
                    extensionName: extensionName,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "88c0b1c8-b4f1-498a-9b2a-8446ef9f32e7", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} draftId
     * @param {string} assetType
     */
    getAssetFromNewExtensionDraft(publisherName, draftId, assetType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    draftId: draftId,
                    assetType: assetType
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "88c0b1c8-b4f1-498a-9b2a-8446ef9f32e7", routeValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get install/uninstall events of an extension. If both count and afterDate parameters are specified, count takes precedence.
     *
     * @param {string} publisherName - Name of the publisher
     * @param {string} extensionName - Name of the extension
     * @param {number} count - Count of events to fetch, applies to each event type.
     * @param {Date} afterDate - Fetch events that occurred on or after this date
     * @param {string} include - Filter options. Supported values: install, uninstall, review, acquisition, sales. Default is to fetch all types of events
     * @param {string} includeProperty - Event properties to include. Currently only 'lastContactDetails' is supported for uninstall events
     */
    getExtensionEvents(publisherName, extensionName, count, afterDate, include, includeProperty) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    count: count,
                    afterDate: afterDate,
                    include: include,
                    includeProperty: includeProperty,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "3d13c499-2168-4d06-bef4-14aba185dcd5", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionEvents, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * API endpoint to publish extension install/uninstall events. This is meant to be invoked by EMS only for sending us data related to install/uninstall of an extension.
     *
     * @param {GalleryInterfaces.ExtensionEvents[]} extensionEvents
     */
    publishExtensionEvents(extensionEvents) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "0bf2bd3a-70e0-4d5d-8bf7-bd4a9c2ab6e7", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, extensionEvents, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.ExtensionQuery} extensionQuery
     * @param {string} accountToken
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    queryExtensions(customHeaders, extensionQuery, accountToken, accountTokenHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    accountToken: accountToken,
                };
                customHeaders = customHeaders || {};
                customHeaders["X-Market-AccountToken"] = "accountTokenHeader";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "eb9d5ee1-6d43-456b-b80e-8a96fbc014b6", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.create(url, extensionQuery, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionQueryResult, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} extensionType
     * @param {string} reCaptchaToken
     */
    createExtension(customHeaders, contentStream, extensionType, reCaptchaToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                let queryValues = {
                    extensionType: extensionType,
                    reCaptchaToken: reCaptchaToken,
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "a41192c8-9525-4b58-bc86-179fa549d80d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("POST", url, contentStream, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} extensionId
     * @param {string} version
     */
    deleteExtensionById(extensionId, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    extensionId: extensionId
                };
                let queryValues = {
                    version: version,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "a41192c8-9525-4b58-bc86-179fa549d80d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} extensionId
     * @param {string} version
     * @param {GalleryInterfaces.ExtensionQueryFlags} flags
     */
    getExtensionById(extensionId, version, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    extensionId: extensionId
                };
                let queryValues = {
                    version: version,
                    flags: flags,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "a41192c8-9525-4b58-bc86-179fa549d80d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} extensionId
     * @param {string} reCaptchaToken
     */
    updateExtensionById(extensionId, reCaptchaToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    extensionId: extensionId
                };
                let queryValues = {
                    reCaptchaToken: reCaptchaToken,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "a41192c8-9525-4b58-bc86-179fa549d80d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, null, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionType
     * @param {string} reCaptchaToken
     */
    createExtensionWithPublisher(customHeaders, contentStream, publisherName, extensionType, reCaptchaToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                let queryValues = {
                    extensionType: extensionType,
                    reCaptchaToken: reCaptchaToken,
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0966", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("POST", url, contentStream, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     */
    deleteExtension(publisherName, extensionName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    version: version,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0966", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {GalleryInterfaces.ExtensionQueryFlags} flags
     * @param {string} accountToken
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getExtension(customHeaders, publisherName, extensionName, version, flags, accountToken, accountTokenHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    version: version,
                    flags: flags,
                    accountToken: accountToken,
                };
                customHeaders = customHeaders || {};
                customHeaders["X-Market-AccountToken"] = "accountTokenHeader";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0966", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * REST endpoint to update an extension.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName - Name of the publisher
     * @param {string} extensionName - Name of the extension
     * @param {string} extensionType
     * @param {string} reCaptchaToken
     * @param {boolean} bypassScopeCheck - This parameter decides if the scope change check needs to be invoked or not
     */
    updateExtension(customHeaders, contentStream, publisherName, extensionName, extensionType, reCaptchaToken, bypassScopeCheck) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    extensionType: extensionType,
                    reCaptchaToken: reCaptchaToken,
                    bypassScopeCheck: bypassScopeCheck,
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0966", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {GalleryInterfaces.PublishedExtensionFlags} flags
     */
    updateExtensionProperties(publisherName, extensionName, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            if (flags == null) {
                throw new TypeError('flags can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    flags: flags,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.2", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0966", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, null, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} hostType
     * @param {string} hostName
     */
    shareExtensionWithHost(publisherName, extensionName, hostType, hostName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    hostType: hostType,
                    hostName: hostName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "328a3af8-d124-46e9-9483-01690cd415b9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} hostType
     * @param {string} hostName
     */
    unshareExtensionWithHost(publisherName, extensionName, hostType, hostName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    hostType: hostType,
                    hostName: hostName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "328a3af8-d124-46e9-9483-01690cd415b9", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Rest end point to validate if an Azure publisher owns an extension for 3rd party commerce scenario. Azure only supports POST operations and the above signature is not typical of the REST operations. http://sharepoint/sites/AzureUX/_layouts/15/WopiFrame2.aspx?sourcedoc={A793D31E-6DC6-4174-8FA3-DE3F82B51642}&file=Data%20Market%20Partner%20integration%20with%20Marketplace%20service.docx&action=default
     *
     * @param {GalleryInterfaces.AzureRestApiRequestModel} azureRestApiRequestModel - All the parameters are sent in the request body
     */
    extensionValidator(azureRestApiRequestModel) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "05e8a5e1-8c59-4c2c-8856-0ff087d1a844", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, azureRestApiRequestModel, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Send Notification
     *
     * @param {GalleryInterfaces.NotificationsData} notificationData - Denoting the data needed to send notification
     */
    sendNotifications(notificationData) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "eab39817-413c-4602-a49f-07ad00844980", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, notificationData, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * This endpoint gets hit when you download a VSTS extension from the Web UI
     *
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getPackage(customHeaders, publisherName, extensionName, version, accountToken, acceptDefault, accountTokenHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version
                };
                let queryValues = {
                    accountToken: accountToken,
                    acceptDefault: acceptDefault,
                };
                customHeaders = customHeaders || {};
                customHeaders["X-Market-AccountToken"] = "accountTokenHeader";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "7cb576f8-1cae-4c4b-b7b1-e4af5759e965", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} assetToken
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getAssetWithToken(customHeaders, publisherName, extensionName, version, assetType, assetToken, accountToken, acceptDefault, accountTokenHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version,
                    assetType: assetType,
                    assetToken: assetToken
                };
                let queryValues = {
                    accountToken: accountToken,
                    acceptDefault: acceptDefault,
                };
                customHeaders = customHeaders || {};
                customHeaders["X-Market-AccountToken"] = "accountTokenHeader";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "364415a1-0077-4a41-a7a0-06edd4497492", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Delete publisher asset like logo
     *
     * @param {string} publisherName - Internal name of the publisher
     * @param {string} assetType - Type of asset. Default value is 'logo'.
     */
    deletePublisherAsset(publisherName, assetType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                let queryValues = {
                    assetType: assetType,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "21143299-34f9-4c62-8ca8-53da691192f9", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get publisher asset like logo as a stream
     *
     * @param {string} publisherName - Internal name of the publisher
     * @param {string} assetType - Type of asset. Default value is 'logo'.
     */
    getPublisherAsset(publisherName, assetType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                let queryValues = {
                    assetType: assetType,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "21143299-34f9-4c62-8ca8-53da691192f9", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Update publisher asset like logo. It accepts asset file as an octet stream and file name is passed in header values.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName - Internal name of the publisher
     * @param {string} assetType - Type of asset. Default value is 'logo'.
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    updatePublisherAsset(customHeaders, contentStream, publisherName, assetType, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                let queryValues = {
                    assetType: assetType,
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "application/octet-stream";
                customHeaders["X-Market-UploadFileName"] = "fileName";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "21143299-34f9-4c62-8ca8-53da691192f9", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, null, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     */
    fetchDomainToken(publisherName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "67a609ef-fa74-4b52-8664-78d76f7b3634", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     */
    verifyDomainToken(publisherName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "67a609ef-fa74-4b52-8664-78d76f7b3634", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.PublisherQuery} publisherQuery
     */
    queryPublishers(publisherQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "2ad6ee0a-b53f-4034-9d1d-d009fda1212e", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, publisherQuery, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublisherQueryResult, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.Publisher} publisher
     */
    createPublisher(publisher) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "4ddec66a-e4f6-4f5d-999e-9e77710d7ff4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, publisher, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Publisher, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     */
    deletePublisher(publisherName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "4ddec66a-e4f6-4f5d-999e-9e77710d7ff4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {number} flags
     */
    getPublisher(publisherName, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                let queryValues = {
                    flags: flags,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "4ddec66a-e4f6-4f5d-999e-9e77710d7ff4", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Publisher, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.Publisher} publisher
     * @param {string} publisherName
     */
    updatePublisher(publisher, publisherName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "4ddec66a-e4f6-4f5d-999e-9e77710d7ff4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.replace(url, publisher, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Publisher, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Endpoint to add/modify publisher membership. Currently Supports only addition/modification of 1 user at a time Works only for adding members of same tenant.
     *
     * @param {GalleryInterfaces.PublisherUserRoleAssignmentRef[]} roleAssignments - List of user identifiers(email address) and role to be added. Currently only one entry is supported.
     * @param {string} publisherName - The name/id of publisher to which users have to be added
     * @param {boolean} limitToCallerIdentityDomain - Should cross tenant addtions be allowed or not.
     */
    updatePublisherMembers(roleAssignments, publisherName, limitToCallerIdentityDomain) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                let queryValues = {
                    limitToCallerIdentityDomain: limitToCallerIdentityDomain,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "4ddec66a-e4f6-4f5d-999e-9e77710d7ff4", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, roleAssignments, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublisherRoleAssignment, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} extensionType
     * @param {string} reCaptchaToken
     * @param {boolean} bypassScopeCheck
     */
    publishExtensionWithPublisherSignature(customHeaders, contentStream, publisherName, extensionName, extensionType, reCaptchaToken, bypassScopeCheck) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    extensionType: extensionType,
                    reCaptchaToken: reCaptchaToken,
                    bypassScopeCheck: bypassScopeCheck,
                };
                customHeaders = customHeaders || {};
                customHeaders["Content-Type"] = "multipart/related";
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0969", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    options.additionalHeaders = customHeaders;
                    let res;
                    res = yield this.rest.uploadStream("PUT", url, contentStream, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     */
    getPublisherWithoutToken(publisherName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "215a2ed8-458a-4850-ad5a-45f1dabc3461", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Publisher, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a list of questions with their responses associated with an extension.
     *
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} count - Number of questions to retrieve (defaults to 10).
     * @param {number} page - Page number from which set of questions are to be retrieved.
     * @param {Date} afterDate - If provided, results questions are returned which were posted after this date
     */
    getQuestions(publisherName, extensionName, count, page, afterDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    count: count,
                    page: page,
                    afterDate: afterDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "c010d03d-812c-4ade-ae07-c1862475eda5", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.QuestionsResult, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Flags a concern with an existing question for an extension.
     *
     * @param {GalleryInterfaces.Concern} concern - User reported concern with a question for the extension.
     * @param {string} pubName - Name of the publisher who published the extension.
     * @param {string} extName - Name of the extension.
     * @param {number} questionId - Identifier of the question to be updated for the extension.
     */
    reportQuestion(concern, pubName, extName, questionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    pubName: pubName,
                    extName: extName,
                    questionId: questionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "784910cd-254a-494d-898b-0728549b2f10", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, concern, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Concern, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a new question for an extension.
     *
     * @param {GalleryInterfaces.Question} question - Question to be created for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     */
    createQuestion(question, publisherName, extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "6d1d9741-eca8-4701-a3a5-235afc82dfa4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, question, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Question, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Deletes an existing question and all its associated responses for an extension. (soft delete)
     *
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question to be deleted for the extension.
     */
    deleteQuestion(publisherName, extensionName, questionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    questionId: questionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "6d1d9741-eca8-4701-a3a5-235afc82dfa4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Updates an existing question for an extension.
     *
     * @param {GalleryInterfaces.Question} question - Updated question to be set for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question to be updated for the extension.
     */
    updateQuestion(question, publisherName, extensionName, questionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    questionId: questionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "6d1d9741-eca8-4701-a3a5-235afc82dfa4", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, question, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Question, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a new response for a given question for an extension.
     *
     * @param {GalleryInterfaces.Response} response - Response to be created for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question for which response is to be created for the extension.
     */
    createResponse(response, publisherName, extensionName, questionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    questionId: questionId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "7f8ae5e0-46b0-438f-b2e8-13e8513517bd", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, response, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Response, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Deletes a response for an extension. (soft delete)
     *
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifies the question whose response is to be deleted.
     * @param {number} responseId - Identifies the response to be deleted.
     */
    deleteResponse(publisherName, extensionName, questionId, responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    questionId: questionId,
                    responseId: responseId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "7f8ae5e0-46b0-438f-b2e8-13e8513517bd", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Updates an existing response for a given question for an extension.
     *
     * @param {GalleryInterfaces.Response} response - Updated response to be set for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question for which response is to be updated for the extension.
     * @param {number} responseId - Identifier of the response which has to be updated.
     */
    updateResponse(response, publisherName, extensionName, questionId, responseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    questionId: questionId,
                    responseId: responseId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "7f8ae5e0-46b0-438f-b2e8-13e8513517bd", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, response, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Response, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns extension reports
     *
     * @param {string} publisherName - Name of the publisher who published the extension
     * @param {string} extensionName - Name of the extension
     * @param {number} days - Last n days report. If afterDate and days are specified, days will take priority
     * @param {number} count - Number of events to be returned
     * @param {Date} afterDate - Use if you want to fetch events newer than the specified date
     */
    getExtensionReports(publisherName, extensionName, days, count, afterDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    days: days,
                    count: count,
                    afterDate: afterDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "79e0c74f-157f-437e-845f-74fbb4121d4c", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a list of reviews associated with an extension
     *
     * @param {string} publisherName - Name of the publisher who published the extension
     * @param {string} extensionName - Name of the extension
     * @param {number} count - Number of reviews to retrieve (defaults to 5)
     * @param {GalleryInterfaces.ReviewFilterOptions} filterOptions - FilterOptions to filter out empty reviews etcetera, defaults to none
     * @param {Date} beforeDate - Use if you want to fetch reviews older than the specified date, defaults to null
     * @param {Date} afterDate - Use if you want to fetch reviews newer than the specified date, defaults to null
     */
    getReviews(publisherName, extensionName, count, filterOptions, beforeDate, afterDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    count: count,
                    filterOptions: filterOptions,
                    beforeDate: beforeDate,
                    afterDate: afterDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "5b3f819f-f247-42ad-8c00-dd9ab9ab246d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ReviewsResult, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Returns a summary of the reviews
     *
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     * @param {Date} beforeDate - Use if you want to fetch summary of reviews older than the specified date, defaults to null
     * @param {Date} afterDate - Use if you want to fetch summary of reviews newer than the specified date, defaults to null
     */
    getReviewsSummary(pubName, extName, beforeDate, afterDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    pubName: pubName,
                    extName: extName
                };
                let queryValues = {
                    beforeDate: beforeDate,
                    afterDate: afterDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "b7b44e21-209e-48f0-ae78-04727fc37d77", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Creates a new review for an extension
     *
     * @param {GalleryInterfaces.Review} review - Review to be created for the extension
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     */
    createReview(review, pubName, extName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    pubName: pubName,
                    extName: extName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "e6e85b9d-aa70-40e6-aa28-d0fbf40b91a3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, review, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.Review, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Deletes a review
     *
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     * @param {number} reviewId - Id of the review which needs to be updated
     */
    deleteReview(pubName, extName, reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    pubName: pubName,
                    extName: extName,
                    reviewId: reviewId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "e6e85b9d-aa70-40e6-aa28-d0fbf40b91a3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.del(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Updates or Flags a review
     *
     * @param {GalleryInterfaces.ReviewPatch} reviewPatch - ReviewPatch object which contains the changes to be applied to the review
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     * @param {number} reviewId - Id of the review which needs to be updated
     */
    updateReview(reviewPatch, pubName, extName, reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    pubName: pubName,
                    extName: extName,
                    reviewId: reviewId
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "e6e85b9d-aa70-40e6-aa28-d0fbf40b91a3", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, reviewPatch, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ReviewPatch, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.ExtensionCategory} category
     */
    createCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {};
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "476531a3-7024-4516-a76a-ed64d3008ad6", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, category, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Get all setting entries for the given user/all-users scope
     *
     * @param {string} userScope - User-Scope at which to get the value. Should be "me" for the current user or "host" for all users.
     * @param {string} key - Optional key under which to filter all the entries
     */
    getGalleryUserSettings(userScope, key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    userScope: userScope,
                    key: key
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "9b75ece3-7960-401c-848b-148ac01ca350", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, true);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Set all setting entries for the given user/all-users scope
     *
     * @param {{ [key: string] : any; }} entries - A key-value pair of all settings that need to be set
     * @param {string} userScope - User-Scope at which to get the value. Should be "me" for the current user or "host" for all users.
     */
    setGalleryUserSettings(entries, userScope) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    userScope: userScope
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "9b75ece3-7960-401c-848b-148ac01ca350", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, entries, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} keyType
     * @param {number} expireCurrentSeconds
     */
    generateKey(keyType, expireCurrentSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    keyType: keyType
                };
                let queryValues = {
                    expireCurrentSeconds: expireCurrentSeconds,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "92ed5cf4-c38b-465a-9059-2f2fb7c624b5", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} keyType
     */
    getSigningKey(keyType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    keyType: keyType
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "92ed5cf4-c38b-465a-9059-2f2fb7c624b5", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {GalleryInterfaces.ExtensionStatisticUpdate} extensionStatisticsUpdate
     * @param {string} publisherName
     * @param {string} extensionName
     */
    updateExtensionStatistics(extensionStatisticsUpdate, publisherName, extensionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "a0ea3204-11e9-422d-a9ca-45851cc41400", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.update(url, extensionStatisticsUpdate, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {number} days
     * @param {GalleryInterfaces.ExtensionStatsAggregateType} aggregate
     * @param {Date} afterDate
     */
    getExtensionDailyStats(publisherName, extensionName, days, aggregate, afterDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName
                };
                let queryValues = {
                    days: days,
                    aggregate: aggregate,
                    afterDate: afterDate,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "ae06047e-51c5-4fb4-ab65-7be488544416", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDailyStats, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * This route/location id only supports HTTP POST anonymously, so that the page view daily stat can be incremented from Marketplace client. Trying to call GET on this route should result in an exception. Without this explicit implementation, calling GET on this public route invokes the above GET implementation GetExtensionDailyStats.
     *
     * @param {string} publisherName - Name of the publisher
     * @param {string} extensionName - Name of the extension
     * @param {string} version - Version of the extension
     */
    getExtensionDailyStatsAnonymous(publisherName, extensionName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "4fa7adb6-ca65-4075-a232-5f28323288ea", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.get(url, options);
                    let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.ExtensionDailyStats, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * Increments a daily statistic associated with the extension
     *
     * @param {string} publisherName - Name of the publisher
     * @param {string} extensionName - Name of the extension
     * @param {string} version - Version of the extension
     * @param {string} statType - Type of stat to increment
     * @param {string} targetPlatform
     */
    incrementExtensionDailyStat(publisherName, extensionName, version, statType, targetPlatform) {
        return __awaiter(this, void 0, void 0, function* () {
            if (statType == null) {
                throw new TypeError('statType can not be null or undefined');
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version
                };
                let queryValues = {
                    statType: statType,
                    targetPlatform: targetPlatform,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "4fa7adb6-ca65-4075-a232-5f28323288ea", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} targetPlatform
     */
    getVerificationLog(publisherName, extensionName, version, targetPlatform) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    publisherName: publisherName,
                    extensionName: extensionName,
                    version: version
                };
                let queryValues = {
                    targetPlatform: targetPlatform,
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "c5523abe-b843-437f-875b-5833064efe4d", routeValues, queryValues);
                    let url = verData.requestUrl;
                    let apiVersion = verData.apiVersion;
                    let accept = this.createAcceptHeader("application/octet-stream", apiVersion);
                    resolve((yield this.http.get(url, { "Accept": accept })).message);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
    /**
     * @param {string} itemName
     * @param {string} version
     * @param {GalleryInterfaces.VSCodeWebExtensionStatisicsType} statType
     */
    updateVSCodeWebExtensionStatistics(itemName, version, statType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let routeValues = {
                    itemName: itemName,
                    version: version,
                    statType: statType
                };
                try {
                    let verData = yield this.vsoClient.getVersioningData("7.2-preview.1", "gallery", "205c91a8-7841-4fd3-ae4f-5a745d5a8df5", routeValues);
                    let url = verData.requestUrl;
                    let options = this.createRequestOptions('application/json', verData.apiVersion);
                    let res;
                    res = yield this.rest.create(url, null, options);
                    let ret = this.formatResponse(res.result, null, false);
                    resolve(ret);
                }
                catch (err) {
                    reject(err);
                }
            }));
        });
    }
}
GalleryApi.RESOURCE_AREA_ID = "69d21c00-f135-441b-b5ce-3626378e0819";
exports.GalleryApi = GalleryApi;
