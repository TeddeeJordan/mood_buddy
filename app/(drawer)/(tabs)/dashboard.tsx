import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import {
  ANXIETY_OPTIONS,
  MOOD_OPTIONS,
  STRESS_OPTIONS,
  type MoodOption,
} from '@/constants/mood-data';
import type { ThemePalette } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import {
  type MoodEntry,
  getAllEntryDates,
  getEntriesForDateRange,
} from '@/lib/database';
import {
  type RangeType,
  type BarData,
  addDays,
  buildBars,
  computeStreak,
  emojiForValue,
  parseTopWords,
} from '@/lib/dashboard-utils';

// ── Sub-components ────────────────────────────────────────────────────────────

const CHART_H = 148;
const BAR_MAX_H = 108;

function RangeSelector({
  range,
  onChange,
}: {
  range: RangeType;
  onChange: (r: RangeType) => void;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 4,
      gap: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 2,
    },
    btn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnActive: { backgroundColor: theme.primary },
    label: { fontSize: 14, fontWeight: '600', color: theme.text, opacity: 0.6 },
    labelActive: { color: '#FFFFFF', opacity: 1 },
  }), [theme]);

  const RANGES: RangeType[] = ['week', 'month', 'year'];
  return (
    <View style={styles.row}>
      {RANGES.map(r => (
        <TouchableOpacity
          key={r}
          style={[styles.btn, range === r && styles.btnActive]}
          onPress={() => onChange(r)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, range === r && styles.labelActive]}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function BarChart({
  data,
  options,
  barColor,
}: {
  data: BarData[];
  options: MoodOption[];
  barColor: string;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
    emoji: { fontSize: 16, lineHeight: 20 },
    bar: {
      width: '62%',
      borderRadius: 5,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
    },
    emptyBar: {
      width: '62%',
      height: 4,
      backgroundColor: theme.tertiary,
      borderRadius: 2,
      opacity: 0.5,
    },
    labelsRow: {
      flexDirection: 'row',
      marginTop: 6,
    },
    labelText: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      color: theme.text,
      opacity: 0.55,
      fontWeight: '500',
    },
  }), [theme]);

  return (
    <View>
      <View style={{ flexDirection: 'row', height: CHART_H }}>
        {data.map((bar, i) => {
          const barH =
            bar.value != null ? Math.max((bar.value / 5) * BAR_MAX_H, 5) : 0;
          const emoji =
            bar.value != null ? emojiForValue(bar.value, options) : null;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: CHART_H,
              }}
            >
              {emoji != null && (
                <Text style={styles.emoji}>{emoji}</Text>
              )}
              {emoji != null && <View style={{ height: 4 }} />}
              <View
                style={[
                  styles.bar,
                  bar.value != null
                    ? { height: barH, backgroundColor: barColor }
                    : styles.emptyBar,
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {data.map((bar, i) => (
          <Text key={i} style={styles.labelText} numberOfLines={1}>
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function WordCloud({
  words,
  emptyText,
}: {
  words: { word: string; count: number }[];
  emptyText: string;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
    cloud: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 4,
    },
    chip: {
      backgroundColor: theme.background,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    word: {
      color: theme.primary,
      fontWeight: '600',
    },
    empty: {
      fontSize: 13,
      color: theme.text,
      opacity: 0.45,
      paddingVertical: 8,
      fontStyle: 'italic',
    },
  }), [theme]);

  if (words.length === 0) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }
  const maxCount = words[0].count;
  return (
    <View style={styles.cloud}>
      {words.map(({ word, count }) => {
        const fontSize = Math.round(14 + (count / maxCount) * 12);
        const opacity = 0.6 + (count / maxCount) * 0.4;
        return (
          <View key={word} style={styles.chip}>
            <Text style={[styles.word, { fontSize, opacity }]}>{word}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StreakCounter({ streak }: { streak: number }) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create({
    card: { alignItems: 'center', paddingVertical: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    flame: { fontSize: 40 },
    count: {
      fontSize: 56,
      fontWeight: '800',
      color: theme.primary,
      lineHeight: 64,
    },
    subLabel: {
      fontSize: 15,
      color: theme.text,
      opacity: 0.6,
      fontWeight: '500',
      marginTop: 4,
    },
    hint: {
      fontSize: 13,
      color: theme.text,
      opacity: 0.45,
      marginTop: 8,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  }), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.count}>{streak}</Text>
      </View>
      <Text style={styles.subLabel}>
        {streak === 1 ? '1 day in a row' : `${streak} days in a row`}
      </Text>
      {streak === 0 && (
        <Text style={styles.hint}>Log your mood today to start your streak!</Text>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

function makeScreenStyles(theme: ThemePalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    appbar: { backgroundColor: theme.background },
    appbarTitle: { color: theme.text, fontWeight: '700', fontSize: 20 },
    scroll: { padding: 16, paddingBottom: 32, gap: 16 },
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
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 14,
    },
  });
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { theme, backgroundImage } = useAppTheme();
  const styles = useMemo(() => makeScreenStyles(theme), [theme]);

  const [range, setRange] = useState<RangeType>('week');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      const yearAgo = addDays(now, -366);
      setEntries(getEntriesForDateRange(yearAgo.toISOString(), now.toISOString()));
      setAllDates(getAllEntryDates());
    }, []),
  );

  const cutoff =
    range === 'week'
      ? addDays(new Date(), -7)
      : range === 'month'
      ? addDays(new Date(), -28)
      : addDays(new Date(), -366);

  const visible = entries.filter(e => new Date(e.timestamp) >= cutoff);

  const moodBars = buildBars(visible, range, 'mood');
  const stressBars = buildBars(visible, range, 'stress');
  const anxietyBars = buildBars(visible, range, 'anxiety');
  const topStressors = parseTopWords([
    ...visible.map(e => e.stress_note_1),
    ...visible.map(e => e.stress_note_2),
    ...visible.map(e => e.stress_note_3),
  ], 5);
  const topTriggers = parseTopWords([
    ...visible.map(e => e.anxiety_note_1),
    ...visible.map(e => e.anxiety_note_2),
    ...visible.map(e => e.anxiety_note_3),
  ], 5);
  const streak = computeStreak(allDates);

  return (
    <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover" imageStyle={{ opacity: 0.35 }}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={theme.primary}
        />
        <Appbar.Content title="Dashboard" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <RangeSelector range={range} onChange={setRange} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mood</Text>
          <BarChart data={moodBars} options={MOOD_OPTIONS} barColor={theme.primary} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stress</Text>
          <BarChart data={stressBars} options={STRESS_OPTIONS} barColor="#E07B7B" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Stressors</Text>
          <WordCloud words={topStressors} emptyText="No stressor notes yet — high-stress days unlock this." />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Anxiety</Text>
          <BarChart data={anxietyBars} options={ANXIETY_OPTIONS} barColor="#7BA8D4" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Anxiety Triggers</Text>
          <WordCloud words={topTriggers} emptyText="No anxiety notes yet — high-anxiety days unlock this." />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Streak</Text>
          <StreakCounter streak={streak} />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
