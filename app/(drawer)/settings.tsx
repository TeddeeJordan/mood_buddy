import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Switch, Text } from 'react-native-paper';
import type { ThemeName, ThemePalette } from '@/constants/theme';
import { Themes } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { getSetting, setSetting } from '@/lib/database';
import {
  cancelDailyReminder,
  requestNotificationPermissions,
  scheduleDailyReminder,
} from '@/lib/notifications';

// ── Theme picker ───────────────────────────────────────────────────────────────

const THEME_OPTIONS: { name: ThemeName; label: string }[] = [
  { name: 'water', label: 'Water' },
  { name: 'lavender', label: 'Lavender' },
  { name: 'sage', label: 'Sage' },
];

function ThemePicker() {
  const { themeName, setThemeName, theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Theme</Text>
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map(({ name, label }) => {
          const isSelected = themeName === name;
          const palette = Themes[name];
          return (
            <Pressable
              key={name}
              style={[styles.themeOption, isSelected && { borderColor: palette.primary, borderWidth: 2 }]}
              onPress={() => setThemeName(name)}
              android_ripple={{ color: palette.tertiary }}
            >
              <View style={[styles.swatch, { backgroundColor: palette.primary }]}>
                {isSelected && (
                  <Text style={styles.swatchCheck}>✓</Text>
                )}
              </View>
              <Text style={[styles.themeLabel, isSelected && { color: palette.primary, fontWeight: '700' }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeFromParts(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display12 = h % 12 || 12;
  return `${display12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Notifications section ──────────────────────────────────────────────────────

function NotificationsSection() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [enabled, setEnabled] = useState(() => getSetting('reminder_enabled') === 'true');
  const [time, setTime] = useState<Date>(() => {
    const hour = parseInt(getSetting('reminder_hour') ?? '18', 10);
    const minute = parseInt(getSetting('reminder_minute') ?? '0', 10);
    return timeFromParts(hour, minute);
  });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setSetting('reminder_enabled', String(enabled));
    if (enabled) {
      scheduleDailyReminder(time.getHours(), time.getMinutes()).catch(() => {});
    } else {
      cancelDailyReminder().catch(() => {});
    }
  }, [enabled]);

  async function handleToggle(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please allow notifications in your device settings to receive daily reminders.',
        );
        return;
      }
    }
    setEnabled(value);
  }

  function handleTimeChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected) return;
    setTime(selected);
    setSetting('reminder_hour', String(selected.getHours()));
    setSetting('reminder_minute', String(selected.getMinutes()));
    if (enabled) {
      scheduleDailyReminder(selected.getHours(), selected.getMinutes()).catch(() => {});
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Notifications</Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Remind me to check in</Text>
        <Switch value={enabled} onValueChange={handleToggle} color={theme.primary} />
      </View>

      {enabled && (
        <>
          <View style={styles.divider} />
          <Text style={styles.timeQuestion}>
            What time would you like to check in each day?
          </Text>

          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              style={styles.iosPicker}
            />
          ) : (
            <>
              <Pressable
                style={styles.androidTimeButton}
                onPress={() => setShowPicker(true)}
              >
                <Text style={[styles.androidTimeText, { color: theme.primary }]}>
                  {formatTime(time)}
                </Text>
              </Pressable>
              {showPicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

// ── Styles factory ─────────────────────────────────────────────────────────────

function makeStyles(theme: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    appbar: {
      backgroundColor: theme.background,
    },
    appbarTitle: {
      color: theme.text,
      fontWeight: '700',
    },
    scroll: {
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 16,
    },

    // Theme picker
    themeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: theme.background,
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchCheck: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '700',
    },
    themeLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.text,
    },

    // Notifications
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '500',
      flex: 1,
      marginRight: 12,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background,
      marginVertical: 16,
    },
    timeQuestion: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '500',
      marginBottom: 8,
    },
    iosPicker: {
      marginTop: 4,
    },
    androidTimeButton: {
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: theme.background,
      alignSelf: 'flex-start',
    },
    androidTimeText: {
      fontSize: 20,
      fontWeight: '600',
    },
  });
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={theme.primary}
        />
        <Appbar.Content title="Settings" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ThemePicker />
        <NotificationsSection />
      </ScrollView>
    </View>
  );
}
