import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PACKAGE_VERSION = '0.1.5';
const DEFAULT_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.orenzatech.orenza';

function normalizeVersion(value: string | undefined, fallback: string) {
  const candidate = value?.trim();
  return candidate && /^\d+(?:\.\d+){0,3}$/.test(candidate) ? candidate : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform') || 'android';

  if (platform !== 'android') {
    return NextResponse.json({ error: 'Unsupported update platform' }, { status: 400 });
  }

  const latestVersion = normalizeVersion(
    process.env.ORENZA_ANDROID_LATEST_VERSION || process.env.npm_package_version,
    PACKAGE_VERSION,
  );
  const minimumVersion = normalizeVersion(process.env.ORENZA_ANDROID_MIN_VERSION, '0.1.4');
  const playStoreUrl = process.env.ORENZA_ANDROID_PLAY_STORE_URL || DEFAULT_PLAY_STORE_URL;
  const forceUpdate = process.env.ORENZA_ANDROID_FORCE_UPDATE === 'true';

  return NextResponse.json(
    {
      name: 'ORENZA',
      platform: 'android',
      version: latestVersion,
      minimumVersion,
      forceUpdate,
      playStoreUrl,
      releaseNotes: [
        'ORENZA Android update system',
        'Performance and stability improvements',
        'Bug fixes and release hardening',
      ],
      environment: process.env.NODE_ENV || 'production',
      build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 'local',
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    },
  );
}
