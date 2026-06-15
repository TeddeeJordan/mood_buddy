// All mock functions are created inside the factory so there's no hoisting issue.
// We capture references to them in beforeAll after the module is loaded.
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn(),
  })),
}));

import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  insertMoodEntry,
  getAllEntries,
  getEntriesForDateRange,
  getAllEntryDates,
  type MoodEntry,
} from '@/lib/database';

type MockDb = { execSync: jest.Mock; runSync: jest.Mock; getAllSync: jest.Mock };

// database.ts calls openDatabaseSync at load time; capture the returned mock object.
let mockDb: MockDb;

beforeAll(() => {
  const openMock = SQLite.openDatabaseSync as jest.Mock;
  mockDb = openMock.mock.results[0].value as MockDb;
});

beforeEach(() => {
  mockDb.execSync.mockClear();
  mockDb.runSync.mockClear();
  mockDb.getAllSync.mockClear();
});

describe('initDatabase', () => {
  it('runs the CREATE TABLE statement', () => {
    initDatabase();
    expect(mockDb.execSync).toHaveBeenCalledTimes(1);
    expect(mockDb.execSync.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS mood_entries');
  });
});

describe('insertMoodEntry', () => {
  it('calls runSync with correct SQL and parameters', () => {
    const entry = {
      timestamp: '2026-06-15T10:00:00.000Z',
      mood: 4,
      stress: 3,
      stress_note: null,
      anxiety: 2,
      anxiety_note: 'work pressure',
    };
    insertMoodEntry(entry);
    expect(mockDb.runSync).toHaveBeenCalledTimes(1);
    const [sql, params] = mockDb.runSync.mock.calls[0];
    expect(sql).toContain('INSERT INTO mood_entries');
    expect(params).toEqual([
      entry.timestamp,
      entry.mood,
      entry.stress,
      null,
      entry.anxiety,
      entry.anxiety_note,
    ]);
  });

  it('coerces null stress_note and anxiety_note to null in params', () => {
    insertMoodEntry({
      timestamp: '2026-06-15T10:00:00.000Z',
      mood: 5,
      stress: 4,
      stress_note: null,
      anxiety: 5,
      anxiety_note: null,
    });
    const params = mockDb.runSync.mock.calls[0][1];
    expect(params[3]).toBeNull();
    expect(params[5]).toBeNull();
  });
});

describe('getAllEntries', () => {
  it('returns results from getAllSync ordered by timestamp DESC', () => {
    const rows: MoodEntry[] = [
      { id: 2, timestamp: '2026-06-15T10:00:00.000Z', mood: 4, stress: 3, stress_note: null, anxiety: 2, anxiety_note: null },
      { id: 1, timestamp: '2026-06-14T10:00:00.000Z', mood: 3, stress: 2, stress_note: 'busy', anxiety: 1, anxiety_note: null },
    ];
    mockDb.getAllSync.mockReturnValueOnce(rows);
    const result = getAllEntries();
    expect(result).toEqual(rows);
    expect(mockDb.getAllSync.mock.calls[0][0]).toContain('ORDER BY timestamp DESC');
  });
});

describe('getEntriesForDateRange', () => {
  it('passes start and end ISO strings as parameters', () => {
    mockDb.getAllSync.mockReturnValueOnce([]);
    const start = '2026-06-01T00:00:00.000Z';
    const end = '2026-06-15T23:59:59.999Z';
    getEntriesForDateRange(start, end);
    const [sql, params] = mockDb.getAllSync.mock.calls[0];
    expect(sql).toContain('WHERE timestamp >= ?');
    expect(params).toEqual([start, end]);
  });
});

describe('getAllEntryDates', () => {
  it('returns deduplicated YYYY-MM-DD strings', () => {
    mockDb.getAllSync.mockReturnValueOnce([
      { timestamp: '2026-06-15T08:00:00.000Z' },
      { timestamp: '2026-06-15T20:00:00.000Z' },
      { timestamp: '2026-06-14T10:00:00.000Z' },
    ]);
    const result = getAllEntryDates();
    expect(result).toHaveLength(2);
    expect(result).toContain('2026-06-15');
    expect(result).toContain('2026-06-14');
  });

  it('returns an empty array when there are no entries', () => {
    mockDb.getAllSync.mockReturnValueOnce([]);
    expect(getAllEntryDates()).toEqual([]);
  });
});
