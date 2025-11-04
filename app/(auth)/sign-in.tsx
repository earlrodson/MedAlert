import { SignInForm } from '@/components/sign-in-form';
import { HeaderLeft } from '@/components/header-left';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function SignInScreen() {
    const router = useRouter();

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerLeft: () => <HeaderLeft />,
                }}
            />
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="sm:flex-1 items-center justify-center p-4 py-8 sm:py-4 sm:p-6 mt-safe"
                keyboardDismissMode="interactive">
                <View className="w-full max-w-sm">
                    <SignInForm onSuccess={() => router.push('/')} />
                </View>
            </ScrollView>
        </>
    );
}
