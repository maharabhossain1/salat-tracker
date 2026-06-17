import { and, eq, sql } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

import { db } from '@/lib/db';
import { kazaLogs, kazaTargets } from '@/lib/db/schema';
import { PRAYERS, type PrayerKey } from '@/lib/kaza/constants';
import { todayStr } from '@/lib/kaza/date';

export interface PrayerSummary {
  prayer: PrayerKey;
  label: string;
  arabic: string;
  /** Total owed (the debt). */
  debt: number;
  /** Total made up so far. */
  completed: number;
  /** debt - completed, clamped at 0. */
  remaining: number;
  /** Made up today. */
  today: number;
}

export interface KazaDashboard {
  prayers: PrayerSummary[];
  totals: { debt: number; completed: number; remaining: number; today: number };
  /** Whether the user has set up any debt yet. */
  hasSetup: boolean;
}

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

export async function getKazaDashboard(userId: string): Promise<KazaDashboard> {
  noStore(); // opt out of Next.js full-route cache — always fetch live from DB
  const today = todayStr();

  const [targets, completedRows, todayRows] = await Promise.all([
    db.select().from(kazaTargets).where(eq(kazaTargets.userId, userId)),
    db
      .select({ prayer: kazaLogs.prayer, total: sql<string>`coalesce(sum(${kazaLogs.count}), 0)` })
      .from(kazaLogs)
      .where(eq(kazaLogs.userId, userId))
      .groupBy(kazaLogs.prayer),
    db
      .select({ prayer: kazaLogs.prayer, total: sql<string>`coalesce(sum(${kazaLogs.count}), 0)` })
      .from(kazaLogs)
      .where(and(eq(kazaLogs.userId, userId), eq(kazaLogs.prayedOn, today)))
      .groupBy(kazaLogs.prayer),
  ]);

  const debtBy = new Map(targets.map(t => [t.prayer, t.initialCount]));
  const completedBy = new Map(completedRows.map(r => [r.prayer, num(r.total)]));
  const todayBy = new Map(todayRows.map(r => [r.prayer, num(r.total)]));

  const prayers: PrayerSummary[] = PRAYERS.map(p => {
    const debt = debtBy.get(p.key) ?? 0;
    const completed = completedBy.get(p.key) ?? 0;
    return {
      prayer: p.key,
      label: p.label,
      arabic: p.arabic,
      debt,
      completed,
      remaining: Math.max(0, debt - completed),
      today: todayBy.get(p.key) ?? 0,
    };
  });

  const totals = prayers.reduce(
    (acc, p) => ({
      debt: acc.debt + p.debt,
      completed: acc.completed + p.completed,
      remaining: acc.remaining + p.remaining,
      today: acc.today + p.today,
    }),
    { debt: 0, completed: 0, remaining: 0, today: 0 },
  );

  return { prayers, totals, hasSetup: targets.length > 0 };
}
