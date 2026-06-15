import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('moodbuddy.db');

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
