import { NextRequest, NextResponse } from 'next/server';

const TARGET_SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8001';

// GET /api/wiki/tasks/:task_id/stream -> proxy the backend SSE progress stream.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ task_id: string }> },
) {
  const { task_id } = await params;
  try {
    const upstream = await fetch(
      `${TARGET_SERVER_BASE_URL}/wiki/tasks/${encodeURIComponent(task_id)}/stream`,
      { headers: { Accept: 'text/event-stream' } },
    );

    if (!upstream.ok || !upstream.body) {
      return new NextResponse(await upstream.text(), {
        status: upstream.status || 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Error in /api/wiki/tasks/[task_id]/stream GET proxy:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to open task stream' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
