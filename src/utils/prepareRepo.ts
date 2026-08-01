// Client helper that warms the backend embedding index for a repository via
// the /api/repo/prepare SSE endpoint.
//
// Why this exists: indexing a large repo can take many minutes. If that cold
// embedding runs inside the first chat request, the backend sends no HTTP
// headers until it finishes and the proxy fetch dies with a headers timeout
// (UND_ERR_HEADERS_TIMEOUT). Calling this first moves the slow work to a
// dedicated streaming endpoint that emits progress, so the subsequent chat /
// wiki-structure requests hit a warm cache and return quickly.

export interface PrepareProgress {
  elapsedSec?: number;
}

interface SseFrame {
  event: string;
  data: string;
}

function parseSseFrame(frame: string): SseFrame | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith(':')) continue; // comment / heartbeat -> ignore
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }
  if (dataLines.length === 0 && event === 'message') return null;
  return { event, data: dataLines.join('\n') };
}

/**
 * Trigger (or resume) indexing of a repository and resolve once it is ready.
 *
 * Resolves when the backend reports `event: done` (including the fast path
 * where the repo is already indexed). Rejects on `event: error` or a transport
 * failure so the caller can decide whether to abort or fall back to on-demand
 * indexing inside the chat request.
 *
 * @param body     Request body: repo_url, type, token?, provider, model, excluded/included dirs and files.
 * @param onProgress  Optional callback invoked on each progress heartbeat.
 * @param signal   Optional AbortSignal to cancel the request.
 */
export async function prepareRepoIndex(
  body: Record<string, unknown>,
  onProgress?: (progress: PrepareProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/repo/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to start repository indexing: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      const parsed = parseSseFrame(frame);
      if (!parsed) continue;

      if (parsed.event === 'error') {
        let message = 'Repository indexing failed';
        try {
          message = JSON.parse(parsed.data).error ?? message;
        } catch {
          /* keep default message */
        }
        throw new Error(message);
      }

      if (parsed.event === 'progress') {
        try {
          onProgress?.({ elapsedSec: JSON.parse(parsed.data).elapsed_sec });
        } catch {
          onProgress?.({});
        }
      }

      if (parsed.event === 'done') {
        return; // indexing complete (or already indexed via the 'ready' fast path)
      }
      // 'ready' is followed by 'done'; keep reading.
    }
  }
  // Stream ended without an explicit 'done'; treat as complete to avoid hanging.
}
