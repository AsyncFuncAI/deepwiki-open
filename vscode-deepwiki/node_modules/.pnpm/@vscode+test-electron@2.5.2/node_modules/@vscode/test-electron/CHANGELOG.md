# Changelog

### 2.5.2 | 2024-04-09

- Fix install issue on various platforms

### 2.5.1 | 2024-04-07

- Allow downloading server versions

### 2.5.0 | 2024-02-04

- Fix deleting old Insiders in electron not working

### 2.4.1 | 2024-07-05

- Throw a typed `TestRunFailedError` on failure instead of a string.

### 2.4.0 | 2024-05-24

- Allow installing unreleased builds using an `-unreleased` suffix, such as `insiders-unreleased`.
- Allow passing different data directories in `runVSCodeCommand`, using it for extension development.
- Improve the appearance progress reporting.

### 2.3.10 | 2024-05-13

- Add `runVSCodeCommand` method and workaround for Node CVE-2024-27980

### 2.3.9 | 2024-01-19

- Fix archive extraction on Windows failing when run under Electron

### 2.3.8 | 2023-11-24

- Fix archive extraction on macOS and Linux sometimes failing

### 2.3.7 | 2023-11-23

- Remove detection for unsupported win32 builds
- Add length and hash validation for downloaded builds

### 2.3.6 | 2023-10-24

- Fix windows sometimes failing on EPERM in download (again)

### 2.3.5 | 2023-10-04

- Fix windows sometimes failing on EPERM in download

### 2.3.4 | 2023-07-31

- Fix "insiders" string not matching correctly

### 2.3.3 | 2023-06-10

- Disable GPU sandbox by default, fixing failures in some CI's.

### 2.3.2 | 2023-05-11

- Fix download method not working for the vscode cli.

### 2.3.1 | 2023-04-04

- Gracefully kill VS Code if SIGINT is received

### 2.3.0 | 2023-02-27

- Automatically use the most recent version matching `engines.vscode` in extensions' package.json
- Allow insiders `version`s to be specified, such as `version: "1.76.0-insider"`
- Reduce the likelihood of 'broken' installations on interrupted downloads
- Remove dependency on outdated `unzipper` module

### 2.2.4 | 2023-02-19

- Use existing downloads if internet is inaccessible

### 2.2.3 | 2023-01-30

- Fix tests sometimes hanging on windows

### 2.2.2 | 2023-01-09

- Add default for platform in `resolveCliPathFromVSCodeExecutablePath` to match docs

### 2.2.1 | 2022-12-06

- Add an idle `timeout` for downloads

### 2.1.5 | 2022-06-27

- Automatically retry if VS Code download fails

### 2.1.4 | 2022-06-10

- Fix uncaught error when failing to connect to the extension service

### 2.1.3 | 2022-03-04

- Support arm64 builds on Linux

### 2.1.2 | 2022-02-04

- Fix executable path being returned incorrectly on cross-platform downloads
- Fix tests sometimes failing with EACCESS errors on OSX

### 2.1.1 | 2022-01-20

- Fix excessive logging when running in CI

### 2.1.0 | 2022-01-14

- Add a progress `reporter` option on the `TestOptions`, which can be used to see more detail or silence download progress.

### 2.0.3 | 2022-01-11

- Fix `@vscode/test-electron` auto updating
- Use arm64 version of VS Code on relevant platforms

### 2.0.2 | 2022-01-07

- Add `resolveCliArgsFromVSCodeExecutablePath`

### 2.0.1 | 2021-12-29

- Fix extra new lines added to test output

### 2.0.0 | 2021-12-14

- Run tests using a separate instance of VS Code by default. This can be disabled by setting `reuseMachineInstall: true`.

### 1.6.2 | 2021-07-15

- Add `--disable-workspace-trust` flag when running tests by default

### 1.6.1 | 2021-07-15

- Rename to `@vscode/test-electron`

### 1.6.0 | 2021-07-14

- Expose generic `download` API with support for `cachePath`

### 1.5.2 | 2021-03-29

- Don't write progress report when output is not connected to tty [#91](https://github.com/microsoft/vscode-test/pull/91)

### 1.5.1 | 2021-01-25

- Fix wrong http proxy agent used [#82](https://github.com/microsoft/vscode-test/issues/82)

### 1.5.0 | 2021-01-25

- Fix download failing on windows with long file paths
- Make installation platform aware [#78](https://github.com/microsoft/vscode-test/issues/78)
- Download and unzip directly for faster setup
- Add download progress indicator
- Show signal that caused vscode to quit if no exit code is present [#64](https://github.com/microsoft/vscode-test/issues/64)

### 1.4.1 | 2020-10-27

- Use "exit" event in runTest.ts. [#74](https://github.com/microsoft/vscode-test/issues/74).

### 1.4.0 | 2020-04-11

- Propagate signal when subprocess terminates. [#56](https://github.com/microsoft/vscode-test/pull/56).

### 1.3.0 | 2019-12-11

- Add `platform` option. By default, Windows/macOS/Linux defaults to use `win32-archive`, `darwin` and `linux-x64`.
  On Windows, `win32-x64-archive` is also available for using 64 bit version of VS Code. #18.
- Allow running offline when `version` is specified and a matching version is found locally. #51.
- Show error when failing to unzip downloaded vscode archive. #50.

### 1.2.3 | 2019-10-31

- Add `--no-sandbox` option to default `launchArgs` for https://github.com/microsoft/vscode/issues/84238.

### 1.2.2 | 2019-10-31

- Reject `downloadAndUnzipVSCode` when `https.get` fails to parse the JSON sent back from VS Code update server. #44.
- Reject `downloadAndUnzipVSCode` promise when download fails due to network error. #49.

### 1.2.1 | 2019-10-31

- Update https-proxy-agent for https://www.npmjs.com/advisories/1184.

### 1.2.0 | 2019-08-06

- Remove downloaded Insiders at `.vscode-test/vscode-insiders` if it's outdated. [#25](https://github.com/microsoft/vscode-test/issues/25).

### 1.1.0 | 2019-08-02

- Add `resolveCliPathFromVSCodeExecutablePath` that would resolve `vscodeExecutablePath` to VS Code CLI path, which can be used
  for extension management features such as `--install-extension` and `--uninstall-extension`. [#31](https://github.com/microsoft/vscode-test/issues/31).

### 1.0.2 | 2019-07-17

- Revert faulty fix for #29.

### 1.0.1 | 2019-07-16

- Use correct CLI path for launching VS Code on macOS / Linux. [#29](https://github.com/Microsoft/vscode-test/issues/29).

### 1.0.0 | 2019-07-03

- Stable release for changes introduced in the `next` tags.

### 1.0.0-next.1 | 2019-06-24

- Improve console message for downloading VS Code. [microsoft/vscode#76090](https://github.com/microsoft/vscode/issues/76090).
- Improve logging. No more prefix `Spawn Error` and direct `stdout` and `stderr` of launched process to `console.log` and `console.error`.
- `stable` added as a download version option.

### 1.0.0-next.0 | 2019-06-24

- Updated API:
  - One single set of options.
  - `extensionPath` => `extensionDevelopmentPath` to align with VS Code launch flags
  - `testRunnerPath` => `extensionTestsPath` to align with VS Code launch flags
  - `testRunnerEnv` => `extensionTestsEnv` to align with VS Code launch flags
  - `additionalLaunchArgs` => `launchArgs`
  - `testWorkspace` removed. Pass path to file/folder/workspace as first argument to `launchArgs` instead.
  - `locale` removed. Pass `--locale` to `launchArgs` instead.

### 0.4.3 | 2019-05-30

- Improved API documentation.

### 0.4.2 | 2019-05-24

- `testWorkspace` is now optional.

### 0.4.1 | 2019-05-02

- Fix Linux crash because `testRunnerEnv` is not merged with `process.env` for spawning the
  testing process. [#14](https://github.com/Microsoft/vscode-test/issues/14c).

### 0.4.0 | 2019-04-18

- Add `testRunnerEnv` option. [#13](https://github.com/Microsoft/vscode-test/issues/13).

### 0.3.5 | 2019-04-17

- Fix macOS Insiders incorrect url resolve.

### 0.3.4 | 2019-04-17

- One more fix for Insiders url resolver.

### 0.3.3 | 2019-04-17

- Correct Insiders download link.

### 0.3.2 | 2019-04-17

- Correctly resolve Insider exectuable. [#12](https://github.com/Microsoft/vscode-test/issues/12).

### 0.3.1 | 2019-04-16

- Log errors from stderr of the command to launch VS Code.

### 0.3.0 | 2019-04-13

- 🙌 Add TypeScript as dev dependency. [#9](https://github.com/Microsoft/vscode-test/pull/9).
- 🙌 Adding a simpler way of running tests with only `vscodeExecutablePath` and `launchArgs`. [#8](https://github.com/Microsoft/vscode-test/pull/8).

### 0.2.0 | 2019-04-12

- 🙌 Set `ExecutionPolicy` for Windows unzip command. [#6](https://github.com/Microsoft/vscode-test/pull/6).
- 🙌 Fix NPM http/https proxy handling. [#5](https://github.com/Microsoft/vscode-test/pull/5).
- Fix the option `vscodeLaunchArgs` so it's being used for launching VS Code. [#7](https://github.com/Microsoft/vscode-test/issues/7).

### 0.1.5 | 2019-03-21

- Log folder to download VS Code into.

### 0.1.4 | 2019-03-21

- Add `-NoProfile`, `-NonInteractive` and `-NoLogo` for using PowerShell to extract VS Code. [#2](https://github.com/Microsoft/vscode-test/issues/2).
- Use `Microsoft.PowerShell.Archive\Expand-Archive` to ensure using built-in `Expand-Archive`. [#2](https://github.com/Microsoft/vscode-test/issues/2).

### 0.1.3 | 2019-03-21

- Support specifying testing locale. [#1](https://github.com/Microsoft/vscode-test/pull/1).
- Fix zip extraction failure where `.vscode-test/vscode-<VERSION>` dir doesn't exist on Linux. [#3](https://github.com/Microsoft/vscode-test/issues/3).
