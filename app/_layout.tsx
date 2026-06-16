import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { Image } from 'expo-image';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { initDatabase, initDiaryPrompts, initProfile } from '@/lib/database';

SplashScreen.preventAutoHideAsync();

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initDatabase();
    initProfile();
    initDiaryPrompts();
    setIsReady(true);
    SplashScreen.hideAsync();
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
      {!isReady && (
        <View style={styles.splash}>
          <Image
            source={require('../assets/images/clouds_spinner.gif')}
            style={styles.gif}
            contentFit="contain"
            autoplay
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: {
    width: 200,
    height: 200,
  },
});
