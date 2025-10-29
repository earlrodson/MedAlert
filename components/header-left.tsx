import { Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function HeaderLeft() {
    const router = useRouter();
    return (
        <Pressable
            onPress={() => {
                router.push('/');
            }}
            className="ios:pr-2.5">
            <ChevronLeft size={24} className={'text-foreground'} />
        </Pressable>
    );
}
