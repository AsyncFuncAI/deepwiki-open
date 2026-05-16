const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8001';
const DEFAULT_REPO_URL = '/Users/samroku/dev/deepwiki-open';
const DEFAULT_REPO_TYPE = 'local';
const DEFAULT_PROVIDER = 'ollama';
const DEFAULT_MODEL = 'qwen3:1.7b';
const DEFAULT_LANGUAGE = 'en';

function getConfigValue(primary, fallback) {
  return primary === undefined || primary === null || primary === '' ? fallback : primary;
}

async function readResponseBody(response) {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    output += decoder.decode(value, { stream: true });
  }

  output += decoder.decode();
  return output;
}

export default class DeepWikiPromptfooProvider {
  constructor(options = {}) {
    this.options = options;
    this.config = options.config ?? {};
  }

  id() {
    const provider = getConfigValue(
      this.config.provider,
      process.env.PROMPTFOO_DEEPWIKI_PROVIDER || DEFAULT_PROVIDER,
    );
    const model = getConfigValue(
      this.config.model,
      process.env.PROMPTFOO_DEEPWIKI_MODEL || DEFAULT_MODEL,
    );

    return `deepwiki:${provider}:${model}`;
  }

  async callApi(prompt, context) {
    const startedAt = Date.now();
    const vars = context?.vars ?? {};
    const apiBaseUrl = getConfigValue(
      vars.api_base_url,
      getConfigValue(
        this.config.apiBaseUrl,
        process.env.PROMPTFOO_DEEPWIKI_API_BASE_URL || DEFAULT_API_BASE_URL,
      ),
    );
    const repoUrl = getConfigValue(
      vars.repo_url,
      getConfigValue(
        this.config.repoUrl,
        process.env.PROMPTFOO_DEEPWIKI_REPO_URL || DEFAULT_REPO_URL,
      ),
    );
    const repoType = getConfigValue(
      vars.repo_type,
      getConfigValue(
        this.config.repoType,
        process.env.PROMPTFOO_DEEPWIKI_REPO_TYPE || DEFAULT_REPO_TYPE,
      ),
    );
    const provider = getConfigValue(
      vars.provider,
      getConfigValue(
        this.config.provider,
        process.env.PROMPTFOO_DEEPWIKI_PROVIDER || DEFAULT_PROVIDER,
      ),
    );
    const model = getConfigValue(
      vars.model,
      getConfigValue(
        this.config.model,
        process.env.PROMPTFOO_DEEPWIKI_MODEL || DEFAULT_MODEL,
      ),
    );
    const language = getConfigValue(
      vars.language,
      getConfigValue(
        this.config.language,
        process.env.PROMPTFOO_DEEPWIKI_LANGUAGE || DEFAULT_LANGUAGE,
      ),
    );
    const filePath = getConfigValue(vars.file_path, this.config.filePath);
    const includedFiles = getConfigValue(
      vars.included_files,
      getConfigValue(this.config.includedFiles, filePath || undefined),
    );
    const includedDirs = getConfigValue(vars.included_dirs, this.config.includedDirs);
    const excludedFiles = getConfigValue(vars.excluded_files, this.config.excludedFiles);
    const excludedDirs = getConfigValue(vars.excluded_dirs, this.config.excludedDirs);
    const endpoint = new URL('/chat/completions/stream', apiBaseUrl).toString();

    const payload = {
      repo_url: repoUrl,
      type: repoType,
      provider,
      model,
      language,
      messages: [
        {
          role: 'user',
          content: String(prompt).trim(),
        },
      ],
    };

    if (filePath) {
      payload.filePath = filePath;
    }
    if (includedFiles) {
      payload.included_files = includedFiles;
    }
    if (includedDirs) {
      payload.included_dirs = includedDirs;
    }
    if (excludedFiles) {
      payload.excluded_files = excludedFiles;
    }
    if (excludedDirs) {
      payload.excluded_dirs = excludedDirs;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const output = (await readResponseBody(response)).trim();
      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        return {
          error: output || `DeepWiki request failed with status ${response.status}`,
          latencyMs,
          metadata: {
            http: {
              status: response.status,
              statusText: response.statusText,
            },
            deepwiki: {
              endpoint,
              repoUrl,
              repoType,
              provider,
              model,
              language,
              filePath: filePath || null,
              includedFiles: includedFiles || null,
              includedDirs: includedDirs || null,
            },
          },
        };
      }

      return {
        output,
        latencyMs,
        metadata: {
          http: {
            status: response.status,
            statusText: response.statusText,
          },
          deepwiki: {
            endpoint,
            repoUrl,
            repoType,
            provider,
            model,
            language,
            filePath: filePath || null,
            includedFiles: includedFiles || null,
            includedDirs: includedDirs || null,
          },
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Date.now() - startedAt,
        metadata: {
          deepwiki: {
            endpoint,
            repoUrl,
            repoType,
            provider,
            model,
            language,
            filePath: filePath || null,
            includedFiles: includedFiles || null,
            includedDirs: includedDirs || null,
          },
        },
      };
    }
  }
}
