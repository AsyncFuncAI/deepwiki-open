/// <reference types="node" />
import VsoBaseInterfaces = require('./interfaces/common/VsoBaseInterfaces');
import compatBase = require("././GalleryCompatHttpClientBase");
import GalleryInterfaces = require("./interfaces/GalleryInterfaces");
export interface IGalleryApi extends compatBase.GalleryCompatHttpClientBase {
    shareExtensionById(extensionId: string, accountName: string): Promise<void>;
    unshareExtensionById(extensionId: string, accountName: string): Promise<void>;
    shareExtension(publisherName: string, extensionName: string, accountName: string): Promise<void>;
    unshareExtension(publisherName: string, extensionName: string, accountName: string): Promise<void>;
    getAcquisitionOptions(itemId: string, installationTarget: string, testCommerce?: boolean, isFreeOrTrialInstall?: boolean): Promise<GalleryInterfaces.AcquisitionOptions>;
    requestAcquisition(acquisitionRequest: GalleryInterfaces.ExtensionAcquisitionRequest): Promise<GalleryInterfaces.ExtensionAcquisitionRequest>;
    getAssetByName(customHeaders: any, publisherName: string, extensionName: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    getAsset(customHeaders: any, extensionId: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    getAssetAuthenticated(customHeaders: any, publisherName: string, extensionName: string, version: string, assetType: string, accountToken?: string, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    associateAzurePublisher(publisherName: string, azurePublisherId: string): Promise<GalleryInterfaces.AzurePublisher>;
    queryAssociatedAzurePublisher(publisherName: string): Promise<GalleryInterfaces.AzurePublisher>;
    getCategories(languages?: string): Promise<string[]>;
    getCategoryDetails(categoryName: string, languages?: string, product?: string): Promise<GalleryInterfaces.CategoriesResult>;
    getCategoryTree(product: string, categoryId: string, lcid?: number, source?: string, productVersion?: string, skus?: string, subSkus?: string, productArchitecture?: string): Promise<GalleryInterfaces.ProductCategory>;
    getRootCategories(product: string, lcid?: number, source?: string, productVersion?: string, skus?: string, subSkus?: string): Promise<GalleryInterfaces.ProductCategoriesResult>;
    getCertificate(publisherName: string, extensionName: string, version?: string): Promise<NodeJS.ReadableStream>;
    getContentVerificationLog(publisherName: string, extensionName: string): Promise<NodeJS.ReadableStream>;
    createSupportRequest(customerSupportRequest: GalleryInterfaces.CustomerSupportRequest): Promise<void>;
    createDraftForEditExtension(publisherName: string, extensionName: string): Promise<GalleryInterfaces.ExtensionDraft>;
    performEditExtensionDraftOperation(draftPatch: GalleryInterfaces.ExtensionDraftPatch, publisherName: string, extensionName: string, draftId: string): Promise<GalleryInterfaces.ExtensionDraft>;
    updatePayloadInDraftForEditExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, draftId: string, fileName?: String): Promise<GalleryInterfaces.ExtensionDraft>;
    addAssetForEditExtensionDraft(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, draftId: string, assetType: string): Promise<GalleryInterfaces.ExtensionDraftAsset>;
    createDraftForNewExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, product: String, fileName?: String): Promise<GalleryInterfaces.ExtensionDraft>;
    performNewExtensionDraftOperation(draftPatch: GalleryInterfaces.ExtensionDraftPatch, publisherName: string, draftId: string): Promise<GalleryInterfaces.ExtensionDraft>;
    updatePayloadInDraftForNewExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, draftId: string, fileName?: String): Promise<GalleryInterfaces.ExtensionDraft>;
    addAssetForNewExtensionDraft(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, draftId: string, assetType: string): Promise<GalleryInterfaces.ExtensionDraftAsset>;
    getAssetFromEditExtensionDraft(publisherName: string, draftId: string, assetType: string, extensionName: string): Promise<NodeJS.ReadableStream>;
    getAssetFromNewExtensionDraft(publisherName: string, draftId: string, assetType: string): Promise<NodeJS.ReadableStream>;
    getExtensionEvents(publisherName: string, extensionName: string, count?: number, afterDate?: Date, include?: string, includeProperty?: string): Promise<GalleryInterfaces.ExtensionEvents>;
    publishExtensionEvents(extensionEvents: GalleryInterfaces.ExtensionEvents[]): Promise<void>;
    queryExtensions(customHeaders: any, extensionQuery: GalleryInterfaces.ExtensionQuery, accountToken?: string, accountTokenHeader?: String): Promise<GalleryInterfaces.ExtensionQueryResult>;
    createExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, extensionType?: string, reCaptchaToken?: string): Promise<GalleryInterfaces.PublishedExtension>;
    deleteExtensionById(extensionId: string, version?: string): Promise<void>;
    getExtensionById(extensionId: string, version?: string, flags?: GalleryInterfaces.ExtensionQueryFlags): Promise<GalleryInterfaces.PublishedExtension>;
    updateExtensionById(extensionId: string, reCaptchaToken?: string): Promise<GalleryInterfaces.PublishedExtension>;
    createExtensionWithPublisher(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionType?: string, reCaptchaToken?: string): Promise<GalleryInterfaces.PublishedExtension>;
    deleteExtension(publisherName: string, extensionName: string, version?: string): Promise<void>;
    getExtension(customHeaders: any, publisherName: string, extensionName: string, version?: string, flags?: GalleryInterfaces.ExtensionQueryFlags, accountToken?: string, accountTokenHeader?: String): Promise<GalleryInterfaces.PublishedExtension>;
    updateExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, extensionType?: string, reCaptchaToken?: string, bypassScopeCheck?: boolean): Promise<GalleryInterfaces.PublishedExtension>;
    updateExtensionProperties(publisherName: string, extensionName: string, flags: GalleryInterfaces.PublishedExtensionFlags): Promise<GalleryInterfaces.PublishedExtension>;
    shareExtensionWithHost(publisherName: string, extensionName: string, hostType: string, hostName: string): Promise<void>;
    unshareExtensionWithHost(publisherName: string, extensionName: string, hostType: string, hostName: string): Promise<void>;
    extensionValidator(azureRestApiRequestModel: GalleryInterfaces.AzureRestApiRequestModel): Promise<void>;
    sendNotifications(notificationData: GalleryInterfaces.NotificationsData): Promise<void>;
    getPackage(customHeaders: any, publisherName: string, extensionName: string, version: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    getAssetWithToken(customHeaders: any, publisherName: string, extensionName: string, version: string, assetType: string, assetToken?: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    deletePublisherAsset(publisherName: string, assetType?: string): Promise<void>;
    getPublisherAsset(publisherName: string, assetType?: string): Promise<NodeJS.ReadableStream>;
    updatePublisherAsset(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, assetType?: string, fileName?: String): Promise<{
        [key: string]: string;
    }>;
    fetchDomainToken(publisherName: string): Promise<string>;
    verifyDomainToken(publisherName: string): Promise<void>;
    queryPublishers(publisherQuery: GalleryInterfaces.PublisherQuery): Promise<GalleryInterfaces.PublisherQueryResult>;
    createPublisher(publisher: GalleryInterfaces.Publisher): Promise<GalleryInterfaces.Publisher>;
    deletePublisher(publisherName: string): Promise<void>;
    getPublisher(publisherName: string, flags?: number): Promise<GalleryInterfaces.Publisher>;
    updatePublisher(publisher: GalleryInterfaces.Publisher, publisherName: string): Promise<GalleryInterfaces.Publisher>;
    updatePublisherMembers(roleAssignments: GalleryInterfaces.PublisherUserRoleAssignmentRef[], publisherName: string, limitToCallerIdentityDomain?: boolean): Promise<GalleryInterfaces.PublisherRoleAssignment[]>;
    publishExtensionWithPublisherSignature(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, extensionType?: string, reCaptchaToken?: string, bypassScopeCheck?: boolean): Promise<GalleryInterfaces.PublishedExtension>;
    getPublisherWithoutToken(publisherName: string): Promise<GalleryInterfaces.Publisher>;
    getQuestions(publisherName: string, extensionName: string, count?: number, page?: number, afterDate?: Date): Promise<GalleryInterfaces.QuestionsResult>;
    reportQuestion(concern: GalleryInterfaces.Concern, pubName: string, extName: string, questionId: number): Promise<GalleryInterfaces.Concern>;
    createQuestion(question: GalleryInterfaces.Question, publisherName: string, extensionName: string): Promise<GalleryInterfaces.Question>;
    deleteQuestion(publisherName: string, extensionName: string, questionId: number): Promise<void>;
    updateQuestion(question: GalleryInterfaces.Question, publisherName: string, extensionName: string, questionId: number): Promise<GalleryInterfaces.Question>;
    createResponse(response: GalleryInterfaces.Response, publisherName: string, extensionName: string, questionId: number): Promise<GalleryInterfaces.Response>;
    deleteResponse(publisherName: string, extensionName: string, questionId: number, responseId: number): Promise<void>;
    updateResponse(response: GalleryInterfaces.Response, publisherName: string, extensionName: string, questionId: number, responseId: number): Promise<GalleryInterfaces.Response>;
    getExtensionReports(publisherName: string, extensionName: string, days?: number, count?: number, afterDate?: Date): Promise<any>;
    getReviews(publisherName: string, extensionName: string, count?: number, filterOptions?: GalleryInterfaces.ReviewFilterOptions, beforeDate?: Date, afterDate?: Date): Promise<GalleryInterfaces.ReviewsResult>;
    getReviewsSummary(pubName: string, extName: string, beforeDate?: Date, afterDate?: Date): Promise<GalleryInterfaces.ReviewSummary>;
    createReview(review: GalleryInterfaces.Review, pubName: string, extName: string): Promise<GalleryInterfaces.Review>;
    deleteReview(pubName: string, extName: string, reviewId: number): Promise<void>;
    updateReview(reviewPatch: GalleryInterfaces.ReviewPatch, pubName: string, extName: string, reviewId: number): Promise<GalleryInterfaces.ReviewPatch>;
    createCategory(category: GalleryInterfaces.ExtensionCategory): Promise<GalleryInterfaces.ExtensionCategory>;
    getGalleryUserSettings(userScope: string, key?: string): Promise<{
        [key: string]: any;
    }>;
    setGalleryUserSettings(entries: {
        [key: string]: any;
    }, userScope: string): Promise<void>;
    generateKey(keyType: string, expireCurrentSeconds?: number): Promise<void>;
    getSigningKey(keyType: string): Promise<string>;
    updateExtensionStatistics(extensionStatisticsUpdate: GalleryInterfaces.ExtensionStatisticUpdate, publisherName: string, extensionName: string): Promise<void>;
    getExtensionDailyStats(publisherName: string, extensionName: string, days?: number, aggregate?: GalleryInterfaces.ExtensionStatsAggregateType, afterDate?: Date): Promise<GalleryInterfaces.ExtensionDailyStats>;
    getExtensionDailyStatsAnonymous(publisherName: string, extensionName: string, version: string): Promise<GalleryInterfaces.ExtensionDailyStats>;
    incrementExtensionDailyStat(publisherName: string, extensionName: string, version: string, statType: string, targetPlatform?: string): Promise<void>;
    getVerificationLog(publisherName: string, extensionName: string, version: string, targetPlatform?: string): Promise<NodeJS.ReadableStream>;
    updateVSCodeWebExtensionStatistics(itemName: string, version: string, statType: GalleryInterfaces.VSCodeWebExtensionStatisicsType): Promise<void>;
}
export declare class GalleryApi extends compatBase.GalleryCompatHttpClientBase implements IGalleryApi {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions);
    static readonly RESOURCE_AREA_ID = "69d21c00-f135-441b-b5ce-3626378e0819";
    /**
     * @param {string} extensionId
     * @param {string} accountName
     */
    shareExtensionById(extensionId: string, accountName: string): Promise<void>;
    /**
     * @param {string} extensionId
     * @param {string} accountName
     */
    unshareExtensionById(extensionId: string, accountName: string): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     */
    shareExtension(publisherName: string, extensionName: string, accountName: string): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} accountName
     */
    unshareExtension(publisherName: string, extensionName: string, accountName: string): Promise<void>;
    /**
     * @param {string} itemId
     * @param {string} installationTarget
     * @param {boolean} testCommerce
     * @param {boolean} isFreeOrTrialInstall
     */
    getAcquisitionOptions(itemId: string, installationTarget: string, testCommerce?: boolean, isFreeOrTrialInstall?: boolean): Promise<GalleryInterfaces.AcquisitionOptions>;
    /**
     * @param {GalleryInterfaces.ExtensionAcquisitionRequest} acquisitionRequest
     */
    requestAcquisition(acquisitionRequest: GalleryInterfaces.ExtensionAcquisitionRequest): Promise<GalleryInterfaces.ExtensionAcquisitionRequest>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getAssetByName(customHeaders: any, publisherName: string, extensionName: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} extensionId
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {boolean} acceptDefault
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getAsset(customHeaders: any, extensionId: string, version: string, assetType: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} assetType
     * @param {string} accountToken
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getAssetAuthenticated(customHeaders: any, publisherName: string, extensionName: string, version: string, assetType: string, accountToken?: string, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} publisherName
     * @param {string} azurePublisherId
     */
    associateAzurePublisher(publisherName: string, azurePublisherId: string): Promise<GalleryInterfaces.AzurePublisher>;
    /**
     * @param {string} publisherName
     */
    queryAssociatedAzurePublisher(publisherName: string): Promise<GalleryInterfaces.AzurePublisher>;
    /**
     * @param {string} languages
     */
    getCategories(languages?: string): Promise<string[]>;
    /**
     * @param {string} categoryName
     * @param {string} languages
     * @param {string} product
     */
    getCategoryDetails(categoryName: string, languages?: string, product?: string): Promise<GalleryInterfaces.CategoriesResult>;
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
    getCategoryTree(product: string, categoryId: string, lcid?: number, source?: string, productVersion?: string, skus?: string, subSkus?: string, productArchitecture?: string): Promise<GalleryInterfaces.ProductCategory>;
    /**
     * @param {string} product
     * @param {number} lcid
     * @param {string} source
     * @param {string} productVersion
     * @param {string} skus
     * @param {string} subSkus
     */
    getRootCategories(product: string, lcid?: number, source?: string, productVersion?: string, skus?: string, subSkus?: string): Promise<GalleryInterfaces.ProductCategoriesResult>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     */
    getCertificate(publisherName: string, extensionName: string, version?: string): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     */
    getContentVerificationLog(publisherName: string, extensionName: string): Promise<NodeJS.ReadableStream>;
    /**
     * @param {GalleryInterfaces.CustomerSupportRequest} customerSupportRequest
     */
    createSupportRequest(customerSupportRequest: GalleryInterfaces.CustomerSupportRequest): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     */
    createDraftForEditExtension(publisherName: string, extensionName: string): Promise<GalleryInterfaces.ExtensionDraft>;
    /**
     * @param {GalleryInterfaces.ExtensionDraftPatch} draftPatch
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} draftId
     */
    performEditExtensionDraftOperation(draftPatch: GalleryInterfaces.ExtensionDraftPatch, publisherName: string, extensionName: string, draftId: string): Promise<GalleryInterfaces.ExtensionDraft>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} draftId
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    updatePayloadInDraftForEditExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, draftId: string, fileName?: String): Promise<GalleryInterfaces.ExtensionDraft>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} draftId
     * @param {string} assetType
     */
    addAssetForEditExtensionDraft(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, draftId: string, assetType: string): Promise<GalleryInterfaces.ExtensionDraftAsset>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {String} product - Header to pass the product type of the payload file
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    createDraftForNewExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, product: String, fileName?: String): Promise<GalleryInterfaces.ExtensionDraft>;
    /**
     * @param {GalleryInterfaces.ExtensionDraftPatch} draftPatch
     * @param {string} publisherName
     * @param {string} draftId
     */
    performNewExtensionDraftOperation(draftPatch: GalleryInterfaces.ExtensionDraftPatch, publisherName: string, draftId: string): Promise<GalleryInterfaces.ExtensionDraft>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} draftId
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    updatePayloadInDraftForNewExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, draftId: string, fileName?: String): Promise<GalleryInterfaces.ExtensionDraft>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} draftId
     * @param {string} assetType
     */
    addAssetForNewExtensionDraft(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, draftId: string, assetType: string): Promise<GalleryInterfaces.ExtensionDraftAsset>;
    /**
     * @param {string} publisherName
     * @param {string} draftId
     * @param {string} assetType
     * @param {string} extensionName
     */
    getAssetFromEditExtensionDraft(publisherName: string, draftId: string, assetType: string, extensionName: string): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} publisherName
     * @param {string} draftId
     * @param {string} assetType
     */
    getAssetFromNewExtensionDraft(publisherName: string, draftId: string, assetType: string): Promise<NodeJS.ReadableStream>;
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
    getExtensionEvents(publisherName: string, extensionName: string, count?: number, afterDate?: Date, include?: string, includeProperty?: string): Promise<GalleryInterfaces.ExtensionEvents>;
    /**
     * API endpoint to publish extension install/uninstall events. This is meant to be invoked by EMS only for sending us data related to install/uninstall of an extension.
     *
     * @param {GalleryInterfaces.ExtensionEvents[]} extensionEvents
     */
    publishExtensionEvents(extensionEvents: GalleryInterfaces.ExtensionEvents[]): Promise<void>;
    /**
     * @param {GalleryInterfaces.ExtensionQuery} extensionQuery
     * @param {string} accountToken
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    queryExtensions(customHeaders: any, extensionQuery: GalleryInterfaces.ExtensionQuery, accountToken?: string, accountTokenHeader?: String): Promise<GalleryInterfaces.ExtensionQueryResult>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} extensionType
     * @param {string} reCaptchaToken
     */
    createExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, extensionType?: string, reCaptchaToken?: string): Promise<GalleryInterfaces.PublishedExtension>;
    /**
     * @param {string} extensionId
     * @param {string} version
     */
    deleteExtensionById(extensionId: string, version?: string): Promise<void>;
    /**
     * @param {string} extensionId
     * @param {string} version
     * @param {GalleryInterfaces.ExtensionQueryFlags} flags
     */
    getExtensionById(extensionId: string, version?: string, flags?: GalleryInterfaces.ExtensionQueryFlags): Promise<GalleryInterfaces.PublishedExtension>;
    /**
     * @param {string} extensionId
     * @param {string} reCaptchaToken
     */
    updateExtensionById(extensionId: string, reCaptchaToken?: string): Promise<GalleryInterfaces.PublishedExtension>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionType
     * @param {string} reCaptchaToken
     */
    createExtensionWithPublisher(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionType?: string, reCaptchaToken?: string): Promise<GalleryInterfaces.PublishedExtension>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     */
    deleteExtension(publisherName: string, extensionName: string, version?: string): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {GalleryInterfaces.ExtensionQueryFlags} flags
     * @param {string} accountToken
     * @param {String} accountTokenHeader - Header to pass the account token
     */
    getExtension(customHeaders: any, publisherName: string, extensionName: string, version?: string, flags?: GalleryInterfaces.ExtensionQueryFlags, accountToken?: string, accountTokenHeader?: String): Promise<GalleryInterfaces.PublishedExtension>;
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
    updateExtension(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, extensionType?: string, reCaptchaToken?: string, bypassScopeCheck?: boolean): Promise<GalleryInterfaces.PublishedExtension>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {GalleryInterfaces.PublishedExtensionFlags} flags
     */
    updateExtensionProperties(publisherName: string, extensionName: string, flags: GalleryInterfaces.PublishedExtensionFlags): Promise<GalleryInterfaces.PublishedExtension>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} hostType
     * @param {string} hostName
     */
    shareExtensionWithHost(publisherName: string, extensionName: string, hostType: string, hostName: string): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} hostType
     * @param {string} hostName
     */
    unshareExtensionWithHost(publisherName: string, extensionName: string, hostType: string, hostName: string): Promise<void>;
    /**
     * Rest end point to validate if an Azure publisher owns an extension for 3rd party commerce scenario. Azure only supports POST operations and the above signature is not typical of the REST operations. http://sharepoint/sites/AzureUX/_layouts/15/WopiFrame2.aspx?sourcedoc={A793D31E-6DC6-4174-8FA3-DE3F82B51642}&file=Data%20Market%20Partner%20integration%20with%20Marketplace%20service.docx&action=default
     *
     * @param {GalleryInterfaces.AzureRestApiRequestModel} azureRestApiRequestModel - All the parameters are sent in the request body
     */
    extensionValidator(azureRestApiRequestModel: GalleryInterfaces.AzureRestApiRequestModel): Promise<void>;
    /**
     * Send Notification
     *
     * @param {GalleryInterfaces.NotificationsData} notificationData - Denoting the data needed to send notification
     */
    sendNotifications(notificationData: GalleryInterfaces.NotificationsData): Promise<void>;
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
    getPackage(customHeaders: any, publisherName: string, extensionName: string, version: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
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
    getAssetWithToken(customHeaders: any, publisherName: string, extensionName: string, version: string, assetType: string, assetToken?: string, accountToken?: string, acceptDefault?: boolean, accountTokenHeader?: String): Promise<NodeJS.ReadableStream>;
    /**
     * Delete publisher asset like logo
     *
     * @param {string} publisherName - Internal name of the publisher
     * @param {string} assetType - Type of asset. Default value is 'logo'.
     */
    deletePublisherAsset(publisherName: string, assetType?: string): Promise<void>;
    /**
     * Get publisher asset like logo as a stream
     *
     * @param {string} publisherName - Internal name of the publisher
     * @param {string} assetType - Type of asset. Default value is 'logo'.
     */
    getPublisherAsset(publisherName: string, assetType?: string): Promise<NodeJS.ReadableStream>;
    /**
     * Update publisher asset like logo. It accepts asset file as an octet stream and file name is passed in header values.
     *
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName - Internal name of the publisher
     * @param {string} assetType - Type of asset. Default value is 'logo'.
     * @param {String} fileName - Header to pass the filename of the uploaded data
     */
    updatePublisherAsset(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, assetType?: string, fileName?: String): Promise<{
        [key: string]: string;
    }>;
    /**
     * @param {string} publisherName
     */
    fetchDomainToken(publisherName: string): Promise<string>;
    /**
     * @param {string} publisherName
     */
    verifyDomainToken(publisherName: string): Promise<void>;
    /**
     * @param {GalleryInterfaces.PublisherQuery} publisherQuery
     */
    queryPublishers(publisherQuery: GalleryInterfaces.PublisherQuery): Promise<GalleryInterfaces.PublisherQueryResult>;
    /**
     * @param {GalleryInterfaces.Publisher} publisher
     */
    createPublisher(publisher: GalleryInterfaces.Publisher): Promise<GalleryInterfaces.Publisher>;
    /**
     * @param {string} publisherName
     */
    deletePublisher(publisherName: string): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {number} flags
     */
    getPublisher(publisherName: string, flags?: number): Promise<GalleryInterfaces.Publisher>;
    /**
     * @param {GalleryInterfaces.Publisher} publisher
     * @param {string} publisherName
     */
    updatePublisher(publisher: GalleryInterfaces.Publisher, publisherName: string): Promise<GalleryInterfaces.Publisher>;
    /**
     * Endpoint to add/modify publisher membership. Currently Supports only addition/modification of 1 user at a time Works only for adding members of same tenant.
     *
     * @param {GalleryInterfaces.PublisherUserRoleAssignmentRef[]} roleAssignments - List of user identifiers(email address) and role to be added. Currently only one entry is supported.
     * @param {string} publisherName - The name/id of publisher to which users have to be added
     * @param {boolean} limitToCallerIdentityDomain - Should cross tenant addtions be allowed or not.
     */
    updatePublisherMembers(roleAssignments: GalleryInterfaces.PublisherUserRoleAssignmentRef[], publisherName: string, limitToCallerIdentityDomain?: boolean): Promise<GalleryInterfaces.PublisherRoleAssignment[]>;
    /**
     * @param {NodeJS.ReadableStream} contentStream - Content to upload
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} extensionType
     * @param {string} reCaptchaToken
     * @param {boolean} bypassScopeCheck
     */
    publishExtensionWithPublisherSignature(customHeaders: any, contentStream: NodeJS.ReadableStream, publisherName: string, extensionName: string, extensionType?: string, reCaptchaToken?: string, bypassScopeCheck?: boolean): Promise<GalleryInterfaces.PublishedExtension>;
    /**
     * @param {string} publisherName
     */
    getPublisherWithoutToken(publisherName: string): Promise<GalleryInterfaces.Publisher>;
    /**
     * Returns a list of questions with their responses associated with an extension.
     *
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} count - Number of questions to retrieve (defaults to 10).
     * @param {number} page - Page number from which set of questions are to be retrieved.
     * @param {Date} afterDate - If provided, results questions are returned which were posted after this date
     */
    getQuestions(publisherName: string, extensionName: string, count?: number, page?: number, afterDate?: Date): Promise<GalleryInterfaces.QuestionsResult>;
    /**
     * Flags a concern with an existing question for an extension.
     *
     * @param {GalleryInterfaces.Concern} concern - User reported concern with a question for the extension.
     * @param {string} pubName - Name of the publisher who published the extension.
     * @param {string} extName - Name of the extension.
     * @param {number} questionId - Identifier of the question to be updated for the extension.
     */
    reportQuestion(concern: GalleryInterfaces.Concern, pubName: string, extName: string, questionId: number): Promise<GalleryInterfaces.Concern>;
    /**
     * Creates a new question for an extension.
     *
     * @param {GalleryInterfaces.Question} question - Question to be created for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     */
    createQuestion(question: GalleryInterfaces.Question, publisherName: string, extensionName: string): Promise<GalleryInterfaces.Question>;
    /**
     * Deletes an existing question and all its associated responses for an extension. (soft delete)
     *
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question to be deleted for the extension.
     */
    deleteQuestion(publisherName: string, extensionName: string, questionId: number): Promise<void>;
    /**
     * Updates an existing question for an extension.
     *
     * @param {GalleryInterfaces.Question} question - Updated question to be set for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question to be updated for the extension.
     */
    updateQuestion(question: GalleryInterfaces.Question, publisherName: string, extensionName: string, questionId: number): Promise<GalleryInterfaces.Question>;
    /**
     * Creates a new response for a given question for an extension.
     *
     * @param {GalleryInterfaces.Response} response - Response to be created for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question for which response is to be created for the extension.
     */
    createResponse(response: GalleryInterfaces.Response, publisherName: string, extensionName: string, questionId: number): Promise<GalleryInterfaces.Response>;
    /**
     * Deletes a response for an extension. (soft delete)
     *
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifies the question whose response is to be deleted.
     * @param {number} responseId - Identifies the response to be deleted.
     */
    deleteResponse(publisherName: string, extensionName: string, questionId: number, responseId: number): Promise<void>;
    /**
     * Updates an existing response for a given question for an extension.
     *
     * @param {GalleryInterfaces.Response} response - Updated response to be set for the extension.
     * @param {string} publisherName - Name of the publisher who published the extension.
     * @param {string} extensionName - Name of the extension.
     * @param {number} questionId - Identifier of the question for which response is to be updated for the extension.
     * @param {number} responseId - Identifier of the response which has to be updated.
     */
    updateResponse(response: GalleryInterfaces.Response, publisherName: string, extensionName: string, questionId: number, responseId: number): Promise<GalleryInterfaces.Response>;
    /**
     * Returns extension reports
     *
     * @param {string} publisherName - Name of the publisher who published the extension
     * @param {string} extensionName - Name of the extension
     * @param {number} days - Last n days report. If afterDate and days are specified, days will take priority
     * @param {number} count - Number of events to be returned
     * @param {Date} afterDate - Use if you want to fetch events newer than the specified date
     */
    getExtensionReports(publisherName: string, extensionName: string, days?: number, count?: number, afterDate?: Date): Promise<any>;
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
    getReviews(publisherName: string, extensionName: string, count?: number, filterOptions?: GalleryInterfaces.ReviewFilterOptions, beforeDate?: Date, afterDate?: Date): Promise<GalleryInterfaces.ReviewsResult>;
    /**
     * Returns a summary of the reviews
     *
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     * @param {Date} beforeDate - Use if you want to fetch summary of reviews older than the specified date, defaults to null
     * @param {Date} afterDate - Use if you want to fetch summary of reviews newer than the specified date, defaults to null
     */
    getReviewsSummary(pubName: string, extName: string, beforeDate?: Date, afterDate?: Date): Promise<GalleryInterfaces.ReviewSummary>;
    /**
     * Creates a new review for an extension
     *
     * @param {GalleryInterfaces.Review} review - Review to be created for the extension
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     */
    createReview(review: GalleryInterfaces.Review, pubName: string, extName: string): Promise<GalleryInterfaces.Review>;
    /**
     * Deletes a review
     *
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     * @param {number} reviewId - Id of the review which needs to be updated
     */
    deleteReview(pubName: string, extName: string, reviewId: number): Promise<void>;
    /**
     * Updates or Flags a review
     *
     * @param {GalleryInterfaces.ReviewPatch} reviewPatch - ReviewPatch object which contains the changes to be applied to the review
     * @param {string} pubName - Name of the publisher who published the extension
     * @param {string} extName - Name of the extension
     * @param {number} reviewId - Id of the review which needs to be updated
     */
    updateReview(reviewPatch: GalleryInterfaces.ReviewPatch, pubName: string, extName: string, reviewId: number): Promise<GalleryInterfaces.ReviewPatch>;
    /**
     * @param {GalleryInterfaces.ExtensionCategory} category
     */
    createCategory(category: GalleryInterfaces.ExtensionCategory): Promise<GalleryInterfaces.ExtensionCategory>;
    /**
     * Get all setting entries for the given user/all-users scope
     *
     * @param {string} userScope - User-Scope at which to get the value. Should be "me" for the current user or "host" for all users.
     * @param {string} key - Optional key under which to filter all the entries
     */
    getGalleryUserSettings(userScope: string, key?: string): Promise<{
        [key: string]: any;
    }>;
    /**
     * Set all setting entries for the given user/all-users scope
     *
     * @param {{ [key: string] : any; }} entries - A key-value pair of all settings that need to be set
     * @param {string} userScope - User-Scope at which to get the value. Should be "me" for the current user or "host" for all users.
     */
    setGalleryUserSettings(entries: {
        [key: string]: any;
    }, userScope: string): Promise<void>;
    /**
     * @param {string} keyType
     * @param {number} expireCurrentSeconds
     */
    generateKey(keyType: string, expireCurrentSeconds?: number): Promise<void>;
    /**
     * @param {string} keyType
     */
    getSigningKey(keyType: string): Promise<string>;
    /**
     * @param {GalleryInterfaces.ExtensionStatisticUpdate} extensionStatisticsUpdate
     * @param {string} publisherName
     * @param {string} extensionName
     */
    updateExtensionStatistics(extensionStatisticsUpdate: GalleryInterfaces.ExtensionStatisticUpdate, publisherName: string, extensionName: string): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {number} days
     * @param {GalleryInterfaces.ExtensionStatsAggregateType} aggregate
     * @param {Date} afterDate
     */
    getExtensionDailyStats(publisherName: string, extensionName: string, days?: number, aggregate?: GalleryInterfaces.ExtensionStatsAggregateType, afterDate?: Date): Promise<GalleryInterfaces.ExtensionDailyStats>;
    /**
     * This route/location id only supports HTTP POST anonymously, so that the page view daily stat can be incremented from Marketplace client. Trying to call GET on this route should result in an exception. Without this explicit implementation, calling GET on this public route invokes the above GET implementation GetExtensionDailyStats.
     *
     * @param {string} publisherName - Name of the publisher
     * @param {string} extensionName - Name of the extension
     * @param {string} version - Version of the extension
     */
    getExtensionDailyStatsAnonymous(publisherName: string, extensionName: string, version: string): Promise<GalleryInterfaces.ExtensionDailyStats>;
    /**
     * Increments a daily statistic associated with the extension
     *
     * @param {string} publisherName - Name of the publisher
     * @param {string} extensionName - Name of the extension
     * @param {string} version - Version of the extension
     * @param {string} statType - Type of stat to increment
     * @param {string} targetPlatform
     */
    incrementExtensionDailyStat(publisherName: string, extensionName: string, version: string, statType: string, targetPlatform?: string): Promise<void>;
    /**
     * @param {string} publisherName
     * @param {string} extensionName
     * @param {string} version
     * @param {string} targetPlatform
     */
    getVerificationLog(publisherName: string, extensionName: string, version: string, targetPlatform?: string): Promise<NodeJS.ReadableStream>;
    /**
     * @param {string} itemName
     * @param {string} version
     * @param {GalleryInterfaces.VSCodeWebExtensionStatisicsType} statType
     */
    updateVSCodeWebExtensionStatistics(itemName: string, version: string, statType: GalleryInterfaces.VSCodeWebExtensionStatisicsType): Promise<void>;
}
