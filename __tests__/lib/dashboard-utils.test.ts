import {
  localDateStr,
  addDays,
  emojiForValue,
  computeStreak,
  parseTopWords,
  buildBars,
} from '@/lib/dashboard-utils';
import { MOOD_OPTIONS } from '@/constants/mood-data';
import type { MoodEntry } from '@/lib/database';

// ── localDateStr ──────────────────────────────────────────────────────────────

describe('localDateStr', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(localDateStr(new Date(2026, 5, 15))).toBe('2026-06-15');
  });

  it('zero-pads month and day', () => {
    expect(localDateStr(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
});

// ── addDays ───────────────────────────────────────────────────────────────────

describe('addDays', () => {
  it('adds positive days', () => {
    const base = new Date(2026, 5, 10);
    expect(localDateStr(addDays(base, 5))).toBe('2026-06-15');
  });

  it('subtracts when n is negative', () => {
    const base = new Date(2026, 5, 15);
    expect(localDateStr(addDays(base, -5))).toBe('2026-06-10');
  });

  it('does not mutate the original date', () => {
    const base = new Date(2026, 5, 15);
    addDays(base, 10);
    expect(localDateStr(base)).toBe('2026-06-15');
  });

  it('crosses month boundaries', () => {
    const base = new Date(2026, 5, 30);
    expect(localDateStr(addDays(base, 2))).toBe('2026-07-02');
  });
});

// ── emojiForValue ─────────────────────────────────────────────────────────────

describe('emojiForValue', () => {
  it('returns the emoji for an exact match', () => {
    expect(emojiForValue(1, MOOD_OPTIONS)).toBe('😭');
    expect(emojiForValue(5, MOOD_OPTIONS)).toBe('😄');
  });

  it('rounds fractional values before lookup', () => {
    expect(emojiForValue(4.6, MOOD_OPTIONS)).toBe('😄');
    expect(emojiForValue(3.4, MOOD_OPTIONS)).toBe('😐');
  });

  it('falls back to 😐 when value is out of range', () => {
    expect(emojiForValue(99, MOOD_OPTIONS)).toBe('😐');
  });
});

// ── computeStreak ─────────────────────────────────────────────────────────────

describe('computeStreak', () => {
  const TODAY = '2026-06-15';
  const YESTERDAY = '2026-06-14';
  const TWO_DAYS_AGO = '2026-06-13';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 0 when no dates', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 0 when last entry is two days ago', () => {
    expect(computeStreak([TWO_DAYS_AGO])).toBe(0);
  });

  it('returns 1 when only today is logged', () => {
    expect(computeStreak([TODAY])).toBe(1);
  });

  it('returns 1 when only yesterday is logged', () => {
    expect(computeStreak([YESTERDAY])).toBe(1);
  });

  it('returns 2 for today + yesterday', () => {
    expect(computeStreak([TODAY, YESTERDAY])).toBe(2);
  });

  it('returns 3 for three consecutive days ending today', () => {
    expect(computeStreak([TODAY, YESTERDAY, TWO_DAYS_AGO])).toBe(3);
  });

  it('counts consecutive days even with a gap further back', () => {
    expect(computeStreak([TODAY, YESTERDAY, '2026-06-10'])).toBe(2);
  });
});

// ── parseTopWords ─────────────────────────────────────────────────────────────

describe('parseTopWords', () => {
  it('returns an empty array for empty input', () => {
    expect(parseTopWords([], 5)).toEqual([]);
  });

  it('returns an empty array when all notes are null', () => {
    expect(parseTopWords([null, null], 5)).toEqual([]);
  });

  it('counts word frequencies correctly', () => {
    const notes = ['work stress work', 'work deadline'];
    const result = parseTopWords(notes, 5);
    expect(result[0]).toEqual({ word: 'work', count: 3 });
  });

  it('filters stop words', () => {
    const notes = ['the and a work'];
    const result = parseTopWords(notes, 5);
    expect(result.every(r => r.word === 'work')).toBe(true);
  });

  it('filters words shorter than 3 characters', () => {
    const notes = ['ok go run work'];
    const result = parseTopWords(notes, 5);
    const words = result.map(r => r.word);
    expect(words).not.toContain('ok');
    expect(words).not.toContain('go');
  });

  it('respects topN limit', () => {
    const notes = ['alpha beta gamma delta epsilon'];
    expect(parseTopWords(notes, 3)).toHaveLength(3);
  });

  it('is case-insensitive', () => {
    const notes = ['Work work WORK'];
    const result = parseTopWords(notes, 5);
    expect(result[0]).toEqual({ word: 'work', count: 3 });
  });
});

// ── buildBars ─────────────────────────────────────────────────────────────────

function makeEntry(timestamp: string, mood = 3, stress = 3, anxiety = 3): MoodEntry {
  return { id: 1, timestamp, mood, stress, stress_note: null, anxiety, anxiety_note: null };
}

describe('buildBars', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('week range', () => {
    it('returns 7 bars', () => {
      expect(buildBars([], 'week', 'mood')).toHaveLength(7);
    });

    it('last bar has the correct day label for today', () => {
      const bars = buildBars([], 'week', 'mood');
      const todayLabel = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date().getDay()];
      expect(bars[6].label).toBe(todayLabel);
    });

    it('bar with entry has a non-null value', () => {
      const entry = makeEntry('2026-06-15T08:00:00.000Z', 4);
      const bars = buildBars([entry], 'week', 'mood');
      expect(bars[6].value).toBe(4);
    });

    it('bar with no entries has null value', () => {
      const bars = buildBars([], 'week', 'mood');
      bars.forEach(bar => expect(bar.value).toBeNull());
    });

    it('averages multiple entries on the same day', () => {
      // Use noon UTC so the date is unambiguous in any timezone.
      const entries = [
        makeEntry('2026-06-15T12:00:00.000Z', 2),
        makeEntry('2026-06-15T13:00:00.000Z', 4),
      ];
      const bars = buildBars(entries, 'week', 'mood');
      expect(bars[6].value).toBe(3);
    });
  });

  describe('month range', () => {
    it('returns 4 bars', () => {
      expect(buildBars([], 'month', 'stress')).toHaveLength(4);
    });

    it('labels bars W1 through W4', () => {
      const bars = buildBars([], 'month', 'stress');
      expect(bars.map(b => b.label)).toEqual(['W1', 'W2', 'W3', 'W4']);
    });
  });

  describe('year range', () => {
    it('returns 12 bars', () => {
      expect(buildBars([], 'year', 'anxiety')).toHaveLength(12);
    });

    it('last bar corresponds to the current month', () => {
      const bars = buildBars([], 'year', 'anxiety');
      const currentMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()];
      expect(bars[11].label).toBe(currentMonth);
    });
  });
});
