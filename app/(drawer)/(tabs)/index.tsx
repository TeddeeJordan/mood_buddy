import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar, Button, Text, TextInput } from 'react-native-paper';
import { EmojiPicker } from '@/components/emoji-picker';
import { ANXIETY_OPTIONS, MOOD_OPTIONS, STRESS_OPTIONS } from '@/constants/mood-data';
import { Themes } from '@/constants/theme';
import { insertMoodEntry } from '@/lib/database';

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [stressNote, setStressNote] = useState('');
  const [anxiety, setAnxiety] = useState<number | null>(null);
  const [anxietyNote, setAnxietyNote] = useState('');

  const showStressInput = stress !== null && stress <= 2;
  const showAnxietyInput = anxiety !== null && anxiety <= 2;

  function handleSubmit() {
    if (mood === null || stress === null || anxiety === null) {
      Alert.alert('Incomplete', 'Please select your mood, stress, and anxiety levels before submitting.');
      return;
    }

    insertMoodEntry({
      timestamp: new Date().toISOString(),
      mood,
      stress,
      stress_note: showStressInput ? stressNote.trim() || null : null,
      anxiety,
      anxiety_note: showAnxietyInput ? anxietyNote.trim() || null : null,
    });

    setMood(null);
    setStress(null);
    setStressNote('');
    setAnxiety(null);
    setAnxietyNote('');

    Alert.alert('Saved!', 'Your mood has been recorded.');
  }

  function handleStressSelect(value: number) {
    setStress(value);
    if (value > 2) setStressNote('');
  }

  function handleAnxietySelect(value: number) {
    setAnxiety(value);
    if (value > 2) setAnxietyNote('');
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={Themes.lavender.primary}
        />
        <Appbar.Content title="Mood Buddy" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleMedium" style={styles.sectionLabel}>
          How are you feeling today?
        </Text>
        <EmojiPicker options={MOOD_OPTIONS} selected={mood} onSelect={setMood} />

        <Text variant="titleMedium" style={styles.sectionLabel}>
          How is your stress level?
        </Text>
        <EmojiPicker options={STRESS_OPTIONS} selected={stress} onSelect={handleStressSelect} />

        {showStressInput && (
          <View style={styles.noteBlock}>
            <Text style={styles.noteLabel}>
              What do you think is stressing you out?
            </Text>
            <TextInput
              value={stressNote}
              onChangeText={setStressNote}
              multiline
              numberOfLines={3}
              maxLength={300}
              mode="outlined"
              style={styles.textInput}
            />
            <Text style={styles.charCount}>{stressNote.length}/300</Text>
          </View>
        )}

        <Text variant="titleMedium" style={styles.sectionLabel}>
          How is your anxiety level?
        </Text>
        <EmojiPicker options={ANXIETY_OPTIONS} selected={anxiety} onSelect={handleAnxietySelect} />

        {showAnxietyInput && (
          <View style={styles.noteBlock}>
            <Text style={styles.noteLabel}>
              Have you thought about what is triggering your anxiety?
            </Text>
            <TextInput
              value={anxietyNote}
              onChangeText={setAnxietyNote}
              multiline
              numberOfLines={3}
              maxLength={300}
              mode="outlined"
              style={styles.textInput}
            />
            <Text style={styles.charCount}>{anxietyNote.length}/300</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          contentStyle={styles.submitContent}
          labelStyle={styles.submitLabel}
        >
          Submit
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Themes.lavender.background,
  },
  appbar: {
    backgroundColor: Themes.lavender.background,
  },
  appbarTitle: {
    color: Themes.lavender.text,
    fontWeight: '700',
    fontSize: 20,
  },
  scroll: {
    padding: 16,
    paddingBottom: 16,
  },
  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Themes.lavender.background,
    borderTopWidth: 1,
    borderTopColor: Themes.lavender.tertiary,
  },
  sectionLabel: {
    color: Themes.lavender.text,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  noteBlock: {
    marginTop: 12,
  },
  noteLabel: {
    fontSize: 14,
    color: Themes.lavender.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: Themes.lavender.text,
    opacity: 0.55,
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 50,
  },
  submitContent: {
    paddingVertical: 6,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
