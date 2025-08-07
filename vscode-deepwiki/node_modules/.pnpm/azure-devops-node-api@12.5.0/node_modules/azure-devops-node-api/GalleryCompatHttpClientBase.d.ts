import basem = require('./ClientApiBases');
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import GalleryInterfaces = require("./interfaces/GalleryInterfaces");
export interface IGalleryCompatHttpClientBase extends basem.ClientApiBase {
    createExtensionJson(extensionPackage: GalleryInterfaces.ExtensionPackage): Promise<GalleryInterfaces.PublishedExtension>;
    updateExtensionByIdJson(extensionPackage: GalleryInterfaces.ExtensionPackage, extensionId: string): Promise<GalleryInterfaces.PublishedExtension>;
    createExtensionWithPublisherJson(extensionPackage: GalleryInterfaces.ExtensionPackage, publisherName: string): Promise<GalleryInterfaces.PublishedExtension>;
    updateExtensionJson(extensionPackage: GalleryInterfaces.ExtensionPackage, publisherName: string, extensionName: string): Promise<GalleryInterfaces.PublishedExtension>;
}
export declare class GalleryCompatHttpClientBase extends basem.ClientApiBase implements IGalleryCompatHttpClientBase {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], userAgent?: string, options?: VsoBaseInterfaces.IRequestOptions);
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    */
    createExtensionJson(extensionPackage: GalleryInterfaces.ExtensionPackage): Promise<GalleryInterfaces.PublishedExtension>;
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    * @param {string} extensionId
    */
    updateExtensionByIdJson(extensionPackage: GalleryInterfaces.ExtensionPackage, extensionId: string): Promise<GalleryInterfaces.PublishedExtension>;
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    * @param {string} publisherName
    */
    createExtensionWithPublisherJson(extensionPackage: GalleryInterfaces.ExtensionPackage, publisherName: string): Promise<GalleryInterfaces.PublishedExtension>;
    /**
    * @param {GalleryInterfaces.ExtensionPackage} extensionPackage
    * @param {string} publisherName
    * @param {string} extensionName
    */
    updateExtensionJson(extensionPackage: GalleryInterfaces.ExtensionPackage, publisherName: string, extensionName: string): Promise<GalleryInterfaces.PublishedExtension>;
}
