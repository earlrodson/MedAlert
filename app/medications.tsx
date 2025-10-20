import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function MedicationsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: 'Medications',
                    headerShown: true,
                }}
            />
            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-2xl font-bold text-foreground mb-4">Medications</Text>
                <Text className="text-muted-foreground text-center">
                    Manage your medications, view history, and track adherence.
                </Text>
            </View>
        </SafeAreaView>
    );
}
