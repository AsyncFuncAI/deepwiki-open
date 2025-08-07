"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wordTrim = exports.indentRow = exports.wordWrap = exports.tableView = exports.ratingStars = exports.repeatString = exports.formatDateTime = exports.formatTime = exports.formatDate = exports.icons = void 0;
const fixedLocale = 'en-us';
const format = {
    date: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
};
const columns = process.stdout.columns ? process.stdout.columns : 80;
// xxx: Windows cmd + powershell standard fonts currently don't support the full
// unicode charset. For now we use fallback icons when on windows.
const useFallbackIcons = process.platform === 'win32';
exports.icons = useFallbackIcons
    ? { download: '\u{2193}', star: '\u{2665}', emptyStar: '\u{2022}' }
    : { download: '\u{2913}', star: '\u{2605}', emptyStar: '\u{2606}' };
function formatDate(date) {
    return date.toLocaleString(fixedLocale, format.date);
}
exports.formatDate = formatDate;
function formatTime(date) {
    return date.toLocaleString(fixedLocale, format.time);
}
exports.formatTime = formatTime;
function formatDateTime(date) {
    return date.toLocaleString(fixedLocale, { ...format.date, ...format.time });
}
exports.formatDateTime = formatDateTime;
function repeatString(text, count) {
    let result = '';
    for (let i = 0; i < count; i++) {
        result += text;
    }
    return result;
}
exports.repeatString = repeatString;
function ratingStars(rating, total = 5) {
    const c = Math.min(Math.round(rating), total);
    return `${repeatString(exports.icons.star + ' ', c)}${repeatString(exports.icons.emptyStar + ' ', total - c)}`;
}
exports.ratingStars = ratingStars;
function tableView(table, spacing = 2) {
    const maxLen = {};
    table.forEach(row => row.forEach((cell, i) => (maxLen[i] = Math.max(maxLen[i] || 0, cell.length))));
    return table.map(row => row.map((cell, i) => `${cell}${repeatString(' ', maxLen[i] - cell.length + spacing)}`).join(''));
}
exports.tableView = tableView;
function wordWrap(text, width = columns) {
    const [indent = ''] = text.match(/^\s+/) || [];
    const maxWidth = width - indent.length;
    return text
        .replace(/^\s+/, '')
        .split('')
        .reduce(([out, buffer, pos], ch) => {
        const nl = pos === maxWidth ? `\n${indent}` : '';
        const newPos = nl ? 0 : +pos + 1;
        return / |-|,|\./.test(ch) ? [`${out}${buffer}${ch}${nl}`, '', newPos] : [`${out}${nl}`, buffer + ch, newPos];
    }, [indent, '', 0])
        .slice(0, 2)
        .join('');
}
exports.wordWrap = wordWrap;
function indentRow(row) {
    return `  ${row}`;
}
exports.indentRow = indentRow;
function wordTrim(text, width = columns, indicator = '...') {
    if (text.length > width) {
        return text.substr(0, width - indicator.length) + indicator;
    }
    return text;
}
exports.wordTrim = wordTrim;
//# sourceMappingURL=viewutils.js.map