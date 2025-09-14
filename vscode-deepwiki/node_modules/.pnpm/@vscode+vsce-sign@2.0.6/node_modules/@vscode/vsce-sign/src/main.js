/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  See LICENSE.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ts-check
'use strict';

const { execFile } = require('child_process');
const Path = require('path');

const command = process.platform === 'win32' ? 'vsce-sign.exe' : 'vsce-sign';
const vsceSignFilePath = Path.join(__dirname, '..', 'bin', command);

// If this module is in an .asar file, then the binary is unpacked.
const vsceSignOnDiskFilePath = vsceSignFilePath.replace(/\bnode_modules\.asar\b/, 'node_modules.asar.unpacked');

const ExtensionSignatureVerificationCode = {
    'Success': 'Success',
    'RequiredArgumentMissing': 'RequiredArgumentMissing',
    'InvalidArgument': 'InvalidArgument',
    'PackageIsUnreadable': 'PackageIsUnreadable',
    'UnhandledException': 'UnhandledException',
    'SignatureManifestIsMissing': 'SignatureManifestIsMissing',
    'SignatureManifestIsUnreadable': 'SignatureManifestIsUnreadable',
    'SignatureIsMissing': 'SignatureIsMissing',
    'SignatureIsUnreadable': 'SignatureIsUnreadable',
    'CertificateIsUnreadable': 'CertificateIsUnreadable',
    'SignatureArchiveIsUnreadable': 'SignatureArchiveIsUnreadable',
    'FileAlreadyExists': 'FileAlreadyExists',
    'SignatureArchiveIsInvalidZip': 'SignatureArchiveIsInvalidZip',
    'SignatureArchiveHasSameSignatureFile': 'SignatureArchiveHasSameSignatureFile',

    'PackageIntegrityCheckFailed': 'PackageIntegrityCheckFailed',
    'SignatureIsInvalid': 'SignatureIsInvalid',
    'SignatureManifestIsInvalid': 'SignatureManifestIsInvalid',
    'SignatureIntegrityCheckFailed': 'SignatureIntegrityCheckFailed',
    'EntryIsMissing': 'EntryIsMissing',
    'EntryIsTampered': 'EntryIsTampered',
    'Untrusted': 'Untrusted',
    'CertificateRevoked': 'CertificateRevoked',
    'SignatureIsNotValid': 'SignatureIsNotValid',
    'UnknownError': 'UnknownError',
    'PackageIsInvalidZip': 'PackageIsInvalidZip',
    'SignatureArchiveHasTooManyEntries': 'SignatureArchiveHasTooManyEntries',
};

// Must stay in sync with Microsoft.VisualStudio.Extensions.Signing.ReturnCode (https://github.com/microsoft/vsce-sign/blob/main/src/Core/ReturnCode.cs).
const ReturnCode = {};

ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.Success] = 0] = ExtensionSignatureVerificationCode.Success;  // The operation succeeded.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.RequiredArgumentMissing] = 3] = ExtensionSignatureVerificationCode.RequiredArgumentMissing; // A required argument is missing.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.InvalidArgument] = 4] = ExtensionSignatureVerificationCode.InvalidArgument;  // An argument is invalid.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.PackageIsUnreadable] = 5] = ExtensionSignatureVerificationCode.PackageIsUnreadable;  // The extension package is unreadable.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.UnhandledException] = 6] = ExtensionSignatureVerificationCode.UnhandledException; // An unhandled exception occurred.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureManifestIsMissing] = 7] = ExtensionSignatureVerificationCode.SignatureManifestIsMissing; // The extension is missing a signature manifest file (.signature.manifest).
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureManifestIsUnreadable] = 8] = ExtensionSignatureVerificationCode.SignatureManifestIsUnreadable; // The signature manifest is unreadable.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureIsMissing] = 9] = ExtensionSignatureVerificationCode.SignatureIsMissing; // The extension is missing a signature file (.signature.p7s).
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureIsUnreadable] = 10] = ExtensionSignatureVerificationCode.SignatureIsUnreadable; // The signature is unreadable.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.CertificateIsUnreadable] = 11] = ExtensionSignatureVerificationCode.CertificateIsUnreadable; // The certificate is unreadable.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureArchiveIsUnreadable] = 12] = ExtensionSignatureVerificationCode.SignatureArchiveIsUnreadable; // The signature archive is unreadable.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.FileAlreadyExists] = 13] = ExtensionSignatureVerificationCode.FileAlreadyExists; // The output file already exists.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureArchiveIsInvalidZip] = 14] = ExtensionSignatureVerificationCode.SignatureArchiveIsInvalidZip; // The signature archive is not valid ZIP format.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureArchiveHasSameSignatureFile] = 15] = ExtensionSignatureVerificationCode.SignatureArchiveHasSameSignatureFile; // The signature archive has the same signature file.

// Space reserved for additional CLI-specific return codes.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.PackageIntegrityCheckFailed] = 30] = ExtensionSignatureVerificationCode.PackageIntegrityCheckFailed; // The package integrity check failed.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureIsInvalid] = 31] = ExtensionSignatureVerificationCode.SignatureIsInvalid; // The extension has an invalid signature file (.signature.p7s).
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureManifestIsInvalid] = 32] = ExtensionSignatureVerificationCode.SignatureManifestIsInvalid; // The extension has an invalid signature manifest file (.signature.manifest).
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureIntegrityCheckFailed] = 33] = ExtensionSignatureVerificationCode.SignatureIntegrityCheckFailed; // The extension's signature integrity check failed.  Extension integrity is suspect.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.EntryIsMissing] = 34] = ExtensionSignatureVerificationCode.EntryIsMissing; // An entry referenced in the signature manifest was not found in the extension.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.EntryIsTampered] = 35] = ExtensionSignatureVerificationCode.EntryIsTampered; // The integrity check for an entry referenced in the signature manifest failed.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.Untrusted] = 36] = ExtensionSignatureVerificationCode.Untrusted; // An X.509 certificate in the extension signature is untrusted.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.CertificateRevoked] = 37] = ExtensionSignatureVerificationCode.CertificateRevoked; // An X.509 certificate in the extension signature has been revoked.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureIsNotValid] = 38] = ExtensionSignatureVerificationCode.SignatureIsNotValid; // The extension signature is invalid.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.UnknownError] = 39] = ExtensionSignatureVerificationCode.UnknownError; // An unknown error occurred.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.PackageIsInvalidZip] = 40] = ExtensionSignatureVerificationCode.PackageIsInvalidZip; // The extension package is not valid ZIP format.
ReturnCode[ReturnCode[ExtensionSignatureVerificationCode.SignatureArchiveHasTooManyEntries] = 41] = ExtensionSignatureVerificationCode.SignatureArchiveHasTooManyEntries; // The signature archive has too many entries.

class ExtensionSignatureVerificationResult {
    /**
     * @param {string} code
     * @param {boolean} didExecute
     * @param {number | undefined} internalCode
     * @param {string | undefined} output
     */
    constructor(code, didExecute, internalCode, output) {
        this.code = code;
        this.internalCode = internalCode;
        this.didExecute = didExecute;
        this.output = output;
    }
}

/**
 * @param {string} vsixFilePath
 * @param {string} signatureArchiveFilePath
 * @param {boolean} verbose
 * @returns {Promise<ExtensionSignatureVerificationResult>}
 */
async function verify(vsixFilePath, signatureArchiveFilePath, verbose) {
    const args = ['verify', '--package', vsixFilePath, '--signaturearchive', signatureArchiveFilePath];
    return await execCommand(args, verbose, false);
}

/**
 * @param {string} vsixFilePath
 * @param {string | undefined} manifestFilePath
 * @param {boolean} verbose
 * @returns {Promise<string>}
 */
async function generateManifest(vsixFilePath, manifestFilePath, verbose) {
    const args = ['generatemanifest', '--package', vsixFilePath];

    if (typeof manifestFilePath === 'string') {
        args.push('--output');
        args.push(manifestFilePath);
    }

    await execCommand(args, verbose, true);

    return manifestFilePath ?? Path.join(Path.dirname(vsixFilePath), '.signature.manifest');
}

/**
 * @param {string} manifestFilePath
 * @param {string} signatureFilePath
 * @param {string | undefined} signatureArchiveFilePath
 * @param {boolean} verbose
 * @returns {Promise<string>}
 */
async function zip(manifestFilePath, signatureFilePath, signatureArchiveFilePath, verbose) {
    const args = ['zip', '--manifest', manifestFilePath, '--signature', signatureFilePath];

    if (typeof signatureArchiveFilePath === 'string') {
        args.push('--output');
        args.push(signatureArchiveFilePath);
    }

    await execCommand(args, verbose, true);

    return signatureArchiveFilePath ?? Path.join(Path.dirname(manifestFilePath), '.signature.zip');
}

/**
 * @param {string[]} args
 * @param {boolean} verbose
 * @param {boolean} throwIfNotSuccess
 * @returns {Promise<ExtensionSignatureVerificationResult>}
 */
function execCommand(args, verbose, throwIfNotSuccess) {
    return new Promise((resolve, reject) => {

        if (verbose === true) {
            args.push('--verbose');
        }

        execFile(vsceSignOnDiskFilePath, args, (error, stdout) => {
            let internalCode = undefined;
            let returnCode;
            let didExecute = false;

            const code = error === null ? 0 : error?.code;
            const output = verbose ? stdout : undefined;

            // vsce-sign returns exit codes (numbers), whereas execFile(...), in the absence of an exit code, returns an error code (string) (e.g.:  ENOENT) to indicate failure.
            if (typeof code === 'number') {
                didExecute = true;
                internalCode = code;
                returnCode = ReturnCode[code];
            } else if (typeof code === 'string') {
                returnCode = code;
            }

            returnCode = returnCode ?? ExtensionSignatureVerificationCode.UnknownError;

            if (throwIfNotSuccess && returnCode !== ExtensionSignatureVerificationCode.Success) {
                reject(new ExtensionSignatureVerificationResult(returnCode, didExecute, internalCode, output));
                return;
            }

            resolve(new ExtensionSignatureVerificationResult(returnCode, didExecute, internalCode, output));
        });
    });
}

module.exports = {
    verify,
    generateManifest,
    zip,
    ReturnCode,
    ExtensionSignatureVerificationCode,
    ExtensionSignatureVerificationResult
};