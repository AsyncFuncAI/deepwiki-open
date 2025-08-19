"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArrayDef = void 0;
const zod_1 = require("zod");
const errorMessages_1 = require("../errorMessages");
const parseDef_1 = require("../parseDef");
function parseArrayDef(def, refs) {
    var _a, _b;
    const res = {
        type: "array",
    };
    if (((_b = (_a = def.type) === null || _a === void 0 ? void 0 : _a._def) === null || _b === void 0 ? void 0 : _b.typeName) !== zod_1.ZodFirstPartyTypeKind.ZodAny) {
        res.items = (0, parseDef_1.parseDef)(def.type._def, Object.assign(Object.assign({}, refs), { currentPath: [...refs.currentPath, "items"] }));
    }
    if (def.minLength) {
        (0, errorMessages_1.setResponseValueAndErrors)(res, "minItems", def.minLength.value, def.minLength.message, refs);
    }
    if (def.maxLength) {
        (0, errorMessages_1.setResponseValueAndErrors)(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
    }
    return res;
}
exports.parseArrayDef = parseArrayDef;
