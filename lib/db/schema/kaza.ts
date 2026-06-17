import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  timestamp,
  date,
  unique,
  index,
} from 'drizzle-orm/pg-core';

import { users } from './users';

/** The five obligatory (fard) daily prayers. */
export const prayerEnum = pgEnum('prayer', ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);

/**
 * The kaza (qada) debt per prayer for a user — how many of each prayer they
 * owe. One row per (user, prayer). Editable: raising/lowering this only changes
 * the target, never the logged make-ups.
 */
export const kazaTargets = pgTable(
  'kaza_targets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    prayer: prayerEnum('prayer').notNull(),
    initialCount: integer('initial_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [unique('kaza_targets_user_prayer_uq').on(t.userId, t.prayer)],
);

/**
 * Each completed make-up prayer. One tap = one row of count 1; bulk entry =
 * one row of count N. `remaining = target.initialCount - SUM(count)`.
 * `prayedOn` is the local calendar day credited (YYYY-MM-DD).
 */
export const kazaLogs = pgTable(
  'kaza_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    prayer: prayerEnum('prayer').notNull(),
    count: integer('count').notNull().default(1),
    prayedOn: date('prayed_on', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  t => [
    index('kaza_logs_user_prayer_idx').on(t.userId, t.prayer),
    index('kaza_logs_user_day_idx').on(t.userId, t.prayedOn),
  ],
);

export type KazaTarget = typeof kazaTargets.$inferSelect;
export type KazaLog = typeof kazaLogs.$inferSelect;
