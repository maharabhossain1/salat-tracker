/**
 * Local calendar day as `YYYY-MM-DD`. Used to credit a make-up prayer to the
 * day it was logged and to count "today" totals. Computed from the server's
 * local time — fine for a single-user personal tracker; revisit if multi-tz.
 */
export function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
