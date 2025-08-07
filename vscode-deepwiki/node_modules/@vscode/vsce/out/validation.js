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
exports.validateVSCodeTypesCompatibility = exports.validateEngineCompatibility = exports.validateVersion = exports.validateExtensionName = exports.validatePublisher = void 0;
const semver = __importStar(require("semver"));
const parse_semver_1 = __importDefault(require("parse-semver"));
const nameRegex = /^[a-z0-9][a-z0-9\-]*$/i;
function validatePublisher(publisher) {
    if (!publisher) {
        throw new Error(`Missing publisher name. Learn more: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions`);
    }
    if (!nameRegex.test(publisher)) {
        throw new Error(`Invalid publisher name '${publisher}'. Expected the identifier of a publisher, not its human-friendly name. Learn more: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions`);
    }
}
exports.validatePublisher = validatePublisher;
function validateExtensionName(name) {
    if (!name) {
        throw new Error(`Missing extension name`);
    }
    if (!nameRegex.test(name)) {
        throw new Error(`Invalid extension name '${name}'`);
    }
}
exports.validateExtensionName = validateExtensionName;
function validateVersion(version) {
    if (!version) {
        throw new Error(`Missing extension version`);
    }
    if (!semver.valid(version)) {
        throw new Error(`Invalid extension version '${version}'`);
    }
}
exports.validateVersion = validateVersion;
function validateEngineCompatibility(version) {
    if (!version) {
        throw new Error(`Missing vscode engine compatibility version`);
    }
    if (!/^\*$|^(\^|>=)?((\d+)|x)\.((\d+)|x)\.((\d+)|x)(\-.*)?$/.test(version)) {
        throw new Error(`Invalid vscode engine compatibility version '${version}'`);
    }
}
exports.validateEngineCompatibility = validateEngineCompatibility;
/**
 * User shouldn't use a newer version of @types/vscode than the one specified in engines.vscode
 *
 * NOTE: This is enforced at the major and minor level. Since we don't have control over the patch
 * version (it's auto-incremented by DefinitelyTyped), we don't look at the patch version at all.
 */
function validateVSCodeTypesCompatibility(engineVersion, typeVersion) {
    if (engineVersion === '*') {
        return;
    }
    if (!typeVersion) {
        throw new Error(`Missing @types/vscode version`);
    }
    let plainEngineVersion, plainTypeVersion;
    try {
        const engineSemver = (0, parse_semver_1.default)(`vscode@${engineVersion}`);
        plainEngineVersion = engineSemver.version;
    }
    catch (err) {
        throw new Error('Failed to parse semver of engines.vscode');
    }
    try {
        const typeSemver = (0, parse_semver_1.default)(`@types/vscode@${typeVersion}`);
        plainTypeVersion = typeSemver.version;
    }
    catch (err) {
        throw new Error('Failed to parse semver of @types/vscode');
    }
    // For all `x`, use smallest version for comparison
    plainEngineVersion = plainEngineVersion.replace(/x/g, '0');
    const [typeMajor, typeMinor] = plainTypeVersion.split('.').map(x => {
        try {
            return parseInt(x);
        }
        catch (err) {
            return 0;
        }
    });
    const [engineMajor, engineMinor] = plainEngineVersion.split('.').map(x => {
        try {
            return parseInt(x);
        }
        catch (err) {
            return 0;
        }
    });
    const error = new Error(`@types/vscode ${typeVersion} greater than engines.vscode ${engineVersion}. Either upgrade engines.vscode or use an older @types/vscode version`);
    if (typeMajor > engineMajor) {
        throw error;
    }
    if (typeMajor === engineMajor && typeMinor > engineMinor) {
        throw error;
    }
}
exports.validateVSCodeTypesCompatibility = validateVSCodeTypesCompatibility;
//# sourceMappingURL=validation.js.map