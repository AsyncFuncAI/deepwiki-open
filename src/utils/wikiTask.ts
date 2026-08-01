// Client helpers for the backend-driven wiki-generation Task model.
//
// The backend owns index + wiki generation as an asyncio Task (SPEC.md). The
// browser only:
//   1. submits a task (get-or-create, deduped per repo), then
//   2. subscribes to an SSE progress stream until a terminal done/error, then
//   3. loads the finished wiki from the server cache (handled by the caller).
//
// Wire field names match the backend exactly (snake_case, e.g. `submitted_at`).

export type TaskStatusValue =
  | 'pending'
  | 'indexing'
  | 'determining_structure'
  | 'generating'
  | 'completed'
  | 'failed';

export interface WikiTaskSubmitRequest {
  repo_url: string;
  type: string;
  owner: string;
  repo: string;
  comprehensive?: boolean;
  token?: string;
  provider?: string;
  model?: string;
  language?: string;
  excluded_dirs?: string;
  excluded_files?: string;
  included_dirs?: string;
  included_files?: string;
}

export interface WikiTaskSubmitResult {
  task_id: string;
  status: TaskStatusValue | string;
  created: boolean;
  joined: boolean;
  from_cache: boolean;
}

export interface WikiTaskPageDto {
  id: string;
  title: string;
  content: string;
  filePaths: string[];
  importance: string;
  relatedPages: string[];
}

export interface WikiTaskStructureDto {
  id: string;
  title: string;
  description: string;
  pages: WikiTaskPageDto[];
  sections?: unknown[] | null;
  rootSections?: string[] | null;
}

export interface WikiTaskSummaryDto {
  id: string;
  owner: string;
  repo: string;
  repo_type: string;
  language: string;
  status: TaskStatusValue | string;
  pages_done: number;
  pages_total: number;
  current_page_ids: string[];
  error?: string | null;
  submitted_at: number;
  name: string;
}

export interface WikiTaskStatusDto extends WikiTaskSummaryDto {
  wiki_structure?: WikiTaskStructureDto | null;
}

export interface SubscribeWikiTaskHandlers {
  onProgress?: (status: WikiTaskStatusDto) => void;
  onDone?: (status: WikiTaskStatusDto | null) => void;
  onError?: (message: string) => void;
}

// Drop undefined/empty-string values so we never send them to the backend.
function clean(req: WikiTaskSubmitRequest): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(req)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v === '') continue;
    out[k] = v;
  }
  return out;
}

// Submit a repo for index + wiki generation (get-or-create; deduped per repo).
export async function submitWikiTask(
  req: WikiTaskSubmitRequest,
): Promise<WikiTaskSubmitResult> {
  const res = await fetch('/api/wiki/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clean(req)),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Failed to submit wiki task (${res.status}): ${detail}`);
  }
  return res.json();
}

// List tasks. Omit `status` for the homepage list (completed first, queued last).
export async function listWikiTasks(
  status?: 'active' | 'completed',
): Promise<WikiTaskSummaryDto[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`/api/wiki/tasks${qs}`);
  if (!res.ok) {
    throw new Error(`Failed to list wiki tasks (${res.status})`);
  }
  return res.json();
}

// Single task status. Returns null on 404 (task is gone -> caller falls back to cache).
export async function getWikiTask(
  taskId: string,
): Promise<WikiTaskStatusDto | null> {
  const res = await fetch(`/api/wiki/tasks/${encodeURIComponent(taskId)}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch wiki task (${res.status})`);
  }
  return res.json();
}

// Subscribe to the SSE progress stream. Returns an unsubscribe function.
//
// The backend emits three named events: `progress` (repeated), `done`, `error`.
// EventSource routes a server-sent `event: error` frame to the same listener as
// a connection-level error, so we distinguish them by the presence of `data`.
export function subscribeWikiTask(
  taskId: string,
  handlers: SubscribeWikiTaskHandlers,
): () => void {
  const es = new EventSource(
    `/api/wiki/tasks/${encodeURIComponent(taskId)}/stream`,
  );

  const parse = (data: string): WikiTaskStatusDto | null => {
    try {
      return JSON.parse(data) as WikiTaskStatusDto;
    } catch {
      return null;
    }
  };

  es.addEventListener('progress', (e) => {
    const status = parse((e as MessageEvent).data);
    if (status) handlers.onProgress?.(status);
  });

  es.addEventListener('done', (e) => {
    const status = parse((e as MessageEvent).data);
    es.close();
    handlers.onDone?.(status);
  });

  es.addEventListener('error', (e) => {
    const me = e as MessageEvent;
    // A server-sent `event: error` frame carries a JSON payload in `data`.
    if (me && typeof me.data === 'string' && me.data) {
      const status = parse(me.data);
      es.close();
      handlers.onError?.(status?.error || 'Wiki generation failed');
      return;
    }
    // Otherwise this is a connection-level error. EventSource auto-retries while
    // the connection is still open; only surface a failure once it has closed.
    if (es.readyState === EventSource.CLOSED) {
      handlers.onError?.('Task stream connection lost');
    }
  });

  return () => es.close();
}
