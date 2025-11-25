import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Pill, ChevronLeft, Check, Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useMedicationStatus } from '@/lib/medication-status-provider';
import { MedicationRecord, MedicationStatus, MedicationWithStatus } from '@/lib/database-types';

export default function DailySchedule() {
    const router = useRouter();
    const { date } = useLocalSearchParams<{ date: string }>();
    const { allMedications, markAsTaken, isLoading: isLoadingMedications } = useMedicationStatus();
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
            console.log('🎯 Marking medication as taken:', medicationId);

            // Find the medication to get its string ID
            const medication = medications.find(med => med.id === medicationId);
            const stringMedicationId = medication?.id?.toString() || medicationId.toString();

            await markAsTaken(stringMedicationId);

            // Filter medications to show updated state
            const updatedMedications = medications.map(med =>
                med.id === medicationId
                    ? { ...med, status: { taken: true, takenAt: new Date().toISOString() } }
                    : med
            );

            setMedications(updatedMedications);
            Alert.alert('Success', 'Medication marked as taken!');
        } catch (error) {
            console.error('Unexpected error updating medication status:', error);
            Alert.alert('Error', 'An unexpected error occurred while updating medication status');
        }
    };

    const loadMedications = () => {
        try {
            setIsLoading(true);

            // Debug logging - Start
            console.log('🔍 Daily Schedule Debug: Loading medications');
            console.log('📅 Selected Date:', selectedDate.toISOString());
            console.log('📅 Is Today:', isToday);
            console.log('📱 Platform:', typeof window !== 'undefined' ? 'web' : 'native');
            console.log('🗄️ Using MedicationStatusProvider with', allMedications.length, 'total medications');

            const dateString = selectedDate.toISOString().split('T')[0];
            console.log('🔍 Filtering medications for date:', dateString);

            // Filter medications for the selected date from global state
            const filteredMedications = allMedications.filter(med => {
                const medDate = med.scheduledTime ?
                    new Date(med.scheduledTime).toISOString().split('T')[0] :
                    new Date().toISOString().split('T')[0];

                return medDate === dateString;
            });

            // Convert to MedicationWithStatus format for compatibility
            const medicationWithStatus: MedicationWithStatus[] = filteredMedications.map(med => ({
                id: med.id ? parseInt(med.id) : 0,
                name: med.medicationName || 'Unknown Medication',
                dosage: med.dosage || 'Unknown Dosage',
                frequency: med.frequency || 'Unknown Frequency',
                time: med.scheduledTime ? new Date(med.scheduledTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : 'Unknown Time',
                instructions: med.instructions || '',
                startDate: med.startDate || new Date().toISOString().split('T')[0],
                endDate: med.endDate || null,
                createdAt: med.createdAt || new Date().toISOString(),
                updatedAt: med.updatedAt || new Date().toISOString(),
                status: {
                    taken: med.taken || false,
                    takenAt: med.takenAt || null
                }
            }));

            console.log('✅ Medications loaded successfully');
            console.log('📊 Medication count:', medicationWithStatus.length);
            console.log('💊 Medications:', medicationWithStatus.map(med => ({
                id: med.id,
                name: med.name,
                time: med.time,
                startDate: med.startDate,
                endDate: med.endDate,
                status: med.status
            })));

            setMedications(medicationWithStatus);
        } catch (error) {
            console.error('❌ Unexpected error loading medications:', error);
            console.error('🔍 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            Alert.alert('Error', 'An unexpected error occurred while loading medications.');
        } finally {
            setIsLoading(false);
            console.log('🏁 Load medications completed');
        }
    };

    useEffect(() => {
        loadMedications();
    }, [date, allMedications]);

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
