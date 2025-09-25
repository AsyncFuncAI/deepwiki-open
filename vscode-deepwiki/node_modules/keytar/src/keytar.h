#ifndef SRC_KEYTAR_H_
#define SRC_KEYTAR_H_

#include <string>
#include <vector>

#include "credentials.h"

namespace keytar {

enum KEYTAR_OP_RESULT {
  SUCCESS,
  FAIL_ERROR,
  FAIL_NONFATAL
};

KEYTAR_OP_RESULT SetPassword(const std::string& service,
                             const std::string& account,
                             const std::string& password,
                             std::string* error);

KEYTAR_OP_RESULT GetPassword(const std::string& service,
                             const std::string& account,
                             std::string* password,
                             std::string* error);

KEYTAR_OP_RESULT DeletePassword(const std::string& service,
                                const std::string& account,
                                std::string* error);

KEYTAR_OP_RESULT FindPassword(const std::string& service,
                              std::string* password,
                              std::string* error);

KEYTAR_OP_RESULT FindCredentials(const std::string& service,
                                 std::vector<Credentials>*,
                                 std::string* error);

}  // namespace keytar

#endif  // SRC_KEYTAR_H_
