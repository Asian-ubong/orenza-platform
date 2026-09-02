import './globals.css';
import ServiceWorkerRegister from './sw-register';

export const metadata = {
  title: 'ORENZA — Private Trading Platform',
  description: 'ORENZA private trading, market analysis, sandbox and provider workspace.',
  applicationName: 'ORENZA',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<ServiceWorkerRegister /></body></html>;
}
