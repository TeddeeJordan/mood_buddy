import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('moodbuddy.db');

// Settings table is needed synchronously by ThemeContext before useEffects fire
db.execSync('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');

export type MoodEntry = {
  id: number;
  timestamp: string;
  mood: number;
  stress: number;
  stress_note_1: string | null;
  stress_note_2: string | null;
  stress_note_3: string | null;
  anxiety: number;
  anxiety_note_1: string | null;
  anxiety_note_2: string | null;
  anxiety_note_3: string | null;
};

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      mood INTEGER NOT NULL,
      stress INTEGER NOT NULL,
      stress_note_1 TEXT,
      stress_note_2 TEXT,
      stress_note_3 TEXT,
      anxiety INTEGER NOT NULL,
      anxiety_note_1 TEXT,
      anxiety_note_2 TEXT,
      anxiety_note_3 TEXT
    );
  `);
  // Migration: add per-item columns if upgrading from old single-column schema
  const cols = new Set(
    db.getAllSync<{ name: string }>('PRAGMA table_info(mood_entries)').map(r => r.name),
  );
  if (!cols.has('stress_note_1')) {
    db.execSync('ALTER TABLE mood_entries ADD COLUMN stress_note_1 TEXT');
    db.execSync('ALTER TABLE mood_entries ADD COLUMN stress_note_2 TEXT');
    db.execSync('ALTER TABLE mood_entries ADD COLUMN stress_note_3 TEXT');
    db.execSync('ALTER TABLE mood_entries ADD COLUMN anxiety_note_1 TEXT');
    db.execSync('ALTER TABLE mood_entries ADD COLUMN anxiety_note_2 TEXT');
    db.execSync('ALTER TABLE mood_entries ADD COLUMN anxiety_note_3 TEXT');
    if (cols.has('stress_note')) {
      db.execSync('UPDATE mood_entries SET stress_note_1 = stress_note');
      db.execSync('UPDATE mood_entries SET anxiety_note_1 = anxiety_note');
    }
  }
}

export function insertMoodEntry(entry: Omit<MoodEntry, 'id'>) {
  return db.runSync(
    `INSERT INTO mood_entries (timestamp, mood, stress, stress_note_1, stress_note_2, stress_note_3, anxiety, anxiety_note_1, anxiety_note_2, anxiety_note_3)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.timestamp, entry.mood, entry.stress,
      entry.stress_note_1 ?? null, entry.stress_note_2 ?? null, entry.stress_note_3 ?? null,
      entry.anxiety,
      entry.anxiety_note_1 ?? null, entry.anxiety_note_2 ?? null, entry.anxiety_note_3 ?? null,
    ],
  );
}

export function getAllEntries(): MoodEntry[] {
  return db.getAllSync<MoodEntry>('SELECT * FROM mood_entries ORDER BY timestamp DESC');
}

export function getEntriesForDateRange(startISO: string, endISO: string): MoodEntry[] {
  return db.getAllSync<MoodEntry>(
    'SELECT * FROM mood_entries WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC',
    [startISO, endISO],
  );
}

export type Profile = {
  bio: string;
  photo_uri: string | null;
};

export function initProfile() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      bio TEXT NOT NULL DEFAULT '',
      photo_uri TEXT
    );
    INSERT OR IGNORE INTO profile (id, bio, photo_uri) VALUES (1, '', NULL);
  `);
}

export function getProfile(): Profile {
  return (
    db.getFirstSync<Profile>('SELECT bio, photo_uri FROM profile WHERE id = 1') ??
    { bio: '', photo_uri: null }
  );
}

export function saveProfile(profile: Profile) {
  db.runSync(
    'UPDATE profile SET bio = ?, photo_uri = ? WHERE id = 1',
    [profile.bio, profile.photo_uri ?? null],
  );
}

export function getSetting(key: string): string | null {
  try {
    return db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key])?.value ?? null;
  } catch {
    return null;
  }
}

export function setSetting(key: string, value: string): void {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export type DiaryPrompt = {
  id: number;
  timestamp: string;
  prompt: string;
};

export function initDiaryPrompts() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS diary_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      prompt TEXT NOT NULL
    );
  `);
}

export function insertDiaryPrompt(prompt: string) {
  const timestamp = new Date().toISOString();
  db.runSync(
    'INSERT INTO diary_prompts (timestamp, prompt) VALUES (?, ?)',
    [timestamp, prompt],
  );
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  db.runSync('DELETE FROM diary_prompts WHERE timestamp < ?', [cutoff]);
}

export function getAllDiaryPrompts(): DiaryPrompt[] {
  return db.getAllSync<DiaryPrompt>('SELECT * FROM diary_prompts ORDER BY timestamp DESC');
}

export function getDiaryPromptsForRange(startISO: string, endISO: string): DiaryPrompt[] {
  return db.getAllSync<DiaryPrompt>(
    'SELECT * FROM diary_prompts WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
    [startISO, endISO],
  );
}

export function getAllEntryDates(): string[] {
  const rows = db.getAllSync<{ timestamp: string }>(
    'SELECT timestamp FROM mood_entries ORDER BY timestamp DESC',
  );
  const seen = new Set<string>();
  for (const { timestamp } of rows) {
    const d = new Date(timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    seen.add(key);
  }
  return [...seen];
}
