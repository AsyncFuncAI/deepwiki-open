#include "keytar.h"

// This is needed to make the builds on Ubuntu 14.04 / libsecret v0.16 work.
// The API we use has already stabilized.
#define SECRET_API_SUBJECT_TO_CHANGE
#include <libsecret/secret.h>
#include <stdio.h>
#include <string.h>

namespace keytar {

namespace {

static const SecretSchema schema = {
  "org.freedesktop.Secret.Generic", SECRET_SCHEMA_NONE, {
    { "service", SECRET_SCHEMA_ATTRIBUTE_STRING },
    { "account", SECRET_SCHEMA_ATTRIBUTE_STRING }
  }
};

}  // namespace

KEYTAR_OP_RESULT SetPassword(const std::string& service,
                             const std::string& account,
                             const std::string& password,
                             std::string* errStr) {
  GError* error = NULL;

  secret_password_store_sync(
    &schema,                            // The schema.
    SECRET_COLLECTION_DEFAULT,          // Default collection.
    (service + "/" + account).c_str(),  // The label.
    password.c_str(),                   // The password.
    NULL,                               // Cancellable. (unneeded)
    &error,                             // Reference to the error.
    "service", service.c_str(),
    "account", account.c_str(),
    NULL);                              // End of arguments.

  if (error != NULL) {
    *errStr = std::string(error->message);
    g_error_free(error);
    return FAIL_ERROR;
  }

  return SUCCESS;
}

KEYTAR_OP_RESULT GetPassword(const std::string& service,
                             const std::string& account,
                             std::string* password,
                             std::string* errStr) {
  GError* error = NULL;

  gchar* raw_password = secret_password_lookup_sync(
    &schema,                            // The schema.
    NULL,                               // Cancellable. (unneeded)
    &error,                             // Reference to the error.
    "service", service.c_str(),
    "account", account.c_str(),
    NULL);                              // End of arguments.

  if (error != NULL) {
    *errStr = std::string(error->message);
    g_error_free(error);
    return FAIL_ERROR;
  }

  if (raw_password == NULL)
    return FAIL_NONFATAL;

  *password = raw_password;
  secret_password_free(raw_password);
  return SUCCESS;
}

KEYTAR_OP_RESULT DeletePassword(const std::string& service,
                                const std::string& account,
                                std::string* errStr) {
  GError* error = NULL;

  gboolean result = secret_password_clear_sync(
    &schema,                            // The schema.
    NULL,                               // Cancellable. (unneeded)
    &error,                             // Reference to the error.
    "service", service.c_str(),
    "account", account.c_str(),
    NULL);                              // End of arguments.

  if (error != NULL) {
    *errStr = std::string(error->message);
    g_error_free(error);
    return FAIL_ERROR;
  }

  if (!result)
    return FAIL_NONFATAL;

  return SUCCESS;
}

KEYTAR_OP_RESULT FindPassword(const std::string& service,
                              std::string* password,
                              std::string* errStr) {
  GError* error = NULL;

  gchar* raw_password = secret_password_lookup_sync(
    &schema,                            // The schema.
    NULL,                               // Cancellable. (unneeded)
    &error,                             // Reference to the error.
    "service", service.c_str(),
    NULL);                              // End of arguments.

  if (error != NULL) {
    *errStr = std::string(error->message);
    g_error_free(error);
    return FAIL_ERROR;
  }

  if (raw_password == NULL)
    return FAIL_NONFATAL;

  *password = raw_password;
  secret_password_free(raw_password);
  return SUCCESS;
}

KEYTAR_OP_RESULT FindCredentials(const std::string& service,
                                 std::vector<Credentials>* credentials,
                                 std::string* errStr) {
  GError* error = NULL;

  GHashTable* attributes = g_hash_table_new(NULL, NULL);
  g_hash_table_replace(attributes,
                       (gpointer) "service",
                       (gpointer) service.c_str());

  GList* items = secret_service_search_sync(
    NULL,
    &schema,                            // The schema.
    attributes,
    static_cast<SecretSearchFlags>(SECRET_SEARCH_ALL | SECRET_SEARCH_UNLOCK |
                                   SECRET_SEARCH_LOAD_SECRETS),
    NULL,                               // Cancellable. (unneeded)
    &error);                             // Reference to the error.

  g_hash_table_destroy(attributes);

  if (error != NULL) {
    *errStr = std::string(error->message);
    g_error_free(error);
    return FAIL_ERROR;
  }

  GList* current = items;
  for (current = items; current != NULL; current = current->next) {
    SecretItem* item = reinterpret_cast<SecretItem*>(current->data);

    GHashTable* itemAttrs = secret_item_get_attributes(item);
    char* account = strdup(
      reinterpret_cast<char*>(g_hash_table_lookup(itemAttrs, "account")));

    SecretValue* secret = secret_item_get_secret(item);
    char* password = strdup(secret_value_get_text(secret));

    if (account == NULL || password == NULL) {
      if (account)
        free(account);

      if (password)
        free(password);

      continue;
    }

    credentials->push_back(Credentials(account, password));
    free(account);
    free(password);
  }

  return SUCCESS;
}

}  // namespace keytar
