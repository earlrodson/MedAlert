import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ScheduleScreen() {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedDate, setSelectedDate] = useState(today);

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

                            return (
                                <View style={styles.dayCell}>
                                    {day ? (
                                        <TouchableOpacity
                                            onPress={() => handleDayPress(day)}
                                            style={[
                                                styles.dayButton,
                                                !isCurrentMonth && styles.nonCurrentMonth
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.dayContent,
                                                    isCurrentDay && styles.currentDay,
                                                    isSameDay(day, selectedDate) && !isCurrentDay && styles.selectedDay
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dayText,
                                                        isCurrentDay && styles.currentDayText
                                                    ]}
                                                >
                                                    {dayNumber}
                                                </Text>
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
});
