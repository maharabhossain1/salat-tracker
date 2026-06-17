import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { SetupForm } from '@/components/features/setup-form';
import { PRAYER_KEYS, type PrayerKey } from '@/lib/kaza/constants';
import { getKazaDashboard } from '@/lib/kaza/queries';

export const metadata = { title: 'Set up your kaza' };

export default async function SetupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getKazaDashboard(session.user.id);
  const initial = data.hasSetup
    ? (Object.fromEntries(data.prayers.map(p => [p.prayer, p.debt])) as Record<PrayerKey, number>)
    : null;
  // Ensure every key is present even if a prayer row was missing.
  const counts = initial
    ? (Object.fromEntries(PRAYER_KEYS.map(k => [k, initial[k] ?? 0])) as Record<PrayerKey, number>)
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {data.hasSetup ? 'Edit your kaza debt' : 'Set up your kaza'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          How many of each prayer do you need to make up? Estimate it, then adjust anytime.
        </p>
      </div>

      <SetupForm initial={counts} />

      {data.hasSetup && (
        <p className="mt-6 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            ← Back to dashboard
          </Link>
        </p>
      )}
    </div>
  );
}
