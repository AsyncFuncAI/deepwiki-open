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
const basem = require("./ClientApiBases");
const GalleryInterfaces = require("./interfaces/GalleryInterfaces");
class GalleryCompatHttpClientBase extends basem.ClientApiBase {
    constructor(baseUrl, handlers, userAgent, options) {
        super(baseUrl, handlers, userAgent, options);
    }
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    */
    createExtensionJson(extensionPackage) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let routeValues = {};
            try {
                let verData = yield this.vsoClient.getVersioningData("3.1-preview.1", "gallery", "a41192c8-9525-4b58-bc86-179fa549d80d", routeValues);
                let url = verData.requestUrl;
                let options = this.createRequestOptions('application/json', verData.apiVersion);
                let res;
                res = yield this.rest.create(url, extensionPackage, options);
                let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                resolve(ret);
            }
            catch (err) {
                reject(err);
            }
        }));
    }
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    * @param {string} extensionId
    */
    updateExtensionByIdJson(extensionPackage, extensionId) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let routeValues = {
                extensionId: extensionId
            };
            try {
                let verData = yield this.vsoClient.getVersioningData("3.1-preview.1", "gallery", "a41192c8-9525-4b58-bc86-179fa549d80d", routeValues);
                let url = verData.requestUrl;
                let options = this.createRequestOptions('application/json', verData.apiVersion);
                let res;
                res = yield this.rest.replace(url, extensionPackage, options);
                let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                resolve(ret);
            }
            catch (err) {
                reject(err);
            }
        }));
    }
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    * @param {string} publisherName
    */
    createExtensionWithPublisherJson(extensionPackage, publisherName) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let routeValues = {
                publisherName: publisherName
            };
            try {
                let verData = yield this.vsoClient.getVersioningData("3.1-preview.1", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0966", routeValues);
                let url = verData.requestUrl;
                let options = this.createRequestOptions('application/json', verData.apiVersion);
                let res;
                res = yield this.rest.create(url, extensionPackage, options);
                let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                resolve(ret);
            }
            catch (err) {
                reject(err);
            }
        }));
    }
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    * @param {string} publisherName
    * @param {string} extensionName
    */
    updateExtensionJson(extensionPackage, publisherName, extensionName) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let routeValues = {
                publisherName: publisherName,
                extensionName: extensionName
            };
            try {
                let verData = yield this.vsoClient.getVersioningData("3.1-preview.1", "gallery", "e11ea35a-16fe-4b80-ab11-c4cab88a0966", routeValues);
                let url = verData.requestUrl;
                let options = this.createRequestOptions('application/json', verData.apiVersion);
                let res;
                res = yield this.rest.replace(url, extensionPackage, options);
                let ret = this.formatResponse(res.result, GalleryInterfaces.TypeInfo.PublishedExtension, false);
                resolve(ret);
            }
            catch (err) {
                reject(err);
            }
        }));
    }
}
exports.GalleryCompatHttpClientBase = GalleryCompatHttpClientBase;
