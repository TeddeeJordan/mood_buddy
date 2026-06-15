import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { type ThemeName, type ThemePalette, Themes } from '@/constants/theme';
import { getSetting, setSetting } from '@/lib/database';

type ThemeContextValue = {
  theme: ThemePalette;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  paperTheme: MD3Theme;
};

function buildPaperTheme(palette: ThemePalette): MD3Theme {
  return {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: palette.primary,
      primaryContainer: palette.tertiary,
      secondary: palette.secondary,
      secondaryContainer: palette.tertiary,
      background: palette.background,
      surface: '#FFFFFF',
      onPrimary: '#FFFFFF',
      onBackground: palette.text,
      onSurface: palette.text,
      outline: palette.secondary,
    },
  };
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: Themes.lavender,
  themeName: 'lavender',
  setThemeName: () => {},
  paperTheme: buildPaperTheme(Themes.lavender),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    const saved = getSetting('theme');
    if (saved === 'lavender' || saved === 'sage' || saved === 'water') return saved;
    return 'lavender';
  });

  const theme = Themes[themeName];
  const paperTheme = useMemo(() => buildPaperTheme(theme), [theme]);

  function setThemeName(name: ThemeName) {
    setThemeNameState(name);
    setSetting('theme', name);
  }

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName, paperTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
