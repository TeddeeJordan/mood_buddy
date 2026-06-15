import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
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
import { Themes } from '@/constants/theme';
import {
  type MoodEntry,
  getAllEntryDates,
  getEntriesForDateRange,
} from '@/lib/database';

type RangeType = 'week' | 'month' | 'year';

interface BarData {
  label: string;
  value: number | null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function emojiForValue(value: number, options: MoodOption[]): string {
  return options.find(o => o.value === Math.round(value))?.emoji ?? '😐';
}

function computeStreak(allDates: string[]): number {
  const dateSet = new Set(allDates);
  const today = localDateStr(new Date());
  const yesterday = localDateStr(addDays(new Date(), -1));

  const start = dateSet.has(today)
    ? today
    : dateSet.has(yesterday)
    ? yesterday
    : null;
  if (!start) return 0;

  let count = 0;
  let cur = new Date(`${start}T12:00:00`);
  while (dateSet.has(localDateStr(cur))) {
    count++;
    cur = addDays(cur, -1);
  }
  return count;
}

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','is','are','was','were','i','my','me','it',
  'of','to','in','that','this','for','with','at','by','from','on','be','not',
  'so','just','about','what','when','how','do','did','have','had','get','got',
  'can','will','would','could','should','he','she','they','we','you','its',
  'im','ive','dont','cant','wont','am','feel','feeling','really','very',
]);

function parseTopWords(
  notes: (string | null)[],
  topN: number,
): { word: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const note of notes) {
    if (!note) continue;
    note
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildBars(
  entries: MoodEntry[],
  range: RangeType,
  field: 'mood' | 'stress' | 'anxiety',
): BarData[] {
  const now = new Date();

  if (range === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(now, -(6 - i));
      const ds = localDateStr(day);
      const dayEntries = entries.filter(e => localDateStr(new Date(e.timestamp)) === ds);
      const avg = dayEntries.length
        ? dayEntries.reduce((s, e) => s + e[field], 0) / dayEntries.length
        : null;
      return { label: DAY_LABELS[day.getDay()], value: avg };
    });
  }

  if (range === 'month') {
    return Array.from({ length: 4 }, (_, i) => {
      const weekEnd = addDays(now, -(3 - i) * 7);
      const weekStart = addDays(weekEnd, -6);
      const ws = localDateStr(weekStart);
      const we = localDateStr(weekEnd);
      const wEntries = entries.filter(e => {
        const d = localDateStr(new Date(e.timestamp));
        return d >= ws && d <= we;
      });
      const avg = wEntries.length
        ? wEntries.reduce((s, e) => s + e[field], 0) / wEntries.length
        : null;
      return { label: `W${i + 1}`, value: avg };
    });
  }

  return Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const mEntries = entries.filter(e => {
      const d = new Date(e.timestamp);
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const avg = mEntries.length
      ? mEntries.reduce((s, e) => s + e[field], 0) / mEntries.length
      : null;
    return { label: MONTH_LABELS[m], value: avg };
  });
}

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
  const RANGES: RangeType[] = ['week', 'month', 'year'];
  return (
    <View style={rs.row}>
      {RANGES.map(r => (
        <TouchableOpacity
          key={r}
          style={[rs.btn, range === r && rs.btnActive]}
          onPress={() => onChange(r)}
          activeOpacity={0.7}
        >
          <Text style={[rs.label, range === r && rs.labelActive]}>
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
                <Text style={bc.emoji}>{emoji}</Text>
              )}
              {emoji != null && <View style={{ height: 4 }} />}
              <View
                style={[
                  bc.bar,
                  bar.value != null
                    ? { height: barH, backgroundColor: barColor }
                    : bc.emptyBar,
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={bc.labelsRow}>
        {data.map((bar, i) => (
          <Text key={i} style={bc.labelText} numberOfLines={1}>
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
  if (words.length === 0) {
    return <Text style={wc.empty}>{emptyText}</Text>;
  }
  const maxCount = words[0].count;
  return (
    <View style={wc.cloud}>
      {words.map(({ word, count }) => {
        const fontSize = Math.round(14 + (count / maxCount) * 12);
        const opacity = 0.6 + (count / maxCount) * 0.4;
        return (
          <View key={word} style={wc.chip}>
            <Text style={[wc.word, { fontSize, opacity }]}>{word}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StreakCounter({ streak }: { streak: number }) {
  return (
    <View style={sk.card}>
      <View style={sk.row}>
        <Text style={sk.flame}>🔥</Text>
        <Text style={sk.count}>{streak}</Text>
      </View>
      <Text style={sk.subLabel}>
        {streak === 1 ? '1 day in a row' : `${streak} days in a row`}
      </Text>
      {streak === 0 && (
        <Text style={sk.hint}>Log your mood today to start your streak!</Text>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigation = useNavigation();
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
  const topStressors = parseTopWords(visible.map(e => e.stress_note), 5);
  const topTriggers = parseTopWords(visible.map(e => e.anxiety_note), 5);
  const streak = computeStreak(allDates);

  return (
    <View style={s.container}>
      <Appbar.Header style={s.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={Themes.lavender.primary}
        />
        <Appbar.Content title="Dashboard" titleStyle={s.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <RangeSelector range={range} onChange={setRange} />

        <View style={s.card}>
          <Text style={s.cardTitle}>Mood</Text>
          <BarChart data={moodBars} options={MOOD_OPTIONS} barColor={Themes.lavender.primary} />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Stress</Text>
          <BarChart data={stressBars} options={STRESS_OPTIONS} barColor="#E07B7B" />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Top Stressors</Text>
          <WordCloud words={topStressors} emptyText="No stressor notes yet — high-stress days unlock this." />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Anxiety</Text>
          <BarChart data={anxietyBars} options={ANXIETY_OPTIONS} barColor="#7BA8D4" />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Top Anxiety Triggers</Text>
          <WordCloud words={topTriggers} emptyText="No anxiety notes yet — high-anxiety days unlock this." />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Daily Streak</Text>
          <StreakCounter streak={streak} />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const T = Themes.lavender;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  appbar: { backgroundColor: T.background },
  appbarTitle: { color: T.text, fontWeight: '700', fontSize: 20 },
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
    color: T.text,
    marginBottom: 14,
  },
});

const rs = StyleSheet.create({
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
  btnActive: { backgroundColor: T.primary },
  label: { fontSize: 14, fontWeight: '600', color: T.text, opacity: 0.6 },
  labelActive: { color: '#FFFFFF', opacity: 1 },
});

const bc = StyleSheet.create({
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
    backgroundColor: T.tertiary,
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
    color: T.text,
    opacity: 0.55,
    fontWeight: '500',
  },
});

const wc = StyleSheet.create({
  cloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: T.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  word: {
    color: T.primary,
    fontWeight: '600',
  },
  empty: {
    fontSize: 13,
    color: T.text,
    opacity: 0.45,
    paddingVertical: 8,
    fontStyle: 'italic',
  },
});

const sk = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flame: { fontSize: 40 },
  count: {
    fontSize: 56,
    fontWeight: '800',
    color: T.primary,
    lineHeight: 64,
  },
  subLabel: {
    fontSize: 15,
    color: T.text,
    opacity: 0.6,
    fontWeight: '500',
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: T.text,
    opacity: 0.45,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
