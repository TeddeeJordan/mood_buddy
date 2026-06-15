import type { MoodOption } from '@/constants/mood-data';
import type { MoodEntry } from '@/lib/database';

export type RangeType = 'week' | 'month' | 'year';

export interface BarData {
  label: string;
  value: number | null;
}

export const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'i', 'my', 'me', 'it',
  'of', 'to', 'in', 'that', 'this', 'for', 'with', 'at', 'by', 'from', 'on', 'be', 'not',
  'so', 'just', 'about', 'what', 'when', 'how', 'do', 'did', 'have', 'had', 'get', 'got',
  'can', 'will', 'would', 'could', 'should', 'he', 'she', 'they', 'we', 'you', 'its',
  'im', 'ive', 'dont', 'cant', 'wont', 'am', 'feel', 'feeling', 'really', 'very',
]);

export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function emojiForValue(value: number, options: MoodOption[]): string {
  return options.find(o => o.value === Math.round(value))?.emoji ?? '😐';
}

export function computeStreak(allDates: string[]): number {
  const dateSet = new Set(allDates);
  const today = localDateStr(new Date());
  const yesterday = localDateStr(addDays(new Date(), -1));

  const start = dateSet.has(today)
    ? today
    : dateSet.has(yesterday)
    ? yesterday
    : null;
  if (!start) return 0;

  let count = 0;
  let cur = new Date(`${start}T12:00:00`);
  while (dateSet.has(localDateStr(cur))) {
    count++;
    cur = addDays(cur, -1);
  }
  return count;
}

export function parseTopWords(
  notes: (string | null)[],
  topN: number,
): { word: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const note of notes) {
    if (!note) continue;
    note
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

export function buildBars(
  entries: MoodEntry[],
  range: RangeType,
  field: 'mood' | 'stress' | 'anxiety',
): BarData[] {
  const now = new Date();

  if (range === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(now, -(6 - i));
      const ds = localDateStr(day);
      const dayEntries = entries.filter(e => localDateStr(new Date(e.timestamp)) === ds);
      const avg = dayEntries.length
        ? dayEntries.reduce((s, e) => s + e[field], 0) / dayEntries.length
        : null;
      return { label: DAY_LABELS[day.getDay()], value: avg };
    });
  }

  if (range === 'month') {
    return Array.from({ length: 4 }, (_, i) => {
      const weekEnd = addDays(now, -(3 - i) * 7);
      const weekStart = addDays(weekEnd, -6);
      const ws = localDateStr(weekStart);
      const we = localDateStr(weekEnd);
      const wEntries = entries.filter(e => {
        const d = localDateStr(new Date(e.timestamp));
        return d >= ws && d <= we;
      });
      const avg = wEntries.length
        ? wEntries.reduce((s, e) => s + e[field], 0) / wEntries.length
        : null;
      return { label: `W${i + 1}`, value: avg };
    });
  }

  return Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const mEntries = entries.filter(e => {
      const d = new Date(e.timestamp);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const avg = mEntries.length
      ? mEntries.reduce((s, e) => s + e[field], 0) / mEntries.length
      : null;
    return { label: MONTH_LABELS[m], value: avg };
  });
}
