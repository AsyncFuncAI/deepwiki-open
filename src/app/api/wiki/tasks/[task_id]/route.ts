import { NextRequest, NextResponse } from 'next/server';

const TARGET_SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8001';

// GET /api/wiki/tasks/:task_id -> single task status (404 once the task is gone).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ task_id: string }> },
) {
  const { task_id } = await params;
  try {
    const res = await fetch(
      `${TARGET_SERVER_BASE_URL}/wiki/tasks/${encodeURIComponent(task_id)}`,
    );
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/wiki/tasks/[task_id] GET proxy:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch wiki task' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
