import { WifiOff } from 'lucide-react';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <WifiOff className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">You&apos;re offline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reconnect to sync and log your prayers.
        </p>
      </div>
    </main>
  );
}
