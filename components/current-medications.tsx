import { Check, Clock, AlertCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentMedications } from '@/lib/medication-status-provider';
import type { MedicationStatusInfo } from '@/lib/medication-status';

interface CurrentMedicationsProps {
    onMedicationTaken?: (medicationId: string) => void;
}

export function CurrentMedications({ onMedicationTaken }: CurrentMedicationsProps) {
    const { colorScheme } = useColorScheme();
    const { currentMedications: currentMeds, isLoading, error, markAsTaken } = useCurrentMedications();

    const handleMedicationTaken = async (medicationId: string) => {
        try {
            await markAsTaken(medicationId);
            onMedicationTaken?.(medicationId);
        } catch (err) {
            console.error('Failed to mark medication as taken:', err);
        }
    };

    if (isLoading) {
        return (
            <Card className="mb-6">
                <CardContent className="p-6 items-center">
                    <Clock size={32} color={colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary} />
                    <Text className="mt-4 text-lg font-semibold text-center">Loading medications...</Text>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="mb-6">
                <CardContent className="p-6 items-center">
                    <AlertCircle size={32} color={colorScheme === 'dark' ? THEME.dark.warning : THEME.light.warning} />
                    <Text className="mt-4 text-lg font-semibold text-center text-destructive">Error</Text>
                    <Text className="text-muted-foreground text-center mt-2">{error}</Text>
                </CardContent>
            </Card>
        );
    }

    if (currentMeds.length === 0) {
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
                    Current Medications ({currentMeds.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
                {currentMeds.map((medication) => (
                    <View
                        key={medication.medicationId}
                        className={cn(
                            'flex-row items-center justify-between p-4 rounded-lg border',
                            medication.isPastDue && 'border-destructive/50 bg-destructive/5',
                            medication.isCurrent && 'border-primary/50 bg-primary/5',
                            !medication.isPastDue && !medication.isCurrent && (colorScheme === 'dark' ? 'border-border/30 bg-card/50' : 'border-border/50 bg-card/30')
                        )}
                    >
                        <View className="flex-1">
                            <Text className="font-semibold text-foreground">{medication.name}</Text>
                            <Text className="text-sm text-muted-foreground">{medication.dosage}</Text>
                            <View className="flex-row items-center mt-1">
                                <Text className="text-xs text-muted-foreground">{medication.time}</Text>
                                {medication.minutesUntil !== undefined && (
                                    <Text className="text-xs text-muted-foreground ml-2">
                                        {medication.minutesUntil <= 0
                                            ? `${Math.abs(medication.minutesUntil)} min overdue`
                                            : `in ${medication.minutesUntil} min`
                                        }
                                    </Text>
                                )}
                                {medication.isPastDue && (
                                    <AlertCircle size={12} color={colorScheme === 'dark' ? THEME.dark.warning : THEME.light.warning} className="ml-1" />
                                )}
                            </View>
                        </View>
                        <Button
                            size="sm"
                            onPress={() => handleMedicationTaken(medication.medicationId)}
                            className="ml-4"
                            variant={medication.isPastDue ? "default" : "outline"}
                        >
                            <Check size={16} className="mr-1" />
                            <Text className="text-sm font-medium">
                                {medication.isPastDue ? 'Take Now' : 'Taken'}
                            </Text>
                        </Button>
                    </View>
                ))}
            </CardContent>
        </Card>
    );
}
