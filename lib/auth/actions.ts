'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { hashPassword } from '@/lib/auth/password';
import { registrationOpen } from '@/lib/auth/registration';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().or(z.literal('')),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerUser(input: {
  name?: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  if (!registrationOpen) {
    return { ok: false, error: 'Registration is currently closed' };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { ok: false, error: 'An account with this email already exists' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.insert(users).values({
    email,
    name: parsed.data.name?.trim() || null,
    passwordHash,
  });

  return { ok: true };
}
