import ifm = require('../interfaces/common/VsoBaseInterfaces');
import * as resthandlers from 'typed-rest-client/Handlers';
export declare class BasicCredentialHandler extends resthandlers.BasicCredentialHandler implements ifm.IRequestHandler {
    constructor(username: string, password: string, allowCrossOriginAuthentication?: boolean);
}
