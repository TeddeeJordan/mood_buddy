import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { Themes } from '@/constants/theme';
import { getProfile, saveProfile } from '@/lib/database';

const T = Themes.lavender;
const BIO_LIMIT = 1000;

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [draftBio, setDraftBio] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [quote, setQuote] = useState<{ q: string; a: string } | null>(null);

  useEffect(() => {
    fetch('https://zenquotes.io/api/random')
      .then(r => r.json())
      .then((data: { q: string; a: string }[]) => {
        if (data?.[0]) setQuote(data[0]);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      const profile = getProfile();
      setBio(profile.bio);
      setPhotoUri(profile.photo_uri);
    }, []),
  );

  const handleEdit = () => {
    setDraftBio(bio);
    setDraftPhoto(photoUri);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = () => {
    saveProfile({ bio: draftBio, photo_uri: draftPhoto });
    setBio(draftBio);
    setPhotoUri(draftPhoto);
    setEditing(false);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Allow access to your photo library to set a profile picture.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDraftPhoto(result.assets[0].uri);
    }
  };

  const currentPhoto = editing ? draftPhoto : photoUri;
  const currentBio = editing ? draftBio : bio;

  return (
    <View style={s.container}>
      <Appbar.Header style={s.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={T.primary}
        />
        <Appbar.Content title="Profile" titleStyle={s.appbarTitle} />
        {editing ? (
          <>
            <Appbar.Action icon="close" onPress={handleCancel} iconColor={T.text} />
            <Appbar.Action icon="check" onPress={handleSave} iconColor={T.primary} />
          </>
        ) : (
          <Appbar.Action icon="pencil" onPress={handleEdit} iconColor={T.primary} />
        )}
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={editing ? handlePickPhoto : undefined}
          activeOpacity={editing ? 0.7 : 1}
          style={s.avatarWrap}
        >
          {currentPhoto ? (
            <Image source={{ uri: currentPhoto }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={72} color={T.secondary} />
            </View>
          )}
          {editing && (
            <View style={s.cameraOverlay}>
              <MaterialCommunityIcons name="camera" size={22} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.cardLabel}>Bio</Text>
          {editing ? (
            <>
              <TextInput
                style={s.bioInput}
                value={draftBio}
                onChangeText={t => setDraftBio(t.slice(0, BIO_LIMIT))}
                placeholder="Write something about yourself…"
                placeholderTextColor={`${T.text}66`}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <Text style={s.charCount}>
                {draftBio.length} / {BIO_LIMIT}
              </Text>
            </>
          ) : (
            <Text style={[s.bioText, !currentBio && s.bioPlaceholder]}>
              {currentBio || 'Tap the pencil to add a bio…'}
            </Text>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardLabel}>Daily Inspiration</Text>
          {quote ? (
            <>
              <Text style={s.quoteText}>"{quote.q}"</Text>
              <Text style={s.quoteAuthor}>— {quote.a}</Text>
              <Text style={s.quoteAttribution}>Powered by ZenQuotes.io</Text>
            </>
          ) : (
            <Text style={s.bioPlaceholder}>Loading…</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  appbar: { backgroundColor: T.background },
  appbarTitle: { color: T.text, fontWeight: '700', fontSize: 20 },
  scroll: { padding: 16, paddingBottom: 40, alignItems: 'center', gap: 20 },

  avatarWrap: { marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    backgroundColor: T.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.background,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: T.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quoteText: {
    fontSize: 15,
    color: T.text,
    lineHeight: 23,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    color: T.primary,
    fontWeight: '600',
    marginBottom: 10,
  },
  quoteAttribution: {
    fontSize: 11,
    color: T.text,
    opacity: 0.35,
  },
  bioText: {
    fontSize: 15,
    color: T.text,
    lineHeight: 22,
  },
  bioPlaceholder: { opacity: 0.4, fontStyle: 'italic' },
  bioInput: {
    fontSize: 15,
    color: T.text,
    lineHeight: 22,
    minHeight: 120,
    padding: 0,
  },
  charCount: {
    marginTop: 8,
    fontSize: 12,
    color: T.text,
    opacity: 0.45,
    textAlign: 'right',
  },
});
