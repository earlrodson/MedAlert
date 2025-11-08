import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { initDatabase } from '@/lib/database';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderLeft } from '@/components/header-left';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
    const { colorScheme } = useColorScheme();

    // Initialize database on app startup
    React.useEffect(() => {
        const initializeDb = async () => {
            try {
                await initDatabase();
                console.log('Database initialized successfully');
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        };

        initializeDb();
    }, []);

    return (
        <ClerkProvider tokenCache={tokenCache}>
            <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
                <StatusBar style={colorScheme === 'dark' ? 'dark' : 'light'} />
                <Routes />
                <PortalHost />
            </ThemeProvider>
        </ClerkProvider>
    );
}

SplashScreen.preventAutoHideAsync();

function Routes() {
    const { isSignedIn, isLoaded } = useAuth();

    React.useEffect(() => {
        if (isLoaded) {
            SplashScreen.hideAsync();
        }
    }, [isLoaded]);

    if (!isLoaded) {
        return null;
    }

    // Screen options are now defined inline

    const stackScreenOptions: NativeStackNavigationOptions = {
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
        presentation: 'card',
    };

    return (
        <Stack screenOptions={stackScreenOptions}>
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
            <Stack.Screen
                name="daily-schedule"
                options={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    presentation: 'card',
                }}
            />
            <Stack.Screen name="(auth)/sign-in" options={SIGN_IN_SCREEN_OPTIONS} />
            <Stack.Screen name="(auth)/sign-up" options={SIGN_UP_SCREEN_OPTIONS} />
            <Stack.Screen name="(auth)/reset-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
            <Stack.Screen name="(auth)/forgot-password" options={DEFAULT_AUTH_SCREEN_OPTIONS} />
        </Stack>
    );
}

const SIGN_IN_SCREEN_OPTIONS: NativeStackNavigationOptions = {
    title: '',
    headerShadowVisible: false,
    headerTransparent: true,
    headerLeft: () => <HeaderLeft />,
};

const SIGN_UP_SCREEN_OPTIONS: NativeStackNavigationOptions = {
    presentation: 'modal',
    title: '',
    headerTransparent: true,
    gestureEnabled: false,
};

const DEFAULT_AUTH_SCREEN_OPTIONS: NativeStackNavigationOptions = {
    title: '',
    headerShadowVisible: false,
    headerTransparent: true,
};
