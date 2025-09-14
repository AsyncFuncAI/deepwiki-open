# vscode-test

![Test Status Badge](https://github.com/microsoft/vscode-test/workflows/Tests/badge.svg)

This module helps you test VS Code extensions. Note that new extensions may want to use the [VS Code Test CLI](https://github.com/microsoft/vscode-test-cli/blob/main/README.md), which leverages this module, for a richer editing and execution experience.

Supported:

- Node >= 16.x
- Windows >= Windows Server 2012+ / Win10+ (anything with Powershell >= 5.0)
- macOS
- Linux

## Usage

See [./sample](./sample) for a runnable sample, with [Azure DevOps Pipelines](https://github.com/microsoft/vscode-test/blob/main/sample/azure-pipelines.yml) and [Github Actions](https://github.com/microsoft/vscode-test/blob/main/sample/.github/workflows/ci.yml) configuration.

```ts
import { runTests, runVSCodeCommand, downloadAndUnzipVSCode } from '@vscode/test-electron';

async function go() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
		const extensionTestsPath = path.resolve(__dirname, './suite');

		/**
		 * Basic usage
		 */
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
		});

		const extensionTestsPath2 = path.resolve(__dirname, './suite2');
		const testWorkspace = path.resolve(__dirname, '../../../test-fixtures/fixture1');

		/**
		 * Running another test suite on a specific workspace
		 */
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath: extensionTestsPath2,
			launchArgs: [testWorkspace],
		});

		/**
		 * Use 1.36.1 release for testing
		 */
		await runTests({
			version: '1.36.1',
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace],
		});

		/**
		 * Use Insiders release for testing
		 */
		await runTests({
			version: 'insiders',
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace],
		});

		/**
		 * Noop, since 1.36.1 already downloaded to .vscode-test/vscode-1.36.1
		 */
		await downloadAndUnzipVSCode('1.36.1');

		/**
		 * Manually download VS Code 1.35.0 release for testing.
		 */
		const vscodeExecutablePath = await downloadAndUnzipVSCode('1.35.0');
		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [testWorkspace],
		});

		/**
		 * Install Python extension
		 */
		await runVSCodeCommand(['--install-extension', 'ms-python.python'], { version: '1.35.0' });

		/**
		 * - Add additional launch flags for VS Code
		 * - Pass custom environment variables to test runner
		 */
		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				testWorkspace,
				// This disables all extensions except the one being tested
				'--disable-extensions',
			],
			// Custom environment variables for extension test script
			extensionTestsEnv: { foo: 'bar' },
		});

		/**
		 * Use win64 instead of win32 for testing Windows
		 */
		if (process.platform === 'win32') {
			await runTests({
				extensionDevelopmentPath,
				extensionTestsPath,
				version: '1.40.0',
				platform: 'win32-x64-archive',
			});
		}
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

go();
```

## Development

- `npm install`
- Make necessary changes in [`lib`](./lib)
- `npm run compile` (or `npm run watch`)
- In [`sample`](./sample), run `npm install`, `npm run compile` and `npm run test` to make sure integration test can run successfully

## License

[MIT](LICENSE)

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
