"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicGalleryAPI = void 0;
const HttpClient_1 = require("typed-rest-client/HttpClient");
const GalleryInterfaces_1 = require("azure-devops-node-api/interfaces/GalleryInterfaces");
const Serialization_1 = require("azure-devops-node-api/Serialization");
class PublicGalleryAPI {
    constructor(baseUrl, apiVersion = '3.0-preview.1') {
        this.baseUrl = baseUrl;
        this.apiVersion = apiVersion;
        this.client = new HttpClient_1.HttpClient('vsce');
    }
    post(url, data, additionalHeaders) {
        return this.client.post(`${this.baseUrl}/_apis/public${url}`, data, additionalHeaders);
    }
    async extensionQuery({ pageNumber = 1, pageSize = 1, flags = [], criteria = [], assetTypes = [], }) {
        const data = JSON.stringify({
            filters: [{ pageNumber, pageSize, criteria }],
            assetTypes,
            flags: flags.reduce((memo, flag) => memo | flag, 0),
        });
        const res = await this.post('/gallery/extensionquery', data, {
            Accept: `application/json;api-version=${this.apiVersion}`,
            'Content-Type': 'application/json',
        });
        const raw = JSON.parse(await res.readBody());
        if (raw.errorCode !== undefined) {
            throw new Error(raw.message);
        }
        return Serialization_1.ContractSerializer.deserialize(raw.results[0].extensions, GalleryInterfaces_1.TypeInfo.PublishedExtension, false, false);
    }
    async getExtension(extensionId, flags = []) {
        const query = { criteria: [{ filterType: GalleryInterfaces_1.ExtensionQueryFilterType.Name, value: extensionId }], flags };
        const extensions = await this.extensionQuery(query);
        return extensions.filter(({ publisher: { publisherName: publisher }, extensionName: name }) => extensionId.toLowerCase() === `${publisher}.${name}`.toLowerCase())[0];
    }
}
exports.PublicGalleryAPI = PublicGalleryAPI;
//# sourceMappingURL=publicgalleryapi.js.map