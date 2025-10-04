import { Text } from '@/components/ui/text';
import { UserMenu } from '@/components/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Pill } from 'lucide-react-native';
import { View } from 'react-native';
import { colors } from '@/lib/theme';

export function AppHeader() {
    return (
        <View className="bg-background px-4 py-2">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <Pill size={32} color={colors.primary.main} />
                    <Text className="ml-2 text-xl font-bold text-foreground">MedAlert</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <ThemeToggle />
                    <UserMenu />
                </View>
            </View>
        </View>
    );
}
