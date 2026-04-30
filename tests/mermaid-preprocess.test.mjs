import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { doubleWrap } = require('../temp/temp.js');

const input = `
flowchart TD
    Functioncall -->|GetMoney(Number amount) and| B(Go shopping)
    Functioncall -->|"Already quoted"| B("Already quoted")
    Functioncall -->|"Already quoted"| B("Function(string s) quoted")
    Functioncall -->|"Already quoted"| B{"Function{string s} quoted"}
    Functioncall -->|"Already quoted"| B["Function[string s] quoted"]
    Functioncall -->|"Already quoted"| B(Function(string s) quoted)
    Functioncall -->|"Already quoted"| B{Function{string s} quoted}
    Functioncall -->|"Already quoted"| B[Function[string s] quoted]
    A("Test") -->|"Already quoted"| B("Function(string s) quoted")
    A("Test") -->|"Already quoted"| B{"Function{string s} quoted"}
    A("Test") -->|"Already quoted"| B["Function[string s] quoted"]
    A(Test) -->|"Already quoted"| B(Function(string s) quoted)
    A(Test) -->|"Already quoted"| B{Function{string s} quoted}
    A(Test) -->|"Already quoted"| B[Function[string s] quoted]
    B --> C{Thinking(Number time)}
    C -->|"One"| D[La"ptop]
    C -->|Two| E["iPhone"]
    C -->|Three| F[fa:fa-car Car]
`;

const expected = `
flowchart TD
    Functioncall -->|"GetMoney(Number amount) and"| B("Go shopping")
    Functioncall -->|"Already quoted"| B("Already quoted")
    Functioncall -->|"Already quoted"| B("Function(string s) quoted")
    Functioncall -->|"Already quoted"| B{"Function{string s} quoted"}
    Functioncall -->|"Already quoted"| B["Function[string s] quoted"]
    Functioncall -->|"Already quoted"| B("Function(string s) quoted")
    Functioncall -->|"Already quoted"| B{"Function{string s} quoted"}
    Functioncall -->|"Already quoted"| B["Function[string s] quoted"]
    A("Test") -->|"Already quoted"| B("Function(string s) quoted")
    A("Test") -->|"Already quoted"| B{"Function{string s} quoted"}
    A("Test") -->|"Already quoted"| B["Function[string s] quoted"]
    A("Test") -->|"Already quoted"| B("Function(string s) quoted")
    A("Test") -->|"Already quoted"| B{"Function{string s} quoted"}
    A("Test") -->|"Already quoted"| B["Function[string s] quoted"]
    B --> C{"Thinking(Number time)"}
    C -->|"One"| D[La"ptop]
    C -->|"Two"| E["iPhone"]
    C -->|"Three"| F["fa:fa-car Car"]
`;

try {
  const actual = doubleWrap(input);
  assert.equal(actual, expected);
  process.stdout.write('mermaid-preprocess: ok\n');
} catch (err) {
  process.stderr.write('mermaid-preprocess: failed\n');
  process.stderr.write(String(err) + '\n');
  process.exitCode = 1;
}
