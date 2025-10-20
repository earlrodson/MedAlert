import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function ScheduleScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: 'Schedule',
                    headerShown: true,
                }}
            />
            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-2xl font-bold text-foreground mb-4">Schedule</Text>
                <Text className="text-muted-foreground text-center">
                    View your medication schedule and upcoming reminders.
                </Text>
            </View>
        </SafeAreaView>
    );
}
