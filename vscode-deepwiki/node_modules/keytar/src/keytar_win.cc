#include "keytar.h"

#define UNICODE

#include <windows.h>
#include <wincred.h>

#include "credentials.h"

namespace keytar {

LPWSTR utf8ToWideChar(std::string utf8) {
  int wide_char_length = MultiByteToWideChar(CP_UTF8,
                                             0,
                                             utf8.c_str(),
                                             -1,
                                             NULL,
                                             0);
  if (wide_char_length == 0) {
    return NULL;
  }

  LPWSTR result = new WCHAR[wide_char_length];
  if (MultiByteToWideChar(CP_UTF8,
                          0,
                          utf8.c_str(),
                          -1,
                          result,
                          wide_char_length) == 0) {
    delete[] result;
    return NULL;
  }

  return result;
}

std::string wideCharToAnsi(LPWSTR wide_char) {
  if (wide_char == NULL) {
    return std::string();
  }

  int ansi_length = WideCharToMultiByte(CP_ACP,
                                        0,
                                        wide_char,
                                        -1,
                                        NULL,
                                        0,
                                        NULL,
                                        NULL);
  if (ansi_length == 0) {
    return std::string();
  }

  char* buffer = new char[ansi_length];
  if (WideCharToMultiByte(CP_ACP,
                          0,
                          wide_char,
                          -1,
                          buffer,
                          ansi_length,
                          NULL,
                          NULL) == 0) {
    delete[] buffer;
    return std::string();
  }

  std::string result = std::string(buffer);
  delete[] buffer;
  return result;
}

std::string wideCharToUtf8(LPWSTR wide_char) {
  if (wide_char == NULL) {
    return std::string();
  }

  int utf8_length = WideCharToMultiByte(CP_UTF8,
                                        0,
                                        wide_char,
                                        -1,
                                        NULL,
                                        0,
                                        NULL,
                                        NULL);
  if (utf8_length == 0) {
    return std::string();
  }

  char* buffer = new char[utf8_length];
  if (WideCharToMultiByte(CP_UTF8,
                          0,
                          wide_char,
                          -1,
                          buffer,
                          utf8_length,
                          NULL,
                          NULL) == 0) {
    delete[] buffer;
    return std::string();
  }

  std::string result = std::string(buffer);
  delete[] buffer;
  return result;
}

std::string getErrorMessage(DWORD errorCode) {
  LPWSTR errBuffer;
  ::FormatMessage(FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM,
                  NULL, errorCode, 0, (LPWSTR) &errBuffer, 0, NULL);
  std::string errMsg = wideCharToAnsi(errBuffer);
  LocalFree(errBuffer);
  return errMsg;
}

KEYTAR_OP_RESULT SetPassword(const std::string& service,
                 const std::string& account,
                 const std::string& password,
                 std::string* errStr) {
  LPWSTR target_name = utf8ToWideChar(service + '/' + account);
  if (target_name == NULL) {
    return FAIL_ERROR;
  }

  LPWSTR user_name = utf8ToWideChar(account);
  if (user_name == NULL) {
    return FAIL_ERROR;
  }

  CREDENTIAL cred = { 0 };
  cred.Type = CRED_TYPE_GENERIC;
  cred.TargetName = target_name;
  cred.UserName = user_name;
  cred.CredentialBlobSize = password.size();
  cred.CredentialBlob = (LPBYTE)(password.data());
  cred.Persist = CRED_PERSIST_ENTERPRISE;

  bool result = ::CredWrite(&cred, 0);
  delete[] target_name;
  if (!result) {
    *errStr = getErrorMessage(::GetLastError());
    return FAIL_ERROR;
  } else {
    return SUCCESS;
  }
}

KEYTAR_OP_RESULT GetPassword(const std::string& service,
                 const std::string& account,
                 std::string* password,
                 std::string* errStr) {
  LPWSTR target_name = utf8ToWideChar(service + '/' + account);
  if (target_name == NULL) {
    return FAIL_ERROR;
  }

  CREDENTIAL* cred;
  bool result = ::CredRead(target_name, CRED_TYPE_GENERIC, 0, &cred);
  delete[] target_name;
  if (!result) {
    DWORD code = ::GetLastError();
    if (code == ERROR_NOT_FOUND) {
      return FAIL_NONFATAL;
    } else {
      *errStr = getErrorMessage(code);
      return FAIL_ERROR;
    }
  }

  *password = std::string(reinterpret_cast<char*>(cred->CredentialBlob),
                          cred->CredentialBlobSize);
  ::CredFree(cred);
  return SUCCESS;
}

KEYTAR_OP_RESULT DeletePassword(const std::string& service,
                    const std::string& account,
                    std::string* errStr) {
  LPWSTR target_name = utf8ToWideChar(service + '/' + account);
  if (target_name == NULL) {
    return FAIL_ERROR;
  }

  bool result = ::CredDelete(target_name, CRED_TYPE_GENERIC, 0);
  delete[] target_name;
  if (!result) {
    DWORD code = ::GetLastError();
    if (code == ERROR_NOT_FOUND) {
      return FAIL_NONFATAL;
    } else {
      *errStr = getErrorMessage(code);
      return FAIL_ERROR;
    }
  }

  return SUCCESS;
}

KEYTAR_OP_RESULT FindPassword(const std::string& service,
                  std::string* password,
                  std::string* errStr) {
  LPWSTR filter = utf8ToWideChar(service + "*");
  if (filter == NULL) {
    return FAIL_ERROR;
  }

  DWORD count;
  CREDENTIAL** creds;
  bool result = ::CredEnumerate(filter, 0, &count, &creds);
  delete[] filter;
  if (!result) {
    DWORD code = ::GetLastError();
    if (code == ERROR_NOT_FOUND) {
      return FAIL_NONFATAL;
    } else {
      *errStr = getErrorMessage(code);
      return FAIL_ERROR;
    }
  }

  *password = std::string(reinterpret_cast<char*>(creds[0]->CredentialBlob),
                          creds[0]->CredentialBlobSize);
  ::CredFree(creds);
  return SUCCESS;
}

KEYTAR_OP_RESULT FindCredentials(const std::string& service,
                                 std::vector<Credentials>* credentials,
                                 std::string* errStr) {
  LPWSTR filter = utf8ToWideChar(service + "*");
  if (filter == NULL) {
    *errStr = "Error generating credential filter";
    return FAIL_ERROR;
  }

  DWORD count;
  CREDENTIAL **creds;

  bool result = ::CredEnumerate(filter, 0, &count, &creds);
  if (!result) {
    DWORD code = ::GetLastError();
    if (code == ERROR_NOT_FOUND) {
      return FAIL_NONFATAL;
    } else {
      *errStr = getErrorMessage(code);
      return FAIL_ERROR;
    }
  }

  for (unsigned int i = 0; i < count; ++i) {
    CREDENTIAL* cred = creds[i];

    if (cred->UserName == NULL || cred->CredentialBlobSize == NULL) {
      continue;
    }

    std::string login = wideCharToUtf8(cred->UserName);
    std::string password(
      reinterpret_cast<char*>(
        cred->CredentialBlob),
        cred->CredentialBlobSize);

    credentials->push_back(Credentials(login, password));
  }

  CredFree(creds);

  return SUCCESS;
}


}  // namespace keytar
