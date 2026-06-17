import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
  /** Crescent fill color. Defaults to currentColor. */
  crescentColor?: string;
  /** Bead fill color. Defaults to #c9a24b (gold). Pass "currentColor" for monochrome. */
  beadColor?: string;
  /** Unique suffix for mask IDs — required when multiple marks appear on one page. */
  maskId?: string;
}

/** Crescent + bead mark. Crescent inherits text color; bead is gold by default. */
export function BrandMark({
  className,
  crescentColor = 'currentColor',
  beadColor = '#c9a24b',
  maskId = 'bm',
}: BrandMarkProps) {
  const mid = `cm-${maskId}`;
  return (
    <svg viewBox="0 0 512 512" className={cn('h-6 w-6', className)} aria-hidden role="img">
      <defs>
        <mask id={mid}>
          <rect width="512" height="512" fill="#000" />
          <circle cx="235" cy="256" r="180" fill="#fff" />
          <circle cx="320" cy="256" r="158" fill="#000" />
        </mask>
      </defs>
      <circle cx="235" cy="256" r="180" fill={crescentColor} mask={`url(#${mid})`} />
      <circle cx="291" cy="256" r="43" fill={beadColor} />
    </svg>
  );
}
