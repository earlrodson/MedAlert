import { Text } from '@/components/ui/text';
import { useUser } from '@clerk/clerk-expo';
import { View } from 'react-native';
import { getTimeOfDay } from '@/lib/utils';

export function WelcomeSection() {
    const { user } = useUser();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <View className="mb-8">
            <Text className="text-muted-foreground">Good {getTimeOfDay()},</Text>
            <Text className="text-2xl font-bold text-foreground">
                {user?.firstName || 'User'}
            </Text>
            <View className="mt-2 flex-row items-center">
                <Text className="ml-1 text-sm text-muted-foreground">
                    {currentTime} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
            </View>
        </View>
    );
}
