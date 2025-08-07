"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptionalDef = void 0;
const parseDef_1 = require("../parseDef");
const parseOptionalDef = (def, refs) => {
    var _a;
    if (refs.currentPath.toString() === ((_a = refs.propertyPath) === null || _a === void 0 ? void 0 : _a.toString())) {
        return (0, parseDef_1.parseDef)(def.innerType._def, refs);
    }
    const innerSchema = (0, parseDef_1.parseDef)(def.innerType._def, Object.assign(Object.assign({}, refs), { currentPath: [...refs.currentPath, "anyOf", "1"] }));
    return innerSchema
        ? {
            anyOf: [
                {
                    not: {},
                },
                innerSchema,
            ],
        }
        : {};
};
exports.parseOptionalDef = parseOptionalDef;
