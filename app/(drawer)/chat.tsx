import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar, Button, IconButton, Text, TextInput } from 'react-native-paper';
import type { ThemePalette } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { getSetting } from '@/lib/database';
import { sendChatMessage, type ChatMessage } from '@/lib/claude';

type LocalMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
};

function makeStyles(theme: ThemePalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    appbar: { backgroundColor: theme.background },
    appbarTitle: { color: theme.text, fontWeight: '700' },
    keyboardView: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 10,
    },
    bubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: theme.primary,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxWidth: '80%',
    },
    bubbleAssistant: {
      alignSelf: 'flex-start',
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxWidth: '80%',
      borderWidth: 1,
      borderColor: theme.tertiary,
    },
    bubbleError: {
      alignSelf: 'flex-start',
      backgroundColor: '#FFF5F5',
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxWidth: '80%',
      borderWidth: 1,
      borderColor: '#E53E3E',
    },
    textUser: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
    textAssistant: { color: theme.text, fontSize: 15, lineHeight: 22 },
    textError: { color: '#C53030', fontSize: 15, lineHeight: 22 },
    typingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 4,
    },
    typingText: { color: theme.text, opacity: 0.5, fontSize: 14 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.tertiary,
      backgroundColor: theme.background,
      gap: 4,
    },
    textInput: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      maxHeight: 120,
    },
    noKeyCenter: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    noKeyCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 2,
    },
    noKeyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    noKeyBody: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.75,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
  });
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const { theme, backgroundImage } = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey] = useState<string | null>(() => getSetting('anthropic_api_key'));
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const initialized = useRef(false);
  // Full conversation history sent to the API, including the hidden initial prompt
  const apiHistory = useRef<ChatMessage[]>([]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages, loading]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', e => {
      setAndroidKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  // On mount: send the mood context to Claude silently so it can open the conversation
  useEffect(() => {
    if (!initialized.current && apiKey && initialPrompt) {
      initialized.current = true;
      apiHistory.current = [{ role: 'user', content: initialPrompt }];
      callApi(apiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function callApi(key: string) {
    setLoading(true);
    try {
      const text = await sendChatMessage(apiHistory.current, key);
      apiHistory.current = [...apiHistory.current, { role: 'assistant', content: text }];
      setMessages(prev => [
        ...prev,
        { id: `${Date.now()}`, role: 'assistant', content: text },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || !apiKey || loading) return;

    setInputText('');
    apiHistory.current = [...apiHistory.current, { role: 'user', content: text }];
    setMessages(prev => [...prev, { id: `${Date.now()}`, role: 'user', content: text }]);
    callApi(apiKey);
  }

  if (!apiKey) {
    return (
      <ImageBackground
        source={backgroundImage}
        style={styles.container}
        resizeMode="cover"
        imageStyle={{ opacity: 0.35 }}
      >
        <Appbar.Header style={styles.appbar} elevated>
          <Appbar.BackAction onPress={() => navigation.goBack()} iconColor={theme.primary} />
          <Appbar.Content title="Chat" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <View style={styles.noKeyCenter}>
          <View style={styles.noKeyCard}>
            <Text style={styles.noKeyTitle}>API Key Required</Text>
            <Text style={styles.noKeyBody}>
              To chat with AI, add your Anthropic API key in Settings.{'\n\n'}
              Get a key at console.anthropic.com — it is separate from your Claude.ai
              subscription.
            </Text>
            <Button mode="contained" icon="cog" onPress={() => router.push('/settings')}>
              Open Settings
            </Button>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.35 }}
    >
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} iconColor={theme.primary} />
        <Appbar.Content title="Chat" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={[styles.keyboardView, Platform.OS === 'android' && { paddingBottom: androidKeyboardHeight }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={
                msg.isError
                  ? styles.bubbleError
                  : msg.role === 'user'
                    ? styles.bubbleUser
                    : styles.bubbleAssistant
              }
            >
              <Text
                style={
                  msg.isError
                    ? styles.textError
                    : msg.role === 'user'
                      ? styles.textUser
                      : styles.textAssistant
                }
              >
                {msg.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.typingText}>Thinking…</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message…"
            mode="outlined"
            style={styles.textInput}
            multiline
            disabled={loading}
          />
          <IconButton
            icon="send"
            iconColor={inputText.trim() && !loading ? theme.primary : theme.text}
            disabled={!inputText.trim() || loading}
            onPress={handleSend}
          />
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
