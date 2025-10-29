import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Pill, ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { getMedicationsByDate, MedicationRecord } from '@/lib/database';

export default function DailySchedule() {
    const router = useRouter();
    const { date } = useLocalSearchParams<{ date: string }>();
    const [medications, setMedications] = useState<MedicationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const selectedDate = date ? parseISO(date) : new Date();
    const isToday = new Date().toDateString() === selectedDate.toDateString();

    useEffect(() => {
        const loadMedications = async () => {
            try {
                setIsLoading(true);
                const meds = await getMedicationsByDate(selectedDate);
                setMedications(meds);
            } catch (error) {
                console.error('Error loading medications:', error);
            } finally {
                setIsLoading(false);
            }
        };

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
                    {medications.map((med) => (
                        <View key={med.id} className="bg-card rounded-lg p-4 border border-border mb-3 flex-row items-center">
                            <View className="bg-blue-100 p-2 rounded-full mr-3">
                                <Pill size={20} color="#3b82f6" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-medium text-foreground text-lg">{med.name}</Text>
                                <View className="flex-row justify-between mt-1">
                                    <View>
                                        <Text className="text-sm text-muted-foreground">{med.dosage}</Text>
                                        {med.instructions && (
                                            <Text className="text-sm text-muted-foreground mt-1">
                                                {med.instructions}
                                            </Text>
                                        )}
                                    </View>
                                    <Text className="text-sm font-medium text-foreground">
                                        {new Date(`2000-01-01T${med.time}`).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit',
                                            hour12: true 
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
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
