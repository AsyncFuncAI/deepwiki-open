#include "napi.h"
#include "async.h"

namespace {

Napi::Value SetPassword(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Parameter 'service' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string service = info[0].As<Napi::String>();

  if (!info[1].IsString()) {
    Napi::TypeError::New(env, "Parameter 'username' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string username = info[1].As<Napi::String>();

  if (!info[2].IsString()) {
    Napi::TypeError::New(env, "Parameter 'password' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string password = info[2].As<Napi::String>();

  SetPasswordWorker* worker = new SetPasswordWorker(
    service,
    username,
    password,
    env);
  worker->Queue();
  return worker->Promise();
}

Napi::Value GetPassword(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Parameter 'service' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string service = info[0].As<Napi::String>();

  if (!info[1].IsString()) {
    Napi::TypeError::New(env, "Parameter 'username' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string username = info[1].As<Napi::String>();

  GetPasswordWorker* worker = new GetPasswordWorker(
    service,
    username,
    env);
  worker->Queue();
  return worker->Promise();
}

Napi::Value DeletePassword(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Parameter 'service' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string service = info[0].As<Napi::String>();

  if (!info[1].IsString()) {
    Napi::TypeError::New(env, "Parameter 'username' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string username = info[1].As<Napi::String>();

  DeletePasswordWorker *worker = new DeletePasswordWorker(
    service,
    username,
    env);
  worker->Queue();
  return worker->Promise();
}

Napi::Value FindPassword(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Parameter 'service' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string service = info[0].As<Napi::String>();

  FindPasswordWorker* worker = new FindPasswordWorker(
    service,
    env);
  worker->Queue();
  return worker->Promise();
}

Napi::Value FindCredentials(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Parameter 'service' must be a string").
      ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string service = info[0].As<Napi::String>();

  FindCredentialsWorker* worker = new FindCredentialsWorker(
    service,
    env);
  worker->Queue();
  return worker->Promise();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("getPassword", Napi::Function::New(env, GetPassword));
  exports.Set("setPassword", Napi::Function::New(env, SetPassword));
  exports.Set("deletePassword", Napi::Function::New(env, DeletePassword));
  exports.Set("findPassword", Napi::Function::New(env, FindPassword));
  exports.Set("findCredentials", Napi::Function::New(env, FindCredentials));
  return exports;
}

}  // namespace

NODE_API_MODULE(keytar, Init)
