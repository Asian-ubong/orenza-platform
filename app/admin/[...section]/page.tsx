import { AdminScreen } from '../page';

export default async function AdminSection({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const path = section?.join('/') || 'dashboard';
  return <AdminScreen path={path} />;
}
