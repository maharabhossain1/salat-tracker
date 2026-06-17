import { Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { KazaSummary } from '@/components/features/kaza-summary';
import { KazaTracker } from '@/components/features/kaza-tracker';
import { getKazaDashboard } from '@/lib/kaza/queries';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getKazaDashboard(session.user.id);
  if (!data.hasSetup) redirect('/setup');

  const firstName = session.user.name?.split(' ')[0];
  const allDone = data.totals.remaining === 0 && data.totals.debt > 0;

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

      <KazaSummary totals={data.totals} />

      {allDone && (
        <p className="shadow-soft flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          MashaAllah — every prayer made up. May Allah accept it.
        </p>
      )}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-muted-foreground">Prayers</h2>
          <span className="text-xs text-muted-foreground">Tap to log · undo on the right</span>
        </div>
        <KazaTracker prayers={data.prayers} />
      </div>
    </div>
  );
}
