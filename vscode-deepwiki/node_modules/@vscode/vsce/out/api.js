"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishVSIX = exports.listFiles = exports.publish = exports.createVSIX = exports.PackageManager = void 0;
const publish_1 = require("./publish");
const package_1 = require("./package");
/**
 * The supported list of package managers.
 * @public
 */
var PackageManager;
(function (PackageManager) {
    PackageManager[PackageManager["Npm"] = 0] = "Npm";
    PackageManager[PackageManager["Yarn"] = 1] = "Yarn";
    PackageManager[PackageManager["None"] = 2] = "None";
})(PackageManager = exports.PackageManager || (exports.PackageManager = {}));
/**
 * Creates a VSIX from the extension in the current working directory.
 * @public
 */
function createVSIX(options = {}) {
    return (0, package_1.packageCommand)(options);
}
exports.createVSIX = createVSIX;
/**
 * Publishes the extension in the current working directory.
 * @public
 */
function publish(options = {}) {
    return (0, publish_1.publish)(options);
}
exports.publish = publish;
/**
 * Lists the files included in the extension's package.
 * @public
 */
function listFiles(options = {}) {
    return (0, package_1.listFiles)({
        ...options,
        useYarn: options.packageManager === PackageManager.Yarn,
        dependencies: options.packageManager !== PackageManager.None,
    });
}
exports.listFiles = listFiles;
/**
 * Publishes a pre-build VSIX.
 * @public
 */
function publishVSIX(packagePath, options = {}) {
    return (0, publish_1.publish)({
        packagePath: typeof packagePath === 'string' ? [packagePath] : packagePath,
        ...options,
        targets: typeof options.target === 'string' ? [options.target] : undefined,
        ...{ target: undefined },
    });
}
exports.publishVSIX = publishVSIX;
//# sourceMappingURL=api.js.map