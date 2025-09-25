"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMapDef = void 0;
const parseDef_1 = require("../parseDef");
function parseMapDef(def, refs) {
    const keys = (0, parseDef_1.parseDef)(def.keyType._def, Object.assign(Object.assign({}, refs), { currentPath: [...refs.currentPath, "items", "items", "0"] })) || {};
    const values = (0, parseDef_1.parseDef)(def.valueType._def, Object.assign(Object.assign({}, refs), { currentPath: [...refs.currentPath, "items", "items", "1"] })) || {};
    return {
        type: "array",
        maxItems: 125,
        items: {
            type: "array",
            items: [keys, values],
            minItems: 2,
            maxItems: 2,
        },
    };
}
exports.parseMapDef = parseMapDef;
