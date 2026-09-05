import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      name: 'ORENZA',
      version: process.env.npm_package_version || '0.1.2',
      environment: process.env.NODE_ENV || 'production',
      build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 'local',
      downloadUrl: 'https://github.com/Asian-ubong/orenza-platform/releases/latest/download/orenza-debug.apk',
      updatedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
