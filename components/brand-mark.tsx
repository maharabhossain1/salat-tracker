import { cn } from '@/lib/utils';

/** Crescent + star, matching the app icon. Inherits text color via currentColor. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn('h-6 w-6', className)} aria-hidden role="img">
      <defs>
        <mask id="crescent-mask">
          <rect width="512" height="512" fill="black" />
          <circle cx="256" cy="256" r="150" fill="white" />
          <circle cx="314" cy="215" r="138" fill="black" />
        </mask>
      </defs>
      <circle cx="256" cy="256" r="150" fill="currentColor" mask="url(#crescent-mask)" />
      <path
        fill="currentColor"
        d="M352 170 l10 26 l27 2 l-21 17 l7 26 l-23 -15 l-23 15 l7 -26 l-21 -17 l27 -2 z"
      />
    </svg>
  );
}
