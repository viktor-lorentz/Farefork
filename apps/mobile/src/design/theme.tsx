import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { usePreferences } from '@/stores/preferences';
import { colorSchemes, type ColorScheme, type ColorTokens } from './tokens/colors';
import { elevations, type ElevationTokens } from './tokens/elevation';

export type Theme = {
  scheme: ColorScheme;
  colors: ColorTokens;
  elevation: ElevationTokens;
};

const themes: Record<ColorScheme, Theme> = {
  light: { scheme: 'light', colors: colorSchemes.light, elevation: elevations.light },
  dark: { scheme: 'dark', colors: colorSchemes.dark, elevation: elevations.dark },
};

const ThemeContext = createContext<Theme>(themes.light);

function useResolvedScheme(): ColorScheme {
  const preference = usePreferences((state) => state.themePreference);
  const system = useColorScheme();
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = usePreferences((state) => state.themePreference);
  const scheme = useResolvedScheme();
  const theme = themes[scheme];

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
    }
  }, [preference]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = theme.scheme;
      document.body.style.backgroundColor = theme.colors.background;
    }
  }, [theme]);

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function SchemeThemeProvider({
  scheme,
  children,
}: {
  scheme: ColorScheme;
  children: ReactNode;
}) {
  return <ThemeContext value={themes[scheme]}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  return use(ThemeContext);
}
