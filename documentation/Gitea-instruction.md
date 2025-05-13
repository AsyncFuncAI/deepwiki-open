# Gitea Configuration for Deepwiki-Open Integration

This document explains how to configure **CORS** in your self-hosted Gitea instance so that Deepwiki-Open can access its REST API directly from the browser.

If CORS is not properly configured, modern browsers will block API requests for security reasons — even if the server is running and reachable.

---

## 🔐 Why CORS Matters

Modern web browsers enforce a security mechanism called **Cross-Origin Resource Sharing (CORS)** to protect users from malicious cross-site requests.

When Deepwiki-Open attempts to call the Gitea REST API from a different origin (e.g. `https://deepwiki.selfhosted.local`), the browser first sends an automatic `OPTIONS` **preflight** request.  
This checks whether the server explicitly allows such cross-origin requests.

If Gitea does **not** respond correctly (e.g. missing `Access-Control-Allow-Origin`), the browser will block the actual request — even before it reaches Gitea.

---

## ✅ Required Gitea Configuration (`app.ini`)

To allow your Gitea instance to be accessed from a browser frontend, you must add the following configuration:

```ini
[cors]
ENABLED = true
ALLOW_DOMAIN = https://deepwiki.selfhosted.local
METHODS = GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
HEADERS = Authorization, Content-Type
ALLOW_CREDENTIALS = true
````

### Notes:

* `ALLOW_DOMAIN` must match the origin of your Deepwiki-Open frontend (protocol included).
* If you use tokens or custom headers, make sure `Authorization` is listed under `HEADERS`.
* Restart your Gitea instance after applying this configuration.

---

## ⚠️ Important

* Do **not** combine this `[cors]` section with legacy `[server]` CORS options (`ENABLE_CORS`, `CORS_ALLOW_DOMAIN`, etc.) — they are for Git over HTTP and **do not affect API routes**.
* If the CORS config is missing or misconfigured, **browsers will block Deepwiki-Open's API access entirely** due to missing preflight validation.

---

## 🔍 How to Verify

After restarting your Gitea instance with the correct config:

* You should see `Access-Control-Allow-Origin` in the response headers to any request from your frontend origin.
* If not, double-check your config file path and environment variables (`GITEA_CUSTOM` should point to your config root).

---

## 📎 References

* [Gitea Docs](https://docs.gitea.com/)
* [Config Example (app.ini)](https://github.com/go-gitea/gitea/blob/main/custom/conf/app.example.ini)

