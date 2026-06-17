'use server';

import { and, desc, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { kazaLogs, kazaTargets } from '@/lib/db/schema';
import { PRAYER_KEYS } from '@/lib/kaza/constants';
import { todayStr } from '@/lib/kaza/date';
import { targetsSchema, type TargetsInput } from '@/lib/kaza/schema';

const prayerSchema = z.enum(PRAYER_KEYS as [string, ...string[]]);

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');
  return session.user.id;
}

/** Remaining (debt - completed) for one prayer. */
async function remainingFor(userId: string, prayer: string): Promise<number> {
  const [target] = await db
    .select({ initialCount: kazaTargets.initialCount })
    .from(kazaTargets)
    .where(and(eq(kazaTargets.userId, userId), eq(kazaTargets.prayer, prayer as never)));
  if (!target) return 0;

  const [done] = await db
    .select({ total: sql<string>`coalesce(sum(${kazaLogs.count}), 0)` })
    .from(kazaLogs)
    .where(and(eq(kazaLogs.userId, userId), eq(kazaLogs.prayer, prayer as never)));

  return Math.max(0, target.initialCount - Number(done?.total ?? 0));
}

/** Log `amount` made-up prayers. Never logs more than remain owed. */
export async function incrementKaza(prayer: string, amount = 1): Promise<void> {
  const userId = await requireUserId();
  const key = prayerSchema.parse(prayer);
  const n = Math.max(1, Math.floor(amount));

  const remaining = await remainingFor(userId, key);
  if (remaining <= 0) return;
  const toLog = Math.min(n, remaining);

  await db.insert(kazaLogs).values({
    userId,
    prayer: key as never,
    count: toLog,
    prayedOn: todayStr(),
  });
  revalidatePath('/dashboard');
}

/** Undo `amount` make-ups: peels off the most recent log entries for this prayer. */
export async function decrementKaza(prayer: string, amount = 1): Promise<void> {
  const userId = await requireUserId();
  const key = prayerSchema.parse(prayer);
  const n = Math.max(1, Math.floor(amount));

  for (let i = 0; i < n; i++) {
    const [latest] = await db
      .select({ id: kazaLogs.id, count: kazaLogs.count })
      .from(kazaLogs)
      .where(and(eq(kazaLogs.userId, userId), eq(kazaLogs.prayer, key as never)))
      .orderBy(desc(kazaLogs.createdAt))
      .limit(1);

    if (!latest) break;

    if (latest.count > 1) {
      await db
        .update(kazaLogs)
        .set({ count: latest.count - 1 })
        .where(eq(kazaLogs.id, latest.id));
    } else {
      await db.delete(kazaLogs).where(eq(kazaLogs.id, latest.id));
    }
  }
  revalidatePath('/dashboard');
}

/** Create or update the debt for all five prayers. */
export async function setKazaTargets(input: TargetsInput): Promise<void> {
  const userId = await requireUserId();
  const values = targetsSchema.parse(input);

  await db
    .insert(kazaTargets)
    .values(
      PRAYER_KEYS.map(prayer => ({
        userId,
        prayer: prayer as never,
        initialCount: values[prayer],
      })),
    )
    .onConflictDoUpdate({
      target: [kazaTargets.userId, kazaTargets.prayer],
      set: { initialCount: sql`excluded.initial_count`, updatedAt: sql`now()` },
    });

  revalidatePath('/dashboard');
  revalidatePath('/setup');
}
