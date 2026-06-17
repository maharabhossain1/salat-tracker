export const PRAYERS = [
  { key: 'fajr', label: 'Fajr', arabic: 'الفجر' },
  { key: 'dhuhr', label: 'Dhuhr', arabic: 'الظهر' },
  { key: 'asr', label: 'Asr', arabic: 'العصر' },
  { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب' },
  { key: 'isha', label: 'Isha', arabic: 'العشاء' },
] as const;

export type PrayerKey = (typeof PRAYERS)[number]['key'];

export const PRAYER_KEYS = PRAYERS.map(p => p.key) as PrayerKey[];

export const PRAYER_LABEL: Record<PrayerKey, string> = Object.fromEntries(
  PRAYERS.map(p => [p.key, p.label]),
) as Record<PrayerKey, string>;

/** Days in a year used by the debt calculator (Gregorian). */
export const DAYS_PER_YEAR = 365;
