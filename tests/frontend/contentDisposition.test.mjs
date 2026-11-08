import assert from 'node:assert/strict';
import { test } from 'node:test';

import { filenameFromContentDisposition } from '../../src/utils/contentDisposition.ts';

const fallback = 'repo_wiki.md';

test('filename* takes precedence over filename=', () => {
  const header = `attachment; filename="____wiki_20260101.md"; filename*=UTF-8''%E9%A1%B9%E7%9B%AE_wiki_20260101.md`;
  assert.equal(filenameFromContentDisposition(header, fallback), '项目_wiki_20260101.md');
});

test('filename* is used when it comes first', () => {
  const header = `attachment; filename*=UTF-8''my%20repo_wiki.md; filename="my_repo_wiki.md"`;
  assert.equal(filenameFromContentDisposition(header, fallback), 'my repo_wiki.md');
});

test('malformed percent-encoding falls back to filename=', () => {
  const header = `attachment; filename="broken_wiki.md"; filename*=UTF-8''%E9%A1%ZZ_wiki.md`;
  assert.equal(filenameFromContentDisposition(header, fallback), 'broken_wiki.md');
});

test('unquoted filename= is read without trailing parameters', () => {
  const header = 'attachment; filename=deepwiki_wiki.json; size=10';
  assert.equal(filenameFromContentDisposition(header, fallback), 'deepwiki_wiki.json');
});

test('missing header keeps the default name', () => {
  assert.equal(filenameFromContentDisposition(null, fallback), fallback);
  assert.equal(filenameFromContentDisposition('', fallback), fallback);
});

test('header without a filename keeps the default name', () => {
  assert.equal(filenameFromContentDisposition('attachment', fallback), fallback);
});
