import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar, Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { EmojiPicker } from '@/components/emoji-picker';
import { ANXIETY_OPTIONS, MOOD_OPTIONS, STRESS_OPTIONS } from '@/constants/mood-data';
import type { ThemePalette } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { getSetting, insertDiaryPrompt, insertMoodEntry, setSetting } from '@/lib/database';

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
      fontSize: 20,
    },
    scroll: {
      padding: 16,
      paddingBottom: 16,
    },
    stickyFooter: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.tertiary,
    },
    sectionLabel: {
      color: theme.text,
      fontWeight: '600',
      marginTop: 24,
      marginBottom: 12,
    },
    noteBlock: {
      marginTop: 12,
    },
    noteLabel: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: '#FFFFFF',
    },
    charCount: {
      textAlign: 'right',
      fontSize: 12,
      color: theme.text,
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
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { backgroundImage } = useAppTheme();

  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [stressNotes, setStressNotes] = useState<[string, string, string]>(['', '', '']);
  const [anxiety, setAnxiety] = useState<number | null>(null);
  const [anxietyNotes, setAnxietyNotes] = useState<[string, string, string]>(['', '', '']);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showTalkDialog, setShowTalkDialog] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');

  const showStressInput = stress !== null && stress <= 2;
  const showAnxietyInput = anxiety !== null && anxiety <= 2;

  function joinList(items: [string, string, string]): string {
    const filtered = items.map(s => s.trim()).filter(Boolean);
    if (filtered.length === 0) return '';
    if (filtered.length === 1) return filtered[0];
    if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
    return `${filtered[0]}, ${filtered[1]}, and ${filtered[2]}`;
  }

  function buildPrompt(
    moodVal: number,
    stressVal: number,
    stressNotesVal: [string, string, string],
    anxietyVal: number,
    anxietyNotesVal: [string, string, string],
  ): string {
    const moodLabel = MOOD_OPTIONS.find((o) => o.value === moodVal)?.label ?? String(moodVal);
    const stressLabel = STRESS_OPTIONS.find((o) => o.value === stressVal)?.label ?? String(stressVal);
    const anxietyLabel = ANXIETY_OPTIONS.find((o) => o.value === anxietyVal)?.label ?? String(anxietyVal);

    const parts: string[] = [];
    parts.push(`Right now I feel ${moodLabel}.`);
    parts.push(`My stress level is ${stressLabel}.`);
    const stressJoined = joinList(stressNotesVal);
    if (stressVal <= 2 && stressJoined) {
      parts.push(`My main stressors right now are ${stressJoined}.`);
    }
    parts.push(`My anxiety level is ${anxietyLabel}.`);
    const anxietyJoined = joinList(anxietyNotesVal);
    if (anxietyVal <= 2 && anxietyJoined) {
      parts.push(`My anxiety triggers are ${anxietyJoined}.`);
    }
    parts.push('I would like to talk about my feelings and get insight.');
    return parts.join(' ');
  }

  function handleSubmit() {
    if (mood === null || stress === null || anxiety === null) {
      Alert.alert('Incomplete', 'Please select your mood, stress, and anxiety levels before submitting.');
      return;
    }

    insertMoodEntry({
      timestamp: new Date().toISOString(),
      mood,
      stress,
      stress_note_1: showStressInput ? stressNotes[0].trim() || null : null,
      stress_note_2: showStressInput ? stressNotes[1].trim() || null : null,
      stress_note_3: showStressInput ? stressNotes[2].trim() || null : null,
      anxiety,
      anxiety_note_1: showAnxietyInput ? anxietyNotes[0].trim() || null : null,
      anxiety_note_2: showAnxietyInput ? anxietyNotes[1].trim() || null : null,
      anxiety_note_3: showAnxietyInput ? anxietyNotes[2].trim() || null : null,
    });

    const prompt = buildPrompt(mood, stress, stressNotes, anxiety, anxietyNotes);
    insertDiaryPrompt(prompt);
    setPendingPrompt(prompt);

    setMood(null);
    setStress(null);
    setStressNotes(['', '', '']);
    setAnxiety(null);
    setAnxietyNotes(['', '', '']);

    const aiEnabled = getSetting('ai_integration_enabled') === 'true';
    const alreadyPrompted = getSetting('ai_chat_prompt_shown') === 'true';

    if (!alreadyPrompted) {
      // Flow 1 & 2: first-time — ask if they want to enable AI chat
      setShowAIPrompt(true);
    } else if (aiEnabled) {
      // Flow 3: AI enabled, already prompted — ask if they want to chat today
      setShowTalkDialog(true);
    } else {
      // Flow 4: AI disabled — just confirm saved
      Alert.alert('Saved!', 'Your mood has been recorded.');
    }
  }

  function handleAIPromptYes() {
    setSetting('ai_integration_enabled', 'true');
    setSetting('ai_chat_prompt_shown', 'true');
    setShowAIPrompt(false);
    router.push({ pathname: '/chat', params: { initialPrompt: pendingPrompt } });
  }

  function handleAIPromptNo() {
    setSetting('ai_chat_prompt_shown', 'true');
    setShowAIPrompt(false);
    Alert.alert('Saved!', 'Your mood has been recorded.');
  }

  function handleTalkYes() {
    setShowTalkDialog(false);
    router.push({ pathname: '/chat', params: { initialPrompt: pendingPrompt } });
  }

  function handleTalkNo() {
    setShowTalkDialog(false);
    Alert.alert('Saved!', 'Your mood has been recorded.');
  }

  function handleStressSelect(value: number) {
    setStress(value);
    if (value > 2) setStressNotes(['', '', '']);
  }

  function handleAnxietySelect(value: number) {
    setAnxiety(value);
    if (value > 2) setAnxietyNotes(['', '', '']);
  }

  return (
    <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover" imageStyle={{ opacity: 0.35 }}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={theme.primary}
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
            {stressNotes.map((note, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <TextInput
                  value={note}
                  onChangeText={val => setStressNotes(prev => { const next = [...prev] as [string, string, string]; next[i] = val; return next; })}
                  maxLength={50}
                  mode="outlined"
                  placeholder={`Stressor ${i + 1}`}
                  style={styles.textInput}
                />
                <Text style={styles.charCount}>{note.length}/50</Text>
              </View>
            ))}
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
            {anxietyNotes.map((note, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <TextInput
                  value={note}
                  onChangeText={val => setAnxietyNotes(prev => { const next = [...prev] as [string, string, string]; next[i] = val; return next; })}
                  maxLength={50}
                  mode="outlined"
                  placeholder={`Trigger ${i + 1}`}
                  style={styles.textInput}
                />
                <Text style={styles.charCount}>{note.length}/50</Text>
              </View>
            ))}
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

      <Portal>
        <Dialog visible={showAIPrompt} dismissable={false}>
          <Dialog.Title>Chat about your feelings?</Dialog.Title>
          <Dialog.Content>
            <Text>Would you like the option to chat about your feelings with AI after logging your mood?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleAIPromptNo}>No Thank You</Button>
            <Button onPress={handleAIPromptYes}>Yes</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showTalkDialog} dismissable={false}>
          <Dialog.Title>Talk about your mood?</Dialog.Title>
          <Dialog.Content>
            <Text>Would you like to chat about how you're feeling today?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleTalkNo}>No</Button>
            <Button onPress={handleTalkYes}>Yes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ImageBackground>
  );
}
