import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React from 'react';

export default function ProfileScreen() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace('/(auth)/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded || !isSignedIn) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: 'Profile',
                    headerShown: true,
                }}
            />
            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-2xl font-bold text-foreground mb-4">Profile</Text>
                <Text className="text-muted-foreground text-center">
                    Manage your account settings and preferences.
                </Text>
            </View>
        </SafeAreaView>
    );
}
