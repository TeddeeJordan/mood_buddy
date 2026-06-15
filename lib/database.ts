import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('moodbuddy.db');

// Settings table is needed synchronously by ThemeContext before useEffects fire
db.execSync('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');

export type MoodEntry = {
  id: number;
  timestamp: string;
  mood: number;
  stress: number;
  stress_note: string | null;
  anxiety: number;
  anxiety_note: string | null;
};

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      mood INTEGER NOT NULL,
      stress INTEGER NOT NULL,
      stress_note TEXT,
      anxiety INTEGER NOT NULL,
      anxiety_note TEXT
    );
  `);
}

export function insertMoodEntry(entry: Omit<MoodEntry, 'id'>) {
  return db.runSync(
    `INSERT INTO mood_entries (timestamp, mood, stress, stress_note, anxiety, anxiety_note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.timestamp, entry.mood, entry.stress, entry.stress_note ?? null, entry.anxiety, entry.anxiety_note ?? null]
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
