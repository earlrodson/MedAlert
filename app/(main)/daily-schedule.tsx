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

        // Parse the time more robustly
        let medHour: number;

        try {
            // Try to parse the time string
            const timeString = med.time.trim();

            // Check if it's a 24-hour format (e.g., "14:30")
            if (timeString.includes(':') && !timeString.includes('AM') && !timeString.includes('PM')) {
                const [hours, minutes] = timeString.split(':');
                medHour = parseInt(hours, 10);
            } else {
                // Assume it's 12-hour format with AM/PM (e.g., "2:30 PM")
                const [timePart, period] = timeString.split(' ');
                const [hours, minutes] = timePart.split(':');
                medHour = parseInt(hours, 10);

                // Convert 12-hour to 24-hour format if needed
                if (period) {
                    if (period.toLowerCase() === 'pm' && medHour !== 12) {
                        medHour += 12;
                    } else if (period.toLowerCase() === 'am' && medHour === 12) {
                        medHour = 0;
                    }
                }
            }

            // Validate the parsed hour
            if (isNaN(medHour) || medHour < 0 || medHour > 23) {
                console.warn('Invalid time format:', med.time);
                return 'pending';
            }
        } catch (error) {
            console.warn('Error parsing time:', med.time, error);
            return 'pending';
        }

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

            const dateString = selectedDate.toISOString().split('T')[0];

            // Filter medications that should be scheduled for the selected date
            const scheduledMedications = allMedications.filter(med => {
                // Check if medication is active on this date
                const isAfterStart = !med.startDate || new Date(med.startDate) <= selectedDate;
                const isBeforeEnd = !med.endDate || new Date(med.endDate) >= selectedDate;

                if (!isAfterStart || !isBeforeEnd) return false;

                // Check frequency patterns to determine if medication should appear on this date
                const frequency = med.frequency?.toLowerCase() || '';

                if (frequency.includes('daily') || frequency.includes('once daily')) {
                    // Daily medications appear every day
                    return true;
                } else if (frequency.includes('twice daily')) {
                    // Twice daily medications appear once (representing the medication schedule)
                    return true;
                } else if (frequency.includes('weekly')) {
                    // For weekly medications, include them (can be refined with day-of-week matching later)
                    return true;
                } else {
                    // Default: include if no clear frequency pattern
                    return true;
                }
            });

            // Sort medications by time for proper display order
            scheduledMedications.sort((a, b) => {
                const timeA = a.time24h || a.time;
                const timeB = b.time24h || b.time;
                return timeA.localeCompare(timeB);
            });

            // Convert to MedicationWithStatus format for compatibility
            const medicationWithStatus: MedicationWithStatus[] = scheduledMedications.map(med => {
                // Format time for display with better error handling
                let formattedTime = 'Unknown Time';

                try {
                    const timeString = med.time24h || med.time;

                    if (timeString && timeString.trim()) {
                        const [hours, minutes] = timeString.trim().split(':');
                        const parsedHours = parseInt(hours, 10);
                        const parsedMinutes = parseInt(minutes, 10);

                        if (!isNaN(parsedHours) && !isNaN(parsedMinutes) &&
                            parsedHours >= 0 && parsedHours <= 23 &&
                            parsedMinutes >= 0 && parsedMinutes <= 59) {

                            const timeDate = new Date();
                            timeDate.setHours(parsedHours, parsedMinutes, 0, 0);

                            formattedTime = timeDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            });
                        } else {
                            console.warn('Invalid time components:', timeString);
                        }
                    }
                } catch (error) {
                    console.warn('Error formatting time for medication:', med.name, med.time, error);
                }

                return {
                    id: typeof med.id === 'number' ? med.id : parseInt(med.id || '0'),
                    name: med.name || med.medicationName || 'Unknown Medication',
                    dosage: med.dosage || 'Unknown Dosage',
                    frequency: med.frequency || 'Daily',
                    time: formattedTime,
                    instructions: med.instructions || '',
                    startDate: med.startDate || selectedDate.toISOString().split('T')[0],
                    endDate: med.endDate || null,
                    createdAt: med.createdAt || new Date().toISOString(),
                    updatedAt: med.updatedAt || new Date().toISOString(),
                    status: {
                        taken: med.taken || false,
                        takenAt: med.takenAt || null
                    }
                };
            });

            setMedications(medicationWithStatus);
        } catch (error) {
            console.error('Error loading medications:', error);
            Alert.alert('Error', 'An unexpected error occurred while loading medications.');
        } finally {
            setIsLoading(false);
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
                        {isToday ? `Today's Schedule` : format(selectedDate, 'EEEE, MMMM d')}
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
                        {medications.map((med, index) => {
                            const statusType = getMedicationStatusType(med);
                            const isTaken = statusType === 'taken';

                            // Create a unique key using both medication id and index
                            const uniqueKey = `${med.id}-${index}`;

                            const bgClasses = isTaken
    ? 'bg-green-50 border-green-200'
    : statusType === 'active'
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-card border-border';

                            return (
                                <View
                                    key={uniqueKey}
                                    className={`rounded-lg p-4 border mb-3 ${bgClasses}`}
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
                                                        {med.time || 'Unknown Time'}
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
                                                        Taken at {(() => {
                                                            try {
                                                                const takenDate = new Date(med.status.takenAt!);
                                                                if (isNaN(takenDate.getTime())) {
                                                                    return med.status.takenAt || 'Unknown time';
                                                                }
                                                                return takenDate.toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                });
                                                            } catch (error) {
                                                                return med.status.takenAt || 'Unknown time';
                                                            }
                                                        })()}
                                                    </Text>
                                                )}
                                            </View>
                                            {!isTaken && (
                                                <TouchableOpacity
                                                    onPress={() => handleTakeMedication(med.id!)}
                                                    className={`mt-3 px-4 py-2 rounded-lg flex-row items-center justify-center ${
                                                        statusType === 'active' ? 'bg-yellow-500' : 'bg-blue-500'
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
