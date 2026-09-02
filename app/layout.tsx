import './globals.css';
import ServiceWorkerRegister from './sw-register';

export const metadata = {
  title: 'AURENZA BROKER — Private Trading Platform',
  description: 'AURENZA BROKER private trading, market analysis, sandbox and provider workspace.',
  applicationName: 'AURENZA BROKER',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<ServiceWorkerRegister /></body></html>;
}
