import { AppHeader } from '@/components/app-header';
import { MedicationOverview } from '@/components/medication-overview';
import { QuickActions } from '@/components/quick-actions';
import { UpcomingReminders, type Medication } from '@/components/upcoming-reminders';
import { WelcomeSection } from '@/components/welcome-section';
import { CurrentMedications } from '@/components/current-medications';
import { database, type MedicationRecord } from '@/lib/database-wrapper';
import { useMedicationStatus } from '@/lib/medication-status-provider';
import { CURRENT_MEDICATIONS_TIME_WINDOW, UPCOMING_MEDICATIONS_TIME_RANGE } from '@/lib/time-constants';
import {
    registerForPushNotificationsAsync,
    scheduleAllPendingMedications,
} from '@/lib/notifications';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { TimeUtils } from '@/lib/time-utils';
import { logger, ErrorHandler } from '@/lib/error-handling';
import ErrorBoundary from '@/components/error-boundary';
import React from 'react';
import { Stack } from 'expo-router';
import { ScrollView, ActivityIndicator, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';

const SCREEN_OPTIONS = {
    header: () => <AppHeader />,
};

// Format time using robust time utility
const formatTime = (time24: string): string => {
    const timeResult = TimeUtils.parseTime(time24);
    return timeResult.success ? timeResult.formatted12h : time24;
};

export default function Screen() {
    const { colorScheme } = useColorScheme();
    const [refreshing, setRefreshing] = React.useState(false);
    const {
        allMedications,
        isLoading,
        error,
        refreshData: refreshMedications,
        markAsTaken
    } = useMedicationStatus();

    const handleMedicationTaken = React.useCallback(async (medicationId: string) => {
        // Use the global context's markAsTaken function
        await markAsTaken(medicationId);
        logger.info('Medication marked as taken', { medicationId }, 'MainScreen');
    }, [markAsTaken]);

    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshMedications();
            logger.info('Home page refreshed manually', {}, 'MainScreen');
        } catch (error) {
            console.error('Error refreshing home page:', error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshMedications]);

    // Filter medications for different sections
    const { currentMedications, upcomingMedications } = React.useMemo(() => {
        const now = new Date();
        const current: Medication[] = [];
        const upcoming: Medication[] = [];

        allMedications.forEach(med => {
            // Skip already taken medications for upcoming, but include in current if not taken
            if (med.taken) return;

            // Parse medication time to check time windows
            const [hours, minutes] = med.time24h.split(':').map(Number);
            const medTime = new Date();
            medTime.setHours(hours, minutes, 0, 0);

            // Calculate time difference in milliseconds
            const timeDiff = medTime.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            const medFormatted = {
                id: med.medicationId,
                name: med.name,
                dosage: med.dosage,
                time: formatTime(med.time),
                taken: med.taken,
            };

            // Current Medications: Use configured time window (2 hours before to 2 hours after)
            if (hoursDiff >= -CURRENT_MEDICATIONS_TIME_WINDOW.hoursBefore &&
                hoursDiff <= CURRENT_MEDICATIONS_TIME_WINDOW.hoursAfter) {
                current.push(medFormatted);
            }
            // Upcoming Reminders: Future medications outside current time window
            else if (hoursDiff > CURRENT_MEDICATIONS_TIME_WINDOW.hoursAfter &&
                     hoursDiff <= UPCOMING_MEDICATIONS_TIME_RANGE.maxHoursAfter) {
                upcoming.push(medFormatted);
            }
        });

        return { currentMedications: current, upcomingMedications: upcoming };
    }, [allMedications]);

    // Schedule notifications for all medications - non-blocking
    React.useEffect(() => {
        const allFormattedMedications = [...currentMedications, ...upcomingMedications];
        if (allFormattedMedications.length > 0) {
            // Schedule notifications in background without blocking UI
            scheduleAllPendingMedications(allFormattedMedications).catch(error => {
                console.warn('Failed to schedule notifications:', error);
            });
        }
    }, [currentMedications, upcomingMedications]);

    // Register for push notifications on mount - non-blocking with error handling
    React.useEffect(() => {
        // Register for notifications in background without blocking UI
        registerForPushNotificationsAsync().catch(error => {
            // Silently handle notification registration errors
            console.warn('Notification registration failed:', error);
        });
    }, []);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" />
                <Text className="mt-4 text-muted-foreground">Loading medications...</Text>
            </SafeAreaView>
        );
    }
    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center p-4">
                <Text className="text-destructive text-center">{error}</Text>
            </SafeAreaView>
        );
    }

    const activeCount = currentMedications.length + upcomingMedications.length;
    const dueNowCount = currentMedications.filter(m => !m.taken).length;
    const upcomingCount = upcomingMedications.filter(m => !m.taken).length;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={SCREEN_OPTIONS} />
            <ErrorBoundary
                context="MainScreen"
                showRetry={true}
                customMessage="The home screen encountered an error. Please try again."
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary}
                            colors={[colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary]}
                        />
                    }
                >
                    <View className={cn('rounded-lg p-4 mb-4')} style={{ backgroundColor: colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary }}>
                        <ErrorBoundary context="WelcomeSection">
                            <WelcomeSection />
                        </ErrorBoundary>
                        <ErrorBoundary context="MedicationOverview">
                            <MedicationOverview
                                activeCount={activeCount}
                                dueNowCount={dueNowCount}
                                upcomingCount={upcomingCount}
                            />
                        </ErrorBoundary>
                    </View>
                    <ErrorBoundary context="CurrentMedications">
                        <CurrentMedications
                            onMedicationTaken={handleMedicationTaken}
                        />
                    </ErrorBoundary>
                    <ErrorBoundary context="UpcomingReminders">
                        <UpcomingReminders medications={upcomingMedications} />
                    </ErrorBoundary>
                </ScrollView>
            </ErrorBoundary>
        </SafeAreaView>
    );
}
