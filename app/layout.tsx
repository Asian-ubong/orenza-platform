import './globals.css';
import ServiceWorkerRegister from './sw-register';
import UpdateNotice from './update-notice';

export const metadata = {
  title: 'ORENZA — Smart Trading. Secure Future.',
  description: 'ORENZA trading, market analysis, sandbox and connected provider workspace.',
  applicationName: 'ORENZA',
  manifest: '/manifest.json',
  icons: {
    icon: '/brand/orenza-mark.svg',
    shortcut: '/brand/orenza-mark.svg',
    apple: '/brand/orenza-mark.svg',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><link rel="stylesheet" href="/brand/brand-overrides.css" /></head><body>{children}<UpdateNotice /><ServiceWorkerRegister /></body></html>;
}
