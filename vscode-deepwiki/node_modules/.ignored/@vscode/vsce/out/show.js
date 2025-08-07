"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.show = void 0;
const util_1 = require("./util");
const GalleryInterfaces_1 = require("azure-devops-node-api/interfaces/GalleryInterfaces");
const viewutils_1 = require("./viewutils");
const limitVersions = 6;
const isExtensionTag = /^__ext_(.*)$/;
function show(extensionId, json = false) {
    const flags = [
        GalleryInterfaces_1.ExtensionQueryFlags.IncludeCategoryAndTags,
        GalleryInterfaces_1.ExtensionQueryFlags.IncludeMetadata,
        GalleryInterfaces_1.ExtensionQueryFlags.IncludeStatistics,
        GalleryInterfaces_1.ExtensionQueryFlags.IncludeVersions,
        GalleryInterfaces_1.ExtensionQueryFlags.IncludeVersionProperties,
    ];
    return (0, util_1.getPublicGalleryAPI)()
        .getExtension(extensionId, flags)
        .then(extension => {
        if (json) {
            console.log(JSON.stringify(extension, undefined, '\t'));
        }
        else {
            if (extension === undefined) {
                util_1.log.error(`Extension "${extensionId}" not found.`);
            }
            else {
                showOverview(extension);
            }
        }
    });
}
exports.show = show;
function round(num) {
    return Math.round(num * 100) / 100;
}
function unit(value, statisticName) {
    switch (statisticName) {
        case 'install':
            return `${value} installs`;
        case 'updateCount':
            return `${value} updates`;
        case 'averagerating':
        case 'weightedRating':
            return `${value} stars`;
        case 'ratingcount':
            return `${value} ratings`;
        case 'downloadCount':
            return `${value} downloads`;
        default:
            return `${value}`;
    }
}
function getVersionTable(versions) {
    if (!versions.length) {
        return [];
    }
    const set = new Set();
    const result = versions
        .filter(({ version }) => !set.has(version) && set.add(version))
        .slice(0, limitVersions)
        .map(({ version, lastUpdated, properties }) => [version, (0, viewutils_1.formatDate)(lastUpdated), properties?.some(p => p.key === 'Microsoft.VisualStudio.Code.PreRelease')]);
    // Only show pre-release column if there are any pre-releases
    if (result.every(v => !v[2])) {
        for (const version of result) {
            version.pop();
        }
        result.unshift(['Version', 'Last Updated']);
    }
    else {
        for (const version of result) {
            version[2] = version[2] ? `✔️` : '';
        }
        result.unshift(['Version', 'Last Updated', 'Pre-release']);
    }
    return result;
}
function showOverview({ displayName = 'unknown', extensionName = 'unknown', shortDescription = '', versions = [], publisher: { displayName: publisherDisplayName, publisherName }, categories = [], tags = [], statistics = [], publishedDate, lastUpdated, }) {
    const [{ version = 'unknown' } = {}] = versions;
    const versionTable = getVersionTable(versions);
    const latestVersionTargets = versions
        .filter(v => v.version === version)
        .filter(v => v.targetPlatform)
        .map(v => v.targetPlatform);
    const { install: installs = 0, averagerating = 0, ratingcount = 0 } = statistics.reduce((map, { statisticName, value }) => ({ ...map, [statisticName]: value }), {});
    const rows = [
        `${displayName}`,
        `${publisherDisplayName} | ${viewutils_1.icons.download} ` +
            `${Number(installs).toLocaleString()} installs |` +
            ` ${(0, viewutils_1.ratingStars)(averagerating)} (${ratingcount})`,
        '',
        `${shortDescription}`,
        '',
        ...(versionTable.length ? (0, viewutils_1.tableView)(versionTable).map(viewutils_1.indentRow) : ['no versions found']),
        '',
        'Categories:',
        `  ${categories.join(', ')}`,
        '',
        'Tags:',
        `  ${tags.filter(tag => !isExtensionTag.test(tag)).join(', ')}`
    ];
    if (latestVersionTargets.length) {
        rows.push('', 'Targets:', `  ${latestVersionTargets.join(', ')}`);
    }
    rows.push('', 'More info:', ...(0, viewutils_1.tableView)([
        ['Unique identifier:', `${publisherName}.${extensionName}`],
        ['Version:', version],
        ['Last updated:', (0, viewutils_1.formatDateTime)(lastUpdated)],
        ['Publisher:', publisherDisplayName],
        ['Published at:', (0, viewutils_1.formatDate)(publishedDate)],
    ]).map(viewutils_1.indentRow), '', 'Statistics:', ...(0, viewutils_1.tableView)(statistics
        .filter(({ statisticName }) => !/^trending/.test(statisticName))
        .map(({ statisticName, value }) => [statisticName, unit(round(value), statisticName)])).map(viewutils_1.indentRow));
    // Render
    console.log(rows.map(line => (0, viewutils_1.wordWrap)(line)).join('\n'));
}
//# sourceMappingURL=show.js.map