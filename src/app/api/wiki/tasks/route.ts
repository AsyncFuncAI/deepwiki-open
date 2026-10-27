import { NextRequest, NextResponse } from 'next/server';

// Proxy for the backend wiki-task endpoints.
const TARGET_SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8001';

function json(text: string, status: number): NextResponse {
  return new NextResponse(text, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/wiki/tasks -> submit (get-or-create) a wiki-generation task.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${TARGET_SERVER_BASE_URL}/wiki/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return json(await res.text(), res.status);
  } catch (error) {
    console.error('Error in /api/wiki/tasks POST proxy:', error);
    return json(JSON.stringify({ error: 'Failed to submit wiki task' }), 502);
  }
}

// GET /api/wiki/tasks[?status=active|completed] -> list tasks.
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status');
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${TARGET_SERVER_BASE_URL}/wiki/tasks${qs}`);
    return json(await res.text(), res.status);
  } catch (error) {
    console.error('Error in /api/wiki/tasks GET proxy:', error);
    return json(JSON.stringify({ error: 'Failed to list wiki tasks' }), 502);
  }
}
