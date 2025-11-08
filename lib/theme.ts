import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    // Base colors - Actual HSL values for React Native
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(224 30% 15%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(224 30% 15%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(224 30% 15%)',
    
    // Semantic colors
    primary: 'hsl(195 35% 47%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(105 34% 58%)',
    secondaryForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(0 58% 58%)',
    destructiveForeground: 'hsl(0 0% 100%)',
    
    // Status colors
    success: 'hsl(105 34% 58%)',
    successForeground: 'hsl(0 0% 100%)',
    warning: 'hsl(38 70% 63%)',
    warningForeground: 'hsl(0 0% 100%)',
    info: 'hsl(200 58% 65%)',
    infoForeground: 'hsl(0 0% 100%)',
    
    // Neutral colors
    muted: 'hsl(42 64% 86%)',
    mutedForeground: 'hsl(210 10% 46%)',
    accent: 'hsl(42 64% 86%)',
    accentForeground: 'hsl(210 10% 46%)',
    
    // Surface colors
    surface: 'hsl(0 0% 100%)',
    surfaceForeground: 'hsl(224 30% 15%)',
    surfaceVariant: 'hsl(210 20% 96%)',
    
    // UI elements
    border: 'hsl(220 20% 90%)',
    input: 'hsl(220 20% 95%)',
    ring: 'hsl(195 35% 47%)',
    
    // Chart colors
    chart1: 'hsl(195 35% 50%)',
    chart2: 'hsl(105 34% 60%)',
    chart3: 'hsl(38 70% 63%)',
    chart4: 'hsl(0 58% 58%)',
    chart5: 'hsl(270 80% 60%)',
    
    // Design system
    radius: '0.625rem',
  },
  dark: {
    // Base colors - Actual HSL values for React Native
    background: 'hsl(210 30% 8%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(210 30% 10%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(210 30% 10%)',
    popoverForeground: 'hsl(0 0% 98%)',
    
    // Semantic colors
    primary: 'hsl(195 45% 55%)',
    primaryForeground: 'hsl(0 0% 98%)',
    secondary: 'hsl(105 40% 65%)',
    secondaryForeground: 'hsl(0 0% 98%)',
    destructive: 'hsl(0 65% 65%)',
    destructiveForeground: 'hsl(0 0% 98%)',
    
    // Status colors
    success: 'hsl(105 40% 65%)',
    successForeground: 'hsl(0 0% 98%)',
    warning: 'hsl(38 75% 68%)',
    warningForeground: 'hsl(0 0% 98%)',
    info: 'hsl(200 65% 70%)',
    infoForeground: 'hsl(0 0% 98%)',
    
    // Neutral colors
    muted: 'hsl(210 20% 18%)',
    mutedForeground: 'hsl(0 0% 75%)',
    accent: 'hsl(210 20% 18%)',
    accentForeground: 'hsl(0 0% 85%)',
    
    // Surface colors
    surface: 'hsl(210 30% 10%)',
    surfaceForeground: 'hsl(0 0% 98%)',
    surfaceVariant: 'hsl(210 20% 15%)',
    
    // UI elements
    border: 'hsl(210 20% 25%)',
    input: 'hsl(210 20% 22%)',
    ring: 'hsl(195 45% 55%)',
    
    // Chart colors
    chart1: 'hsl(195 45% 60%)',
    chart2: 'hsl(105 40% 68%)',
    chart3: 'hsl(38 75% 68%)',
    chart4: 'hsl(0 65% 65%)',
    chart5: 'hsl(270 85% 68%)',
    
    // Design system
    radius: '0.625rem',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
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
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};

// Export color scales for easy access
export const colors = {
  primary: {
    main: THEME.light.primary,
    foreground: THEME.light.primaryForeground,
    dark: THEME.dark.primary,
    contrastText: THEME.light.primaryForeground,
  },
  secondary: {
    main: THEME.light.secondary,
    foreground: THEME.light.secondaryForeground,
    dark: THEME.dark.secondary,
    contrastText: THEME.light.secondaryForeground,
  },
  status: {
    success: THEME.light.success,
    warning: THEME.light.warning,
    danger: THEME.light.destructive,
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
