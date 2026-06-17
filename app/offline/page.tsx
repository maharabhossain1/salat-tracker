import { WifiOff } from 'lucide-react';

import { OfflineQueueStatus } from '@/components/pwa/offline-queue-status';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <WifiOff className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">You&apos;re offline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You can still log prayers — they&apos;ll sync when you reconnect.
        </p>
      </div>
      <OfflineQueueStatus />
    </main>
  );
}
