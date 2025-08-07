#include <string>
#include <vector>

#include "napi.h"
#include "keytar.h"
#include "async.h"

using keytar::KEYTAR_OP_RESULT;

SetPasswordWorker::SetPasswordWorker(
  const std::string& service,
  const std::string& account,
  const std::string& password,
  const Napi::Env &env
) : AsyncWorker(env),
    service(service),
    account(account),
    password(password),
    deferred(Napi::Promise::Deferred::New(env)) {}

SetPasswordWorker::~SetPasswordWorker() {}

Napi::Promise SetPasswordWorker::Promise() {
  return deferred.Promise();
}

void SetPasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::SetPassword(service,
                                                account,
                                                password,
                                                &error);
  if (result == keytar::FAIL_ERROR) {
    SetError(error.c_str());
  }
}

void SetPasswordWorker::OnOK() {
  Napi::HandleScope scope(Env());
  deferred.Resolve(Env().Undefined());
}

void SetPasswordWorker::OnError(Napi::Error const &error) {
  Napi::HandleScope scope(Env());
  deferred.Reject(error.Value());
}


GetPasswordWorker::GetPasswordWorker(
  const std::string& service,
  const std::string& account,
  const Napi::Env &env
) : AsyncWorker(env),
    service(service),
    account(account),
    deferred(Napi::Promise::Deferred::New(env)) {}

GetPasswordWorker::~GetPasswordWorker() {}

Napi::Promise GetPasswordWorker::Promise() {
  return deferred.Promise();
}

void GetPasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::GetPassword(service,
                                                account,
                                                &password,
                                                &error);
  if (result == keytar::FAIL_ERROR) {
    SetError(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void GetPasswordWorker::OnOK() {
  Napi::HandleScope scope(Env());
  Napi::Value val = Env().Null();
  if (success) {
    val = Napi::String::New(Env(), password.data(),
                               password.length());
  }
  deferred.Resolve(val);
}

void GetPasswordWorker::OnError(Napi::Error const &error) {
  Napi::HandleScope scope(Env());
  deferred.Reject(error.Value());
}

DeletePasswordWorker::DeletePasswordWorker(
  const std::string& service,
  const std::string& account,
  const Napi::Env &env
) : AsyncWorker(env),
    service(service),
    account(account),
    deferred(Napi::Promise::Deferred::New(env)) {}

DeletePasswordWorker::~DeletePasswordWorker() {}

Napi::Promise DeletePasswordWorker::Promise() {
  return deferred.Promise();
}

void DeletePasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::DeletePassword(service, account, &error);
  if (result == keytar::FAIL_ERROR) {
    SetError(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void DeletePasswordWorker::OnOK() {
  Napi::HandleScope scope(Env());
  deferred.Resolve(Napi::Boolean::New(Env(), success));
}

void DeletePasswordWorker::OnError(Napi::Error const &error) {
  Napi::HandleScope scope(Env());
  deferred.Reject(error.Value());
}

FindPasswordWorker::FindPasswordWorker(
  const std::string& service,
  const Napi::Env &env
) : AsyncWorker(env),
    service(service),
    deferred(Napi::Promise::Deferred::New(env)) {}

FindPasswordWorker::~FindPasswordWorker() {}

Napi::Promise FindPasswordWorker::Promise() {
  return deferred.Promise();
}

void FindPasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::FindPassword(service,
                                                 &password,
                                                 &error);
  if (result == keytar::FAIL_ERROR) {
    SetError(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void FindPasswordWorker::OnOK() {
  Napi::HandleScope scope(Env());
  Napi::Value val = Env().Null();
  if (success) {
    val = Napi::String::New(Env(), password.data(),
                               password.length());
  }
  deferred.Resolve(val);
}

void FindPasswordWorker::OnError(Napi::Error const &error) {
  Napi::HandleScope scope(Env());
  deferred.Reject(error.Value());
}

FindCredentialsWorker::FindCredentialsWorker(
  const std::string& service,
  const Napi::Env &env
) : AsyncWorker(env),
    service(service),
    deferred(Napi::Promise::Deferred::New(env)) {}

FindCredentialsWorker::~FindCredentialsWorker() {}

Napi::Promise FindCredentialsWorker::Promise() {
  return deferred.Promise();
}

void FindCredentialsWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::FindCredentials(service,
                                                    &credentials,
                                                    &error);
  if (result == keytar::FAIL_ERROR) {
    SetError(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void FindCredentialsWorker::OnOK() {
  Napi::HandleScope scope(Env());
  Napi::Env env = Env();

  if (success) {
    Napi::Array val = Napi::Array::New(env, credentials.size());
    unsigned int idx = 0;
    std::vector<keytar::Credentials>::iterator it;
    for (it = credentials.begin(); it != credentials.end(); it++) {
      keytar::Credentials cred = *it;
      Napi::Object obj = Napi::Object::New(env);

      Napi::String account = Napi::String::New(env,
        cred.first.data(),
        cred.first.length());

      Napi::String password = Napi::String::New(env,
        cred.second.data(),
        cred.second.length());

#ifndef _WIN32
#pragma GCC diagnostic ignored "-Wunused-result"
#endif
      obj.Set("account", account);
#ifndef _WIN32
#pragma GCC diagnostic ignored "-Wunused-result"
#endif
      obj.Set("password", password);

      (val).Set(idx, obj);
      ++idx;
    }

    deferred.Resolve(val);
  } else {
    deferred.Resolve(Napi::Array::New(env, 0));
  }
}

void FindCredentialsWorker::OnError(Napi::Error const &error) {
  Napi::HandleScope scope(Env());
  deferred.Reject(error.Value());
}
