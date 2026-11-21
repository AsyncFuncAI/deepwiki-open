import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseRepositoryInput } from '../../src/utils/parseRepositoryInput.ts';

test('owner/repo shorthand is a GitHub repository', () => {
  assert.deepEqual(parseRepositoryInput('AsyncFuncAI/deepwiki-open'), {
    owner: 'AsyncFuncAI',
    repo: 'deepwiki-open',
    type: 'github',
    fullPath: 'AsyncFuncAI/deepwiki-open',
    localPath: undefined,
    repoUrl: 'https://github.com/AsyncFuncAI/deepwiki-open',
  });
});

test('owner/repo shorthand drops a .git suffix', () => {
  const parsed = parseRepositoryInput(' owner/my.repo.git ');
  assert.equal(parsed?.repo, 'my.repo');
  assert.equal(parsed?.repoUrl, 'https://github.com/owner/my.repo');
});

test('a URL without scheme gets https', () => {
  const parsed = parseRepositoryInput('gitlab.com/group/subgroup/project');
  assert.equal(parsed?.type, 'gitlab');
  assert.equal(parsed?.owner, 'subgroup');
  assert.equal(parsed?.repo, 'project');
  assert.equal(parsed?.fullPath, 'group/subgroup/project');
  assert.equal(parsed?.repoUrl, 'https://gitlab.com/group/subgroup/project');
});

test('a full URL is kept as typed', () => {
  const parsed = parseRepositoryInput('http://git.example.com:8080/team/app.git');
  assert.equal(parsed?.type, 'web');
  assert.equal(parsed?.owner, 'team');
  assert.equal(parsed?.repo, 'app');
  assert.equal(parsed?.repoUrl, 'http://git.example.com:8080/team/app.git');
});

test('Bitbucket and GitHub URLs keep their type', () => {
  assert.equal(parseRepositoryInput('https://bitbucket.org/team/app')?.type, 'bitbucket');
  assert.equal(parseRepositoryInput('https://github.com/owner/repo/')?.repo, 'repo');
});

test('local folders have no repoUrl', () => {
  assert.deepEqual(parseRepositoryInput('/home/me/project'), {
    owner: 'local',
    repo: 'project',
    type: 'local',
    fullPath: undefined,
    localPath: '/home/me/project',
    repoUrl: undefined,
  });
  assert.equal(parseRepositoryInput('C:\\code\\project')?.localPath, 'C:\\code\\project');
});

test('other input is rejected', () => {
  assert.equal(parseRepositoryInput('just-a-name'), null);
  assert.equal(parseRepositoryInput('owner/'), null);
  assert.equal(parseRepositoryInput(''), null);
});
