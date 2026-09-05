'use client';

import { useEffect, useMemo, useState } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const WEB_FALLBACK_VERSION = '0.1.4';
const REMINDER_KEY = 'orenza.update.remind-until.v1';
const DISMISSED_KEY = 'orenza.update.dismissed-session.v1';
const REMINDER_MS = 24 * 60 * 60 * 1000;

export type UpdateInfo = {
  name?: string;
  version?: string;
  minimumVersion?: string;
  forceUpdate?: boolean;
  playStoreUrl?: string;
  releaseNotes?: string[];
};

export function compareVersions(a: string, b: string) {
  const aa = a.split('.').map(Number);
  const bb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(aa.length, bb.length); i += 1) {
    const left = Number.isFinite(aa[i]) ? aa[i] : 0;
    const right = Number.isFinite(bb[i]) ? bb[i] : 0;
    if (left !== right) return left - right;
  }
  return 0;
}

function readNumber(key: string) {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function isDismissedForSession() {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function UpdateNotice() {
  const [installedVersion, setInstalledVersion] = useState(WEB_FALLBACK_VERSION);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdate = async () => {
    let currentVersion = WEB_FALLBACK_VERSION;

    try {
      const info = await App.getInfo();
      if (info.version) currentVersion = info.version;
    } catch {
      // Web builds do not expose native app metadata; use the web fallback.
    }

    setInstalledVersion(currentVersion);

    try {
      const response = await fetch(`/api/version?platform=android&client=${encodeURIComponent(currentVersion)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) return;

      const data = (await response.json()) as UpdateInfo;
      if (!data.version) return;

      const newer = compareVersions(data.version, currentVersion) > 0;
      const belowMinimum = Boolean(data.minimumVersion) && compareVersions(currentVersion, data.minimumVersion || '0.0.0') < 0;
      const shouldShow = newer || belowMinimum;

      if (shouldShow) setUpdate(data);
      else setUpdate(null);
    } catch {
      // Update checks must never block or break the ORENZA application.
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      setDismissed(isDismissedForSession());
      await checkForUpdate();
    };

    run();
    const timer = window.setInterval(run, 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const forced = Boolean(update?.forceUpdate) || Boolean(update?.minimumVersion && compareVersions(installedVersion, update.minimumVersion) < 0);
  const reminderActive = useMemo(() => readNumber(REMINDER_KEY) > Date.now(), [update]);

  if (!update?.version || (!forced && (dismissed || reminderActive))) return null;

  const openPlayStore = async () => {
    const url = update.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.orenzatech.orenza';
    setBusy(true);
    try {
      await Browser.open({ url, presentationStyle: 'popover' });
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      window.setTimeout(() => setBusy(false), 1500);
    }
  };

  const remindLater = () => {
    try {
      window.localStorage.setItem(REMINDER_KEY, String(Date.now() + REMINDER_MS));
    } catch {
      // Continue even when browser storage is unavailable.
    }
    setUpdate(null);
  };

  const cancel = () => {
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Session storage is only a convenience; dismissal still applies to this render.
    }
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal={forced}
      aria-labelledby="orenza-update-title"
      style={{
        position: 'fixed',
        inset: forced ? 0 : 'auto 12px 12px',
        zIndex: 99999,
        padding: forced ? 18 : 0,
        display: 'grid',
        placeItems: forced ? 'center' : 'stretch',
        background: forced ? 'rgba(0,0,0,.72)' : 'transparent',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          padding: 20,
          borderRadius: 20,
          background: '#0B192B',
          color: '#FAF9F6',
          boxShadow: '0 18px 70px rgba(0,0,0,.42)',
          border: '1px solid rgba(201,160,99,.55)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/brand/orenza-mark.svg" alt="ORENZA" style={{ width: 46, height: 46, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#C9A063', fontWeight: 800 }}>ORENZA UPDATE</div>
            <div id="orenza-update-title" style={{ fontSize: 21, fontWeight: 850, marginTop: 4 }}>
              {forced ? 'Update required' : 'Update available'}
            </div>
          </div>
        </div>

        <p style={{ margin: '14px 0 5px', fontSize: 13, lineHeight: 1.55, color: '#d4d0c6' }}>
          A newer ORENZA version is ready. Update through the official Google Play Store for the supported, secure release.
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#b5afa3' }}>
          Current {installedVersion} · Available {update.version}
        </p>

        {update.releaseNotes?.length ? (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: '#122337', border: '1px solid #304253' }}>
            <div style={{ fontSize: 10, letterSpacing: '.1em', fontWeight: 800, color: '#C9A063' }}>WHAT'S NEW</div>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#d4d0c6', fontSize: 11, lineHeight: 1.6 }}>
              {update.releaseNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={openPlayStore} disabled={busy} style={{ minHeight: 46, border: 0, borderRadius: 11, background: '#2A402D', color: '#FAF9F6', fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
            {busy ? 'Opening Google Play…' : 'Update Now'}
          </button>
          {!forced && (
            <>
              <button type="button" onClick={remindLater} style={{ minHeight: 44, border: '1px solid #C9A063', borderRadius: 11, background: '#C9A063', color: '#102019', fontWeight: 800, cursor: 'pointer' }}>
                Remind Me Later
              </button>
              <button type="button" onClick={cancel} style={{ minHeight: 42, border: '1px solid #3a4b59', borderRadius: 11, background: '#122337', color: '#FAF9F6', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          )}
        </div>

        <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 9, color: '#8e897f', lineHeight: 1.45 }}>
          ORENZA never silently installs executable updates. The official store controls installation and verification.
        </p>
      </div>
    </div>
  );
}
