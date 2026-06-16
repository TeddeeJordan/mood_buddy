import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { initDatabase, initDiaryPrompts, initProfile } from '@/lib/database';

export const unstable_settings = {
  anchor: '(drawer)',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function ThemedPaperProvider({ children }: { children: ReactNode }) {
  const { paperTheme } = useAppTheme();
  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
}

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    initProfile();
    initDiaryPrompts();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.navigate('/');
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedPaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(drawer)" />
          </Stack>
          <StatusBar style="auto" />
        </ThemedPaperProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
