"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setResponseValueAndErrors = exports.addErrorMessage = void 0;
function addErrorMessage(res, key, errorMessage, refs) {
    if (!(refs === null || refs === void 0 ? void 0 : refs.errorMessages))
        return;
    if (errorMessage) {
        res.errorMessage = Object.assign(Object.assign({}, res.errorMessage), { [key]: errorMessage });
    }
}
exports.addErrorMessage = addErrorMessage;
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
    res[key] = value;
    addErrorMessage(res, key, errorMessage, refs);
}
exports.setResponseValueAndErrors = setResponseValueAndErrors;
