# Visual Studio Code Extension Signing Tool Node.js module (@vscode/vsce-sign)

Build Status

This repo contains the code to build @vscode/vsce-sign, a Node.js module for verifying signed VS Code extension packages.

## Documentation

## License

@vscode/vsce-sign is licensed under a [Microsoft software license](LICENSE.txt).

## Creating a release

### Release @vscode/vsce-sign-* platform packages

- Use [this pipeline](https://dev.azure.com/monacotools/Monaco/_build?definitionId=582) to publish `@vscode/vsce-sign-*` npm packages for all platforms. Provide the version of [vsce-sign](https://github.com/microsoft/vsce-sign/releases) to release in the pipeline parameters.  Note that while the vsce-sign version may have a leading `v` (e.g.:  `v2.0.2`), this pipeline expects versions without the leading `v`.

### Release @vscode/vsce-sign package

- Update the `optionalDependencies` version of `@vscode/vsce-sign-*` packages in [package.json](package.json) to the version of [vsce-sign](https://github.com/microsoft/vsce-sign/releases).
- Bump the version of `@vscode/vsce-sign` in [package.json](package.json)
- Run `npm install` to update `package-lock.json` file. 
- Push to repository.
- Publish the `@vscode/vsce-sign` package using [this pipeline](https://dev.azure.com/monacotools/Monaco/_build?definitionId=550).
