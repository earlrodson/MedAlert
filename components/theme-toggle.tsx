import { Button } from '@/components/ui/button';
import { useColorScheme } from 'nativewind';
import { Sun, Moon } from 'lucide-react-native';

const THEME_ICONS = {
    light: Sun,
    dark: Moon,
};

export function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const Icon = THEME_ICONS[colorScheme ?? 'light'];
    return (
        <Button variant="ghost" size="icon" onPress={toggleColorScheme} className="h-10 w-10">
            <Icon className="size-5 text-foreground" />
        </Button>
    );
}
