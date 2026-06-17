import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { KazaDashboard } from '@/components/features/kaza-dashboard';
import { getKazaDashboard } from '@/lib/kaza/queries';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getKazaDashboard(session.user.id);
  if (!data.hasSetup) redirect('/setup');

  const firstName = session.user.name?.split(' ')[0];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground" dir="rtl">
          السلام عليكم
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {firstName ? `Salam, ${firstName}` : 'Your kaza'}
        </h1>
      </div>

      <KazaDashboard prayers={data.prayers} />
    </div>
  );
}
