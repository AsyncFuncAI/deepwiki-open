"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAzureCredentialAccessToken = void 0;
const identity_1 = require("@azure/identity");
function createChainedTokenCredential() {
    return new identity_1.ChainedTokenCredential(new identity_1.EnvironmentCredential(), new identity_1.AzureCliCredential(), new identity_1.ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID }), new identity_1.AzurePowerShellCredential({ tenantId: process.env.AZURE_TENANT_ID }), new identity_1.AzureDeveloperCliCredential({ tenantId: process.env.AZURE_TENANT_ID }));
}
async function getAzureCredentialAccessToken() {
    try {
        const credential = createChainedTokenCredential();
        const token = await credential.getToken('499b84ac-1321-427f-aa17-267ca6975798/.default', {
            tenantId: process.env.AZURE_TENANT_ID
        });
        return token.token;
    }
    catch (error) {
        throw new Error('Can not acquire a Microsoft Entra ID access token. Additional information:\n\n' + error);
    }
}
exports.getAzureCredentialAccessToken = getAzureCredentialAccessToken;
//# sourceMappingURL=auth.js.map