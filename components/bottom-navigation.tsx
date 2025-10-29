import { Text } from '@/components/ui/text';
import { Home, Pill, Calendar, User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export function BottomNavigation({ ...props }: BottomTabBarProps) {
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const pathname = usePathname();

    const navigationItems = [
        { id: 'home', label: 'Home', icon: Home, href: '/' },
        { id: 'medications', label: 'Meds', icon: Pill, href: '/medications' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, href: '/schedule' },
        { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
    ];

    return (
        <View className="flex-row justify-around items-center bg-background border-t border-border py-2 px-4">
            {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                    <Pressable
                        key={item.id}
                        className={cn(
                            'flex-1 items-center justify-center py-2 px-3 rounded-lg',
                            'active:bg-accent/50',
                            pathname === item.href && 'border border-primary/30'
                        )}
                        onPress={() => {
                            if (pathname !== item.href) {
                                router.push(item.href as any);
                            }
                        }}
                        disabled={pathname === item.href}
                    >
                        <Icon
                            size={24}
                            strokeWidth={2}
                            color={pathname === item.href
                                ? (colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary)
                                : (colorScheme === 'dark' ? THEME.dark.foreground : THEME.light.foreground)
                            }
                        />
                        <Text
                            className="text-xs mt-1"
                            style={{
                                color: pathname === item.href
                                    ? (colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary)
                                    : (colorScheme === 'dark' ? THEME.dark.foreground : THEME.light.foreground)
                            }}
                        >
                            {item.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
