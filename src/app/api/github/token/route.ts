import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 从环境变量读取预配置的GitHub token
    const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    
    return NextResponse.json({
      token: githubToken || null,
      hasToken: !!githubToken
    });
  } catch (error) {
    console.error('Error fetching GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub token configuration' },
      { status: 500 }
    );
  }
} 