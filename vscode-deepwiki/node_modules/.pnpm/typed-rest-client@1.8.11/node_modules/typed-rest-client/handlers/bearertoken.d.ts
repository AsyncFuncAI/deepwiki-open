import ifm = require('../Interfaces');
export declare class BearerCredentialHandler implements ifm.IRequestHandler {
    token: string;
    allowCrossOriginAuthentication: boolean;
    origin: string;
    constructor(token: string, allowCrossOriginAuthentication?: boolean);
    prepareRequest(options: any): void;
    canHandleAuthentication(response: ifm.IHttpClientResponse): boolean;
    handleAuthentication(httpClient: ifm.IHttpClient, requestInfo: ifm.IRequestInfo, objs: any): Promise<ifm.IHttpClientResponse>;
}
