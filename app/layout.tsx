import './globals.css';
import ServiceWorkerRegister from './sw-register';

export const metadata = {
  title: 'ORENZA BROKER — Smart Trading. Secure Future.',
  description: 'ORENZA BROKER private trading, market analysis, sandbox and connected provider workspace.',
  applicationName: 'ORENZA BROKER',
  icons: {
    icon: '/brand/orenza-mark.svg',
    shortcut: '/brand/orenza-mark.svg',
    apple: '/brand/orenza-mark.svg',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<ServiceWorkerRegister /></body></html>;
}
