"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseContentTypes = exports.parseXmlManifest = void 0;
const util_1 = require("util");
const xml2js_1 = require("xml2js");
function createXMLParser() {
    return (0, util_1.promisify)(xml2js_1.parseString);
}
exports.parseXmlManifest = createXMLParser();
exports.parseContentTypes = createXMLParser();
//# sourceMappingURL=xml.js.map