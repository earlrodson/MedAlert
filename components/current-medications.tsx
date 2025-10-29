import { Check, Clock } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Medication } from '@/components/upcoming-reminders';

interface CurrentMedicationsProps {
    medications: Medication[];
    onMedicationTaken: (medicationId: string) => void;
}

export function CurrentMedications({ medications, onMedicationTaken }: CurrentMedicationsProps) {
    const { colorScheme } = useColorScheme();

    // Filter medications that haven't been taken yet and are within the 2-hour window
    const pendingMedications = medications.filter(med => {
        if (med.taken) {
            return false;
        }

        const now = new Date();
        const medTimeParts = med.time.match(/(\d+):(\d+)\s*(AM|PM)/);

        if (!medTimeParts) {
            return false; // Skip medications with invalid time format
        }

        let hours = parseInt(medTimeParts[1], 10);
        const minutes = parseInt(medTimeParts[2], 10);
        const ampm = medTimeParts[3];

        if (ampm === 'PM' && hours < 12) {
            hours += 12;
        }
        if (ampm === 'AM' && hours === 12) {
            hours = 0; // Midnight case
        }

        const medDate = new Date();
        medDate.setHours(hours, minutes, 0, 0);

        const twoHours = 2 * 60 * 60 * 1000;
        const lowerBound = new Date(now.getTime() - twoHours);
        const upperBound = new Date(now.getTime() + twoHours);

        return medDate >= lowerBound && medDate <= upperBound;
    });

    if (pendingMedications.length === 0) {
        return (
            <Card className="mb-6">
                <CardContent className="p-6 items-center">
                    <Check size={48} color={colorScheme === 'dark' ? THEME.dark.success : THEME.light.success} />
                    <Text className="mt-4 text-lg font-semibold text-center">All caught up!</Text>
                    <Text className="text-muted-foreground text-center mt-2">
                        No medications to take right now
                    </Text>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                    <Clock size={20} color={colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary} />
                    Current Medications
                </CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
                {pendingMedications.map((medication) => (
                    <View
                        key={medication.id}
                        className={cn(
                            'flex-row items-center justify-between p-4 rounded-lg border',
                            colorScheme === 'dark' ? 'border-border/30 bg-card/50' : 'border-border/50 bg-card/30'
                        )}
                    >
                        <View className="flex-1">
                            <Text className="font-semibold text-foreground">{medication.name}</Text>
                            <Text className="text-sm text-muted-foreground">{medication.dosage}</Text>
                            <Text className="text-xs text-muted-foreground mt-1">{medication.time}</Text>
                        </View>
                        <Button
                            size="sm"
                            onPress={() => onMedicationTaken(medication.id)}
                            className="ml-4"
                            variant={"outline"}
                        >
                            <Check size={16} className="mr-1" />
                            <Text className="text-sm font-medium">Taken</Text>
                        </Button>
                    </View>
                ))}
            </CardContent>
        </Card>
    );
}
