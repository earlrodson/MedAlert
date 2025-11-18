import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Pill, ChevronLeft, Check, Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { database } from '@/lib/database-wrapper';
import { MedicationRecord, MedicationStatus, MedicationWithStatus } from '@/lib/database-types';

export default function DailySchedule() {
    const router = useRouter();
    const { date } = useLocalSearchParams<{ date: string }>();
    const [medications, setMedications] = useState<MedicationWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const selectedDate = date ? parseISO(date) : new Date();
    const isToday = new Date().toDateString() === selectedDate.toDateString();

    // Function to determine medication status
    const getMedicationStatusType = (med: MedicationWithStatus): 'taken' | 'active' | 'pending' => {
        if (med.status?.taken) return 'taken';

        if (!isToday) return 'pending'; // Non-today medications are just pending

        const now = new Date();
        const medTime = new Date(`2000-01-01T${med.time}`);
        const medHour = medTime.getHours();
        const currentHour = now.getHours();

        // Active if within ±1 hour of current time
        if (Math.abs(medHour - currentHour) <= 1) {
            return 'active';
        }

        // Pending if the medication time has passed but not taken
        if (medHour < currentHour) {
            return 'pending';
        }

        // Also pending if medication time is in the future
        return 'pending';
    };

    const handleTakeMedication = async (medicationId: number) => {
        try {
            const dateString = selectedDate.toISOString().split('T')[0];

            // Initialize database if not already done
            const initResult = await database.init();
            if (!initResult.success) {
                console.error('Database initialization failed:', initResult.error);
                Alert.alert('Database Error', 'Failed to initialize medication storage.');
                return;
            }

            const updateResult = await database.updateMedicationStatus(medicationId, dateString, true);

            if (updateResult.success) {
                // Reload medications to update the UI
                loadMedications();
                Alert.alert('Success', 'Medication marked as taken!');
            } else {
                console.error('Failed to update medication status:', updateResult.error);
                Alert.alert('Error', 'Failed to update medication status');
            }
        } catch (error) {
            console.error('Unexpected error updating medication status:', error);
            Alert.alert('Error', 'An unexpected error occurred while updating medication status');
        }
    };

    const loadMedications = async () => {
        try {
            setIsLoading(true);

            // Initialize database if not already done
            const initResult = await database.init();
            if (!initResult.success) {
                console.error('Database initialization failed:', initResult.error);
                Alert.alert('Database Error', 'Failed to initialize medication storage.');
                return;
            }

            const medsResult = await database.getMedicationsWithStatusForDate(selectedDate);
            if (medsResult.success) {
                setMedications(medsResult.data || []);
            } else {
                console.error('Failed to load medications:', medsResult.error);
                Alert.alert('Error', 'Failed to load medications for this date.');
            }
        } catch (error) {
            console.error('Unexpected error loading medications:', error);
            Alert.alert('Error', 'An unexpected error occurred while loading medications.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMedications();
    }, [date]);

    return (
        <View className="flex-1 bg-background">
            <View className="bg-card border-b border-border px-4 py-2">
                <View className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.replace('/(main)/schedule')}
                            className="p-2 -ml-2"
                        >
                            <ChevronLeft size={24} color="#3b82f6" />
                        </TouchableOpacity>
                        <Text className="text-lg font-semibold text-foreground ml-2">
                            {format(selectedDate, 'MMMM d, yyyy')}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">

                <View className="mb-6">
                    <Text className="text-2xl font-bold text-foreground">
                        {isToday ? "Today's Schedule" : format(selectedDate, 'EEEE, MMMM d')}
                    </Text>
                    <Text className="text-muted-foreground">
                        {format(selectedDate, 'MMMM d, yyyy')}
                    </Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-muted-foreground">Loading...</Text>
                    </View>
                ) : medications.length > 0 ? (
                    <ScrollView className="flex-1">
                        {medications.map((med) => {
                            const statusType = getMedicationStatusType(med);
                            const isTaken = statusType === 'taken';

                            return (
                                <View
                                    key={med.id}
                                    className={`rounded-lg p-4 border mb-3 ${isTaken
                                            ? 'bg-green-50 border-green-200'
                                            : statusType === 'active'
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-card border-border'
                                        }`}
                                >
                                    <View className="flex-row items-center">
                                        <View className={`p-2 rounded-full mr-3 ${isTaken
                                                ? 'bg-green-200'
                                                : statusType === 'active'
                                                    ? 'bg-yellow-200'
                                                    : 'bg-blue-100'
                                            }`}>
                                            {isTaken ? (
                                                <Check size={20} color="#16a34a" />
                                            ) : statusType === 'active' ? (
                                                <Clock size={20} color="#ca8a04" />
                                            ) : (
                                                <Pill size={20} color="#3b82f6" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="font-medium text-foreground text-lg">{med.name}</Text>
                                                <View className="flex-row items-center">
                                                    <Text className="text-sm font-medium text-foreground mr-2">
                                                        {new Date(`2000-01-01T${med.time}`).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </Text>
                                                    {isTaken && (
                                                        <View className="bg-green-100 px-2 py-1 rounded-full">
                                                            <Text className="text-xs font-medium text-green-800">Taken</Text>
                                                        </View>
                                                    )}
                                                    {!isTaken && statusType === 'active' && (
                                                        <View className="bg-yellow-100 px-2 py-1 rounded-full">
                                                            <Text className="text-xs font-medium text-yellow-800">Active</Text>
                                                        </View>
                                                    )}
                                                    {!isTaken && statusType === 'pending' && isToday && (
                                                        <View className="bg-gray-100 px-2 py-1 rounded-full">
                                                            <Text className="text-xs font-medium text-gray-800">Pending</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                            <View className="mt-2">
                                                <Text className="text-sm text-muted-foreground">{med.dosage}</Text>
                                                {med.instructions && (
                                                    <Text className="text-sm text-muted-foreground mt-1">
                                                        {med.instructions}
                                                    </Text>
                                                )}
                                                {isTaken && med.status?.takenAt && (
                                                    <Text className="text-sm text-green-600 mt-1">
                                                        Taken at {new Date(med.status.takenAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </Text>
                                                )}
                                            </View>
                                            {!isTaken && (
                                                <TouchableOpacity
                                                    onPress={() => handleTakeMedication(med.id!)}
                                                    className={`mt-3 px-4 py-2 rounded-lg flex-row items-center justify-center ${statusType === 'active'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-blue-500'
                                                        }`}
                                                >
                                                    <Check size={16} color="white" />
                                                    <Text className="text-white font-medium ml-2">Take</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-muted-foreground text-center">
                            No medications scheduled for {isToday ? 'today' : 'this day'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
