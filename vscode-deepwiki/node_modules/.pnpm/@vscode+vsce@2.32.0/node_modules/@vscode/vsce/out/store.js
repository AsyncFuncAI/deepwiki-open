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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublishers = exports.deletePublisher = exports.logoutPublisher = exports.loginPublisher = exports.getPublisher = exports.verifyPat = exports.KeytarStore = exports.FileStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
const util_1 = require("./util");
const validation_1 = require("./validation");
const package_1 = require("./package");
const publish_1 = require("./publish");
class FileStore {
    constructor(path, publishers) {
        this.path = path;
        this.publishers = publishers;
    }
    static async open(path = FileStore.DefaultPath) {
        try {
            const rawStore = await fs.promises.readFile(path, 'utf8');
            return new FileStore(path, JSON.parse(rawStore).publishers);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return new FileStore(path, []);
            }
            else if (/SyntaxError/.test(err)) {
                throw new Error(`Error parsing file store: ${path}`);
            }
            throw err;
        }
    }
    get size() {
        return this.publishers.length;
    }
    async save() {
        await fs.promises.writeFile(this.path, JSON.stringify({ publishers: this.publishers }), { mode: '0600' });
    }
    async deleteStore() {
        try {
            await fs.promises.unlink(this.path);
        }
        catch {
            // noop
        }
    }
    get(name) {
        return this.publishers.filter(p => p.name === name)[0];
    }
    async add(publisher) {
        this.publishers = [...this.publishers.filter(p => p.name !== publisher.name), publisher];
        await this.save();
    }
    async delete(name) {
        this.publishers = this.publishers.filter(p => p.name !== name);
        await this.save();
    }
    [Symbol.iterator]() {
        return this.publishers[Symbol.iterator]();
    }
}
exports.FileStore = FileStore;
FileStore.DefaultPath = path.join((0, os_1.homedir)(), '.vsce');
class KeytarStore {
    constructor(keytar, serviceName, publishers) {
        this.keytar = keytar;
        this.serviceName = serviceName;
        this.publishers = publishers;
    }
    static async open(serviceName = 'vscode-vsce') {
        const keytar = await Promise.resolve().then(() => __importStar(require('keytar')));
        const creds = await keytar.findCredentials(serviceName);
        return new KeytarStore(keytar, serviceName, creds.map(({ account, password }) => ({ name: account, pat: password })));
    }
    get size() {
        return this.publishers.length;
    }
    get(name) {
        return this.publishers.filter(p => p.name === name)[0];
    }
    async add(publisher) {
        this.publishers = [...this.publishers.filter(p => p.name !== publisher.name), publisher];
        await this.keytar.setPassword(this.serviceName, publisher.name, publisher.pat);
    }
    async delete(name) {
        this.publishers = this.publishers.filter(p => p.name !== name);
        await this.keytar.deletePassword(this.serviceName, name);
    }
    [Symbol.iterator]() {
        return this.publishers[Symbol.iterator]();
    }
}
exports.KeytarStore = KeytarStore;
async function verifyPat(options) {
    const publisherName = options.publisherName ?? (await (0, package_1.readManifest)()).publisher;
    const pat = await (0, publish_1.getPAT)(publisherName, options);
    try {
        // If the caller of the `getRoleAssignments` API has any of the roles
        // (Creator, Owner, Contributor, Reader) on the publisher, we get a 200,
        // otherwise we get a 403.
        const api = await (0, util_1.getSecurityRolesAPI)(pat);
        await api.getRoleAssignments('gallery.publisher', publisherName);
    }
    catch (error) {
        throw new Error('The Personal Access Token verification has failed. Additional information:\n\n' + error);
    }
    console.log(`The Personal Access Token verification succeeded for the publisher '${publisherName}'.`);
}
exports.verifyPat = verifyPat;
async function requestPAT(publisherName) {
    console.log(`${(0, util_1.getMarketplaceUrl)()}/manage/publishers/`);
    const pat = await (0, util_1.read)(`Personal Access Token for publisher '${publisherName}':`, { silent: true, replace: '*' });
    await verifyPat({ publisherName, pat });
    return pat;
}
async function openDefaultStore() {
    if (/^file$/i.test(process.env['VSCE_STORE'] ?? '')) {
        return await FileStore.open();
    }
    let keytarStore;
    try {
        keytarStore = await KeytarStore.open();
    }
    catch (err) {
        const store = await FileStore.open();
        util_1.log.warn(`Failed to open credential store. Falling back to storing secrets clear-text in: ${store.path}`);
        return store;
    }
    const fileStore = await FileStore.open();
    // migrate from file store
    if (fileStore.size) {
        for (const publisher of fileStore) {
            await keytarStore.add(publisher);
        }
        await fileStore.deleteStore();
        util_1.log.info(`Migrated ${fileStore.size} publishers to system credential manager. Deleted local store '${fileStore.path}'.`);
    }
    return keytarStore;
}
async function getPublisher(publisherName) {
    (0, validation_1.validatePublisher)(publisherName);
    const store = await openDefaultStore();
    let publisher = store.get(publisherName);
    if (publisher) {
        return publisher;
    }
    const pat = await requestPAT(publisherName);
    publisher = { name: publisherName, pat };
    await store.add(publisher);
    return publisher;
}
exports.getPublisher = getPublisher;
async function loginPublisher(publisherName) {
    (0, validation_1.validatePublisher)(publisherName);
    const store = await openDefaultStore();
    let publisher = store.get(publisherName);
    if (publisher) {
        console.log(`Publisher '${publisherName}' is already known`);
        const answer = await (0, util_1.read)('Do you want to overwrite its PAT? [y/N] ');
        if (!/^y$/i.test(answer)) {
            throw new Error('Aborted');
        }
    }
    const pat = await requestPAT(publisherName);
    publisher = { name: publisherName, pat };
    await store.add(publisher);
    return publisher;
}
exports.loginPublisher = loginPublisher;
async function logoutPublisher(publisherName) {
    (0, validation_1.validatePublisher)(publisherName);
    const store = await openDefaultStore();
    const publisher = store.get(publisherName);
    if (!publisher) {
        throw new Error(`Unknown publisher '${publisherName}'`);
    }
    await store.delete(publisherName);
}
exports.logoutPublisher = logoutPublisher;
async function deletePublisher(publisherName) {
    const publisher = await getPublisher(publisherName);
    const answer = await (0, util_1.read)(`This will FOREVER delete '${publisherName}'! Are you sure? [y/N] `);
    if (!/^y$/i.test(answer)) {
        throw new Error('Aborted');
    }
    const api = await (0, util_1.getGalleryAPI)(publisher.pat);
    await api.deletePublisher(publisherName);
    const store = await openDefaultStore();
    await store.delete(publisherName);
    util_1.log.done(`Deleted publisher '${publisherName}'.`);
}
exports.deletePublisher = deletePublisher;
async function listPublishers() {
    const store = await openDefaultStore();
    for (const publisher of store) {
        console.log(publisher.name);
    }
}
exports.listPublishers = listPublishers;
//# sourceMappingURL=store.js.map