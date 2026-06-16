# Mood Buddy

A personal mood tracking app for iOS and Android, built with Expo and React Native. Log how you're feeling each day, identify patterns in your stress and anxiety triggers, and optionally talk through your emotions with an AI companion.

## Intent

Mood Buddy helps users build self-awareness around their emotional state by making it fast and frictionless to record mood, stress, and anxiety each day. Over time the app surfaces patterns — which stressors keep showing up, what triggers anxiety, how mood trends across weeks and months — so users can better understand their own mental and emotional landscape.

## Features

### Mood Check-In
Log three dimensions of your current state using emoji-based pickers:
- **Mood** — overall feeling (5 options from very low to great)
- **Stress** — stress level; high-stress days unlock up to 3 free-text stressor fields
- **Anxiety** — anxiety level; high-anxiety days unlock up to 3 free-text trigger fields

Each submission saves a timestamped entry to local SQLite storage and generates a natural-language diary prompt summarising what was logged.

### Dashboard
Visualise your data across the past week, month, or year:
- Bar charts for mood, stress, and anxiety over time (with emoji markers at each data point)
- Word clouds for top stressors and top anxiety triggers, sized by frequency
- Daily streak counter to encourage consistent check-ins

### Diary
Browse past check-in summaries by date using an interactive range calendar. Select a single day or a date range (up to 30 days) to see the diary entries generated from those sessions. Entries are retained for 90 days.

### AI Chat (optional)
After logging a mood entry, users can optionally chat with Claude (Anthropic's AI) about how they're feeling. The chat screen is pre-seeded with the current mood context so Claude can open the conversation with relevant insight. Requires a personal Anthropic API key entered in Settings.

### Settings
- **Theme** — choose from Water, Lavender, or Sage colour palettes; persisted across sessions
- **Notifications** — enable a daily reminder at a custom time (iOS spinner / Android native picker)
- **AI integration** — toggle AI chat and manage your Anthropic API key (stored locally, never sent anywhere except the Anthropic API)

### Profile
A personal bio and optional photo, stored locally on-device.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | [Expo](https://expo.dev) ~54.0 / React Native 0.81 |
| Language | TypeScript ~5.9 |
| Navigation | expo-router (file-based) + React Navigation drawer + bottom tabs |
| UI components | react-native-paper (Material Design 3) |
| Local storage | expo-sqlite (SQLite, all data stays on device) |
| Notifications | expo-notifications |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) via direct HTTP |
| Animations | react-native-reanimated, react-native-gesture-handler |
| Image picker | expo-image-picker |

## Project Structure

```
app/
  (drawer)/
    (tabs)/
      index.tsx        # Mood check-in (Home tab)
      dashboard.tsx    # Charts and insights (Dashboard tab)
    chat.tsx           # AI conversation screen
    diary.tsx          # Calendar-based diary browser
    profile.tsx        # User profile
    settings.tsx       # Theme / notifications / AI settings
components/
  emoji-picker.tsx     # Reusable emoji option selector
constants/
  mood-data.ts         # Mood, stress, and anxiety option sets
  theme.ts             # Theme palettes (Water, Lavender, Sage)
context/
  ThemeContext.tsx     # Dynamic theme + background image provider
lib/
  claude.ts            # Anthropic API client
  dashboard-utils.ts   # Chart data builders, streak logic, word parsing
  database.ts          # SQLite schema, migrations, and query helpers
  notifications.ts     # Daily reminder scheduling
```

## Getting Started

```bash
npm install
npx expo start
```

Open in an iOS simulator, Android emulator, or on a physical device via [Expo Go](https://expo.dev/go).

To use the AI chat feature, obtain an API key from [console.anthropic.com](https://console.anthropic.com) and enter it in the app's Settings screen. This is separate from a Claude.ai subscription.

## Data & Privacy

All mood entries, diary prompts, profile data, and settings are stored locally on the device using SQLite. Nothing is synced to a server. The only external network call the app makes is to the Anthropic API when the AI chat feature is actively used (opt-in, requires your own API key).
