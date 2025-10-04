import { AppHeader } from '@/components/app-header';
import { MedicationOverview } from '@/components/medication-overview';
import { QuickActions } from '@/components/quick-actions';
import { UpcomingReminders, type Medication } from '@/components/upcoming-reminders';
import { WelcomeSection } from '@/components/welcome-section';
import { initDatabase, getTodayMedications, type MedicationRecord } from '@/lib/database';
import { Stack } from 'expo-router';
import * as React from 'react';
import { ScrollView, ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';

const SCREEN_OPTIONS = {
    header: () => <AppHeader />,
};

// Format time from 24h to 12h format
const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function Screen() {
    const [medications, setMedications] = React.useState<Medication[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const loadMedications = React.useCallback(async () => {
        try {
            setIsLoading(true);
            const dbMedications = await getTodayMedications();
            
            // Convert database records to component format
            const formattedMedications: Medication[] = dbMedications.map((med) => ({
                id: med.id!.toString(),
                name: med.name,
                dosage: med.dosage,
                time: formatTime(med.time),
                taken: false, // TODO: Track medication taken status separately
            }));
            
            setMedications(formattedMedications);
            setError(null);
        } catch (err) {
            console.error('Error loading medications:', err);
            setError('Failed to load medications');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const setup = async () => {
            try {
                await initDatabase();
                await loadMedications();
            } catch (err) {
                console.error('Error initializing database:', err);
                setError('Failed to initialize database');
                setIsLoading(false);
            }
        };

        setup();
    }, [loadMedications]);

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

    const activeCount = medications.length;
    const dueNowCount = medications.filter(m => !m.taken).length;
    const upcomingCount = medications.filter(m => !m.taken).length;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={SCREEN_OPTIONS} />
            <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
                <WelcomeSection />
                <MedicationOverview 
                    activeCount={activeCount} 
                    dueNowCount={dueNowCount} 
                    upcomingCount={upcomingCount} 
                />
                <QuickActions onMedicationAdded={loadMedications} />
                <UpcomingReminders medications={medications} />
            </ScrollView>
        </SafeAreaView>
    );
}
