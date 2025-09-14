/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for
 *  license information.
 *--------------------------------------------------------------------------------------------*/

export function verify(vsixFilePath: string, signatureArchiveFilePath: string, verbose?: boolean): Promise<ExtensionSignatureVerificationResult>;
export function generateManifest(vsixFilePath: string, manifestFilePath?: string, verbose?: boolean): Promise<string>;
export function zip(manifestFilePath: string, signatureFilePath: string, signatureArchiveFilePath?: string, verbose?: boolean): Promise<string>;

export enum ExtensionSignatureVerificationCode {
    'Success' = 'Success',
    'RequiredArgumentMissing' = 'RequiredArgumentMissing',
    'InvalidArgument' = 'InvalidArgument',
    'PackageIsUnreadable' = 'PackageIsUnreadable',
    'UnhandledException' = 'UnhandledException',
    'SignatureManifestIsMissing' = 'SignatureManifestIsMissing',
    'SignatureManifestIsUnreadable' = 'SignatureManifestIsUnreadable',
    'SignatureIsMissing' = 'SignatureIsMissing',
    'SignatureIsUnreadable' = 'SignatureIsUnreadable',
    'CertificateIsUnreadable' = 'CertificateIsUnreadable',
    'SignatureArchiveIsUnreadable' = 'SignatureArchiveIsUnreadable',
    'FileAlreadyExists' = 'FileAlreadyExists',
    'SignatureArchiveIsInvalidZip' = 'SignatureArchiveIsInvalidZip',
    'SignatureArchiveHasSameSignatureFile' = 'SignatureArchiveHasSameSignatureFile',

    'PackageIntegrityCheckFailed' = 'PackageIntegrityCheckFailed',
    'SignatureIsInvalid' = 'SignatureIsInvalid',
    'SignatureManifestIsInvalid' = 'SignatureManifestIsInvalid',
    'SignatureIntegrityCheckFailed' = 'SignatureIntegrityCheckFailed',
    'EntryIsMissing' = 'EntryIsMissing',
    'EntryIsTampered' = 'EntryIsTampered',
    'Untrusted' = 'Untrusted',
    'CertificateRevoked' = 'CertificateRevoked',
    'SignatureIsNotValid' = 'SignatureIsNotValid',
    'UnknownError' = 'UnknownError',
    'PackageIsInvalidZip' = 'PackageIsInvalidZip',
    'SignatureArchiveHasTooManyEntries' = 'SignatureArchiveHasTooManyEntries',
}

export class ExtensionSignatureVerificationResult {
    readonly code: ExtensionSignatureVerificationCode;
    readonly didExecute: boolean;
    readonly internalCode?: number;
    readonly output?: string;
}