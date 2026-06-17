'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import { BrandMark } from '@/components/brand-mark';
import { registerUser } from '@/lib/auth/actions';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const name = String(formData.get('name') ?? '');

    const result = await registerUser({ name, email, password });
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    const signedIn = await signIn('credentials', { email, password, redirect: false });
    if (signedIn?.error) {
      // Account exists but sign-in failed — send them to login.
      router.push('/login');
      return;
    }
    router.push('/setup');
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-7 flex flex-col items-center text-center">
        <span className="shadow-soft flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-deep to-[oklch(0.36_0.09_165)] text-white">
          <BrandMark className="h-9 w-9" />
        </span>
        <h1 className="font-display mt-4 text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start tracking your kaza salah</p>
      </div>

      <div className="shadow-soft rounded-3xl border border-border/70 bg-card p-6">
        {error && (
          <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="h-11 w-full rounded-xl border border-input bg-background px-3.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-input bg-background px-3.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-input bg-background px-3.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters</p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-xl bg-primary font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
