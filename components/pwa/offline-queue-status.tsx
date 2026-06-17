'use client';

import { useEffect, useState } from 'react';

import { getKazaQueue } from '@/lib/offline/queue';

export function OfflineQueueStatus() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getKazaQueue().then(q => setCount(q.length));

    const refresh = () => getKazaQueue().then(q => setCount(q.length));
    window.addEventListener('kaza-queued', refresh);
    return () => window.removeEventListener('kaza-queued', refresh);
  }, []);

  if (count === null || count === 0) return null;

  return (
    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      {count} prayer tap{count !== 1 ? 's' : ''} queued — will sync automatically when you&apos;re
      back online.
    </p>
  );
}
