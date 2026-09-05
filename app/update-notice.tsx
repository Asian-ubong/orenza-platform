'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';

const WEB_FALLBACK_VERSION = '0.1.1';

type UpdateInfo = {
  name?: string;
  version?: string;
  downloadUrl?: string;
};

function compareVersions(a: string, b: string) {
  const aa = a.split('.').map(Number);
  const bb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(aa.length, bb.length); i += 1) {
    const left = aa[i] || 0;
    const right = bb[i] || 0;
    if (left !== right) return left - right;
  }
  return 0;
}

export default function UpdateNotice() {
  const [installedVersion, setInstalledVersion] = useState(WEB_FALLBACK_VERSION);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const info = await App.getInfo();
        if (active && info.version) setInstalledVersion(info.version);
      } catch {
        // The older Orenza shell may not contain the App plugin; keep the safe fallback.
      }

      try {
        const response = await fetch(`/api/version?client=${encodeURIComponent(installedVersion)}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) return;
        const data = (await response.json()) as UpdateInfo;
        if (active && data.version && compareVersions(data.version, installedVersion) > 0) {
          setUpdate(data);
        } else if (active) {
          setUpdate(null);
        }
      } catch {
        // Update checks must never block the application.
      }
    };
    check();
    const timer = window.setInterval(check, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [installedVersion]);

  if (!update?.version) return null;

  const installUpdate = () => {
    if (!update.downloadUrl) return;
    setBusy(true);
    window.location.href = update.downloadUrl;
  };

  return (
    <div style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 99999 }} role="alert">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, borderRadius: 18, background: '#102d2a', color: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ fontSize: 12, letterSpacing: '.08em', opacity: .7 }}>ORENZA UPDATE</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>New update available</div>
        <div style={{ fontSize: 13, opacity: .82, marginTop: 5 }}>Version {update.version} is ready. Update Orenza to get the latest fixes.</div>
        <button type="button" onClick={installUpdate} disabled={busy} style={{ marginTop: 12, width: '100%', minHeight: 46, border: 0, borderRadius: 12, fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Opening update…' : 'Update Orenza'}
        </button>
      </div>
    </div>
  );
}
