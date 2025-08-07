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
exports.printAndValidatePackagedFiles = exports.ls = exports.listFiles = exports.packageCommand = exports.createSignatureArchive = exports.generateManifest = exports.signPackage = exports.pack = exports.prepublish = exports.collect = exports.createDefaultProcessors = exports.processFiles = exports.toContentTypes = exports.toVsixManifest = exports.readManifest = exports.validateManifest = exports.ValidationProcessor = exports.NLSProcessor = exports.isWebKind = exports.LicenseProcessor = exports.ChangelogProcessor = exports.ReadmeProcessor = exports.MarkdownProcessor = exports.TagsProcessor = exports.ManifestProcessor = exports.Targets = exports.versionBump = exports.BaseProcessor = exports.read = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const cp = __importStar(require("child_process"));
const yazl = __importStar(require("yazl"));
const nls_1 = require("./nls");
const util = __importStar(require("./util"));
const glob_1 = __importDefault(require("glob"));
const minimatch_1 = __importDefault(require("minimatch"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const cheerio = __importStar(require("cheerio"));
const url = __importStar(require("url"));
const mime_1 = __importDefault(require("mime"));
const semver = __importStar(require("semver"));
const url_join_1 = __importDefault(require("url-join"));
const chalk_1 = __importDefault(require("chalk"));
const validation_1 = require("./validation");
const npm_1 = require("./npm");
const GitHost = __importStar(require("hosted-git-info"));
const parse_semver_1 = __importDefault(require("parse-semver"));
const jsonc = __importStar(require("jsonc-parser"));
const vsceSign = __importStar(require("@vscode/vsce-sign"));
const MinimatchOptions = { dot: true };
function isInMemoryFile(file) {
    return !!file.contents;
}
function read(file) {
    if (isInMemoryFile(file)) {
        return Promise.resolve(file.contents).then(b => (typeof b === 'string' ? b : b.toString('utf8')));
    }
    else {
        return fs.promises.readFile(file.localPath, 'utf8');
    }
}
exports.read = read;
class BaseProcessor {
    constructor(manifest) {
        this.manifest = manifest;
        this.assets = [];
        this.tags = [];
        this.vsix = Object.create(null);
    }
    async onFile(file) {
        return file;
    }
    async onEnd() {
        // noop
    }
}
exports.BaseProcessor = BaseProcessor;
// https://github.com/npm/cli/blob/latest/lib/utils/hosted-git-info-from-manifest.js
function getGitHost(manifest) {
    const url = getRepositoryUrl(manifest);
    return url ? GitHost.fromUrl(url, { noGitPlus: true }) : undefined;
}
// https://github.com/npm/cli/blob/latest/lib/repo.js
function getRepositoryUrl(manifest, gitHost) {
    if (gitHost) {
        return gitHost.https();
    }
    let url = undefined;
    if (manifest.repository) {
        if (typeof manifest.repository === 'string') {
            url = manifest.repository;
        }
        else if (typeof manifest.repository === 'object' &&
            manifest.repository.url &&
            typeof manifest.repository.url === 'string') {
            url = manifest.repository.url;
        }
    }
    return url;
}
// https://github.com/npm/cli/blob/latest/lib/bugs.js
function getBugsUrl(manifest, gitHost) {
    if (manifest.bugs) {
        if (typeof manifest.bugs === 'string') {
            return manifest.bugs;
        }
        if (typeof manifest.bugs === 'object' && manifest.bugs.url) {
            return manifest.bugs.url;
        }
        if (typeof manifest.bugs === 'object' && manifest.bugs.email) {
            return `mailto:${manifest.bugs.email}`;
        }
    }
    if (gitHost) {
        return gitHost.bugs();
    }
    return undefined;
}
// https://github.com/npm/cli/blob/latest/lib/docs.js
function getHomepageUrl(manifest, gitHost) {
    if (manifest.homepage) {
        return manifest.homepage;
    }
    if (gitHost) {
        return gitHost.docs();
    }
    return undefined;
}
// Contributed by Mozilla developer authors
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function toExtensionTags(extensions) {
    return extensions
        .map(s => s.replace(/\W/g, ''))
        .filter(s => !!s)
        .map(s => `__ext_${s}`);
}
function toLanguagePackTags(translations, languageId) {
    return (translations ?? [])
        .map(({ id }) => [`__lp_${id}`, `__lp-${languageId}_${id}`])
        .reduce((r, t) => [...r, ...t], []);
}
/* This list is also maintained by the Marketplace team.
 * Remember to reach out to them when adding new domains.
 */
const TrustedSVGSources = [
    'api.bintray.com',
    'api.travis-ci.com',
    'api.travis-ci.org',
    'app.fossa.io',
    'badge.buildkite.com',
    'badge.fury.io',
    'badge.waffle.io',
    'badgen.net',
    'badges.frapsoft.com',
    'badges.gitter.im',
    'badges.greenkeeper.io',
    'cdn.travis-ci.com',
    'cdn.travis-ci.org',
    'ci.appveyor.com',
    'circleci.com',
    'cla.opensource.microsoft.com',
    'codacy.com',
    'codeclimate.com',
    'codecov.io',
    'coveralls.io',
    'david-dm.org',
    'deepscan.io',
    'dev.azure.com',
    'docs.rs',
    'flat.badgen.net',
    'gemnasium.com',
    'githost.io',
    'gitlab.com',
    'godoc.org',
    'goreportcard.com',
    'img.shields.io',
    'isitmaintained.com',
    'marketplace.visualstudio.com',
    'nodesecurity.io',
    'opencollective.com',
    'snyk.io',
    'travis-ci.com',
    'travis-ci.org',
    'visualstudio.com',
    'vsmarketplacebadges.dev',
    'www.bithound.io',
    'www.versioneye.com',
];
function isGitHubRepository(repository) {
    return /^https:\/\/github\.com\/|^git@github\.com:/.test(repository ?? '');
}
function isGitLabRepository(repository) {
    return /^https:\/\/gitlab\.com\/|^git@gitlab\.com:/.test(repository ?? '');
}
function isGitHubBadge(href) {
    return /^https:\/\/github\.com\/[^/]+\/[^/]+\/(actions\/)?workflows\/.*badge\.svg/.test(href || '');
}
function isHostTrusted(url) {
    return (url.host && TrustedSVGSources.indexOf(url.host.toLowerCase()) > -1) || isGitHubBadge(url.href);
}
async function versionBump(options) {
    if (!options.version) {
        return;
    }
    if (!(options.updatePackageJson ?? true)) {
        return;
    }
    const cwd = options.cwd ?? process.cwd();
    const manifest = await readManifest(cwd);
    if (manifest.version === options.version) {
        return;
    }
    switch (options.version) {
        case 'major':
        case 'minor':
        case 'patch':
            break;
        case 'premajor':
        case 'preminor':
        case 'prepatch':
        case 'prerelease':
        case 'from-git':
            return Promise.reject(`Not supported: ${options.version}`);
        default:
            if (!semver.valid(options.version)) {
                return Promise.reject(`Invalid version ${options.version}`);
            }
    }
    // call `npm version` to do our dirty work
    const args = ['version', options.version];
    const isWindows = process.platform === 'win32';
    const commitMessage = isWindows ? sanitizeCommitMessage(options.commitMessage) : options.commitMessage;
    if (commitMessage) {
        args.push('-m', commitMessage);
    }
    if (!(options.gitTagVersion ?? true)) {
        args.push('--no-git-tag-version');
    }
    const { stdout, stderr } = await (0, util_1.promisify)(cp.execFile)(isWindows ? 'npm.cmd' : 'npm', args, { cwd, shell: isWindows /* https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2 */ });
    if (!process.env['VSCE_TESTS']) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
    }
}
exports.versionBump = versionBump;
function sanitizeCommitMessage(message) {
    if (!message) {
        return undefined;
    }
    // Remove any unsafe characters found by the unsafeRegex
    // Check for characters that might escape quotes or introduce shell commands.
    // Don't allow: ', ", `, $, \ (except for \n which is allowed)
    const sanitizedMessage = message.replace(/(?<!\\)\\(?!n)|['"`$]/g, '');
    if (sanitizedMessage.length === 0) {
        return undefined;
    }
    // Add quotes as commit message is passed as a single argument to the shell
    return `"${sanitizedMessage}"`;
}
exports.Targets = new Set([
    'win32-x64',
    'win32-arm64',
    'linux-x64',
    'linux-arm64',
    'linux-armhf',
    'darwin-x64',
    'darwin-arm64',
    'alpine-x64',
    'alpine-arm64',
    'web',
]);
class ManifestProcessor extends BaseProcessor {
    constructor(manifest, options = {}) {
        super(manifest);
        this.options = options;
        const flags = ['Public'];
        if (manifest.preview) {
            flags.push('Preview');
        }
        const gitHost = getGitHost(manifest);
        const repository = getRepositoryUrl(manifest, gitHost);
        const isGitHub = isGitHubRepository(repository);
        let enableMarketplaceQnA;
        let customerQnALink;
        if (manifest.qna === 'marketplace') {
            enableMarketplaceQnA = true;
        }
        else if (typeof manifest.qna === 'string') {
            customerQnALink = manifest.qna;
        }
        else if (manifest.qna === false) {
            enableMarketplaceQnA = false;
        }
        const extensionKind = getExtensionKind(manifest);
        const target = options.target;
        const preRelease = options.preRelease;
        if (target || preRelease) {
            let engineVersion;
            try {
                const engineSemver = (0, parse_semver_1.default)(`vscode@${manifest.engines['vscode']}`);
                engineVersion = engineSemver.version;
            }
            catch (err) {
                throw new Error('Failed to parse semver of engines.vscode');
            }
            if (target) {
                if (engineVersion !== 'latest' && !semver.satisfies(engineVersion, '>=1.61', { includePrerelease: true })) {
                    throw new Error(`Platform specific extension is supported by VS Code >=1.61. Current 'engines.vscode' is '${manifest.engines['vscode']}'.`);
                }
                if (!exports.Targets.has(target)) {
                    throw new Error(`'${target}' is not a valid VS Code target. Valid targets: ${[...exports.Targets].join(', ')}`);
                }
            }
            if (preRelease) {
                if (engineVersion !== 'latest' && !semver.satisfies(engineVersion, '>=1.63', { includePrerelease: true })) {
                    throw new Error(`Pre-release versions are supported by VS Code >=1.63. Current 'engines.vscode' is '${manifest.engines['vscode']}'.`);
                }
            }
        }
        this.vsix = {
            ...this.vsix,
            id: manifest.name,
            displayName: manifest.displayName ?? manifest.name,
            version: options.version && !(options.updatePackageJson ?? true) ? options.version : manifest.version,
            publisher: manifest.publisher,
            target,
            engine: manifest.engines['vscode'],
            description: manifest.description ?? '',
            pricing: manifest.pricing ?? 'Free',
            categories: (manifest.categories ?? []).join(','),
            flags: flags.join(' '),
            links: {
                repository,
                bugs: getBugsUrl(manifest, gitHost),
                homepage: getHomepageUrl(manifest, gitHost),
            },
            galleryBanner: manifest.galleryBanner ?? {},
            badges: manifest.badges,
            githubMarkdown: manifest.markdown !== 'standard',
            enableMarketplaceQnA,
            customerQnALink,
            extensionDependencies: [...new Set(manifest.extensionDependencies ?? [])].join(','),
            extensionPack: [...new Set(manifest.extensionPack ?? [])].join(','),
            extensionKind: extensionKind.join(','),
            localizedLanguages: manifest.contributes && manifest.contributes.localizations
                ? manifest.contributes.localizations
                    .map(loc => loc.localizedLanguageName ?? loc.languageName ?? loc.languageId)
                    .join(',')
                : '',
            enabledApiProposals: manifest.enabledApiProposals ? manifest.enabledApiProposals.join(',') : '',
            preRelease: !!this.options.preRelease,
            executesCode: !!(manifest.main ?? manifest.browser),
            sponsorLink: manifest.sponsor?.url || '',
        };
        if (isGitHub) {
            this.vsix.links.github = repository;
        }
    }
    async onFile(file) {
        const path = util.normalize(file.path);
        if (!/^extension\/package.json$/i.test(path)) {
            return Promise.resolve(file);
        }
        if (this.options.version && !(this.options.updatePackageJson ?? true)) {
            const contents = await read(file);
            const packageJson = JSON.parse(contents);
            packageJson.version = this.options.version;
            file = { ...file, contents: JSON.stringify(packageJson, undefined, 2) };
        }
        // Ensure that package.json is writable as VS Code needs to
        // store metadata in the extracted file.
        return { ...file, mode: 0o100644 };
    }
    async onEnd() {
        if (typeof this.manifest.extensionKind === 'string') {
            util.log.warn(`The 'extensionKind' property should be of type 'string[]'. Learn more at: https://aka.ms/vscode/api/incorrect-execution-location`);
        }
        if (this.manifest.publisher === 'vscode-samples') {
            throw new Error("It's not allowed to use the 'vscode-samples' publisher. Learn more at: https://code.visualstudio.com/api/working-with-extensions/publishing-extension.");
        }
        if (!this.options.allowMissingRepository && !this.manifest.repository) {
            util.log.warn(`A 'repository' field is missing from the 'package.json' manifest file.\nUse --allow-missing-repository to bypass.`);
            if (!/^y$/i.test(await util.read('Do you want to continue? [y/N] '))) {
                throw new Error('Aborted');
            }
        }
        if (!this.options.allowStarActivation && this.manifest.activationEvents?.some(e => e === '*')) {
            let message = '';
            message += `Using '*' activation is usually a bad idea as it impacts performance.\n`;
            message += `More info: https://code.visualstudio.com/api/references/activation-events#Start-up\n`;
            message += `Use --allow-star-activation to bypass.`;
            util.log.warn(message);
            if (!/^y$/i.test(await util.read('Do you want to continue? [y/N] '))) {
                throw new Error('Aborted');
            }
        }
    }
}
exports.ManifestProcessor = ManifestProcessor;
class TagsProcessor extends BaseProcessor {
    async onEnd() {
        const keywords = this.manifest.keywords ?? [];
        const contributes = this.manifest.contributes;
        const activationEvents = this.manifest.activationEvents ?? [];
        const doesContribute = (...properties) => {
            let obj = contributes;
            for (const property of properties) {
                if (!obj) {
                    return false;
                }
                obj = obj[property];
            }
            return obj && obj.length > 0;
        };
        const colorThemes = doesContribute('themes') ? ['theme', 'color-theme'] : [];
        const iconThemes = doesContribute('iconThemes') ? ['theme', 'icon-theme'] : [];
        const productIconThemes = doesContribute('productIconThemes') ? ['theme', 'product-icon-theme'] : [];
        const snippets = doesContribute('snippets') ? ['snippet'] : [];
        const keybindings = doesContribute('keybindings') ? ['keybindings'] : [];
        const debuggers = doesContribute('debuggers') ? ['debuggers'] : [];
        const json = doesContribute('jsonValidation') ? ['json'] : [];
        const remoteMenu = doesContribute('menus', 'statusBar/remoteIndicator') ? ['remote-menu'] : [];
        const localizationContributions = ((contributes && contributes['localizations']) ?? []).reduce((r, l) => [...r, `lp-${l.languageId}`, ...toLanguagePackTags(l.translations, l.languageId)], []);
        const languageContributions = ((contributes && contributes['languages']) ?? []).reduce((r, l) => [...r, l.id, ...(l.aliases ?? []), ...toExtensionTags(l.extensions ?? [])], []);
        const languageActivations = activationEvents
            .map(e => /^onLanguage:(.*)$/.exec(e))
            .filter(util.nonnull)
            .map(r => r[1]);
        const grammars = ((contributes && contributes['grammars']) ?? []).map(g => g.language);
        const description = this.manifest.description || '';
        const descriptionKeywords = Object.keys(TagsProcessor.Keywords).reduce((r, k) => r.concat(new RegExp('\\b(?:' + escapeRegExp(k) + ')(?!\\w)', 'gi').test(description) ? TagsProcessor.Keywords[k] : []), []);
        const webExtensionTags = isWebKind(this.manifest) ? ['__web_extension'] : [];
        const sponsorTags = this.manifest.sponsor?.url ? ['__sponsor_extension'] : [];
        const tags = new Set([
            ...keywords,
            ...colorThemes,
            ...iconThemes,
            ...productIconThemes,
            ...snippets,
            ...keybindings,
            ...debuggers,
            ...json,
            ...remoteMenu,
            ...localizationContributions,
            ...languageContributions,
            ...languageActivations,
            ...grammars,
            ...descriptionKeywords,
            ...webExtensionTags,
            ...sponsorTags,
        ]);
        this.tags = [...tags].filter(tag => !!tag);
    }
}
exports.TagsProcessor = TagsProcessor;
TagsProcessor.Keywords = {
    git: ['git'],
    npm: ['node'],
    spell: ['markdown'],
    bootstrap: ['bootstrap'],
    lint: ['linters'],
    linting: ['linters'],
    react: ['javascript'],
    js: ['javascript'],
    node: ['javascript', 'node'],
    'c++': ['c++'],
    Cplusplus: ['c++'],
    xml: ['xml'],
    angular: ['javascript'],
    jquery: ['javascript'],
    php: ['php'],
    python: ['python'],
    latex: ['latex'],
    ruby: ['ruby'],
    java: ['java'],
    erlang: ['erlang'],
    sql: ['sql'],
    nodejs: ['node'],
    'c#': ['c#'],
    css: ['css'],
    javascript: ['javascript'],
    ftp: ['ftp'],
    haskell: ['haskell'],
    unity: ['unity'],
    terminal: ['terminal'],
    powershell: ['powershell'],
    laravel: ['laravel'],
    meteor: ['meteor'],
    emmet: ['emmet'],
    eslint: ['linters'],
    tfs: ['tfs'],
    rust: ['rust'],
};
class MarkdownProcessor extends BaseProcessor {
    constructor(manifest, name, filePath, assetType, options = {}) {
        super(manifest);
        this.name = name;
        this.assetType = assetType;
        this.options = options;
        this.filesProcessed = 0;
        this.regexp = new RegExp(`^${util.filePathToVsixPath(filePath)}$`, 'i');
        const guess = this.guessBaseUrls(options.githubBranch || options.gitlabBranch);
        this.baseContentUrl = options.baseContentUrl || (guess && guess.content);
        this.baseImagesUrl = options.baseImagesUrl || options.baseContentUrl || (guess && guess.images);
        this.rewriteRelativeLinks = options.rewriteRelativeLinks ?? true;
        this.repositoryUrl = guess && guess.repository;
        this.isGitHub = isGitHubRepository(this.repositoryUrl);
        this.isGitLab = isGitLabRepository(this.repositoryUrl);
        this.gitHubIssueLinking = typeof options.gitHubIssueLinking === 'boolean' ? options.gitHubIssueLinking : true;
        this.gitLabIssueLinking = typeof options.gitLabIssueLinking === 'boolean' ? options.gitLabIssueLinking : true;
    }
    async onFile(file) {
        const filePath = util.normalize(file.path);
        if (!this.regexp.test(filePath)) {
            return Promise.resolve(file);
        }
        this.filesProcessed++;
        this.assets.push({ type: this.assetType, path: filePath });
        let contents = await read(file);
        if (/This is the README for your extension /.test(contents)) {
            throw new Error(`It seems the README.md still contains template text. Make sure to edit the README.md file before you package or publish your extension.`);
        }
        if (this.rewriteRelativeLinks) {
            const markdownPathRegex = /(!?)\[([^\]\[]*|!\[[^\]\[]*]\([^\)]+\))\]\(([^\)]+)\)/g;
            const urlReplace = (_, isImage, title, link) => {
                if (/^mailto:/i.test(link)) {
                    return `${isImage}[${title}](${link})`;
                }
                const isLinkRelative = !/^\w+:\/\//.test(link) && link[0] !== '#';
                if (!this.baseContentUrl && !this.baseImagesUrl) {
                    const asset = isImage ? 'image' : 'link';
                    if (isLinkRelative) {
                        throw new Error(`Couldn't detect the repository where this extension is published. The ${asset} '${link}' will be broken in ${this.name}. GitHub/GitLab repositories will be automatically detected. Otherwise, please provide the repository URL in package.json or use the --baseContentUrl and --baseImagesUrl options.`);
                    }
                }
                title = title.replace(markdownPathRegex, urlReplace);
                const prefix = isImage ? this.baseImagesUrl : this.baseContentUrl;
                if (!prefix || !isLinkRelative) {
                    return `${isImage}[${title}](${link})`;
                }
                return `${isImage}[${title}](${(0, url_join_1.default)(prefix, path.posix.normalize(link))})`;
            };
            // Replace Markdown links with urls
            contents = contents.replace(markdownPathRegex, urlReplace);
            // Replace <img> links with urls
            contents = contents.replace(/<(?:img|video)[^>]+src=["']([/.\w\s#-]+)['"][^>]*>/gm, (all, link) => {
                const isLinkRelative = !/^\w+:\/\//.test(link) && link[0] !== '#' && !link.startsWith('data:');
                if (!this.baseImagesUrl && isLinkRelative) {
                    throw new Error(`Couldn't detect the repository where this extension is published. The image will be broken in ${this.name}. GitHub/GitLab repositories will be automatically detected. Otherwise, please provide the repository URL in package.json or use the --baseContentUrl and --baseImagesUrl options.`);
                }
                const prefix = this.baseImagesUrl;
                if (!prefix || !isLinkRelative) {
                    return all;
                }
                return all.replace(link, (0, url_join_1.default)(prefix, path.posix.normalize(link)));
            });
            if ((this.gitHubIssueLinking && this.isGitHub) || (this.gitLabIssueLinking && this.isGitLab)) {
                const markdownIssueRegex = /(\s|\n)([\w\d_-]+\/[\w\d_-]+)?#(\d+)\b/g;
                const issueReplace = (all, prefix, ownerAndRepositoryName, issueNumber) => {
                    let result = all;
                    let owner;
                    let repositoryName;
                    if (ownerAndRepositoryName) {
                        [owner, repositoryName] = ownerAndRepositoryName.split('/', 2);
                    }
                    if (owner && repositoryName && issueNumber) {
                        // Issue in external repository
                        const issueUrl = this.isGitHub
                            ? (0, url_join_1.default)('https://github.com', owner, repositoryName, 'issues', issueNumber)
                            : (0, url_join_1.default)('https://gitlab.com', owner, repositoryName, '-', 'issues', issueNumber);
                        result = prefix + `[${owner}/${repositoryName}#${issueNumber}](${issueUrl})`;
                    }
                    else if (!owner && !repositoryName && issueNumber && this.repositoryUrl) {
                        // Issue in own repository
                        result =
                            prefix +
                                `[#${issueNumber}](${this.isGitHub
                                    ? (0, url_join_1.default)(this.repositoryUrl, 'issues', issueNumber)
                                    : (0, url_join_1.default)(this.repositoryUrl, '-', 'issues', issueNumber)})`;
                    }
                    return result;
                };
                // Replace Markdown issue references with urls
                contents = contents.replace(markdownIssueRegex, issueReplace);
            }
        }
        const html = (0, markdown_it_1.default)({ html: true }).render(contents);
        const $ = cheerio.load(html);
        if (this.rewriteRelativeLinks) {
            $('img').each((_, img) => {
                const rawSrc = $(img).attr('src');
                if (!rawSrc) {
                    throw new Error(`Images in ${this.name} must have a source.`);
                }
                const src = decodeURI(rawSrc);
                let srcUrl;
                try {
                    srcUrl = new url.URL(src);
                }
                catch (err) {
                    throw new Error(`Invalid image source in ${this.name}: ${src}`);
                }
                if (/^data:$/i.test(srcUrl.protocol) && /^image$/i.test(srcUrl.host) && /\/svg/i.test(srcUrl.pathname)) {
                    throw new Error(`SVG data URLs are not allowed in ${this.name}: ${src}`);
                }
                if (!/^https:$/i.test(srcUrl.protocol)) {
                    throw new Error(`Images in ${this.name} must come from an HTTPS source: ${src}`);
                }
                if (/\.svg$/i.test(srcUrl.pathname) && !isHostTrusted(srcUrl)) {
                    throw new Error(`SVGs are restricted in ${this.name}; please use other file image formats, such as PNG: ${src}`);
                }
            });
        }
        $('svg').each(() => {
            throw new Error(`SVG tags are not allowed in ${this.name}.`);
        });
        return {
            path: file.path,
            contents: Buffer.from(contents, 'utf8'),
        };
    }
    // GitHub heuristics
    guessBaseUrls(githostBranch) {
        let repository = null;
        if (typeof this.manifest.repository === 'string') {
            repository = this.manifest.repository;
        }
        else if (this.manifest.repository && typeof this.manifest.repository['url'] === 'string') {
            repository = this.manifest.repository['url'];
        }
        if (!repository) {
            return undefined;
        }
        const gitHubRegex = /(?<domain>github(\.com\/|:))(?<project>(?:[^/]+)\/(?:[^/]+))(\/|$)/;
        const gitLabRegex = /(?<domain>gitlab(\.com\/|:))(?<project>(?:[^/]+)(\/(?:[^/]+))+)(\/|$)/;
        const match = (gitHubRegex.exec(repository) || gitLabRegex.exec(repository));
        if (!match) {
            return undefined;
        }
        const project = match.groups.project.replace(/\.git$/i, '');
        const branchName = githostBranch ? githostBranch : 'HEAD';
        if (/^github/.test(match.groups.domain)) {
            return {
                content: `https://github.com/${project}/blob/${branchName}`,
                images: `https://github.com/${project}/raw/${branchName}`,
                repository: `https://github.com/${project}`,
            };
        }
        else if (/^gitlab/.test(match.groups.domain)) {
            return {
                content: `https://gitlab.com/${project}/-/blob/${branchName}`,
                images: `https://gitlab.com/${project}/-/raw/${branchName}`,
                repository: `https://gitlab.com/${project}`,
            };
        }
        return undefined;
    }
}
exports.MarkdownProcessor = MarkdownProcessor;
class ReadmeProcessor extends MarkdownProcessor {
    constructor(manifest, options = {}) {
        super(manifest, 'README.md', options.readmePath ?? 'readme.md', 'Microsoft.VisualStudio.Services.Content.Details', options);
    }
    async onEnd() {
        if (this.options.readmePath && this.filesProcessed === 0) {
            util.log.error(`The provided readme file (${this.options.readmePath}) could not be found.`);
            process.exit(1);
        }
    }
}
exports.ReadmeProcessor = ReadmeProcessor;
class ChangelogProcessor extends MarkdownProcessor {
    constructor(manifest, options = {}) {
        super(manifest, 'CHANGELOG.md', options.changelogPath ?? 'changelog.md', 'Microsoft.VisualStudio.Services.Content.Changelog', options);
    }
    async onEnd() {
        if (this.options.changelogPath && this.filesProcessed === 0) {
            util.log.error(`The provided changelog file (${this.options.changelogPath}) could not be found.`);
            process.exit(1);
        }
    }
}
exports.ChangelogProcessor = ChangelogProcessor;
class LicenseProcessor extends BaseProcessor {
    constructor(manifest, options = {}) {
        super(manifest);
        this.options = options;
        this.didFindLicense = false;
        const match = /^SEE LICENSE IN (.*)$/.exec(manifest.license || '');
        if (!match || !match[1]) {
            this.expectedLicenseName = 'LICENSE, LICENSE.md, or LICENSE.txt';
            this.filter = name => /^extension\/licen[cs]e(\.(md|txt))?$/i.test(name);
        }
        else {
            this.expectedLicenseName = match[1];
            const regexp = new RegExp(`^${util.filePathToVsixPath(match[1])}$`);
            this.filter = regexp.test.bind(regexp);
        }
        delete this.vsix.license;
    }
    onFile(file) {
        if (!this.didFindLicense) {
            let normalizedPath = util.normalize(file.path);
            if (this.filter(normalizedPath)) {
                if (!path.extname(normalizedPath)) {
                    file.path += '.txt';
                    normalizedPath += '.txt';
                }
                this.assets.push({ type: 'Microsoft.VisualStudio.Services.Content.License', path: normalizedPath });
                this.vsix.license = normalizedPath;
                this.didFindLicense = true;
            }
        }
        return Promise.resolve(file);
    }
    async onEnd() {
        if (!this.didFindLicense && !this.options.skipLicense) {
            util.log.warn(`${this.expectedLicenseName} not found`);
            if (!/^y$/i.test(await util.read('Do you want to continue? [y/N] '))) {
                throw new Error('Aborted');
            }
        }
    }
}
exports.LicenseProcessor = LicenseProcessor;
class LaunchEntryPointProcessor extends BaseProcessor {
    constructor(manifest) {
        super(manifest);
        this.entryPoints = new Set();
        if (manifest.main) {
            this.entryPoints.add(util.normalize(path.join('extension', this.appendJSExt(manifest.main))));
        }
        if (manifest.browser) {
            this.entryPoints.add(util.normalize(path.join('extension', this.appendJSExt(manifest.browser))));
        }
    }
    appendJSExt(filePath) {
        if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
            return filePath;
        }
        return filePath + '.js';
    }
    onFile(file) {
        this.entryPoints.delete(util.normalize(file.path));
        return Promise.resolve(file);
    }
    async onEnd() {
        if (this.entryPoints.size > 0) {
            const files = [...this.entryPoints].join(',\n  ');
            throw new Error(`Extension entrypoint(s) missing. Make sure these files exist and aren't ignored by '.vscodeignore':\n  ${files}`);
        }
    }
}
class IconProcessor extends BaseProcessor {
    constructor(manifest) {
        super(manifest);
        this.didFindIcon = false;
        this.icon = manifest.icon && path.posix.normalize(util.filePathToVsixPath(manifest.icon));
        delete this.vsix.icon;
    }
    onFile(file) {
        const normalizedPath = util.normalize(file.path);
        if (normalizedPath === this.icon) {
            this.didFindIcon = true;
            this.assets.push({ type: 'Microsoft.VisualStudio.Services.Icons.Default', path: normalizedPath });
            this.vsix.icon = this.icon;
        }
        return Promise.resolve(file);
    }
    async onEnd() {
        if (this.icon && !this.didFindIcon) {
            return Promise.reject(new Error(`The specified icon '${this.icon}' wasn't found in the extension.`));
        }
    }
}
const ValidExtensionKinds = new Set(['ui', 'workspace']);
function isWebKind(manifest) {
    const extensionKind = getExtensionKind(manifest);
    return extensionKind.some(kind => kind === 'web');
}
exports.isWebKind = isWebKind;
const extensionPointExtensionKindsMap = new Map();
extensionPointExtensionKindsMap.set('jsonValidation', ['workspace', 'web']);
extensionPointExtensionKindsMap.set('localizations', ['ui', 'workspace']);
extensionPointExtensionKindsMap.set('debuggers', ['workspace']);
extensionPointExtensionKindsMap.set('terminal', ['workspace']);
extensionPointExtensionKindsMap.set('typescriptServerPlugins', ['workspace']);
extensionPointExtensionKindsMap.set('markdown.previewStyles', ['workspace', 'web']);
extensionPointExtensionKindsMap.set('markdown.previewScripts', ['workspace', 'web']);
extensionPointExtensionKindsMap.set('markdown.markdownItPlugins', ['workspace', 'web']);
extensionPointExtensionKindsMap.set('html.customData', ['workspace', 'web']);
extensionPointExtensionKindsMap.set('css.customData', ['workspace', 'web']);
function getExtensionKind(manifest) {
    const deduced = deduceExtensionKinds(manifest);
    // check the manifest
    if (manifest.extensionKind) {
        const result = Array.isArray(manifest.extensionKind)
            ? manifest.extensionKind
            : manifest.extensionKind === 'ui'
                ? ['ui', 'workspace']
                : [manifest.extensionKind];
        // Add web kind if the extension can run as web extension
        if (deduced.includes('web') && !result.includes('web')) {
            result.push('web');
        }
        return result;
    }
    return deduced;
}
function deduceExtensionKinds(manifest) {
    // Not an UI extension if it has main
    if (manifest.main) {
        if (manifest.browser) {
            return ['workspace', 'web'];
        }
        return ['workspace'];
    }
    if (manifest.browser) {
        return ['web'];
    }
    let result = ['ui', 'workspace', 'web'];
    const isNonEmptyArray = (obj) => Array.isArray(obj) && obj.length > 0;
    // Extension pack defaults to workspace,web extensionKind
    if (isNonEmptyArray(manifest.extensionPack) || isNonEmptyArray(manifest.extensionDependencies)) {
        result = ['workspace', 'web'];
    }
    if (manifest.contributes) {
        for (const contribution of Object.keys(manifest.contributes)) {
            const supportedExtensionKinds = extensionPointExtensionKindsMap.get(contribution);
            if (supportedExtensionKinds) {
                result = result.filter(extensionKind => supportedExtensionKinds.indexOf(extensionKind) !== -1);
            }
        }
    }
    return result;
}
class NLSProcessor extends BaseProcessor {
    constructor(manifest) {
        super(manifest);
        this.translations = Object.create(null);
        if (!manifest.contributes ||
            !manifest.contributes.localizations ||
            manifest.contributes.localizations.length === 0) {
            return;
        }
        const localizations = manifest.contributes.localizations;
        const translations = Object.create(null);
        // take last reference in the manifest for any given language
        for (const localization of localizations) {
            for (const translation of localization.translations) {
                if (translation.id === 'vscode' && !!translation.path) {
                    const translationPath = util.normalize(translation.path.replace(/^\.[\/\\]/, ''));
                    translations[localization.languageId.toUpperCase()] = util.filePathToVsixPath(translationPath);
                }
            }
        }
        // invert the map for later easier retrieval
        for (const languageId of Object.keys(translations)) {
            this.translations[translations[languageId]] = languageId;
        }
    }
    onFile(file) {
        const normalizedPath = util.normalize(file.path);
        const language = this.translations[normalizedPath];
        if (language) {
            this.assets.push({ type: `Microsoft.VisualStudio.Code.Translation.${language}`, path: normalizedPath });
        }
        return Promise.resolve(file);
    }
}
exports.NLSProcessor = NLSProcessor;
class ValidationProcessor extends BaseProcessor {
    constructor() {
        super(...arguments);
        this.files = new Map();
        this.duplicates = new Set();
    }
    async onFile(file) {
        const lower = file.path.toLowerCase();
        const existing = this.files.get(lower);
        if (existing) {
            this.duplicates.add(lower);
            existing.push(file.path);
        }
        else {
            this.files.set(lower, [file.path]);
        }
        return file;
    }
    async onEnd() {
        if (this.duplicates.size === 0) {
            return;
        }
        const messages = [
            `The following files have the same case insensitive path, which isn't supported by the VSIX format:`,
        ];
        for (const lower of this.duplicates) {
            for (const filePath of this.files.get(lower)) {
                messages.push(`  - ${filePath}`);
            }
        }
        throw new Error(messages.join('\n'));
    }
}
exports.ValidationProcessor = ValidationProcessor;
function validateManifest(manifest) {
    (0, validation_1.validateExtensionName)(manifest.name);
    (0, validation_1.validatePublisher)(manifest.publisher);
    if (!manifest.version) {
        throw new Error('Manifest missing field: version');
    }
    if (manifest.pricing && !['Free', 'Trial'].includes(manifest.pricing)) {
        throw new Error('Pricing can only be "Free" or "Trial"');
    }
    (0, validation_1.validateVersion)(manifest.version);
    if (!manifest.engines) {
        throw new Error('Manifest missing field: engines');
    }
    if (!manifest.engines['vscode']) {
        throw new Error('Manifest missing field: engines.vscode');
    }
    const engineVersion = manifest.engines['vscode'];
    (0, validation_1.validateEngineCompatibility)(engineVersion);
    const hasActivationEvents = !!manifest.activationEvents;
    const hasImplicitLanguageActivationEvents = manifest.contributes?.languages;
    const hasOtherImplicitActivationEvents = manifest.contributes?.commands ||
        manifest.contributes?.authentication ||
        manifest.contributes?.customEditors ||
        manifest.contributes?.views;
    const hasImplicitActivationEvents = hasImplicitLanguageActivationEvents || hasOtherImplicitActivationEvents;
    const hasMain = !!manifest.main;
    const hasBrowser = !!manifest.browser;
    let parsedEngineVersion;
    try {
        const engineSemver = (0, parse_semver_1.default)(`vscode@${engineVersion}`);
        parsedEngineVersion = engineSemver.version;
    }
    catch (err) {
        throw new Error('Failed to parse semver of engines.vscode');
    }
    if (hasActivationEvents ||
        ((engineVersion === '*' || semver.satisfies(parsedEngineVersion, '>=1.74', { includePrerelease: true })) &&
            hasImplicitActivationEvents)) {
        if (!hasMain && !hasBrowser && (hasActivationEvents || !hasImplicitLanguageActivationEvents)) {
            throw new Error("Manifest needs either a 'main' or 'browser' property, given it has a 'activationEvents' property.");
        }
    }
    else if (hasMain) {
        throw new Error("Manifest needs the 'activationEvents' property, given it has a 'main' property.");
    }
    else if (hasBrowser) {
        throw new Error("Manifest needs the 'activationEvents' property, given it has a 'browser' property.");
    }
    if (manifest.devDependencies && manifest.devDependencies['@types/vscode']) {
        (0, validation_1.validateVSCodeTypesCompatibility)(manifest.engines['vscode'], manifest.devDependencies['@types/vscode']);
    }
    if (/\.svg$/i.test(manifest.icon || '')) {
        throw new Error(`SVGs can't be used as icons: ${manifest.icon}`);
    }
    (manifest.badges ?? []).forEach(badge => {
        const decodedUrl = decodeURI(badge.url);
        let srcUrl;
        try {
            srcUrl = new url.URL(decodedUrl);
        }
        catch (err) {
            throw new Error(`Badge URL is invalid: ${badge.url}`);
        }
        if (!/^https:$/i.test(srcUrl.protocol)) {
            throw new Error(`Badge URLs must come from an HTTPS source: ${badge.url}`);
        }
        if (/\.svg$/i.test(srcUrl.pathname) && !isHostTrusted(srcUrl)) {
            throw new Error(`Badge SVGs are restricted. Please use other file image formats, such as PNG: ${badge.url}`);
        }
    });
    Object.keys(manifest.dependencies || {}).forEach(dep => {
        if (dep === 'vscode') {
            throw new Error(`You should not depend on 'vscode' in your 'dependencies'. Did you mean to add it to 'devDependencies'?`);
        }
    });
    if (manifest.extensionKind) {
        const extensionKinds = Array.isArray(manifest.extensionKind) ? manifest.extensionKind : [manifest.extensionKind];
        for (const kind of extensionKinds) {
            if (!ValidExtensionKinds.has(kind)) {
                throw new Error(`Manifest contains invalid value '${kind}' in the 'extensionKind' property. Allowed values are ${[
                    ...ValidExtensionKinds,
                ]
                    .map(k => `'${k}'`)
                    .join(', ')}.`);
            }
        }
    }
    if (manifest.sponsor) {
        let isValidSponsorUrl = true;
        try {
            const sponsorUrl = new url.URL(manifest.sponsor.url);
            isValidSponsorUrl = /^(https|http):$/i.test(sponsorUrl.protocol);
        }
        catch (error) {
            isValidSponsorUrl = false;
        }
        if (!isValidSponsorUrl) {
            throw new Error(`Manifest contains invalid value '${manifest.sponsor.url}' in the 'sponsor' property. It must be a valid URL with a HTTP or HTTPS protocol.`);
        }
    }
    return manifest;
}
exports.validateManifest = validateManifest;
function readManifest(cwd = process.cwd(), nls = true) {
    const manifestPath = path.join(cwd, 'package.json');
    const manifestNLSPath = path.join(cwd, 'package.nls.json');
    const manifest = fs.promises
        .readFile(manifestPath, 'utf8')
        .catch(() => Promise.reject(`Extension manifest not found: ${manifestPath}`))
        .then(manifestStr => {
        try {
            return Promise.resolve(JSON.parse(manifestStr));
        }
        catch (e) {
            console.error(`Error parsing 'package.json' manifest file: not a valid JSON file.`);
            throw e;
        }
    })
        .then(validateManifest);
    if (!nls) {
        return manifest;
    }
    const manifestNLS = fs.promises
        .readFile(manifestNLSPath, 'utf8')
        .catch(err => (err.code !== 'ENOENT' ? Promise.reject(err) : Promise.resolve(undefined)))
        .then(raw => {
        if (!raw) {
            return Promise.resolve(undefined);
        }
        try {
            return Promise.resolve(jsonc.parse(raw));
        }
        catch (e) {
            console.error(`Error parsing JSON manifest translations file: ${manifestNLSPath}`);
            throw e;
        }
    });
    return Promise.all([manifest, manifestNLS]).then(([manifest, translations]) => {
        if (!translations) {
            return manifest;
        }
        return (0, nls_1.patchNLS)(manifest, translations);
    });
}
exports.readManifest = readManifest;
const escapeChars = new Map([
    ["'", '&apos;'],
    ['"', '&quot;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['&', '&amp;'],
]);
function escape(value) {
    return String(value).replace(/(['"<>&])/g, (_, char) => escapeChars.get(char));
}
async function toVsixManifest(vsix) {
    return `<?xml version="1.0" encoding="utf-8"?>
	<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
		<Metadata>
			<Identity Language="en-US" Id="${escape(vsix.id)}" Version="${escape(vsix.version)}" Publisher="${escape(vsix.publisher)}" ${vsix.target ? `TargetPlatform="${escape(vsix.target)}"` : ''}/>
			<DisplayName>${escape(vsix.displayName)}</DisplayName>
			<Description xml:space="preserve">${escape(vsix.description)}</Description>
			<Tags>${escape(vsix.tags)}</Tags>
			<Categories>${escape(vsix.categories)}</Categories>
			<GalleryFlags>${escape(vsix.flags)}</GalleryFlags>
			${!vsix.badges
        ? ''
        : `<Badges>${vsix.badges
            .map(badge => `<Badge Link="${escape(badge.href)}" ImgUri="${escape(badge.url)}" Description="${escape(badge.description)}" />`)
            .join('\n')}</Badges>`}
			<Properties>
				<Property Id="Microsoft.VisualStudio.Code.Engine" Value="${escape(vsix.engine)}" />
				<Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="${escape(vsix.extensionDependencies)}" />
				<Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="${escape(vsix.extensionPack)}" />
				<Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="${escape(vsix.extensionKind)}" />
				<Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="${escape(vsix.localizedLanguages)}" />
				<Property Id="Microsoft.VisualStudio.Code.EnabledApiProposals" Value="${escape(vsix.enabledApiProposals)}" />
				${vsix.preRelease ? `<Property Id="Microsoft.VisualStudio.Code.PreRelease" Value="${escape(vsix.preRelease)}" />` : ''}
				${vsix.executesCode ? `<Property Id="Microsoft.VisualStudio.Code.ExecutesCode" Value="${escape(vsix.executesCode)}" />` : ''}
				${vsix.sponsorLink
        ? `<Property Id="Microsoft.VisualStudio.Code.SponsorLink" Value="${escape(vsix.sponsorLink)}" />`
        : ''}
				${!vsix.links.repository
        ? ''
        : `<Property Id="Microsoft.VisualStudio.Services.Links.Source" Value="${escape(vsix.links.repository)}" />
				<Property Id="Microsoft.VisualStudio.Services.Links.Getstarted" Value="${escape(vsix.links.repository)}" />
				${vsix.links.github
            ? `<Property Id="Microsoft.VisualStudio.Services.Links.GitHub" Value="${escape(vsix.links.github)}" />`
            : `<Property Id="Microsoft.VisualStudio.Services.Links.Repository" Value="${escape(vsix.links.repository)}" />`}`}
				${vsix.links.bugs
        ? `<Property Id="Microsoft.VisualStudio.Services.Links.Support" Value="${escape(vsix.links.bugs)}" />`
        : ''}
				${vsix.links.homepage
        ? `<Property Id="Microsoft.VisualStudio.Services.Links.Learn" Value="${escape(vsix.links.homepage)}" />`
        : ''}
				${vsix.galleryBanner.color
        ? `<Property Id="Microsoft.VisualStudio.Services.Branding.Color" Value="${escape(vsix.galleryBanner.color)}" />`
        : ''}
				${vsix.galleryBanner.theme
        ? `<Property Id="Microsoft.VisualStudio.Services.Branding.Theme" Value="${escape(vsix.galleryBanner.theme)}" />`
        : ''}
				<Property Id="Microsoft.VisualStudio.Services.GitHubFlavoredMarkdown" Value="${escape(vsix.githubMarkdown)}" />
				<Property Id="Microsoft.VisualStudio.Services.Content.Pricing" Value="${escape(vsix.pricing)}"/>

				${vsix.enableMarketplaceQnA !== undefined
        ? `<Property Id="Microsoft.VisualStudio.Services.EnableMarketplaceQnA" Value="${escape(vsix.enableMarketplaceQnA)}" />`
        : ''}
				${vsix.customerQnALink !== undefined
        ? `<Property Id="Microsoft.VisualStudio.Services.CustomerQnALink" Value="${escape(vsix.customerQnALink)}" />`
        : ''}
			</Properties>
			${vsix.license ? `<License>${escape(vsix.license)}</License>` : ''}
			${vsix.icon ? `<Icon>${escape(vsix.icon)}</Icon>` : ''}
		</Metadata>
		<Installation>
			<InstallationTarget Id="Microsoft.VisualStudio.Code"/>
		</Installation>
		<Dependencies/>
		<Assets>
			<Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="${util.filePathToVsixPath('package.json')}" Addressable="true" />
			${vsix.assets
        .map(asset => `<Asset Type="${escape(asset.type)}" Path="${escape(asset.path)}" Addressable="true" />`)
        .join('\n')}
		</Assets>
	</PackageManifest>`;
}
exports.toVsixManifest = toVsixManifest;
const defaultMimetypes = new Map([
    ['.json', 'application/json'],
    ['.vsixmanifest', 'text/xml'],
]);
async function toContentTypes(files) {
    const mimetypes = new Map(defaultMimetypes);
    for (const file of files) {
        const ext = path.extname(file.path).toLowerCase();
        if (ext) {
            mimetypes.set(ext, mime_1.default.lookup(ext));
        }
    }
    const contentTypes = [];
    for (const [extension, contentType] of mimetypes) {
        contentTypes.push(`<Default Extension="${extension}" ContentType="${contentType}"/>`);
    }
    return `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${contentTypes.join('')}</Types>
`;
}
exports.toContentTypes = toContentTypes;
const defaultIgnore = [
    '.vscodeignore',
    'package-lock.json',
    'npm-debug.log',
    'yarn.lock',
    'yarn-error.log',
    'npm-shrinkwrap.json',
    '.editorconfig',
    '.npmrc',
    '.yarnrc',
    '.gitattributes',
    '*.todo',
    'tslint.yaml',
    '.eslintrc*',
    '.babelrc*',
    '.prettierrc*',
    '.cz-config.js',
    '.commitlintrc*',
    'webpack.config.js',
    'ISSUE_TEMPLATE.md',
    'CONTRIBUTING.md',
    'PULL_REQUEST_TEMPLATE.md',
    'CODE_OF_CONDUCT.md',
    '.github',
    '.travis.yml',
    'appveyor.yml',
    '**/.git',
    '**/.git/**',
    '**/*.vsix',
    '**/.DS_Store',
    '**/*.vsixmanifest',
    '**/.vscode-test/**',
    '**/.vscode-test-web/**',
];
async function collectAllFiles(cwd, dependencies, dependencyEntryPoints) {
    const deps = await (0, npm_1.getDependencies)(cwd, dependencies, dependencyEntryPoints);
    const promises = deps.map(dep => (0, util_1.promisify)(glob_1.default)('**', { cwd: dep, nodir: true, dot: true, ignore: 'node_modules/**' }).then(files => files.map(f => path.relative(cwd, path.join(dep, f))).map(f => f.replace(/\\/g, '/'))));
    return Promise.all(promises).then(util.flatten);
}
function getDependenciesOption(options) {
    if (options.dependencies === false) {
        return 'none';
    }
    switch (options.useYarn) {
        case true:
            return 'yarn';
        case false:
            return 'npm';
        default:
            return undefined;
    }
}
function collectFiles(cwd, dependencies, dependencyEntryPoints, ignoreFile, manifestFileIncludes, readmePath) {
    readmePath = readmePath ?? 'README.md';
    const notIgnored = ['!package.json', `!${readmePath}`];
    return collectAllFiles(cwd, dependencies, dependencyEntryPoints).then(files => {
        files = files.filter(f => !/\r$/m.test(f));
        return (fs.promises
            .readFile(ignoreFile ? ignoreFile : path.join(cwd, '.vscodeignore'), 'utf8')
            .catch(err => err.code !== 'ENOENT' ?
            Promise.reject(err) :
            ignoreFile ?
                Promise.reject(err) :
                // No .vscodeignore file exists
                manifestFileIncludes ?
                    // include all files in manifestFileIncludes and ignore the rest
                    Promise.resolve(manifestFileIncludes.map(file => `!${file}`).concat(['**']).join('\n\r')) :
                    // "files" property not used in package.json 
                    Promise.resolve(''))
            // Parse raw ignore by splitting output into lines and filtering out empty lines and comments
            .then(rawIgnore => rawIgnore
            .split(/[\n\r]/)
            .map(s => s.trim())
            .filter(s => !!s)
            .filter(i => !/^\s*#/.test(i)))
            // Add '/**' to possible folder names
            .then(ignore => [
            ...ignore,
            ...ignore.filter(i => !/(^|\/)[^/]*\*[^/]*$/.test(i)).map(i => (/\/$/.test(i) ? `${i}**` : `${i}/**`)),
        ])
            // Combine with default ignore list
            .then(ignore => [...defaultIgnore, ...ignore, ...notIgnored])
            // Split into ignore and negate list
            .then(ignore => ignore.reduce((r, e) => (!/^\s*!/.test(e) ? [[...r[0], e], r[1]] : [r[0], [...r[1], e]]), [[], []]))
            .then(r => ({ ignore: r[0], negate: r[1] }))
            // Filter out files
            .then(({ ignore, negate }) => files.filter(f => !ignore.some(i => (0, minimatch_1.default)(f, i, MinimatchOptions)) ||
            negate.some(i => (0, minimatch_1.default)(f, i.substr(1), MinimatchOptions)))));
    });
}
function processFiles(processors, files) {
    const processedFiles = files.map(file => util.chain(file, processors, (file, processor) => processor.onFile(file)));
    return Promise.all(processedFiles).then(files => {
        return util.sequence(processors.map(p => () => p.onEnd())).then(() => {
            const assets = processors.reduce((r, p) => [...r, ...p.assets], []);
            const tags = [
                ...processors.reduce((r, p) => {
                    for (const tag of p.tags) {
                        if (tag) {
                            r.add(tag);
                        }
                    }
                    return r;
                }, new Set()),
            ].join(',');
            const vsix = processors.reduce((r, p) => ({ ...r, ...p.vsix }), { assets, tags });
            return Promise.all([toVsixManifest(vsix), toContentTypes(files)]).then(result => {
                return [
                    { path: 'extension.vsixmanifest', contents: Buffer.from(result[0], 'utf8') },
                    { path: '[Content_Types].xml', contents: Buffer.from(result[1], 'utf8') },
                    ...files,
                ];
            });
        });
    });
}
exports.processFiles = processFiles;
function createDefaultProcessors(manifest, options = {}) {
    return [
        new ManifestProcessor(manifest, options),
        new TagsProcessor(manifest),
        new ReadmeProcessor(manifest, options),
        new ChangelogProcessor(manifest, options),
        new LaunchEntryPointProcessor(manifest),
        new LicenseProcessor(manifest, options),
        new IconProcessor(manifest),
        new NLSProcessor(manifest),
        new ValidationProcessor(manifest),
    ];
}
exports.createDefaultProcessors = createDefaultProcessors;
function collect(manifest, options = {}) {
    const cwd = options.cwd || process.cwd();
    const packagedDependencies = options.dependencyEntryPoints || undefined;
    const ignoreFile = options.ignoreFile || undefined;
    const processors = createDefaultProcessors(manifest, options);
    return collectFiles(cwd, getDependenciesOption(options), packagedDependencies, ignoreFile, manifest.files, options.readmePath).then(fileNames => {
        const files = fileNames.map(f => ({ path: util.filePathToVsixPath(f), localPath: path.join(cwd, f) }));
        return processFiles(processors, files);
    });
}
exports.collect = collect;
function writeVsix(files, packagePath) {
    return fs.promises
        .unlink(packagePath)
        .catch(err => (err.code !== 'ENOENT' ? Promise.reject(err) : Promise.resolve(null)))
        .then(() => new Promise((c, e) => {
        const zip = new yazl.ZipFile();
        files.forEach(f => isInMemoryFile(f)
            ? zip.addBuffer(typeof f.contents === 'string' ? Buffer.from(f.contents, 'utf8') : f.contents, f.path, {
                mode: f.mode,
            })
            : zip.addFile(f.localPath, f.path, { mode: f.mode }));
        zip.end();
        const zipStream = fs.createWriteStream(packagePath);
        zip.outputStream.pipe(zipStream);
        zip.outputStream.once('error', e);
        zipStream.once('error', e);
        zipStream.once('finish', () => c());
    }));
}
function getDefaultPackageName(manifest, options) {
    let version = manifest.version;
    if (options.version && !(options.updatePackageJson ?? true)) {
        version = options.version;
    }
    if (options.target) {
        return `${manifest.name}-${options.target}-${version}.vsix`;
    }
    return `${manifest.name}-${version}.vsix`;
}
async function prepublish(cwd, manifest, useYarn) {
    if (!manifest.scripts || !manifest.scripts['vscode:prepublish']) {
        return;
    }
    if (useYarn === undefined) {
        useYarn = await (0, npm_1.detectYarn)(cwd);
    }
    console.log(`Executing prepublish script '${useYarn ? 'yarn' : 'npm'} run vscode:prepublish'...`);
    await new Promise((c, e) => {
        const tool = useYarn ? 'yarn' : 'npm';
        const child = cp.spawn(tool, ['run', 'vscode:prepublish'], { cwd, shell: true, stdio: 'inherit' });
        child.on('exit', code => (code === 0 ? c() : e(`${tool} failed with exit code ${code}`)));
        child.on('error', e);
    });
}
exports.prepublish = prepublish;
async function getPackagePath(cwd, manifest, options = {}) {
    if (!options.packagePath) {
        return path.join(cwd, getDefaultPackageName(manifest, options));
    }
    try {
        const _stat = await fs.promises.stat(options.packagePath);
        if (_stat.isDirectory()) {
            return path.join(options.packagePath, getDefaultPackageName(manifest, options));
        }
        else {
            return options.packagePath;
        }
    }
    catch {
        return options.packagePath;
    }
}
async function pack(options = {}) {
    const cwd = options.cwd || process.cwd();
    const manifest = await readManifest(cwd);
    const files = await collect(manifest, options);
    await printAndValidatePackagedFiles(files, cwd, manifest, options);
    if (options.version && !(options.updatePackageJson ?? true)) {
        manifest.version = options.version;
    }
    const packagePath = await getPackagePath(cwd, manifest, options);
    await writeVsix(files, path.resolve(packagePath));
    return { manifest, packagePath, files };
}
exports.pack = pack;
async function signPackage(packageFile, signTool) {
    const packageFolder = path.dirname(packageFile);
    const packageName = path.basename(packageFile, '.vsix');
    const manifestFile = path.join(packageFolder, `${packageName}.signature.manifest`);
    const signatureFile = path.join(packageFolder, `${packageName}.signature.p7s`);
    const signatureZip = path.join(packageFolder, `${packageName}.signature.zip`);
    await generateManifest(packageFile, manifestFile);
    // Sign the manifest file to generate the signature file
    cp.execSync(`${signTool} "${manifestFile}" "${signatureFile}"`, { stdio: 'inherit' });
    return createSignatureArchive(manifestFile, signatureFile, signatureZip);
}
exports.signPackage = signPackage;
// Generate the signature manifest file
function generateManifest(packageFile, outputFile) {
    if (!outputFile) {
        const packageFolder = path.dirname(packageFile);
        const packageName = path.basename(packageFile, '.vsix');
        outputFile = path.join(packageFolder, `${packageName}.manifest`);
    }
    return vsceSign.generateManifest(packageFile, outputFile);
}
exports.generateManifest = generateManifest;
// Create a signature zip file containing the manifest and signature file
async function createSignatureArchive(manifestFile, signatureFile, outputFile) {
    return vsceSign.zip(manifestFile, signatureFile, outputFile);
}
exports.createSignatureArchive = createSignatureArchive;
async function packageCommand(options = {}) {
    const cwd = options.cwd || process.cwd();
    const manifest = await readManifest(cwd);
    util.patchOptionsWithManifest(options, manifest);
    await prepublish(cwd, manifest, options.useYarn);
    await versionBump(options);
    const { packagePath, files } = await pack(options);
    if (options.signTool) {
        await signPackage(packagePath, options.signTool);
    }
    const stats = await fs.promises.stat(packagePath);
    const packageSize = util.bytesToString(stats.size);
    util.log.done(`Packaged: ${packagePath} ` + chalk_1.default.bold(`(${files.length} files, ${packageSize})`));
}
exports.packageCommand = packageCommand;
/**
 * Lists the files included in the extension's package.
 */
async function listFiles(options = {}) {
    const cwd = options.cwd ?? process.cwd();
    const manifest = options.manifest ?? await readManifest(cwd);
    if (options.prepublish) {
        await prepublish(cwd, manifest, options.useYarn);
    }
    return await collectFiles(cwd, getDependenciesOption(options), options.packagedDependencies, options.ignoreFile, manifest.files, options.readmePath);
}
exports.listFiles = listFiles;
/**
 * Lists the files included in the extension's package.
 */
async function ls(options = {}) {
    const cwd = process.cwd();
    const manifest = await readManifest(cwd);
    const files = await listFiles({ ...options, cwd, manifest });
    if (options.tree) {
        const printableFileStructure = await util.generateFileStructureTree(getDefaultPackageName(manifest, options), files.map(f => ({ origin: f, tree: f })));
        console.log(printableFileStructure.join('\n'));
    }
    else {
        console.log(files.join('\n'));
    }
}
exports.ls = ls;
/**
 * Prints the packaged files of an extension. And ensures .vscodeignore and files property in package.json are used correctly.
 */
async function printAndValidatePackagedFiles(files, cwd, manifest, options) {
    // Warn if the extension contains a lot of files
    const jsFiles = files.filter(f => /\.js$/i.test(f.path));
    if (files.length > 5000 || jsFiles.length > 100) {
        let message = '';
        message += `This extension consists of ${chalk_1.default.bold(String(files.length))} files, out of which ${chalk_1.default.bold(String(jsFiles.length))} are JavaScript files. `;
        message += `For performance reasons, you should bundle your extension: ${chalk_1.default.underline('https://aka.ms/vscode-bundle-extension')}. `;
        message += `You should also exclude unnecessary files by adding them to your .vscodeignore: ${chalk_1.default.underline('https://aka.ms/vscode-vscodeignore')}.\n`;
        util.log.warn(message);
    }
    // Warn if the extension does not have a .vscodeignore file or a files property in package.json
    const hasIgnoreFile = fs.existsSync(options.ignoreFile ?? path.join(cwd, '.vscodeignore'));
    if (!hasIgnoreFile && !manifest.files) {
        let message = '';
        message += `Neither a ${chalk_1.default.bold('.vscodeignore')} file nor a ${chalk_1.default.bold('"files"')} property in package.json was found. `;
        message += `To ensure only necessary files are included in your extension, `;
        message += `add a .vscodeignore file or specify the "files" property in package.json. More info: ${chalk_1.default.underline('https://aka.ms/vscode-vscodeignore')}\n`;
        util.log.warn(message);
    }
    // Throw an error if the extension uses both a .vscodeignore file and the files property in package.json
    else if (hasIgnoreFile && manifest.files !== undefined && manifest.files.length > 0) {
        let message = '';
        message += `Both a ${chalk_1.default.bold('.vscodeignore')} file and a ${chalk_1.default.bold('"files"')} property in package.json were found. `;
        message += `VSCE does not support combining both strategies. `;
        message += `Either remove the ${chalk_1.default.bold('.vscodeignore')} file or the ${chalk_1.default.bold('"files"')} property in package.json.`;
        util.log.error(message);
        process.exit(1);
    }
    // Throw an error if the extension uses the files property in package.json and 
    // the package does not include at least one file for each include pattern
    else if (manifest.files !== undefined && manifest.files.length > 0 && !options.allowUnusedFilesPattern) {
        const originalFilePaths = files.map(f => util.vsixPathToFilePath(f.path));
        const unusedIncludePatterns = manifest.files.filter(includePattern => !originalFilePaths.some(filePath => (0, minimatch_1.default)(filePath, includePattern, MinimatchOptions)));
        if (unusedIncludePatterns.length > 0) {
            let message = '';
            message += `The following include patterns in the ${chalk_1.default.bold('"files"')} property in package.json do not match any files packaged in the extension:\n`;
            message += unusedIncludePatterns.map(p => `  - ${p}`).join('\n');
            message += '\nRemove any include pattern which is not needed.\n';
            message += `\n=> Run ${chalk_1.default.bold('vsce ls --tree')} to see all included files.\n`;
            message += `=> Use ${chalk_1.default.bold('--allow-unused-files-patterns')} to skip this check`;
            util.log.error(message);
            process.exit(1);
        }
    }
    // Print the files included in the package
    const printableFileStructure = await util.generateFileStructureTree(getDefaultPackageName(manifest, options), files.map(f => ({
        // File path relative to the extension root
        origin: util.vsixPathToFilePath(f.path),
        // File path in the VSIX
        tree: f.path
    })), 35 // Print up to 35 files/folders
    );
    let message = '';
    message += chalk_1.default.bold.blue(`Files included in the VSIX:\n`);
    message += printableFileStructure.join('\n');
    // If not all files have been printed, mention how all files can be printed
    if (files.length + 1 > printableFileStructure.length) {
        message += `\n\n=> Run ${chalk_1.default.bold('vsce ls --tree')} to see all included files.`;
    }
    message += '\n';
    util.log.info(message);
}
exports.printAndValidatePackagedFiles = printAndValidatePackagedFiles;
//# sourceMappingURL=package.js.map