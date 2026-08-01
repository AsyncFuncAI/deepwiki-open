/**
 * WebSocket client for chat completions
 * This replaces the HTTP streaming endpoint with a WebSocket connection
 */

// Build the WebSocket URL for the chat endpoint.
//
// This code runs in the browser, so it must NOT rely on `process.env.SERVER_BASE_URL`
// (that is a server-only variable — it is `undefined` in the browser bundle and its
// value `localhost:8001` would point at the viewer's own machine, not the server).
//
// Instead we derive the target from the host the site is actually served from, and
// connect to the backend's API port (exposed separately from the Next.js port).
// Overrides:
//   - NEXT_PUBLIC_WS_BASE_URL : full base URL, e.g. "wss://deepwiki.example.com" (best for reverse proxies)
//   - NEXT_PUBLIC_API_PORT    : backend port when it differs from the default 8001
// Resolve the backend WebSocket base (scheme + host + port), without a path.
const getWsBase = () => {
  const explicitBase = process.env.NEXT_PUBLIC_WS_BASE_URL;
  if (explicitBase) {
    return explicitBase.replace(/\/+$/, '').replace(/^http/, 'ws');
  }
  if (typeof window !== 'undefined') {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_API_PORT || '8001';
    return `${wsProtocol}//${host}:${port}`;
  }
  return (process.env.SERVER_BASE_URL || 'http://localhost:8001').replace(/^http/, 'ws');
};

const getWebSocketUrl = () => `${getWsBase()}/ws/chat`;

// HTTP base of the backend API (same host/port as the WebSocket base).
export const getApiBaseUrl = () => getWsBase().replace(/^ws/, 'http');

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: 'normal' | 'deep_research';
}

export interface ChatCompletionRequest {
  repo_url: string;
  messages: ChatMessage[];
  filePath?: string;
  token?: string;
  type?: string;
  provider?: string;
  model?: string;
  language?: string;
  research_iteration?: number;
  excluded_dirs?: string;
  excluded_files?: string;
}

/**
 * Creates a WebSocket connection for chat completions
 * @param request The chat completion request
 * @param onMessage Callback for received messages
 * @param onError Callback for errors
 * @param onClose Callback for when the connection closes
 * @returns The WebSocket connection
 */
export const createChatWebSocket = (
  request: ChatCompletionRequest,
  onMessage: (message: string) => void,
  onError: (error: Event) => void,
  onClose: () => void
): WebSocket => {
  // Create WebSocket connection
  const ws = new WebSocket(getWebSocketUrl());

  // Set up event handlers
  ws.onopen = () => {
    console.log('WebSocket connection established');
    // Send the request as JSON
    ws.send(JSON.stringify(request));
  };

  ws.onmessage = (event) => {
    // Call the message handler with the received text
    onMessage(event.data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError(error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    onClose();
  };

  return ws;
};

/**
 * Closes a WebSocket connection
 * @param ws The WebSocket connection to close
 */
export const closeWebSocket = (ws: WebSocket | null): void => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
};

/* ------------------------------------------------------------------ *
 *  Codemap: source-grounded step-by-step guide generation             *
 * ------------------------------------------------------------------ */

export interface CodemapCitation {
  file_path: string;
  start_line: number | null;
  end_line: number | null;
  snippet: string;
}

export interface CodemapStep {
  id: string;
  label: string;
  code: string;
  citation: CodemapCitation | null;
}

export interface CodemapSection {
  id: string;
  title: string;
  guide: string;
  diagram: string;
  steps: CodemapStep[];
}

export interface CodemapData {
  title: string;
  summary: string;
  sections: CodemapSection[];
}

export interface CodemapRequest {
  repo_url: string;
  question: string;
  token?: string;
  type?: string;
  provider?: string;
  model?: string;
  language?: string;
  excluded_dirs?: string;
  excluded_files?: string;
}

export type CodemapPhase = 'analyzing' | 'initial_codemap' | 'diagrams';

// One NDJSON event streamed from the backend.
export type CodemapEvent =
  | { type: 'phase'; phase: CodemapPhase; status: 'start' | 'done'; [k: string]: unknown }
  | { type: 'codemap'; data: CodemapData }
  | { type: 'error'; message: string; stage?: string }
  | { type: 'done' };

export interface CodemapHandlers {
  onEvent: (event: CodemapEvent) => void;
  onError: (error: Event) => void;
  onClose: () => void;
}

const getCodemapWebSocketUrl = () => `${getWsBase()}/ws/codemap`;

/**
 * Opens a WebSocket to the codemap endpoint and parses the NDJSON event stream.
 * Frames are buffered and split on newlines so partial/merged frames are handled.
 */
export const createCodemapWebSocket = (
  request: CodemapRequest,
  { onEvent, onError, onClose }: CodemapHandlers
): WebSocket => {
  const ws = new WebSocket(getCodemapWebSocketUrl());
  let buffer = '';

  const flush = (chunk: string, final = false) => {
    buffer += chunk;
    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (line) {
        try {
          onEvent(JSON.parse(line) as CodemapEvent);
        } catch (e) {
          console.error('Failed to parse codemap event:', line, e);
        }
      }
    }
    if (final && buffer.trim()) {
      try {
        onEvent(JSON.parse(buffer.trim()) as CodemapEvent);
      } catch {
        /* ignore trailing partial */
      }
      buffer = '';
    }
  };

  ws.onopen = () => ws.send(JSON.stringify(request));
  ws.onmessage = (event) => flush(event.data as string);
  ws.onerror = (error) => {
    console.error('Codemap WebSocket error:', error);
    onError(error);
  };
  ws.onclose = () => {
    flush('', true);
    onClose();
  };

  return ws;
};
