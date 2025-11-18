import { BottomNavigation } from '@/components/bottom-navigation';
import { Tabs } from 'expo-router';
import { MedicationStatusProvider } from '@/lib/medication-status-provider';

export default function TabLayout() {
    return (
        <MedicationStatusProvider>
            <Tabs
                screenOptions={{ headerShown: false }}
                tabBar={(props) => <BottomNavigation {...props} />}
            >
                <Tabs.Screen name="index" />
                <Tabs.Screen name="medications" />
                <Tabs.Screen name="schedule" />
                <Tabs.Screen name="daily-schedule" />
                <Tabs.Screen name="profile" />
            </Tabs>
        </MedicationStatusProvider>
    );
}
