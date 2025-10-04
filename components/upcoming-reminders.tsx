import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';
import { Pill } from 'lucide-react-native';
import { View } from 'react-native';
import { colors } from '@/lib/theme';

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    time: string;
    taken: boolean;
}

interface UpcomingRemindersProps {
    medications: Medication[];
}

export function UpcomingReminders({ medications }: UpcomingRemindersProps) {
    return (
        <View className="mb-8">
            <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">Upcoming Reminders</Text>
                <Link href="/(auth)/sign-up">
                    <Text className="text-sm font-medium text-primary">See All</Text>
                </Link>
            </View>
            <Card>
                <CardContent className="p-0">
                    {medications.map((med, index) => (
                        <View
                            key={med.id}
                            className={`flex-row items-center justify-between py-5 px-4 ${index !== medications.length - 1 ? 'border-b border-border' : ''}`}
                        >
                            <View className="flex-row items-center">
                                <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Pill size={24} color={colors.primary.main} />
                                </View>
                                <View className="ml-4">
                                    <Text className="text-base font-medium text-foreground">{med.name}</Text>
                                    <Text className="text-sm text-muted-foreground mt-0.5">{med.dosage}</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="font-medium text-foreground">{med.time}</Text>
                                <View className={`mt-1 px-2 py-0.5 rounded-full ${med.taken ? 'bg-success/10' : 'bg-warning/10'}`}>
                                    <Text className={`text-xs font-medium ${med.taken ? 'text-success' : 'text-warning'}`}>
                                        {med.taken ? 'Taken' : 'Pending'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </CardContent>
            </Card>
        </View>
    );
}
