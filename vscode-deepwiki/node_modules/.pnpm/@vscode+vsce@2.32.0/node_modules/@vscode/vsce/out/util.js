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
exports.generateFileStructureTree = exports.vsixPathToFilePath = exports.filePathToVsixPath = exports.bytesToString = exports.patchOptionsWithManifest = exports.log = exports.sequence = exports.CancellationToken = exports.isCancelledError = exports.nonnull = exports.flatten = exports.chain = exports.normalize = exports.getPublicGalleryAPI = exports.getSecurityRolesAPI = exports.getGalleryAPI = exports.getHubUrl = exports.getMarketplaceUrl = exports.getPublishedUrl = exports.read = void 0;
const util_1 = require("util");
const fs = __importStar(require("fs"));
const read_1 = __importDefault(require("read"));
const WebApi_1 = require("azure-devops-node-api/WebApi");
const GalleryApi_1 = require("azure-devops-node-api/GalleryApi");
const chalk_1 = __importDefault(require("chalk"));
const publicgalleryapi_1 = require("./publicgalleryapi");
const os_1 = require("os");
const __read = (0, util_1.promisify)(read_1.default);
function read(prompt, options = {}) {
    if (process.env['VSCE_TESTS'] || !process.stdout.isTTY) {
        return Promise.resolve('y');
    }
    return __read({ prompt, ...options });
}
exports.read = read;
const marketplaceUrl = process.env['VSCE_MARKETPLACE_URL'] || 'https://marketplace.visualstudio.com';
function getPublishedUrl(extension) {
    return `${marketplaceUrl}/items?itemName=${extension}`;
}
exports.getPublishedUrl = getPublishedUrl;
function getMarketplaceUrl() {
    return marketplaceUrl;
}
exports.getMarketplaceUrl = getMarketplaceUrl;
function getHubUrl(publisher, name) {
    return `${marketplaceUrl}/manage/publishers/${publisher}/extensions/${name}/hub`;
}
exports.getHubUrl = getHubUrl;
async function getGalleryAPI(pat) {
    // from https://github.com/Microsoft/tfs-cli/blob/master/app/exec/extension/default.ts#L287-L292
    const authHandler = (0, WebApi_1.getBasicHandler)('OAuth', pat);
    return new GalleryApi_1.GalleryApi(marketplaceUrl, [authHandler]);
    // const vsoapi = new WebApi(marketplaceUrl, authHandler);
    // return await vsoapi.getGalleryApi();
}
exports.getGalleryAPI = getGalleryAPI;
async function getSecurityRolesAPI(pat) {
    const authHandler = (0, WebApi_1.getBasicHandler)('OAuth', pat);
    const vsoapi = new WebApi_1.WebApi(marketplaceUrl, authHandler);
    return await vsoapi.getSecurityRolesApi();
}
exports.getSecurityRolesAPI = getSecurityRolesAPI;
function getPublicGalleryAPI() {
    return new publicgalleryapi_1.PublicGalleryAPI(marketplaceUrl, '3.0-preview.1');
}
exports.getPublicGalleryAPI = getPublicGalleryAPI;
function normalize(path) {
    return path.replace(/\\/g, '/');
}
exports.normalize = normalize;
function chain2(a, b, fn, index = 0) {
    if (index >= b.length) {
        return Promise.resolve(a);
    }
    return fn(a, b[index]).then(a => chain2(a, b, fn, index + 1));
}
function chain(initial, processors, process) {
    return chain2(initial, processors, process);
}
exports.chain = chain;
function flatten(arr) {
    return [].concat.apply([], arr);
}
exports.flatten = flatten;
function nonnull(arg) {
    return !!arg;
}
exports.nonnull = nonnull;
const CancelledError = 'Cancelled';
function isCancelledError(error) {
    return error === CancelledError;
}
exports.isCancelledError = isCancelledError;
class CancellationToken {
    constructor() {
        this.listeners = [];
        this._cancelled = false;
    }
    get isCancelled() {
        return this._cancelled;
    }
    subscribe(fn) {
        this.listeners.push(fn);
        return () => {
            const index = this.listeners.indexOf(fn);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    cancel() {
        const emit = !this._cancelled;
        this._cancelled = true;
        if (emit) {
            this.listeners.forEach(l => l(CancelledError));
            this.listeners = [];
        }
    }
}
exports.CancellationToken = CancellationToken;
async function sequence(promiseFactories) {
    for (const factory of promiseFactories) {
        await factory();
    }
}
exports.sequence = sequence;
var LogMessageType;
(function (LogMessageType) {
    LogMessageType[LogMessageType["DONE"] = 0] = "DONE";
    LogMessageType[LogMessageType["INFO"] = 1] = "INFO";
    LogMessageType[LogMessageType["WARNING"] = 2] = "WARNING";
    LogMessageType[LogMessageType["ERROR"] = 3] = "ERROR";
})(LogMessageType || (LogMessageType = {}));
const LogPrefix = {
    [LogMessageType.DONE]: chalk_1.default.bgGreen.black(' DONE '),
    [LogMessageType.INFO]: chalk_1.default.bgBlueBright.black(' INFO '),
    [LogMessageType.WARNING]: chalk_1.default.bgYellow.black(' WARNING '),
    [LogMessageType.ERROR]: chalk_1.default.bgRed.black(' ERROR '),
};
function _log(type, msg, ...args) {
    args = [LogPrefix[type], msg, ...args];
    if (type === LogMessageType.WARNING) {
        process.env['GITHUB_ACTIONS'] ? logToGitHubActions('warning', msg) : console.warn(...args);
    }
    else if (type === LogMessageType.ERROR) {
        process.env['GITHUB_ACTIONS'] ? logToGitHubActions('error', msg) : console.error(...args);
    }
    else {
        process.env['GITHUB_ACTIONS'] ? logToGitHubActions('info', msg) : console.log(...args);
    }
}
const EscapeCharacters = new Map([
    ['%', '%25'],
    ['\r', '%0D'],
    ['\n', '%0A'],
]);
const EscapeRegex = new RegExp(`[${[...EscapeCharacters.keys()].join('')}]`, 'g');
function escapeGitHubActionsMessage(message) {
    return message.replace(EscapeRegex, c => EscapeCharacters.get(c) ?? c);
}
function logToGitHubActions(type, message) {
    const command = type === 'info' ? message : `::${type}::${escapeGitHubActionsMessage(message)}`;
    process.stdout.write(command + os_1.EOL);
}
exports.log = {
    done: _log.bind(null, LogMessageType.DONE),
    info: _log.bind(null, LogMessageType.INFO),
    warn: _log.bind(null, LogMessageType.WARNING),
    error: _log.bind(null, LogMessageType.ERROR),
};
function patchOptionsWithManifest(options, manifest) {
    if (!manifest.vsce) {
        return;
    }
    for (const key of Object.keys(manifest.vsce)) {
        const optionsKey = key === 'yarn' ? 'useYarn' : key;
        if (options[optionsKey] === undefined) {
            options[optionsKey] = manifest.vsce[key];
        }
    }
}
exports.patchOptionsWithManifest = patchOptionsWithManifest;
function bytesToString(bytes) {
    let size = 0;
    let unit = '';
    if (bytes > 1048576) {
        size = Math.round(bytes / 10485.76) / 100;
        unit = 'MB';
    }
    else {
        size = Math.round(bytes / 10.24) / 100;
        unit = 'KB';
    }
    return `${size} ${unit}`;
}
exports.bytesToString = bytesToString;
function filePathToVsixPath(originalFilePath) {
    return `extension/${originalFilePath}`;
}
exports.filePathToVsixPath = filePathToVsixPath;
function vsixPathToFilePath(extensionFilePath) {
    return extensionFilePath.startsWith('extension/') ? extensionFilePath.substring('extension/'.length) : extensionFilePath;
}
exports.vsixPathToFilePath = vsixPathToFilePath;
const FOLDER_SIZE_KEY = "/__FOlDER_SIZE__\\";
const FOLDER_FILES_TOTAL_KEY = "/__FOLDER_CHILDREN__\\";
const FILE_SIZE_WARNING_THRESHOLD = 0.85;
const FILE_SIZE_LARGE_THRESHOLD = 0.2;
async function generateFileStructureTree(rootFolder, filePaths, printLinesLimit = Number.MAX_VALUE) {
    const folderTree = {};
    const depthCounts = [];
    // Build a tree structure from the file paths
    // Store the file size in the leaf node and the folder size in the folder node
    // Store the number of children in the folder node
    for (const filePath of filePaths) {
        const parts = filePath.tree.split('/');
        let currentLevel = folderTree;
        parts.forEach((part, depth) => {
            const isFile = depth === parts.length - 1;
            // Create the node if it doesn't exist
            if (!currentLevel[part]) {
                if (isFile) {
                    // The file size is stored in the leaf node, 
                    currentLevel[part] = 0;
                }
                else {
                    // The folder size is stored in the folder node
                    currentLevel[part] = {};
                    currentLevel[part][FOLDER_SIZE_KEY] = 0;
                    currentLevel[part][FOLDER_FILES_TOTAL_KEY] = 0;
                }
                // Count the number of items at each depth
                if (depthCounts.length <= depth) {
                    depthCounts.push(0);
                }
                depthCounts[depth]++;
            }
            currentLevel = currentLevel[part];
            // Count the total number of children in the nested folders
            if (!isFile) {
                currentLevel[FOLDER_FILES_TOTAL_KEY]++;
            }
        });
    }
    ;
    // Get max depth depending on the maximum number of lines allowed to print
    let currentDepth = 0;
    let countUpToCurrentDepth = depthCounts[0] + 1 /* root folder */;
    for (let i = 1; i < depthCounts.length; i++) {
        if (countUpToCurrentDepth + depthCounts[i] > printLinesLimit) {
            break;
        }
        currentDepth++;
        countUpToCurrentDepth += depthCounts[i];
    }
    const maxDepth = currentDepth;
    // Get all file sizes
    const fileSizes = await Promise.all(filePaths.map(async (filePath) => {
        try {
            const stats = await fs.promises.stat(filePath.origin);
            return [stats.size, filePath.tree];
        }
        catch (error) {
            return [0, filePath.origin];
        }
    }));
    // Store all file sizes in the tree
    let totalFileSizes = 0;
    fileSizes.forEach(([size, filePath]) => {
        totalFileSizes += size;
        const parts = filePath.split('/');
        let currentLevel = folderTree;
        parts.forEach(part => {
            if (typeof currentLevel[part] === 'number') {
                currentLevel[part] = size;
            }
            else if (currentLevel[part]) {
                currentLevel[part][FOLDER_SIZE_KEY] += size;
            }
            currentLevel = currentLevel[part];
        });
    });
    let output = [];
    output.push(chalk_1.default.bold(rootFolder));
    output.push(...createTreeOutput(folderTree, maxDepth, totalFileSizes));
    for (const [size, filePath] of fileSizes) {
        if (size > FILE_SIZE_WARNING_THRESHOLD * totalFileSizes) {
            output.push(`\nThe file ${filePath} is ${chalk_1.default.red('large')} (${bytesToString(size)})`);
            break;
        }
    }
    return output;
}
exports.generateFileStructureTree = generateFileStructureTree;
function createTreeOutput(fileSystem, maxDepth, totalFileSizes) {
    const getColorFromSize = (size) => {
        if (size > FILE_SIZE_WARNING_THRESHOLD * totalFileSizes) {
            return chalk_1.default.red;
        }
        else if (size > FILE_SIZE_LARGE_THRESHOLD * totalFileSizes) {
            return chalk_1.default.yellow;
        }
        else {
            return chalk_1.default.grey;
        }
    };
    const createFileOutput = (prefix, fileName, fileSize) => {
        let fileSizeColored = '';
        if (fileSize > 0) {
            const fileSizeString = `[${bytesToString(fileSize)}]`;
            fileSizeColored = getColorFromSize(fileSize)(fileSizeString);
        }
        return `${prefix}${fileName} ${fileSizeColored}`;
    };
    const createFolderOutput = (prefix, filesCount, folderSize, folderName, depth) => {
        if (depth < maxDepth) {
            // Max depth is not reached, print only the folder
            // as children will be printed
            return prefix + chalk_1.default.bold(`${folderName}/`);
        }
        // Max depth is reached, print the folder name and additional metadata
        // as children will not be printed
        const folderSizeString = bytesToString(folderSize);
        const folder = chalk_1.default.bold(`${folderName}/`);
        const numFilesString = chalk_1.default.green(`(${filesCount} ${filesCount === 1 ? 'file' : 'files'})`);
        const folderSizeColored = getColorFromSize(folderSize)(`[${folderSizeString}]`);
        return `${prefix}${folder} ${numFilesString} ${folderSizeColored}`;
    };
    const createTreeLayerOutput = (tree, depth, prefix, path) => {
        // Print all files before folders
        const sortedFolderKeys = Object.keys(tree).filter(key => typeof tree[key] !== 'number').sort();
        const sortedFileKeys = Object.keys(tree).filter(key => typeof tree[key] === 'number').sort();
        const sortedKeys = [...sortedFileKeys, ...sortedFolderKeys].filter(key => key !== FOLDER_SIZE_KEY && key !== FOLDER_FILES_TOTAL_KEY);
        const output = [];
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            const isLast = i === sortedKeys.length - 1;
            const localPrefix = prefix + (isLast ? '└─ ' : '├─ ');
            const childPrefix = prefix + (isLast ? '   ' : '│  ');
            if (typeof tree[key] === 'number') {
                // It's a file
                output.push(createFileOutput(localPrefix, key, tree[key]));
            }
            else {
                // It's a folder
                output.push(createFolderOutput(localPrefix, tree[key][FOLDER_FILES_TOTAL_KEY], tree[key][FOLDER_SIZE_KEY], key, depth));
                if (depth < maxDepth) {
                    output.push(...createTreeLayerOutput(tree[key], depth + 1, childPrefix, path + key + '/'));
                }
            }
        }
        return output;
    };
    return createTreeLayerOutput(fileSystem, 0, '', '');
}
//# sourceMappingURL=util.js.map