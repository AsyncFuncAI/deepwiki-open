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
const commander_1 = __importDefault(require("commander"));
const leven_1 = __importDefault(require("leven"));
const package_1 = require("./package");
const publish_1 = require("./publish");
const show_1 = require("./show");
const search_1 = require("./search");
const store_1 = require("./store");
const npm_1 = require("./npm");
const util_1 = require("./util");
const semver = __importStar(require("semver"));
const tty_1 = require("tty");
const pkg = require('../package.json');
function fatal(message, ...args) {
    if (message instanceof Error) {
        message = message.message;
        if (/^cancell?ed$/i.test(message)) {
            return;
        }
    }
    util_1.log.error(message, ...args);
    if (/Unauthorized\(401\)/.test(message)) {
        util_1.log.error(`Be sure to use a Personal Access Token which has access to **all accessible accounts**.
See https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions for more information.`);
    }
    process.exit(1);
}
function main(task) {
    let latestVersion = null;
    const token = new util_1.CancellationToken();
    if ((0, tty_1.isatty)(1)) {
        (0, npm_1.getLatestVersion)(pkg.name, token)
            .then(version => (latestVersion = version))
            .catch(_ => {
            /* noop */
        });
    }
    task.catch(fatal).then(() => {
        if (latestVersion && semver.gt(latestVersion, pkg.version)) {
            util_1.log.info(`The latest version of ${pkg.name} is ${latestVersion} and you have ${pkg.version}.\nUpdate it now: npm install -g ${pkg.name}`);
        }
        else {
            token.cancel();
        }
    });
}
const ValidTargets = [...package_1.Targets].join(', ');
module.exports = function (argv) {
    commander_1.default.version(pkg.version).usage('<command>');
    commander_1.default
        .command('ls')
        .description('Lists all the files that will be published/packaged')
        .option('--tree', 'Prints the files in a tree format', false)
        .option('--yarn', 'Use yarn instead of npm (default inferred from presence of yarn.lock or .yarnrc)')
        .option('--no-yarn', 'Use npm instead of yarn (default inferred from absence of yarn.lock or .yarnrc)')
        .option('--packagedDependencies <path>', 'Select packages that should be published only (includes dependencies)', (val, all) => (all ? all.concat(val) : [val]), undefined)
        .option('--ignoreFile <path>', 'Indicate alternative .vscodeignore')
        // default must remain undefined for dependencies or we will fail to load defaults from package.json
        .option('--dependencies', 'Enable dependency detection via npm or yarn', undefined)
        .option('--no-dependencies', 'Disable dependency detection via npm or yarn', undefined)
        .option('--readme-path <path>', 'Path to README file (defaults to README.md)')
        .action(({ tree, yarn, packagedDependencies, ignoreFile, dependencies, readmePath }) => main((0, package_1.ls)({ tree, useYarn: yarn, packagedDependencies, ignoreFile, dependencies, readmePath })));
    commander_1.default
        .command('package [version]')
        .alias('pack')
        .description('Packages an extension')
        .option('-o, --out <path>', 'Output .vsix extension file to <path> location (defaults to <name>-<version>.vsix)')
        .option('-t, --target <target>', `Target architecture. Valid targets: ${ValidTargets}`)
        .option('--ignore-other-target-folders', `Ignore other target folders. Valid only when --target <target> is provided.`)
        .option('--readme-path <path>', 'Path to README file (defaults to README.md)')
        .option('--changelog-path <path>', 'Path to CHANGELOG file (defaults to CHANGELOG.md)')
        .option('-m, --message <commit message>', 'Commit message used when calling `npm version`.')
        .option('--no-git-tag-version', 'Do not create a version commit and tag when calling `npm version`. Valid only when [version] is provided.')
        .option('--no-update-package-json', 'Do not update `package.json`. Valid only when [version] is provided.')
        .option('--githubBranch <branch>', 'The GitHub branch used to infer relative links in README.md. Can be overridden by --baseContentUrl and --baseImagesUrl.')
        .option('--gitlabBranch <branch>', 'The GitLab branch used to infer relative links in README.md. Can be overridden by --baseContentUrl and --baseImagesUrl.')
        .option('--no-rewrite-relative-links', 'Skip rewriting relative links.')
        .option('--baseContentUrl <url>', 'Prepend all relative links in README.md with the specified URL.')
        .option('--baseImagesUrl <url>', 'Prepend all relative image links in README.md with the specified URL.')
        .option('--yarn', 'Use yarn instead of npm (default inferred from presence of yarn.lock or .yarnrc)')
        .option('--no-yarn', 'Use npm instead of yarn (default inferred from absence of yarn.lock or .yarnrc)')
        .option('--ignoreFile <path>', 'Indicate alternative .vscodeignore')
        .option('--no-gitHubIssueLinking', 'Disable automatic expansion of GitHub-style issue syntax into links')
        .option('--no-gitLabIssueLinking', 'Disable automatic expansion of GitLab-style issue syntax into links')
        // default must remain undefined for dependencies or we will fail to load defaults from package.json
        .option('--dependencies', 'Enable dependency detection via npm or yarn', undefined)
        .option('--no-dependencies', 'Disable dependency detection via npm or yarn', undefined)
        .option('--pre-release', 'Mark this package as a pre-release')
        .option('--allow-star-activation', 'Allow using * in activation events')
        .option('--allow-missing-repository', 'Allow missing a repository URL in package.json')
        .option('--allow-unused-files-pattern', 'Allow include patterns for the files field in package.json that does not match any file')
        .option('--skip-license', 'Allow packaging without license file')
        .option('--sign-tool <path>', 'Path to the VSIX signing tool. Will be invoked with two arguments: `SIGNTOOL <path/to/extension.signature.manifest> <path/to/extension.signature.p7s>`.')
        .action((version, { out, target, ignoreOtherTargetFolders, readmePath, changelogPath, message, gitTagVersion, updatePackageJson, githubBranch, gitlabBranch, rewriteRelativeLinks, baseContentUrl, baseImagesUrl, yarn, ignoreFile, gitHubIssueLinking, gitLabIssueLinking, dependencies, preRelease, allowStarActivation, allowMissingRepository, allowUnusedFilesPattern, skipLicense, signTool, }) => main((0, package_1.packageCommand)({
        packagePath: out,
        version,
        target,
        ignoreOtherTargetFolders,
        readmePath,
        changelogPath,
        commitMessage: message,
        gitTagVersion,
        updatePackageJson,
        githubBranch,
        gitlabBranch,
        rewriteRelativeLinks,
        baseContentUrl,
        baseImagesUrl,
        useYarn: yarn,
        ignoreFile,
        gitHubIssueLinking,
        gitLabIssueLinking,
        dependencies,
        preRelease,
        allowStarActivation,
        allowMissingRepository,
        allowUnusedFilesPattern,
        skipLicense,
        signTool,
    })));
    commander_1.default
        .command('publish [version]')
        .description('Publishes an extension')
        .option('-p, --pat <token>', 'Personal Access Token (defaults to VSCE_PAT environment variable)', process.env['VSCE_PAT'])
        .option('--azure-credential', 'Use Microsoft Entra ID for authentication')
        .option('-t, --target <targets...>', `Target architectures. Valid targets: ${ValidTargets}`)
        .option('--ignore-other-target-folders', `Ignore other target folders. Valid only when --target <target> is provided.`)
        .option('--readme-path <path>', 'Path to README file (defaults to README.md)')
        .option('--changelog-path <path>', 'Path to CHANGELOG file (defaults to CHANGELOG.md)')
        .option('-m, --message <commit message>', 'Commit message used when calling `npm version`.')
        .option('--no-git-tag-version', 'Do not create a version commit and tag when calling `npm version`. Valid only when [version] is provided.')
        .option('--no-update-package-json', 'Do not update `package.json`. Valid only when [version] is provided.')
        .option('-i, --packagePath <paths...>', 'Publish the provided VSIX packages.')
        .option('--manifestPath <paths...>', 'Manifest files to publish alongside the VSIX packages.')
        .option('--signaturePath <paths...>', 'Signature files to publish alongside the VSIX packages.')
        .option('--sigzipPath <paths...>', 'Signature archives to publish alongside the VSIX packages.')
        .option('--sign-tool <path>', 'Path to the VSIX signing tool. Will be invoked with two arguments: `SIGNTOOL <path/to/extension.signature.manifest> <path/to/extension.signature.p7s>`. This will be ignored if --sigzipPath is provided.')
        .option('--githubBranch <branch>', 'The GitHub branch used to infer relative links in README.md. Can be overridden by --baseContentUrl and --baseImagesUrl.')
        .option('--gitlabBranch <branch>', 'The GitLab branch used to infer relative links in README.md. Can be overridden by --baseContentUrl and --baseImagesUrl.')
        .option('--baseContentUrl <url>', 'Prepend all relative links in README.md with the specified URL.')
        .option('--baseImagesUrl <url>', 'Prepend all relative image links in README.md with the specified URL.')
        .option('--yarn', 'Use yarn instead of npm (default inferred from presence of yarn.lock or .yarnrc)')
        .option('--no-yarn', 'Use npm instead of yarn (default inferred from absence of yarn.lock or .yarnrc)')
        .option('--noVerify', 'Allow all proposed APIs (deprecated: use --allow-all-proposed-apis instead)')
        .option('--allow-proposed-apis <apis...>', 'Allow specific proposed APIs')
        .option('--allow-all-proposed-apis', 'Allow all proposed APIs')
        .option('--ignoreFile <path>', 'Indicate alternative .vscodeignore')
        // default must remain undefined for dependencies or we will fail to load defaults from package.json
        .option('--dependencies', 'Enable dependency detection via npm or yarn', undefined)
        .option('--no-dependencies', 'Disable dependency detection via npm or yarn', undefined)
        .option('--pre-release', 'Mark this package as a pre-release')
        .option('--allow-star-activation', 'Allow using * in activation events')
        .option('--allow-missing-repository', 'Allow missing a repository URL in package.json')
        .option('--allow-unused-files-pattern', 'Allow include patterns for the files field in package.json that does not match any file')
        .option('--skip-duplicate', 'Fail silently if version already exists on the marketplace')
        .option('--skip-license', 'Allow publishing without license file')
        .action((version, { pat, azureCredential, target, ignoreOtherTargetFolders, readmePath, changelogPath, message, gitTagVersion, updatePackageJson, packagePath, manifestPath, signaturePath, sigzipPath, githubBranch, gitlabBranch, baseContentUrl, baseImagesUrl, yarn, noVerify, allowProposedApis, allowAllProposedApis, ignoreFile, dependencies, preRelease, allowStarActivation, allowMissingRepository, allowUnusedFilesPattern, skipDuplicate, skipLicense, signTool, }) => main((0, publish_1.publish)({
        pat,
        azureCredential,
        version,
        targets: target,
        ignoreOtherTargetFolders,
        readmePath,
        changelogPath,
        commitMessage: message,
        gitTagVersion,
        updatePackageJson,
        packagePath,
        manifestPath,
        signaturePath,
        sigzipPath,
        githubBranch,
        gitlabBranch,
        baseContentUrl,
        baseImagesUrl,
        useYarn: yarn,
        noVerify,
        allowProposedApis,
        allowAllProposedApis,
        ignoreFile,
        dependencies,
        preRelease,
        allowStarActivation,
        allowMissingRepository,
        allowUnusedFilesPattern,
        skipDuplicate,
        skipLicense,
        signTool
    })));
    commander_1.default
        .command('unpublish [extensionid]')
        .description('Unpublishes an extension. Example extension id: ms-vscode.live-server.')
        .option('-p, --pat <token>', 'Personal Access Token')
        .option('--azure-credential', 'Use Microsoft Entra ID for authentication')
        .option('-f, --force', 'Skip confirmation prompt when unpublishing an extension')
        .action((id, { pat, azureCredential, force }) => main((0, publish_1.unpublish)({ id, pat, azureCredential, force })));
    commander_1.default
        .command('generate-manifest')
        .description('Generates the extension manifest from the provided VSIX package.')
        .requiredOption('-i, --packagePath <path>', 'Path to the VSIX package')
        .option('-o, --out <path>', 'Output the extension manifest to <path> location (defaults to <packagename>.manifest)')
        .action(({ packagePath, out }) => main((0, package_1.generateManifest)(packagePath, out)));
    commander_1.default
        .command('ls-publishers')
        .description('Lists all known publishers')
        .action(() => main((0, store_1.listPublishers)()));
    commander_1.default
        .command('delete-publisher <publisher>')
        .description('Deletes a publisher from marketplace')
        .action(publisher => main((0, store_1.deletePublisher)(publisher)));
    commander_1.default
        .command('login <publisher>')
        .description('Adds a publisher to the list of known publishers')
        .action(name => main((0, store_1.loginPublisher)(name)));
    commander_1.default
        .command('logout <publisher>')
        .description('Removes a publisher from the list of known publishers')
        .action(name => main((0, store_1.logoutPublisher)(name)));
    commander_1.default
        .command('verify-pat [publisher]')
        .description('Verifies if the Personal Access Token or Azure identity has publish rights for the publisher')
        .option('-p, --pat <token>', 'Personal Access Token (defaults to VSCE_PAT environment variable)', process.env['VSCE_PAT'])
        .option('--azure-credential', 'Use Microsoft Entra ID for authentication')
        .action((publisherName, { pat, azureCredential }) => main((0, store_1.verifyPat)({ publisherName, pat, azureCredential })));
    commander_1.default
        .command('show <extensionid>')
        .description(`Shows an extension's metadata`)
        .option('--json', 'Outputs data in json format', false)
        .action((extensionid, { json }) => main((0, show_1.show)(extensionid, json)));
    commander_1.default
        .command('search <text>')
        .description('Searches extension gallery')
        .option('--json', 'Output results in json format', false)
        .option('--stats', 'Shows extensions rating and download count', false)
        .option('-p, --pagesize [value]', 'Number of results to return', '100')
        .action((text, { json, pagesize, stats }) => main((0, search_1.search)(text, json, parseInt(pagesize), stats)));
    commander_1.default.on('command:*', ([cmd]) => {
        if (cmd === 'create-publisher') {
            util_1.log.error(`The 'create-publisher' command is no longer available. You can create a publisher directly in the Marketplace: https://aka.ms/vscode-create-publisher`);
            process.exit(1);
        }
        commander_1.default.outputHelp(help => {
            const availableCommands = commander_1.default.commands.map(c => c._name);
            const suggestion = availableCommands.find(c => (0, leven_1.default)(c, cmd) < c.length * 0.4);
            help = `${help}\n Unknown command '${cmd}'`;
            return suggestion ? `${help}, did you mean '${suggestion}'?\n` : `${help}.\n`;
        });
        process.exit(1);
    });
    commander_1.default.description(`${pkg.description}
To learn more about the VS Code extension API: https://aka.ms/vscode-extension-api
To connect with the VS Code extension developer community: https://aka.ms/vscode-discussions`);
    commander_1.default.parse(argv);
};
//# sourceMappingURL=main.js.map