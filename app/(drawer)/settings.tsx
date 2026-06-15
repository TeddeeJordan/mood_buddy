import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { Themes } from '@/constants/theme';

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.Action
          icon="menu"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          iconColor={Themes.lavender.primary}
        />
        <Appbar.Content title="Settings" titleStyle={styles.appbarTitle} />
      </Appbar.Header>
      <View style={styles.body}>
        <Text variant="bodyLarge" style={styles.placeholder}>
          Settings coming soon.
        </Text>
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
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: Themes.lavender.text,
    opacity: 0.5,
  },
});
