import { neon } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-http';
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const url = process.env.DATABASE_URL!;

// Local dev uses Docker Postgres (TCP). Production uses Neon HTTP — faster cold
// starts because there's no TCP handshake and Neon's HTTP endpoint wakes from
// auto-suspend much faster than the TCP path.
const isLocal = url.includes('localhost') || url.includes('127.0.0.1');

export const db = isLocal
  ? pgDrizzle(postgres(url, { max: 1, idle_timeout: 20 }), { schema })
  : (neonDrizzle(neon(url), { schema }) as unknown as ReturnType<typeof pgDrizzle<typeof schema>>);
