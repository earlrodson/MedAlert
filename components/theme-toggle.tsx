import { Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Sun, Moon } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { THEME } from '@/lib/theme';

const THEME_ICONS = {
    light: Sun,
    dark: Moon,
};

export function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const Icon = THEME_ICONS[colorScheme ?? 'light'];

    return (
        <Pressable
            onPress={toggleColorScheme}
            className={cn(
                'h-10 w-10 items-center justify-center rounded-full',
                // No background — purely transparent
                'bg-transparent'
            )}
        >
            <Icon
                size={22}
                strokeWidth={2}
                className={cn(
                    colorScheme === 'dark' 
                        ? 'text-[hsl(195,45%,55%)]' 
                        : 'text-[hsl(195,35%,47%)]'
                )}
            />
        </Pressable>
    );
}
