'use client';

import { Check, Plus, Undo2 } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { KazaSummary } from '@/components/features/kaza-summary';
import { ProgressRing } from '@/components/ui/progress-ring';
import type { KazaDashboard, PrayerSummary } from '@/lib/kaza/queries';
import { cancelLastIncrement, enqueueKazaAction, getKazaQueue } from '@/lib/offline/queue';
import { cn } from '@/lib/utils';

function applyOne(p: PrayerSummary, type: 'inc' | 'dec'): PrayerSummary {
  if (type === 'inc') {
    if (p.remaining <= 0) return p;
    return { ...p, remaining: p.remaining - 1, completed: p.completed + 1, today: p.today + 1 };
  }
  if (p.completed <= 0) return p;
  return {
    ...p,
    remaining: Math.min(p.debt, p.remaining + 1),
    completed: p.completed - 1,
    today: Math.max(0, p.today - 1),
  };
}

function computeTotals(prayers: PrayerSummary[]): KazaDashboard['totals'] {
  return prayers.reduce(
    (acc, p) => ({
      debt: acc.debt + p.debt,
      completed: acc.completed + p.completed,
      remaining: acc.remaining + p.remaining,
      today: acc.today + p.today,
    }),
    { debt: 0, completed: 0, remaining: 0, today: 0 },
  );
}

export function KazaDashboard({ prayers }: { prayers: PrayerSummary[] }) {
  const [display, setDisplay] = useState<PrayerSummary[]>(prayers);

  useEffect(() => {
    void getKazaQueue().then(pending => {
      const nets: Record<string, number> = {};
      for (const item of pending) {
        nets[item.prayer] = (nets[item.prayer] ?? 0) + (item.action === 'increment' ? 1 : -1);
      }
      const next = prayers.map(p => {
        const d = nets[p.prayer] ?? 0;
        if (d === 0) return p;
        return {
          ...p,
          remaining: Math.max(0, p.remaining - d),
          completed: p.completed + Math.max(0, d),
          today: p.today + Math.max(0, d),
        };
      });
      // Skip update if nothing actually changed — avoids unnecessary re-renders
      // after router.refresh() returns the same data that's already displayed.
      setDisplay(prev => {
        const changed = next.some(
          (p, i) =>
            p.remaining !== prev[i]?.remaining ||
            p.completed !== prev[i]?.completed ||
            p.today !== prev[i]?.today,
        );
        return changed ? next : prev;
      });
    });
  }, [prayers]);

  // Stable callbacks — use functional setDisplay so `display` is never in the
  // closure. This lets React.memo on KazaRow skip re-renders effectively.
  const log = useCallback((prayer: string) => {
    setDisplay(prev => prev.map(p => (p.prayer === prayer ? applyOne(p, 'inc') : p)));
    void enqueueKazaAction(prayer, 'increment').then(() => {
      window.dispatchEvent(new Event('kaza-queued'));
    });
  }, []);

  const undo = useCallback((prayer: string) => {
    setDisplay(prev => prev.map(p => (p.prayer === prayer ? applyOne(p, 'dec') : p)));
    void cancelLastIncrement(prayer).then(cancelled => {
      if (!cancelled) void enqueueKazaAction(prayer, 'decrement');
      window.dispatchEvent(new Event('kaza-queued'));
    });
  }, []);

  const liveTotals = useMemo(() => computeTotals(display), [display]);

  return (
    <>
      <KazaSummary totals={liveTotals} />
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-muted-foreground">Prayers</h2>
          <span className="text-xs text-muted-foreground">Tap to log · undo on the right</span>
        </div>
        <div className="space-y-2.5">
          {display.map(p => (
            <KazaRow key={p.prayer} prayer={p} onLog={log} onUndo={undo} />
          ))}
        </div>
      </div>
    </>
  );
}

// memo + stable onLog/onUndo = this only re-renders when its own prayer data changes.
const KazaRow = memo(function KazaRow({
  prayer: p,
  onLog,
  onUndo,
}: {
  prayer: PrayerSummary;
  onLog: (prayer: string) => void;
  onUndo: (prayer: string) => void;
}) {
  const [flash, setFlash] = useState(false);
  const done = p.remaining === 0 && p.debt > 0;
  const progress = p.debt > 0 ? Math.min(100, (p.completed / p.debt) * 100) : 0;

  function handleLog() {
    if (p.remaining <= 0) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
    onLog(p.prayer);
  }

  return (
    <div
      className={cn(
        'shadow-soft flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors',
        done ? 'border-primary/25 bg-primary/[0.04]' : 'border-border/70',
      )}
    >
      <button
        type="button"
        onClick={handleLog}
        disabled={done}
        aria-label={`Log one ${p.label} kaza`}
        className={cn(
          'flex flex-1 items-center gap-3.5 rounded-xl py-1 pl-1 pr-2 text-left transition-transform',
          done ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]',
        )}
      >
        <ProgressRing
          value={progress}
          size={56}
          stroke={5}
          arcClassName="text-primary"
          trackClassName="text-secondary"
          className="shrink-0"
        >
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-transform',
              done ? 'text-primary' : 'bg-secondary/60 text-primary',
              flash && 'scale-75',
            )}
          >
            {done ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </span>
        </ProgressRing>

        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold leading-tight">{p.label}</span>
            <span className="text-sm text-muted-foreground" dir="rtl">
              {p.arabic}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {p.today > 0 && <span className="font-medium text-primary">+{p.today} today · </span>}
            {p.completed.toLocaleString()} / {p.debt.toLocaleString()} done
          </span>
        </span>
      </button>

      <div className="shrink-0 text-right">
        <AnimatedNumber
          value={p.remaining}
          className={cn(
            'font-display text-2xl font-semibold leading-none tabular-nums',
            done ? 'text-primary' : 'text-foreground',
          )}
        />
        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">left</div>
      </div>

      <button
        type="button"
        onClick={() => onUndo(p.prayer)}
        disabled={p.completed <= 0}
        aria-label={`Undo one ${p.label} kaza`}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95 disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
      >
        <Undo2 className="h-4 w-4" />
      </button>
    </div>
  );
});

/** Smoothly counts to the new value over ~250ms (ease-out). */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (displayed === value) return;
    const from = displayed;
    const diff = value - from;
    const duration = Math.min(250, Math.abs(diff) * 8); // faster for small diffs
    const start = performance.now();

    let raf: number;
    function tick() {
      const p = Math.min((performance.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplayed(Math.round(from + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <div className={className}>{displayed.toLocaleString()}</div>;
}
