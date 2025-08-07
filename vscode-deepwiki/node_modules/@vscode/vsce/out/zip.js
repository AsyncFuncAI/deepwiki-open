"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readVSIXPackage = exports.readZip = void 0;
const yauzl_1 = require("yauzl");
const xml_1 = require("./xml");
const util_1 = require("./util");
async function bufferStream(stream) {
    return await new Promise((c, e) => {
        const buffers = [];
        stream.on('data', buffer => buffers.push(buffer));
        stream.once('error', e);
        stream.once('end', () => c(Buffer.concat(buffers)));
    });
}
async function readZip(packagePath, filter) {
    const zipfile = await new Promise((c, e) => (0, yauzl_1.open)(packagePath, { lazyEntries: true }, (err, zipfile) => (err ? e(err) : c(zipfile))));
    return await new Promise((c, e) => {
        const result = new Map();
        zipfile.once('close', () => c(result));
        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
            const name = entry.fileName.toLowerCase();
            if (filter(name)) {
                zipfile.openReadStream(entry, (err, stream) => {
                    if (err) {
                        zipfile.close();
                        return e(err);
                    }
                    bufferStream(stream).then(buffer => {
                        result.set(name, buffer);
                        zipfile.readEntry();
                    });
                });
            }
            else {
                zipfile.readEntry();
            }
        });
    });
}
exports.readZip = readZip;
async function readVSIXPackage(packagePath) {
    const map = await readZip(packagePath, name => /^extension\/package\.json$|^extension\.vsixmanifest$/i.test(name));
    const rawManifest = map.get((0, util_1.filePathToVsixPath)('package.json'));
    if (!rawManifest) {
        throw new Error('Manifest not found');
    }
    const rawXmlManifest = map.get('extension.vsixmanifest');
    if (!rawXmlManifest) {
        throw new Error('VSIX manifest not found');
    }
    return {
        manifest: JSON.parse(rawManifest.toString('utf8')),
        xmlManifest: await (0, xml_1.parseXmlManifest)(rawXmlManifest.toString('utf8')),
    };
}
exports.readVSIXPackage = readVSIXPackage;
//# sourceMappingURL=zip.js.map