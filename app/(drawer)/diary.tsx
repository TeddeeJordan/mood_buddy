import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import type { ThemePalette } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import type { DiaryPrompt } from '@/lib/database';
import { getDiaryPromptsForRange } from '@/lib/database';

// ── Date helpers ───────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetweenExclusive(d: Date, start: Date, end: Date) {
  const t = d.getTime();
  return t > start.getTime() && t < end.getTime();
}

function daysBetweenInclusive(a: Date, b: Date) {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 86_400_000) + 1;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const firstDow = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

// ── Range calendar ─────────────────────────────────────────────────────────────

type DateRange = { start: Date; end: Date } | null;

const CELL_SIZE = 44;
const STRIP_V_INSET = 4; // vertical inset so strip is shorter than cell height

function RangeCalendar({
  range,
  onRangeChange,
  theme,
}: {
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  theme: ThemePalette;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  const weeks = useMemo(
    () => getCalendarWeeks(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function handleDayPress(date: Date) {
    if (!pendingStart) {
      setPendingStart(date);
      onRangeChange(null);
      return;
    }

    if (isSameDay(date, pendingStart)) {
      // Single-day selection
      onRangeChange({ start: date, end: date });
      setPendingStart(null);
      return;
    }

    let start = pendingStart;
    let end = date;
    if (end < start) [start, end] = [end, start];

    if (daysBetweenInclusive(start, end) > 30) {
      Alert.alert('Range too large', 'Please select a date range of up to 30 days.');
      return;
    }

    onRangeChange({ start, end });
    setPendingStart(null);
  }

  const isSingleDay = range ? isSameDay(range.start, range.end) : false;

  return (
    <View style={[calStyles.card, { shadowColor: theme.primary }]}>
      {/* Month navigation */}
      <View style={calStyles.monthNav}>
        <Pressable onPress={prevMonth} hitSlop={16} style={calStyles.navBtn}>
          <Text style={[calStyles.navArrow, { color: theme.primary }]}>‹</Text>
        </Pressable>
        <Text style={[calStyles.monthLabel, { color: theme.text }]}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={nextMonth} hitSlop={16} style={calStyles.navBtn}>
          <Text style={[calStyles.navArrow, { color: theme.primary }]}>›</Text>
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={calStyles.dowRow}>
        {DOW_LABELS.map((d) => (
          <View key={d} style={calStyles.dowCell}>
            <Text style={[calStyles.dowText, { color: theme.secondary }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={calStyles.weekRow}>
          {week.map((date, di) => {
            if (!date) {
              return <View key={di} style={calStyles.emptyCell} />;
            }

            const isToday = isSameDay(date, today);
            const isPending = pendingStart ? isSameDay(date, pendingStart) : false;
            const isStart = range ? isSameDay(date, range.start) : false;
            const isEnd = range ? isSameDay(date, range.end) : false;
            const inRange =
              range && !isSingleDay
                ? isBetweenExclusive(date, range.start, range.end)
                : false;

            const showStrip = inRange || (isStart && !isSingleDay) || (isEnd && !isSingleDay);
            const showPendingCircle = isPending && !range;

            return (
              <Pressable
                key={di}
                style={calStyles.dayCell}
                onPress={() => handleDayPress(date)}
              >
                {/* Range strip */}
                {showStrip && (
                  <View
                    style={[
                      calStyles.strip,
                      { backgroundColor: theme.tertiary },
                      isStart && calStyles.stripLeftRound,
                      isEnd && calStyles.stripRightRound,
                    ]}
                  />
                )}

                {/* Filled circle for start/end/pending/single-day */}
                {(isStart || isEnd || showPendingCircle) && (
                  <View style={[calStyles.circle, { backgroundColor: theme.primary }]} />
                )}

                {/* Today outline ring (only when not selected) */}
                {isToday && !isStart && !isEnd && !isPending && (
                  <View style={[calStyles.todayRing, { borderColor: theme.secondary }]} />
                )}

                <Text
                  style={[
                    calStyles.dayText,
                    { color: isToday && !isStart && !isEnd ? theme.primary : theme.text },
                    (isStart || isEnd || showPendingCircle) && calStyles.dayTextOnCircle,
                    inRange && { color: theme.primary, fontWeight: '600' },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={{ height: 8 }} />
    </View>
  );
}

const calStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    paddingTop: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navBtn: {
    width: 36,
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  dowRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  dowCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  emptyCell: {
    flex: 1,
    height: CELL_SIZE,
  },
  dayCell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: {
    position: 'absolute',
    top: STRIP_V_INSET,
    bottom: STRIP_V_INSET,
    left: 0,
    right: 0,
  },
  stripLeftRound: {
    borderTopLeftRadius: (CELL_SIZE - STRIP_V_INSET * 2) / 2,
    borderBottomLeftRadius: (CELL_SIZE - STRIP_V_INSET * 2) / 2,
  },
  stripRightRound: {
    borderTopRightRadius: (CELL_SIZE - STRIP_V_INSET * 2) / 2,
    borderBottomRightRadius: (CELL_SIZE - STRIP_V_INSET * 2) / 2,
  },
  circle: {
    position: 'absolute',
    width: CELL_SIZE - STRIP_V_INSET * 2,
    height: CELL_SIZE - STRIP_V_INSET * 2,
    borderRadius: (CELL_SIZE - STRIP_V_INSET * 2) / 2,
  },
  todayRing: {
    position: 'absolute',
    width: CELL_SIZE - STRIP_V_INSET * 2,
    height: CELL_SIZE - STRIP_V_INSET * 2,
    borderRadius: (CELL_SIZE - STRIP_V_INSET * 2) / 2,
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '400',
  },
  dayTextOnCircle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

// ── Styles ─────────────────────────────────────────────────────────────────────

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
      paddingTop: 16,
      paddingBottom: 40,
    },
    hint: {
      marginTop: 16,
      marginHorizontal: 16,
      textAlign: 'center',
      fontSize: 13,
      color: theme.secondary,
    },
    rangeLabel: {
      marginTop: 12,
      marginHorizontal: 16,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 2,
    },
    cardTimestamp: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.secondary,
      marginBottom: 8,
    },
    cardPrompt: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 22,
    },
    emptyState: {
      marginTop: 24,
      textAlign: 'center',
      fontSize: 14,
      color: theme.secondary,
    },
  });
}

// ── Screen ─────────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} at ${time}`;
}

export default function DiaryScreen() {
  const navigation = useNavigation();
  const { theme, backgroundImage } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const todayDate = useMemo(() => new Date(), []);
  const [range, setRange] = useState<DateRange>({ start: todayDate, end: todayDate });

  const prompts = useMemo<DiaryPrompt[]>(() => {
    if (!range) return [];
    const start = new Date(range.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(23, 59, 59, 999);
    return getDiaryPromptsForRange(start.toISOString(), end.toISOString());
  }, [range]);

  const rangeText = range
    ? isSameDay(range.start, range.end)
      ? formatDate(range.start)
      : `${formatDate(range.start)} – ${formatDate(range.end)}`
    : null;

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.35 }}
    >
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={theme.primary}
        />
        <Appbar.Content title="Diary" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <RangeCalendar range={range} onRangeChange={setRange} theme={theme} />

        {rangeText ? (
          <Text style={styles.rangeLabel}>{rangeText}</Text>
        ) : (
          <Text style={styles.hint}>Tap a date to start, then tap another to select a range</Text>
        )}

        {range && prompts.length === 0 && (
          <Text style={styles.emptyState}>No diary entries for this period.</Text>
        )}

        {prompts.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.cardTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
            <Text style={styles.cardPrompt}>{entry.prompt}</Text>
          </View>
        ))}
      </ScrollView>
    </ImageBackground>
  );
}
