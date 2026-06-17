'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { setKazaTargets } from '@/lib/kaza/actions';
import { DAYS_PER_YEAR, PRAYERS, type PrayerKey } from '@/lib/kaza/constants';
import { type TargetsInput } from '@/lib/kaza/schema';
import { cn } from '@/lib/utils';

type Counts = Record<PrayerKey, number>;

const EMPTY: Counts = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

function clampInt(v: number): number {
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(1_000_000, Math.floor(v));
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 86_400_000) + 1; // inclusive
}

type Mode = 'years' | 'range';

export function SetupForm({ initial }: { initial: Counts | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [counts, setCounts] = useState<Counts>(initial ?? EMPTY);
  const [mode, setMode] = useState<Mode>('years');
  const [years, setYears] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const suggestion = useMemo(() => {
    if (mode === 'years') {
      const y = Number(years);
      return y > 0 ? clampInt(y * DAYS_PER_YEAR) : 0;
    }
    return clampInt(daysBetween(from, to));
  }, [mode, years, from, to]);

  const total = PRAYERS.reduce((sum, p) => sum + (counts[p.key] || 0), 0);

  function applySuggestion() {
    if (suggestion <= 0) return;
    setCounts({
      fajr: suggestion,
      dhuhr: suggestion,
      asr: suggestion,
      maghrib: suggestion,
      isha: suggestion,
    });
  }

  function setOne(key: PrayerKey, value: string) {
    setCounts(prev => ({ ...prev, [key]: clampInt(Number(value)) }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await setKazaTargets(counts as TargetsInput);
        router.push('/dashboard');
        router.refresh();
      } catch {
        setError('Could not save. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Calculator */}
      <section className="shadow-soft rounded-2xl border border-border/70 bg-card p-5">
        <h2 className="font-display text-base font-semibold">Estimate your debt</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quickly fill all five prayers, then fine-tune each below.
        </p>

        <div className="mt-4 inline-flex rounded-xl border bg-secondary/40 p-1 text-sm">
          {(['years', 'range'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 font-medium transition-colors',
                mode === m
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m === 'years' ? 'By years' : 'By date range'}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          {mode === 'years' ? (
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Years missed</span>
              <input
                type="number"
                min={0}
                step="0.5"
                value={years}
                onChange={e => setYears(e.target.value)}
                placeholder="e.g. 10"
                className="h-11 w-32 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ) : (
            <>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">From</span>
                <input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">To</span>
                <input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </>
          )}

          <button
            type="button"
            onClick={applySuggestion}
            disabled={suggestion <= 0}
            className="h-11 rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            Fill all five
          </button>
        </div>

        {suggestion > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            ≈ <span className="font-medium text-foreground">{suggestion.toLocaleString()}</span> of
            each prayer.
          </p>
        )}
      </section>

      {/* Per-prayer */}
      <section className="space-y-2.5">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">Prayers owed</h2>
        {PRAYERS.map(p => (
          <div
            key={p.key}
            className="shadow-soft flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card px-4 py-3"
          >
            <div>
              <span className="font-display text-base font-semibold">{p.label}</span>
              <span className="ml-2 text-sm text-muted-foreground" dir="rtl">
                {p.arabic}
              </span>
            </div>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={counts[p.key] === 0 ? '' : counts[p.key]}
              placeholder="0"
              onChange={e => setOne(p.key, e.target.value)}
              className="h-11 w-28 rounded-xl border border-input bg-background px-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{total.toLocaleString()}</span>{' '}
          prayers
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save & continue'}
        </button>
      </div>
    </div>
  );
}
