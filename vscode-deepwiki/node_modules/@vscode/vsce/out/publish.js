"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPAT = exports.unpublish = exports.publish = void 0;
const fs = __importStar(require("fs"));
const util_1 = require("util");
const semver = __importStar(require("semver"));
const GalleryInterfaces_1 = require("azure-devops-node-api/interfaces/GalleryInterfaces");
const package_1 = require("./package");
const tmp = __importStar(require("tmp"));
const store_1 = require("./store");
const util_2 = require("./util");
const zip_1 = require("./zip");
const validation_1 = require("./validation");
const form_data_1 = __importDefault(require("form-data"));
const path_1 = require("path");
const cockatiel_1 = require("cockatiel");
const auth_1 = require("./auth");
const tmpName = (0, util_1.promisify)(tmp.tmpName);
async function publish(options = {}) {
    if (options.packagePath) {
        if (options.version) {
            throw new Error(`Both options not supported simultaneously: 'packagePath' and 'version'.`);
        }
        else if (options.targets) {
            throw new Error(`Both options not supported simultaneously: 'packagePath' and 'target'. Use 'vsce package --target <target>' to first create a platform specific package, then use 'vsce publish --packagePath <path>' to publish it.`);
        }
        if (options.manifestPath || options.signaturePath) {
            if (options.packagePath.length !== options.manifestPath?.length || options.packagePath.length !== options.signaturePath?.length) {
                throw new Error(`Either all packages must be signed or none of them.`);
            }
        }
        for (let index = 0; index < options.packagePath.length; index++) {
            const packagePath = options.packagePath[index];
            const vsix = await (0, zip_1.readVSIXPackage)(packagePath);
            let target;
            try {
                target = vsix.xmlManifest.PackageManifest.Metadata[0].Identity[0].$.TargetPlatform ?? undefined;
            }
            catch (err) {
                throw new Error(`Invalid extension VSIX manifest. ${err}`);
            }
            if (options.preRelease) {
                let isPreReleasePackage = false;
                try {
                    isPreReleasePackage = !!vsix.xmlManifest.PackageManifest.Metadata[0].Properties[0].Property.some(p => p.$.Id === 'Microsoft.VisualStudio.Code.PreRelease');
                }
                catch (err) {
                    throw new Error(`Invalid extension VSIX manifest. ${err}`);
                }
                if (!isPreReleasePackage) {
                    throw new Error(`Cannot use '--pre-release' flag with a package that was not packaged as pre-release. Please package it using the '--pre-release' flag and publish again.`);
                }
            }
            validateMarketplaceRequirements(vsix.manifest, options);
            let sigzipPath;
            if (options.manifestPath?.[index] && options.signaturePath?.[index]) {
                sigzipPath = await (0, package_1.createSignatureArchive)(options.manifestPath[index], options.signaturePath[index]);
            }
            if (!sigzipPath) {
                sigzipPath = options.sigzipPath?.[index];
            }
            if (!sigzipPath && options.signTool) {
                sigzipPath = await (0, package_1.signPackage)(packagePath, options.signTool);
            }
            await _publish(packagePath, sigzipPath, vsix.manifest, { ...options, target });
        }
    }
    else {
        const cwd = options.cwd || process.cwd();
        const manifest = await (0, package_1.readManifest)(cwd);
        (0, util_2.patchOptionsWithManifest)(options, manifest);
        // Validate marketplace requirements before prepublish to avoid unnecessary work
        validateMarketplaceRequirements(manifest, options);
        await (0, package_1.prepublish)(cwd, manifest, options.useYarn);
        await (0, package_1.versionBump)(options);
        if (options.targets) {
            for (const target of options.targets) {
                const packagePath = await tmpName();
                const packageResult = await (0, package_1.pack)({ ...options, target, packagePath });
                const sigzipPath = options.signTool ? await (0, package_1.signPackage)(packagePath, options.signTool) : undefined;
                await _publish(packagePath, sigzipPath, packageResult.manifest, { ...options, target });
            }
        }
        else {
            const packagePath = await tmpName();
            const packageResult = await (0, package_1.pack)({ ...options, packagePath });
            const sigzipPath = options.signTool ? await (0, package_1.signPackage)(packagePath, options.signTool) : undefined;
            await _publish(packagePath, sigzipPath, packageResult.manifest, options);
        }
    }
}
exports.publish = publish;
async function _publish(packagePath, sigzipPath, manifest, options) {
    const pat = await getPAT(manifest.publisher, options);
    const api = await (0, util_2.getGalleryAPI)(pat);
    const packageStream = fs.createReadStream(packagePath);
    const name = `${manifest.publisher}.${manifest.name}`;
    const description = options.target
        ? `${name} (${options.target}) v${manifest.version}`
        : `${name} v${manifest.version}`;
    util_2.log.info(`Publishing '${description}'...`);
    let extension = null;
    try {
        try {
            extension = await api.getExtension(null, manifest.publisher, manifest.name, undefined, GalleryInterfaces_1.ExtensionQueryFlags.IncludeVersions);
        }
        catch (err) {
            if (err.statusCode !== 404) {
                throw err;
            }
        }
        if (extension && extension.versions) {
            const versionExists = extension.versions.some(v => (v.version === manifest.version) &&
                (v.targetPlatform === options.target));
            if (versionExists) {
                if (options.skipDuplicate) {
                    util_2.log.done(`Version ${manifest.version} is already published. Skipping publish.`);
                    return;
                }
                else {
                    throw new Error(`${description} already exists.`);
                }
            }
            if (sigzipPath) {
                await _publishSignedPackage(api, (0, path_1.basename)(packagePath), packageStream, (0, path_1.basename)(sigzipPath), fs.createReadStream(sigzipPath), manifest);
            }
            else {
                try {
                    await api.updateExtension(undefined, packageStream, manifest.publisher, manifest.name);
                }
                catch (err) {
                    if (err.statusCode === 409) {
                        if (options.skipDuplicate) {
                            util_2.log.done(`Version ${manifest.version} is already published. Skipping publish.`);
                            return;
                        }
                        else {
                            throw new Error(`${description} already exists.`);
                        }
                    }
                    else {
                        throw err;
                    }
                }
            }
        }
        else {
            if (sigzipPath) {
                await _publishSignedPackage(api, (0, path_1.basename)(packagePath), packageStream, (0, path_1.basename)(sigzipPath), fs.createReadStream(sigzipPath), manifest);
            }
            else {
                await api.createExtension(undefined, packageStream);
            }
        }
    }
    catch (err) {
        const message = (err && err.message) || '';
        if (/Personal Access Token used has expired/.test(message)) {
            err.message = `${err.message}\n\nYou're using an expired Personal Access Token, please get a new PAT.\nMore info: https://aka.ms/vscodepat`;
        }
        else if (/Invalid Resource/.test(message)) {
            err.message = `${err.message}\n\nYou're likely using an expired Personal Access Token, please get a new PAT.\nMore info: https://aka.ms/vscodepat`;
        }
        throw err;
    }
    util_2.log.info(`Extension URL (might take a few minutes): ${(0, util_2.getPublishedUrl)(name)}`);
    util_2.log.info(`Hub URL: ${(0, util_2.getHubUrl)(manifest.publisher, manifest.name)}`);
    util_2.log.done(`Published ${description}.`);
}
async function _publishSignedPackage(api, packageName, packageStream, sigzipName, sigzipStream, manifest) {
    const extensionType = 'Visual Studio Code';
    const form = new form_data_1.default();
    const lineBreak = '\r\n';
    form.setBoundary('0f411892-ef48-488f-89d3-4f0546e84723');
    form.append('vsix', packageStream, {
        header: `--${form.getBoundary()}${lineBreak}Content-Disposition: attachment; name=vsix; filename=${packageName}${lineBreak}Content-Type: application/octet-stream${lineBreak}${lineBreak}`
    });
    form.append('sigzip', sigzipStream, {
        header: `--${form.getBoundary()}${lineBreak}Content-Disposition: attachment; name=sigzip; filename=${sigzipName}${lineBreak}Content-Type: application/octet-stream${lineBreak}${lineBreak}`
    });
    const publishWithRetry = (0, cockatiel_1.retry)((0, cockatiel_1.handleWhen)(err => err.message.includes('timeout')), {
        maxAttempts: 3,
        backoff: new cockatiel_1.IterableBackoff([5000, 10000, 20000])
    });
    return await publishWithRetry.execute(async () => {
        return await api.publishExtensionWithPublisherSignature(undefined, form, manifest.publisher, manifest.name, extensionType);
    });
}
async function unpublish(options = {}) {
    let publisher, name;
    if (options.id) {
        [publisher, name] = options.id.split('.');
    }
    else {
        const manifest = await (0, package_1.readManifest)(options.cwd);
        publisher = manifest.publisher;
        name = manifest.name;
    }
    const fullName = `${publisher}.${name}`;
    if (!options.force) {
        const answer = await (0, util_2.read)(`This will delete ALL published versions! Please type '${fullName}' to confirm: `);
        if (answer !== fullName) {
            throw new Error('Aborted');
        }
    }
    const pat = await getPAT(publisher, options);
    const api = await (0, util_2.getGalleryAPI)(pat);
    await api.deleteExtension(publisher, name);
    util_2.log.done(`Deleted extension: ${fullName}!`);
}
exports.unpublish = unpublish;
function validateMarketplaceRequirements(manifest, options) {
    (0, validation_1.validatePublisher)(manifest.publisher);
    if (manifest.enableProposedApi && !options.allowAllProposedApis && !options.noVerify) {
        throw new Error("Extensions using proposed API (enableProposedApi: true) can't be published to the Marketplace. Use --allow-all-proposed-apis to bypass. https://code.visualstudio.com/api/advanced-topics/using-proposed-api");
    }
    if (manifest.enabledApiProposals && !options.allowAllProposedApis && !options.noVerify && manifest.enabledApiProposals?.some(p => !options.allowProposedApis?.includes(p))) {
        throw new Error(`Extensions using unallowed proposed API (enabledApiProposals: [${manifest.enabledApiProposals}], allowed: [${options.allowProposedApis ?? []}]) can't be published to the Marketplace. Use --allow-proposed-apis <APIS...> or --allow-all-proposed-apis to bypass. https://code.visualstudio.com/api/advanced-topics/using-proposed-api`);
    }
    if (semver.prerelease(manifest.version)) {
        throw new Error(`The VS Marketplace doesn't support prerelease versions: '${manifest.version}'. Checkout our pre-release versioning recommendation here: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions`);
    }
}
async function getPAT(publisher, options) {
    if (options.pat) {
        return options.pat;
    }
    if (options.azureCredential) {
        return await (0, auth_1.getAzureCredentialAccessToken)();
    }
    return (await (0, store_1.getPublisher)(publisher)).pat;
}
exports.getPAT = getPAT;
//# sourceMappingURL=publish.js.map