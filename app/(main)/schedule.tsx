import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, isPast, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/badge';
import { useMedicationStatus } from '@/lib/medication-status-provider';
import { THEME } from '@/lib/theme';

export default function ScheduleScreen() {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedDate, setSelectedDate] = useState(today);
    const [medicationCounts, setMedicationCounts] = useState<Record<string, number>>({});
    const { allMedications, isLoading: isLoadingMedications } = useMedicationStatus();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthName = format(currentDate, 'MMMM yyyy');

    const daysInMonth = useMemo(() => {
        const days = [];
        const startDate = startOfMonth(currentDate);
        const endDate = endOfMonth(currentDate);
        const daysList = eachDayOfInterval({ start: startDate, end: endDate });

        // Add empty cells for days before the first day of the month
        const firstDayOfWeek = startDate.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        daysList.forEach(day => {
            days.push(day);
        });

        // Add empty cells at the end to complete the last row if needed
        const totalCells = Math.ceil(days.length / 7) * 7;
        while (days.length < totalCells) {
            days.push(null);
        }

        return days;
    }, [currentDate]);

    const handlePreviousMonth = () => {
        setCurrentDate(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => addMonths(prev, 1));
    };

    const router = useRouter();

    const handleDayPress = (day: Date | null) => {
        if (day) {
            router.push({
                pathname: '/daily-schedule',
                params: { date: day.toISOString() },
            });
        }
    };

    // Calculate medication counts from global state data
    const calculateMedicationCounts = (days: (Date | null)[]) => {
        const counts: Record<string, number> = {};

        // Filter days for current month
        const daysToProcess = days.filter(day => day !== null && isSameMonth(day, currentDate));
        console.log('🔍 Calculating medication counts for days:',
            daysToProcess.map(d => format(d!, 'yyyy-MM-dd'))
        );

        // Calculate untaken medication counts for each day
        daysToProcess.forEach(day => {
            const dateString = format(day!, 'yyyy-MM-dd');

            // Filter medications for this date that haven't been taken
            const untakenMeds = allMedications.filter(med => {
                const medDate = med.scheduledTime ?
                    new Date(med.scheduledTime).toISOString().split('T')[0] :
                    new Date().toISOString().split('T')[0];

                return medDate === dateString && !med.taken;
            });

            counts[dateString] = untakenMeds.length;
            console.log(`✅ Medications for ${dateString}: ${untakenMeds.length} untaken`);
        });

        console.log('📊 Final untaken medication counts:', counts);
        setMedicationCounts(counts);
    };

    // Calculate counts when month changes or medications update
    useEffect(() => {
        if (!isLoadingMedications && allMedications.length > 0) {
            calculateMedicationCounts(daysInMonth);
        }
    }, [currentDate, allMedications, isLoadingMedications]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: 'Schedule',
                    headerShown: true,
                }}
            />

            <View className="flex-1 p-4">
                {/* Month Navigation */}
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity onPress={handlePreviousMonth} className="p-2">
                        <ChevronLeft size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-foreground">{monthName}</Text>
                    <TouchableOpacity onPress={handleNextMonth} className="p-2">
                        <ChevronRight size={24} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                {/* Day Names */}
                <View className="flex-row mb-2">
                    {dayNames.map((day) => (
                        <View key={day} className="flex-1 items-center">
                            <Text className="text-sm font-medium text-muted-foreground">{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View className="flex-1">
                    <FlatList
                        data={daysInMonth}
                        numColumns={7}
                        keyExtractor={(_, index) => index.toString()}
                        scrollEnabled={false}
                        contentContainerStyle={styles.calendarGrid}
                        renderItem={({ item: day, index }) => {
                            const dayNumber = day ? format(day, 'd') : '';
                            const isCurrentMonth = day ? isSameMonth(day, currentDate) : false;
                            const isCurrentDay = day ? isToday(day) : false;
                            const isPastDate = day ? isBefore(day, startOfDay(new Date())) : false;
                            const dateString = day ? format(day, 'yyyy-MM-dd') : '';
                            const medicationCount = day ? (medicationCounts[dateString] || 0) : 0;

                            // Debug logging for date classification
                            console.log('📅 Date Debug:', {
                                date: dateString,
                                isCurrentDay,
                                isPastDate,
                                untakenMedicationCount: medicationCount,
                                shouldShowBadge: medicationCount > 0 && (!isPastDate || isCurrentDay)
                            });

                            return (
                                <View style={styles.dayCell}>
                                    {day ? (
                                        <TouchableOpacity
                                            onPress={() => handleDayPress(day)}
                                            style={[
                                                styles.dayButton,
                                                !isCurrentMonth && styles.nonCurrentMonth,
                                                isPastDate && !isCurrentDay && styles.pastDate
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.dayContent,
                                                    isCurrentDay && styles.currentDay,
                                                    isSameDay(day, selectedDate) && !isCurrentDay && styles.selectedDay,
                                                    isPastDate && !isCurrentDay && styles.pastDateContent
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dayText,
                                                        isCurrentDay && styles.currentDayText,
                                                        isPastDate && !isCurrentDay && styles.pastDateText
                                                    ]}
                                                >
                                                    {dayNumber}
                                                </Text>

                                                {/* Red floating badge for medication counts */}
                                                {medicationCount > 0 && (!isPastDate || isCurrentDay) && (
                                                    <View style={styles.badgeContainer}>
                                                        <Badge
                                                            variant="destructive"
                                                            style={styles.medicationBadge}
                                                        >
                                                            <Text style={styles.badgeText}>
                                                                {medicationCount > 99 ? '99+' : medicationCount.toString()}
                                                            </Text>
                                                        </Badge>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.emptyDay} />
                                    )}
                                </View>
                            );
                        }}
                    />
                </View>

                {/* Upcoming Reminders */}
                {/* <View className="mt-8">
                    <Text className="text-lg font-semibold mb-4 text-foreground">
                        Upcoming Reminders
                    </Text>
                    <View className="bg-card rounded-lg p-6 border border-border items-center">
                        <Text className="text-muted-foreground text-center">
                            Select a date to view scheduled medications
                        </Text>
                    </View>
                </View> */}
            </View>
        </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');
const daySize = (width - 32) / 7; // 32 = 16px padding on each side

const styles = StyleSheet.create({
    calendarGrid: {
        width: '100%',
    },
    dayCell: {
        width: '14.2857%', // 100% / 7 days
        aspectRatio: 1,
        padding: 2,
    },
    dayButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    dayContent: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        position: 'relative',
    },
    currentDay: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937', // text-foreground equivalent
    },
    currentDayText: {
        color: 'white',
    },
    selectedDay: {
        backgroundColor: '#e0f2fe',
        borderColor: '#7dd3fc',
    },
    nonCurrentMonth: {
        opacity: 0.4,
    },
    emptyDay: {
        width: '100%',
        height: '100%',
    },
    // New styles for past dates
    pastDate: {
        opacity: 0.6,
    },
    pastDateContent: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
    },
    pastDateText: {
        color: '#6b7280', // muted-foreground equivalent
    },
    // Badge styles
    badgeContainer: {
        position: 'absolute',
        top: -8,
        right: -10,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    medicationBadge: {
        minWidth: 10,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        paddingVertical: 0,
        backgroundColor: '#ef4444', // destructive color
        borderWidth: 0,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 18,
    },
});
