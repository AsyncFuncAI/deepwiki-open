import { NextRequest, NextResponse } from 'next/server';

// Proxy for the backend's repository-indexing endpoint.
//
// The backend streams Server-Sent Events (a heartbeat/progress line at least
// every ~10s), so this route just pipes the byte stream straight through. No
// custom fetch timeout is needed: the first byte (headers) arrives immediately
// and heartbeats keep the body well within undici's default 300s timeouts.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8001';

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const targetUrl = `${TARGET_SERVER_BASE_URL}/repo/prepare`;

    const backendResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorBody = await backendResponse.text().catch(() => '');
      return new NextResponse(errorBody || 'Failed to start repository indexing', {
        status: backendResponse.status || 500,
      });
    }

    // Pipe the SSE stream from the backend to the client.
    const stream = new ReadableStream({
      async start(controller) {
        const reader = backendResponse.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Error reading from backend prepare stream in proxy:', error);
          controller.error(error);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
      cancel(reason) {
        console.log('Client cancelled repo prepare stream:', reason);
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Error in API proxy route (/api/repo/prepare):', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error in proxy';
    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
