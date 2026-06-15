import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

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

// ── react-native-paper: passthrough stubs ────────────────────────────────────

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

// ── Component under test ──────────────────────────────────────────────────────

import ProfileScreen from '@/app/(drawer)/profile';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── ProfileScreen ─────────────────────────────────────────────────────────────

describe('ProfileScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue([{ q: 'Stay positive.', a: 'Unknown' }]),
    });
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('renders the title', async () => {
    const { findByText } = await render(<ProfileScreen />);
    expect(await findByText('Profile')).toBeTruthy();
  });

  it('renders the bio section label', async () => {
    const { findByText } = await render(<ProfileScreen />);
    expect(await findByText('Bio')).toBeTruthy();
  });

  it('renders the bio placeholder when bio is empty', async () => {
    const { findByText } = await render(<ProfileScreen />);
    expect(await findByText('Tap the pencil to add a bio…')).toBeTruthy();
  });

  it('renders the Daily Inspiration section label', async () => {
    const { findByText } = await render(<ProfileScreen />);
    expect(await findByText('Daily Inspiration')).toBeTruthy();
  });

  it('shows loading text while the quote is pending', async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    const { getByText } = await render(<ProfileScreen />);
    expect(getByText('Loading…')).toBeTruthy();
  });

  it('shows the quote and author after fetch resolves', async () => {
    const { findByText } = await render(<ProfileScreen />);
    expect(await findByText('"Stay positive."')).toBeTruthy();
    expect(await findByText('— Unknown')).toBeTruthy();
  });

  it('shows the ZenQuotes attribution after fetch resolves', async () => {
    const { findByText } = await render(<ProfileScreen />);
    expect(await findByText('Powered by ZenQuotes.io')).toBeTruthy();
  });

  it('does not crash when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const { findByText } = await render(<ProfileScreen />);
    expect(await findByText('Tap the pencil to add a bio…')).toBeTruthy();
  });

  it('enters edit mode and shows the bio TextInput when pencil is pressed', async () => {
    const { getByTestId, findByPlaceholderText } = await render(<ProfileScreen />);
    fireEvent.press(getByTestId('appbar-action-pencil'));
    expect(await findByPlaceholderText('Write something about yourself…')).toBeTruthy();
  });

  it('shows the character counter in edit mode', async () => {
    const { getByTestId, findByText } = await render(<ProfileScreen />);
    fireEvent.press(getByTestId('appbar-action-pencil'));
    expect(await findByText('0 / 1000')).toBeTruthy();
  });

  it('updates the character counter as the user types', async () => {
    const { getByTestId, findByPlaceholderText, findByText } = await render(<ProfileScreen />);
    fireEvent.press(getByTestId('appbar-action-pencil'));
    const input = await findByPlaceholderText('Write something about yourself…');
    fireEvent.changeText(input, 'Hello');
    expect(await findByText('5 / 1000')).toBeTruthy();
  });

  it('exits edit mode when cancel is pressed', async () => {
    const { getByTestId, findByTestId, queryByPlaceholderText } = await render(<ProfileScreen />);
    fireEvent.press(getByTestId('appbar-action-pencil'));
    fireEvent.press(await findByTestId('appbar-action-close'));
    await waitFor(() => {
      expect(queryByPlaceholderText('Write something about yourself…')).toBeNull();
    });
  });

  it('saves and exits edit mode when check is pressed', async () => {
    const { getByTestId, findByTestId, findByPlaceholderText, queryByPlaceholderText } = await render(<ProfileScreen />);
    fireEvent.press(getByTestId('appbar-action-pencil'));
    await findByTestId('appbar-action-close'); // wait for edit mode to activate
    const input = await findByPlaceholderText('Write something about yourself…');
    fireEvent.changeText(input, 'My new bio');
    fireEvent.press(getByTestId('appbar-action-check'));
    await waitFor(() => {
      expect(queryByPlaceholderText('Write something about yourself…')).toBeNull();
    });
  });
});
