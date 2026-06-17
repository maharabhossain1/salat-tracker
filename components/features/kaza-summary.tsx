'use client';

import { useEffect, useState } from 'react';

import { ProgressRing } from '@/components/ui/progress-ring';
import type { KazaDashboard } from '@/lib/kaza/queries';

export function KazaSummary({ totals }: { totals: KazaDashboard['totals'] }) {
  const pct = totals.debt > 0 ? Math.round((totals.completed / totals.debt) * 100) : 0;

  return (
    <section className="shadow-soft overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-b from-brand-deep to-[oklch(0.36_0.09_165)] text-primary-foreground">
      <div className="flex flex-col items-center px-6 py-8">
        <ProgressRing
          value={pct}
          size={196}
          stroke={14}
          arcClassName="text-white"
          trackClassName="text-white/15"
        >
          <AnimatedNumber
            value={totals.remaining}
            className="font-display text-5xl font-semibold leading-none tabular-nums"
          />
          <span className="mt-1.5 text-xs uppercase tracking-[0.18em] text-white/70">
            kaza left
          </span>
        </ProgressRing>

        <div className="mt-7 grid w-full max-w-xs grid-cols-3 gap-2">
          <Stat label="Complete" value={`${pct}%`} />
          <Stat label="Made up" value={totals.completed.toLocaleString()} />
          <Stat label="Today" value={`+${totals.today.toLocaleString()}`} highlight />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3 text-center backdrop-blur-sm">
      <div
        className={`font-display text-lg font-semibold tabular-nums ${
          highlight ? 'text-white' : 'text-white/95'
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/60">{label}</div>
    </div>
  );
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (displayed === value) return;
    const from = displayed;
    const diff = value - from;
    const duration = Math.min(400, Math.abs(diff) * 12);
    const start = performance.now();

    let raf: number;
    function tick() {
      const p = Math.min((performance.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{displayed.toLocaleString()}</span>;
}
