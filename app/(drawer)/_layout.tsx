import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Themes } from '@/constants/theme';

type DrawerItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const DRAWER_ITEMS: DrawerItem[] = [
  { label: 'Home', href: '/', icon: 'home-outline', iconActive: 'home' },
  { label: 'Dashboard', href: '/dashboard', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { label: 'Profile', href: '/profile', icon: 'person-outline', iconActive: 'person' },
  { label: 'Settings', href: '/settings', icon: 'settings-outline', iconActive: 'settings' },
];

function CustomDrawer(props: any) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: Themes.lavender.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mood Buddy</Text>
        <Pressable onPress={() => props.navigation.closeDrawer()} style={styles.closeButton} hitSlop={8}>
          <Ionicons name="close" size={24} color={Themes.lavender.text} />
        </Pressable>
      </View>
      {DRAWER_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Pressable
            key={item.href}
            style={[styles.item, isActive && styles.activeItem]}
            onPress={() => {
              router.navigate(item.href as any);
              props.navigation.closeDrawer();
            }}
          >
            <Ionicons
              name={isActive ? item.iconActive : item.icon}
              size={22}
              color={isActive ? Themes.lavender.primary : Themes.lavender.text}
              style={styles.itemIcon}
            />
            <Text style={[styles.itemText, isActive && styles.activeItemText]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={CustomDrawer}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="(tabs)" />
      <Drawer.Screen name="profile" />
      <Drawer.Screen name="settings" />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Themes.lavender.tertiary,
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Themes.lavender.primary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  activeItem: {
    backgroundColor: Themes.lavender.tertiary,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemText: {
    fontSize: 16,
    color: Themes.lavender.text,
  },
  activeItemText: {
    color: Themes.lavender.primary,
    fontWeight: '600',
  },
});
