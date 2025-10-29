import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    // Base colors
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(224 30% 15%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(224 30% 15%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(224 30% 15%)',
    
    // Primary (Medical Blue)
    primary: 'hsl(195 35% 47%)',
    primaryForeground: 'hsl(0 0% 100%)',
    primaryLight: 'hsl(195 35% 90%)',
    
    // Secondary (Wellness Green)
    secondary: 'hsl(105 34% 58%)',
    secondaryForeground: 'hsl(0 0% 100%)',
    secondaryLight: 'hsl(105 34% 90%)',
    
    // Accent (Neutral Grays)
    accent: 'hsl(42 64% 86%)',
    accentForeground: 'hsl(210 10% 46%)',
    
    // Status colors
    success: 'hsl(105 34% 58%)',
    warning: 'hsl(38 70% 63%)',
    danger: 'hsl(0 58% 58%)',
    info: 'hsl(200 58% 65%)',
    
    // UI elements
    muted: 'hsl(42 64% 86%)',
    mutedForeground: 'hsl(210 10% 46%)',
    border: 'hsl(220 20% 90%)',
    input: 'hsl(220 20% 95%)',
    ring: 'hsl(195 35% 47%)',
    radius: '0.5rem',
    
    // Additional colors
    chart1: 'hsl(195 35% 50%)',
    chart2: 'hsl(105 34% 60%)',
    chart3: 'hsl(38 70% 63%)',
    chart4: 'hsl(0 58% 58%)',
    chart5: 'hsl(270 80% 60%)',
  },
  dark: {
    // Base colors
    background: 'hsl(210 30% 8%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(210 30% 10%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(210 30% 10%)',
    popoverForeground: 'hsl(0 0% 98%)',
    
    // Primary (Medical Blue) - brighter for dark mode
    primary: 'hsl(195 45% 55%)',
    primaryForeground: 'hsl(0 0% 98%)',
    primaryLight: 'hsl(195 35% 20%)',
    
    // Secondary (Wellness Green) - brighter for dark mode
    secondary: 'hsl(105 40% 65%)',
    secondaryForeground: 'hsl(0 0% 98%)',
    secondaryLight: 'hsl(105 34% 18%)',
    
    // Accent (Neutral Grays) - darker variants
    accent: 'hsl(210 20% 18%)',
    accentForeground: 'hsl(0 0% 85%)',
    
    // Status colors - brighter for dark mode
    success: 'hsl(105 40% 65%)',
    warning: 'hsl(38 75% 68%)',
    danger: 'hsl(0 65% 65%)',
    info: 'hsl(200 65% 70%)',
    
    // UI elements
    muted: 'hsl(210 20% 18%)',
    mutedForeground: 'hsl(0 0% 75%)',
    border: 'hsl(210 20% 25%)',
    input: 'hsl(210 20% 22%)',
    ring: 'hsl(195 45% 55%)',
    radius: '0.5rem',
    
    // Additional colors
    chart1: 'hsl(195 45% 60%)',
    chart2: 'hsl(105 40% 68%)',
    chart3: 'hsl(38 75% 68%)',
    chart4: 'hsl(0 65% 65%)',
    chart5: 'hsl(270 85% 68%)',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.danger,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.danger,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};

// Export color scales for easy access
export const colors = {
  primary: {
    light: THEME.light.primaryLight,
    main: THEME.light.primary,
    dark: THEME.dark.primary,
    contrastText: THEME.light.primaryForeground,
  },
  secondary: {
    light: THEME.light.secondaryLight,
    main: THEME.light.secondary,
    dark: THEME.dark.secondary,
    contrastText: THEME.light.secondaryForeground,
  },
  status: {
    success: THEME.light.success,
    warning: THEME.light.warning,
    danger: THEME.light.danger,
    info: THEME.light.info,
  },
  text: {
    light: THEME.light.mutedForeground,
    default: THEME.light.foreground,
    dark: THEME.dark.foreground,
  },
  background: {
    light: THEME.light.background,
    default: THEME.light.background,
    dark: THEME.dark.background,
  },
};
