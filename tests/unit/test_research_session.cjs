// Run with: node tests/unit/test_research_session.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../../src/utils/researchSession.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = { exports: {}, crypto: webcrypto, Uint8Array };
vm.runInNewContext(compiled, context);
const { createResearchSession } = context.exports;
const first = createResearchSession();
const second = createResearchSession();
const id = first.getId();
assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
assert.equal(first.getId(), id);
assert.notEqual(second.getId(), id);
assert.equal(first.getId(), id);
first.reset();
assert.notEqual(first.getId(), id);
assert.equal(second.getId(), second.getId());
console.log('Conversation creation, follow-up, interleaving and reset passed.');
