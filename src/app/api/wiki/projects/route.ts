import { NextResponse } from 'next/server';

// This should match the expected structure from your Python backend
interface ApiProcessedProject {
  id: string;
  owner: string;
  repo: string;
  name: string;
  repo_type: string;
  submittedAt: number;
  language: string;
}

// Ensure this matches your Python backend configuration
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_HOST || 'http://localhost:8001';
const PROJECTS_API_ENDPOINT = `${PYTHON_BACKEND_URL}/api/processed_projects`;

export async function GET() {
  try {
    const response = await fetch(PROJECTS_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers your Python backend might require, e.g., API keys
      },
      cache: 'no-store', // Ensure fresh data is fetched every time
    });

    if (!response.ok) {
      // Try to parse error from backend, otherwise use status text
      let errorBody = { error: `Failed to fetch from Python backend: ${response.statusText}` };
      try {
        errorBody = await response.json();
      } catch {
        // If parsing JSON fails, errorBody will retain its default value
        // The error from backend is logged in the next line anyway
      }
      console.error(`Error from Python backend (${PROJECTS_API_ENDPOINT}): ${response.status} - ${JSON.stringify(errorBody)}`);
      return NextResponse.json(errorBody, { status: response.status });
    }

    const projects: ApiProcessedProject[] = await response.json();
    return NextResponse.json(projects);

  } catch (error: unknown) {
    console.error(`Network or other error when fetching from ${PROJECTS_API_ENDPOINT}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to connect to the Python backend. ${message}` },
      { status: 503 } // Service Unavailable
    );
  }
} 