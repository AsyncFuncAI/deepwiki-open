/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser/custom-auth
 */

/**
 * This file is the entrypoint when importing with the custom-auth subpath e.g. "import { someExport } from @azure/msal-browser/custom-auth"
 *  Additional exports should be added to the applicable exports-*.ts files
 */

// Application and Controller
export { CustomAuthPublicClientApplication } from "./CustomAuthPublicClientApplication.js";
export { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";

// Configuration
export { CustomAuthConfiguration } from "./configuration/CustomAuthConfiguration.js";

// Account Data
export { CustomAuthAccountData } from "./get_account/auth_flow/CustomAuthAccountData.js";

// Operation Inputs
export {
    SignInInputs,
    SignUpInputs,
    ResetPasswordInputs,
    AccountRetrievalInputs,
    AccessTokenRetrievalInputs,
    SignInWithContinuationTokenInputs,
} from "./CustomAuthActionInputs.js";

// Operation Base State
export { AuthFlowStateBase } from "./core/auth_flow/AuthFlowState.js";
export { AuthFlowActionRequiredStateBase } from "./core/auth_flow/AuthFlowState.js";

// Sign-in State
export { SignInState } from "./sign_in/auth_flow/state/SignInState.js";
export { SignInCodeRequiredState } from "./sign_in/auth_flow/state/SignInCodeRequiredState.js";
export { SignInContinuationState } from "./sign_in/auth_flow/state/SignInContinuationState.js";
export { SignInPasswordRequiredState } from "./sign_in/auth_flow/state/SignInPasswordRequiredState.js";
export { SignInCompletedState } from "./sign_in/auth_flow/state/SignInCompletedState.js";
export { SignInFailedState } from "./sign_in/auth_flow/state/SignInFailedState.js";

// Sign-in Results
export {
    SignInResult,
    SignInResultState,
} from "./sign_in/auth_flow/result/SignInResult.js";
export { SignInSubmitCodeResult } from "./sign_in/auth_flow/result/SignInSubmitCodeResult.js";
export {
    SignInResendCodeResult,
    SignInResendCodeResultState,
} from "./sign_in/auth_flow/result/SignInResendCodeResult.js";
export { SignInSubmitPasswordResult } from "./sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
export { SignInSubmitCredentialResultState } from "./sign_in/auth_flow/result/SignInSubmitCredentialResult.js";

// Sign-in Errors
export {
    SignInError,
    SignInSubmitPasswordError,
    SignInSubmitCodeError,
    SignInResendCodeError,
} from "./sign_in/auth_flow/error_type/SignInError.js";

// Sign-up User Account Attributes
export { UserAccountAttributes } from "./UserAccountAttributes.js";

// Sign-up State
export { SignUpState } from "./sign_up/auth_flow/state/SignUpState.js";
export { SignUpAttributesRequiredState } from "./sign_up/auth_flow/state/SignUpAttributesRequiredState.js";
export { SignUpCodeRequiredState } from "./sign_up/auth_flow/state/SignUpCodeRequiredState.js";
export { SignUpPasswordRequiredState } from "./sign_up/auth_flow/state/SignUpPasswordRequiredState.js";
export { SignUpCompletedState } from "./sign_up/auth_flow/state/SignUpCompletedState.js";
export { SignUpFailedState } from "./sign_up/auth_flow/state/SignUpFailedState.js";

// Sign-up Results
export {
    SignUpResult,
    SignUpResultState,
} from "./sign_up/auth_flow/result/SignUpResult.js";
export {
    SignUpSubmitAttributesResult,
    SignUpSubmitAttributesResultState,
} from "./sign_up/auth_flow/result/SignUpSubmitAttributesResult.js";
export {
    SignUpSubmitCodeResult,
    SignUpSubmitCodeResultState,
} from "./sign_up/auth_flow/result/SignUpSubmitCodeResult.js";
export {
    SignUpResendCodeResult,
    SignUpResendCodeResultState,
} from "./sign_up/auth_flow/result/SignUpResendCodeResult.js";
export {
    SignUpSubmitPasswordResult,
    SignUpSubmitPasswordResultState,
} from "./sign_up/auth_flow/result/SignUpSubmitPasswordResult.js";

// Sign-up Errors
export {
    SignUpError,
    SignUpSubmitPasswordError,
    SignUpSubmitCodeError,
    SignUpSubmitAttributesError,
    SignUpResendCodeError,
} from "./sign_up/auth_flow/error_type/SignUpError.js";

// Reset-password State
export { ResetPasswordState } from "./reset_password/auth_flow/state/ResetPasswordState.js";
export { ResetPasswordCodeRequiredState } from "./reset_password/auth_flow/state/ResetPasswordCodeRequiredState.js";
export { ResetPasswordPasswordRequiredState } from "./reset_password/auth_flow/state/ResetPasswordPasswordRequiredState.js";
export { ResetPasswordCompletedState } from "./reset_password/auth_flow/state/ResetPasswordCompletedState.js";
export { ResetPasswordFailedState } from "./reset_password/auth_flow/state/ResetPasswordFailedState.js";

// Reset-password Results
export {
    ResetPasswordStartResult,
    ResetPasswordStartResultState,
} from "./reset_password/auth_flow/result/ResetPasswordStartResult.js";
export {
    ResetPasswordSubmitCodeResult,
    ResetPasswordSubmitCodeResultState,
} from "./reset_password/auth_flow/result/ResetPasswordSubmitCodeResult.js";
export {
    ResetPasswordResendCodeResult,
    ResetPasswordResendCodeResultState,
} from "./reset_password/auth_flow/result/ResetPasswordResendCodeResult.js";
export {
    ResetPasswordSubmitPasswordResult,
    ResetPasswordSubmitPasswordResultState,
} from "./reset_password/auth_flow/result/ResetPasswordSubmitPasswordResult.js";

// Reset-password Errors
export {
    ResetPasswordError,
    ResetPasswordSubmitPasswordError,
    ResetPasswordSubmitCodeError,
    ResetPasswordResendCodeError,
} from "./reset_password/auth_flow/error_type/ResetPasswordError.js";

// Get Access Token Results
export {
    GetAccessTokenResult,
    GetAccessTokenResultState,
} from "./get_account/auth_flow/result/GetAccessTokenResult.js";

// Get Account Results
export {
    GetAccountResult,
    GetAccountResultState,
} from "./get_account/auth_flow/result/GetAccountResult.js";

// Sign Out Results
export {
    SignOutResult,
    SignOutResultState,
} from "./get_account/auth_flow/result/SignOutResult.js";

// Token Management Errors
export {
    GetAccountError,
    SignOutError,
    GetCurrentAccountAccessTokenError,
} from "./get_account/auth_flow/error_type/GetAccountError.js";

// Errors
export { CustomAuthApiError } from "./core/error/CustomAuthApiError.js";
export { CustomAuthError } from "./core/error/CustomAuthError.js";
export { HttpError } from "./core/error/HttpError.js";
export { InvalidArgumentError } from "./core/error/InvalidArgumentError.js";
export { InvalidConfigurationError } from "./core/error/InvalidConfigurationError.js";
export { MethodNotImplementedError } from "./core/error/MethodNotImplementedError.js";
export { MsalCustomAuthError } from "./core/error/MsalCustomAuthError.js";
export { NoCachedAccountFoundError } from "./core/error/NoCachedAccountFoundError.js";
export { ParsedUrlError } from "./core/error/ParsedUrlError.js";
export { UnexpectedError } from "./core/error/UnexpectedError.js";
export { UnsupportedEnvironmentError } from "./core/error/UnsupportedEnvironmentError.js";
export { UserAccountAttributeError } from "./core/error/UserAccountAttributeError.js";
export { UserAlreadySignedInError } from "./core/error/UserAlreadySignedInError.js";

// Components from msal_browser
export { LogLevel } from "@azure/msal-common/browser";
