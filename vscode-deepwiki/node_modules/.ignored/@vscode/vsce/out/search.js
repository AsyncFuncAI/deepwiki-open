"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const util_1 = require("./util");
const GalleryInterfaces_1 = require("azure-devops-node-api/interfaces/GalleryInterfaces");
const viewutils_1 = require("./viewutils");
const installationTarget = 'Microsoft.VisualStudio.Code';
const excludeFlags = '37888'; //Value to exclude un-published, locked or hidden extensions
const baseResultsTableHeaders = ['<ExtensionId>', '<Publisher>', '<Name>'];
async function search(searchText, json = false, pageSize = 10, stats = false) {
    const api = (0, util_1.getPublicGalleryAPI)();
    const results = (await api.extensionQuery({
        pageSize,
        criteria: [
            { filterType: GalleryInterfaces_1.ExtensionQueryFilterType.SearchText, value: searchText },
            { filterType: GalleryInterfaces_1.ExtensionQueryFilterType.InstallationTarget, value: installationTarget },
            { filterType: GalleryInterfaces_1.ExtensionQueryFilterType.ExcludeWithFlags, value: excludeFlags },
        ],
        flags: [
            GalleryInterfaces_1.ExtensionQueryFlags.ExcludeNonValidated,
            GalleryInterfaces_1.ExtensionQueryFlags.IncludeLatestVersionOnly,
            stats ? GalleryInterfaces_1.ExtensionQueryFlags.IncludeStatistics : 0,
        ],
    }));
    if (stats || !json) {
        console.log([
            `Search results:`,
            '',
            ...buildResultTableView(results, stats),
            '',
            'For more information on an extension use "vsce show <extensionId>"',
        ]
            .map(line => (0, viewutils_1.wordTrim)(line.replace(/\s+$/g, '')))
            .join('\n'));
        return;
    }
    if (!results.length) {
        console.log('No matching results');
        return;
    }
    if (json) {
        console.log(JSON.stringify(results, undefined, '\t'));
        return;
    }
}
exports.search = search;
function buildResultTableView(results, stats) {
    const values = results.map(({ publisher, extensionName, displayName, shortDescription, statistics }) => [
        publisher.publisherName + '.' + extensionName,
        publisher.displayName,
        (0, viewutils_1.wordTrim)(displayName || '', 25),
        stats ? buildExtensionStatisticsText(statistics) : (0, viewutils_1.wordTrim)(shortDescription || '', 150).replace(/\n|\r|\t/g, ' '),
    ]);
    var resultsTableHeaders = stats
        ? [...baseResultsTableHeaders, '<Installs>', '<Rating>']
        : [...baseResultsTableHeaders, '<Description>'];
    const resultsTable = (0, viewutils_1.tableView)([resultsTableHeaders, ...values]);
    return resultsTable;
}
function buildExtensionStatisticsText(statistics) {
    const { install: installs = 0, averagerating = 0, ratingcount = 0 } = statistics?.reduce((map, { statisticName, value }) => ({ ...map, [statisticName]: value }), {});
    return (`${Number(installs).toLocaleString('en-US').padStart(12, ' ')} \t\t` +
        ` ${(0, viewutils_1.ratingStars)(averagerating).padEnd(3, ' ')} (${ratingcount})`);
}
//# sourceMappingURL=search.js.map