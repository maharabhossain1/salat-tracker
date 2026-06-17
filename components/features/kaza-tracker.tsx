'use client';

import { Check, Plus, Undo2 } from 'lucide-react';
import { useOptimistic, useState, useTransition } from 'react';

import { ProgressRing } from '@/components/ui/progress-ring';
import { decrementKaza, incrementKaza } from '@/lib/kaza/actions';
import type { PrayerSummary } from '@/lib/kaza/queries';
import { cn } from '@/lib/utils';

type Optimistic = { prayer: string; type: 'inc' | 'dec' };

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

export function KazaTracker({ prayers }: { prayers: PrayerSummary[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(prayers, (state, action: Optimistic) =>
    state.map(p => (p.prayer === action.prayer ? applyOne(p, action.type) : p)),
  );

  function log(prayer: string) {
    startTransition(async () => {
      addOptimistic({ prayer, type: 'inc' });
      await incrementKaza(prayer);
    });
  }

  function undo(prayer: string) {
    startTransition(async () => {
      addOptimistic({ prayer, type: 'dec' });
      await decrementKaza(prayer);
    });
  }

  return (
    <div className="space-y-2.5">
      {optimistic.map(p => (
        <KazaRow
          key={p.prayer}
          prayer={p}
          onLog={() => log(p.prayer)}
          onUndo={() => undo(p.prayer)}
        />
      ))}
    </div>
  );
}

function KazaRow({
  prayer: p,
  onLog,
  onUndo,
}: {
  prayer: PrayerSummary;
  onLog: () => void;
  onUndo: () => void;
}) {
  const [flash, setFlash] = useState(false);
  const done = p.remaining === 0 && p.debt > 0;
  const progress = p.debt > 0 ? Math.min(100, (p.completed / p.debt) * 100) : 0;

  function handleLog() {
    if (p.remaining <= 0) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8);
    onLog();
  }

  return (
    <div
      className={cn(
        'shadow-soft flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors',
        done ? 'border-primary/25 bg-primary/[0.04]' : 'border-border/70',
      )}
    >
      {/* Primary tap target: ring + name */}
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

      {/* Remaining */}
      <div className="shrink-0 text-right">
        <div
          className={cn(
            'font-display text-2xl font-semibold leading-none tabular-nums',
            done ? 'text-primary' : 'text-foreground',
          )}
        >
          {p.remaining.toLocaleString()}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">left</div>
      </div>

      {/* Undo */}
      <button
        type="button"
        onClick={onUndo}
        disabled={p.completed <= 0}
        aria-label={`Undo one ${p.label} kaza`}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95 disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
      >
        <Undo2 className="h-4 w-4" />
      </button>
    </div>
  );
}
