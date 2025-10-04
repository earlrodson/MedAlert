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
    primary: 'hsl(210 100% 40%)',
    primaryForeground: 'hsl(0 0% 100%)',
    primaryLight: 'hsl(210 100% 95%)',
    
    // Secondary (Wellness Green)
    secondary: 'hsl(156 80% 35%)',
    secondaryForeground: 'hsl(0 0% 100%)',
    secondaryLight: 'hsl(156 80% 95%)',
    
    // Accent (Neutral Grays)
    accent: 'hsl(220 20% 97%)',
    accentForeground: 'hsl(220 10% 46%)',
    
    // Status colors
    success: 'hsl(156 80% 35%)',
    warning: 'hsl(30 100% 50%)',
    danger: 'hsl(0 84% 60%)',
    info: 'hsl(210 100% 50%)',
    
    // UI elements
    muted: 'hsl(220 20% 97%)',
    mutedForeground: 'hsl(220 10% 46%)',
    border: 'hsl(220 20% 90%)',
    input: 'hsl(220 20% 95%)',
    ring: 'hsl(210 100% 40%)',
    radius: '0.5rem',
    
    // Additional colors
    chart1: 'hsl(210 100% 50%)',
    chart2: 'hsl(156 80% 35%)',
    chart3: 'hsl(30 100% 50%)',
    chart4: 'hsl(0 84% 60%)',
    chart5: 'hsl(270 80% 60%)',
  },
  dark: {
    // Base colors
    background: 'hsl(224 30% 10%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(224 30% 12%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(224 30% 12%)',
    popoverForeground: 'hsl(0 0% 98%)',
    
    // Primary (Medical Blue)
    primary: 'hsl(210 100% 50%)',
    primaryForeground: 'hsl(0 0% 98%)',
    primaryLight: 'hsl(210 100% 20%)',
    
    // Secondary (Wellness Green)
    secondary: 'hsl(156 80% 40%)',
    secondaryForeground: 'hsl(0 0% 98%)',
    secondaryLight: 'hsl(156 80% 15%)',
    
    // Accent (Neutral Grays)
    accent: 'hsl(220 20% 18%)',
    accentForeground: 'hsl(220 10% 80%)',
    
    // Status colors
    success: 'hsl(156 80% 40%)',
    warning: 'hsl(30 100% 55%)',
    danger: 'hsl(0 84% 65%)',
    info: 'hsl(210 100% 55%)',
    
    // UI elements
    muted: 'hsl(220 20% 18%)',
    mutedForeground: 'hsl(220 10% 70%)',
    border: 'hsl(220 20% 25%)',
    input: 'hsl(220 20% 22%)',
    ring: 'hsl(210 100% 50%)',
    radius: '0.5rem',
    
    // Additional colors
    chart1: 'hsl(210 100% 55%)',
    chart2: 'hsl(156 80% 45%)',
    chart3: 'hsl(30 100% 55%)',
    chart4: 'hsl(0 84% 65%)',
    chart5: 'hsl(270 80% 65%)',
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
