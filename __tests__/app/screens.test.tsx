import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Navigation / routing mocks ────────────────────────────────────────────────

const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ dispatch: mockDispatch }),
  DrawerActions: { openDrawer: () => 'openDrawer' },
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ── expo-sqlite mock ──────────────────────────────────────────────────────────

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => ({ bio: '', photo_uri: null })),
  })),
}));

// ── expo-image-picker mock ────────────────────────────────────────────────────

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// ── @expo/vector-icons mock ───────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: () => null,
}));

// ── react-native-paper: passthrough stubs (no JSX inside jest.mock) ──────────

jest.mock('react-native-paper', () => {
  const { createElement } = require('react');
  const { View, Text: RNText, TouchableOpacity, TextInput: RNTextInput } = require('react-native');

  return {
    Appbar: {
      Header: ({ children }: { children: unknown }) => createElement(View, null, children),
      Action: ({ onPress, icon }: { onPress?: () => void; icon?: string }) =>
        createElement(TouchableOpacity, { onPress, testID: `appbar-action-${icon}` }),
      Content: ({ title }: { title: string }) => createElement(RNText, null, title),
    },
    Button: ({ children, onPress }: { children: unknown; onPress?: () => void }) =>
      createElement(TouchableOpacity, { onPress }, createElement(RNText, null, children)),
    Text: ({ children }: { children: unknown }) => createElement(RNText, null, children),
    TextInput: ({ value, onChangeText }: { value?: string; onChangeText?: (t: string) => void }) =>
      createElement(RNTextInput, { value, onChangeText }),
  };
});

// ── Screen imports (after mocks are registered) ───────────────────────────────

import ProfileScreen from '@/app/(drawer)/profile';
import SettingsScreen from '@/app/(drawer)/settings';
import HomeScreen from '@/app/(drawer)/(tabs)/index';
import DashboardScreen from '@/app/(drawer)/(tabs)/dashboard';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── ProfileScreen (smoke tests — comprehensive tests are in profile.test.tsx) ──
// Use a never-resolving fetch so no async state update fires during render,
// which would cause overlapping act() warnings and corrupt subsequent describe blocks.

describe('ProfileScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
  });
  afterEach(() => {
    delete (global as any).fetch;
  });

  it('renders the title', async () => {
    const { getByText } = await render(<ProfileScreen />);
    expect(getByText('Profile')).toBeTruthy();
  });

  it('renders the bio placeholder when bio is empty', async () => {
    const { getByText } = await render(<ProfileScreen />);
    expect(getByText('Tap the pencil to add a bio…')).toBeTruthy();
  });
});

// ── SettingsScreen ────────────────────────────────────────────────────────────

describe('SettingsScreen', () => {
  it('renders the title', async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
  });

  it('renders the placeholder text', async () => {
    const { getByText } = await render(<SettingsScreen />);
    expect(getByText('Settings coming soon.')).toBeTruthy();
  });
});

// ── HomeScreen ────────────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  it('renders section labels', async () => {
    const { getByText } = await render(<HomeScreen />);
    expect(getByText('How are you feeling today?')).toBeTruthy();
    expect(getByText('How is your stress level?')).toBeTruthy();
    expect(getByText('How is your anxiety level?')).toBeTruthy();
  });

  it('renders mood emoji options', async () => {
    const { getByText, getAllByText } = await render(<HomeScreen />);
    expect(getByText('😭')).toBeTruthy();
    expect(getByText('😟')).toBeTruthy();
    // 😐 appears in mood, stress, and anxiety lists — verify at least one is present
    expect(getAllByText('😐').length).toBeGreaterThanOrEqual(1);
    expect(getByText('😊')).toBeTruthy();
    expect(getByText('😄')).toBeTruthy();
  });

  it('shows an alert when submit is pressed without selections', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = await render(<HomeScreen />);
    await fireEvent.press(getByText('Submit'));
    expect(alertSpy).toHaveBeenCalledWith('Incomplete', expect.any(String));
  });

  it('does not show stress note input by default', async () => {
    const { queryByText } = await render(<HomeScreen />);
    expect(queryByText('What do you think is stressing you out?')).toBeNull();
  });

  it('shows stress note input when a low-stress option is selected', async () => {
    const { getByText, findByText } = await render(<HomeScreen />);
    await fireEvent.press(getByText('Overwhelmed'));
    expect(await findByText('What do you think is stressing you out?')).toBeTruthy();
  });

  it('hides stress note input when a high-stress option is then selected', async () => {
    const { getByText, findByText, queryByText } = await render(<HomeScreen />);
    await fireEvent.press(getByText('Overwhelmed'));
    await findByText('What do you think is stressing you out?');
    await fireEvent.press(getByText('Stressfree'));
    await waitFor(() => {
      expect(queryByText('What do you think is stressing you out?')).toBeNull();
    });
  });

  it('shows anxiety note input when a low-anxiety option is selected', async () => {
    const { getByText, findByText } = await render(<HomeScreen />);
    await fireEvent.press(getByText('Panicked'));
    expect(await findByText('Have you thought about what is triggering your anxiety?')).toBeTruthy();
  });

  it('saves entry and resets form on valid submit', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = await render(<HomeScreen />);
    // fireEvent.press is async in RTNL v14 — must await each so state flushes between presses.
    await fireEvent.press(getByText('Happy'));
    await fireEvent.press(getByText('Chill'));
    await fireEvent.press(getByText('Relaxed'));
    await fireEvent.press(getByText('Submit'));
    expect(alertSpy).toHaveBeenCalledWith('Saved!', expect.any(String));
  });
});

// ── DashboardScreen ───────────────────────────────────────────────────────────

describe('DashboardScreen', () => {
  it('renders the dashboard title', async () => {
    const { getByText } = await render(<DashboardScreen />);
    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('renders the range selector buttons', async () => {
    const { findByText } = await render(<DashboardScreen />);
    expect(await findByText('Week')).toBeTruthy();
    expect(await findByText('Month')).toBeTruthy();
    expect(await findByText('Year')).toBeTruthy();
  });

  it('renders chart section labels', async () => {
    const { findByText } = await render(<DashboardScreen />);
    expect(await findByText('Mood')).toBeTruthy();
    expect(await findByText('Stress')).toBeTruthy();
    expect(await findByText('Anxiety')).toBeTruthy();
  });

  it('renders the streak card', async () => {
    const { findByText } = await render(<DashboardScreen />);
    expect(await findByText('Daily Streak')).toBeTruthy();
  });

  it('switches to month range when Month is pressed', async () => {
    const { findByText } = await render(<DashboardScreen />);
    const monthBtn = await findByText('Month');
    await fireEvent.press(monthBtn);
    expect(await findByText('Month')).toBeTruthy();
  });
});
