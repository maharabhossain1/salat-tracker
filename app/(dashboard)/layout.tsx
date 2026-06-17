import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { BrandMark } from '@/components/brand-mark';
import { SignOutButton } from '@/components/layout/sign-out-button';
import { OfflineSync } from '@/components/pwa/offline-sync';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-dvh">
      <OfflineSync />
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <BrandMark className="h-7 w-7 text-primary" maskId="hdr" />
            <div className="flex h-7 items-center gap-2.5">
              <div className="w-px self-stretch bg-primary/20" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-[17px] font-semibold tracking-tight text-primary">
                  Salat
                </span>
                <span
                  className="font-label text-[9px] font-normal uppercase tracking-[0.4em] text-primary/60"
                  style={{ marginTop: 2 }}
                >
                  Tracker
                </span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/setup"
              aria-label="Edit kaza debt"
              className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Edit debt</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-8">
        {children}
      </main>
    </div>
  );
}
