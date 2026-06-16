import { Platform } from 'react-native';

export type ThemeName = 'lavender' | 'sage' | 'water';

export type ThemePalette = {
  text: string;
  background: string;
  primary: string;
  secondary: string;
  tertiary: string;
};

export const Themes: Record<ThemeName, ThemePalette> = {
  lavender: {
    text: '#4D4952',
    background: '#EEEEF8',
    primary: '#C47ED0',
    secondary: '#A882CB',
    tertiary: '#DFBFEC',
  },
  sage: {
    text: '#4D4952',
    background: '#EEEEF5',
    primary: '#8DC48D',
    secondary: '#D4DF8A',
    tertiary: '#C4E8C8',
  },
  water: {
    text: '#4D4952',
    background: '#EAEAF5',
    primary: '#4AA8C8',
    secondary: '#5CD4E8',
    tertiary: '#8CE0EC',
  },
};

export const ThemeBackgrounds: Record<ThemeName, number> = {
  lavender: require('../assets/images/lavender.png'),
  sage: require('../assets/images/sage.jpeg'),
  water: require('../assets/images/water.png'),
};

export const Colors = {
  light: {
    text: Themes.lavender.text,
    background: Themes.lavender.background,
    tint: Themes.lavender.primary,
    icon: Themes.lavender.secondary,
    tabIconDefault: Themes.lavender.secondary,
    tabIconSelected: Themes.lavender.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
