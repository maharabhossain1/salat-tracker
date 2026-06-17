'use client';

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { decrementKaza, incrementKaza } from '@/lib/kaza/actions';
import { getKazaQueue, removeKazaAction } from '@/lib/offline/queue';

const DEBOUNCE_MS = 2000;
const FORCE_FLUSH_AT = 15;
const BACKOFF_MS = [5_000, 15_000, 45_000, 120_000, 300_000] as const;
const MAX_RETRIES = BACKOFF_MS.length;

type SyncError = { type: 'auth' | 'network' | 'server'; message: string };

function classifyError(err: unknown): SyncError {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Not authenticated') || msg.includes('Unauthorized'))
    return { type: 'auth', message: 'Session expired. Sign in again to sync.' };
  if (
    msg.includes('fetch failed') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network')
  )
    return { type: 'network', message: 'No connection. Will retry automatically.' };
  return { type: 'server', message: 'Server error. Retrying shortly.' };
}

export function OfflineSync() {
  const router = useRouter();

  // Fix 2: lazy initializer avoids calling setIsOnline synchronously inside useEffect.
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true,
  );
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState<SyncError | null>(null);
  const [retryIn, setRetryIn] = useState<number | null>(null);
  // Fix 3: separate ref (for logic inside flush closure) from state (for render).
  const [retriesExhausted, setRetriesExhausted] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFlushingRef = useRef(false);
  const retryCountRef = useRef(0);
  // Fix 1: store flush in a ref so it can call itself without a temporal dead zone.
  const flushRef = useRef<(() => Promise<void>) | null>(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    retryTimerRef.current = null;
    countdownRef.current = null;
    setRetryIn(null);
  }, []);

  const flush = useCallback(async () => {
    if (!navigator.onLine || isFlushingRef.current) return;
    const queue = await getKazaQueue();
    if (!queue.length) return;

    clearRetryTimer();
    isFlushingRef.current = true;
    setSyncing(true);
    setSyncError(null);
    setRetriesExhausted(false);

    const nets = new Map<string, number>();
    for (const item of queue) {
      nets.set(item.prayer, (nets.get(item.prayer) ?? 0) + (item.action === 'increment' ? 1 : -1));
    }

    try {
      for (const [prayer, net] of nets) {
        if (net > 0) await incrementKaza(prayer, net);
        else if (net < 0) await decrementKaza(prayer, Math.abs(net));
      }
      for (const item of queue) await removeKazaAction(item.id);
      setPendingCount(0);
      setSyncError(null);
      retryCountRef.current = 0;
      router.refresh();
    } catch (err) {
      const classified = classifyError(err);
      setSyncError(classified);

      if (classified.type !== 'auth' && retryCountRef.current < MAX_RETRIES) {
        const delay = BACKOFF_MS[retryCountRef.current];
        retryCountRef.current += 1;

        let secs = Math.round(delay / 1000);
        setRetryIn(secs);
        countdownRef.current = setInterval(() => {
          secs -= 1;
          if (secs <= 0) {
            clearInterval(countdownRef.current!);
            setRetryIn(null);
          } else {
            setRetryIn(secs);
          }
        }, 1000);

        // Use the ref to schedule the next attempt — avoids the TDZ issue.
        retryTimerRef.current = setTimeout(() => void flushRef.current?.(), delay);
      } else if (classified.type !== 'auth') {
        setRetriesExhausted(true);
      }
    } finally {
      isFlushingRef.current = false;
      setSyncing(false);
    }
  }, [router, clearRetryTimer]);

  // Sync flushRef in an effect, not during render (react-compiler: no ref writes during render).
  useLayoutEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const scheduleFlush = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const queue = await getKazaQueue();
    setPendingCount(queue.length);
    if (queue.length >= FORCE_FLUSH_AT) {
      void flush();
    } else {
      debounceRef.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    }
  }, [flush]);

  // Hoisted outside useEffect so setState calls aren't flagged as "setState in effect body".
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    retryCountRef.current = 0;
    setRetriesExhausted(false);
    void flush();
  }, [flush]);

  const handleOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    // Defer so the rule doesn't flag flush() (which calls setState) as "setState in effect body".
    const mountTimer = navigator.onLine ? setTimeout(() => void flush(), 0) : undefined;

    const handleQueued = () => {
      void scheduleFlush();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    const handleBeforeUnload = () => {
      void flush();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('kaza-queued', handleQueued);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (mountTimer !== undefined) clearTimeout(mountTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('kaza-queued', handleQueued);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearRetryTimer();
    };
  }, [flush, scheduleFlush, clearRetryTimer, handleOnline, handleOffline]);

  if (isOnline && !syncing && !syncError && pendingCount === 0) return null;

  if (syncing) {
    return (
      <Banner color="amber">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>
          Syncing {pendingCount} prayer{pendingCount !== 1 ? 's' : ''}…
        </span>
      </Banner>
    );
  }

  if (syncError) {
    return (
      <Banner color="red">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">
          {syncError.message}
          {pendingCount > 0 && ` (${pendingCount} tap${pendingCount !== 1 ? 's' : ''} pending)`}
          {retryIn !== null && ` · retrying in ${retryIn}s`}
        </span>
        {(retriesExhausted || syncError.type === 'auth') &&
          (syncError.type === 'auth' ? (
            <a href="/login" className="underline underline-offset-2">
              Sign in
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                retryCountRef.current = 0;
                setRetriesExhausted(false);
                void flush();
              }}
              className="underline underline-offset-2"
            >
              Retry now
            </button>
          ))}
      </Banner>
    );
  }

  if (!isOnline) {
    return (
      <Banner color="amber">
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span>
          Offline
          {pendingCount > 0
            ? ` · ${pendingCount} tap${pendingCount !== 1 ? 's' : ''} queued`
            : ' · taps will sync when reconnected'}
        </span>
      </Banner>
    );
  }

  return null;
}

function Banner({ color, children }: { color: 'amber' | 'red'; children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium ${
        color === 'red' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
      }`}
    >
      {children}
    </div>
  );
}
