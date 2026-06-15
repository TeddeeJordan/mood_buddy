import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { Themes } from '@/constants/theme';
import { initDatabase, initProfile } from '@/lib/database';

export const unstable_settings = {
  anchor: '(drawer)',
};

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Themes.lavender.primary,
    primaryContainer: Themes.lavender.tertiary,
    secondary: Themes.lavender.secondary,
    secondaryContainer: Themes.lavender.tertiary,
    background: Themes.lavender.background,
    surface: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onBackground: Themes.lavender.text,
    onSurface: Themes.lavender.text,
    outline: Themes.lavender.secondary,
  },
};

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    initProfile();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(drawer)" />
        </Stack>
        <StatusBar style="auto" />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
