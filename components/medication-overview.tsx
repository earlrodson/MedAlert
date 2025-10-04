import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Pill, Bell, Clock } from 'lucide-react-native';
import { View } from 'react-native';
import { colors } from '@/lib/theme';

interface MedicationOverviewProps {
    activeCount: number;
    dueNowCount: number;
    upcomingCount: number;
}

export function MedicationOverview({ activeCount, dueNowCount, upcomingCount }: MedicationOverviewProps) {
    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-foreground">Medication Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <View className="flex-row justify-between">
                    <View className="items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Pill size={24} color={colors.primary.main} />
                        </View>
                        <Text className="mt-2 text-sm font-medium">{activeCount}</Text>
                        <Text className="text-xs text-muted-foreground">Active</Text>
                    </View>
                    <View className="items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-success/10">
                            <Bell size={24} color={colors.status.success} />
                        </View>
                        <Text className="mt-2 text-sm font-medium">{dueNowCount}</Text>
                        <Text className="text-xs text-muted-foreground">Due Now</Text>
                    </View>
                    <View className="items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                            <Clock size={24} color={colors.status.warning} />
                        </View>
                        <Text className="mt-2 text-sm font-medium">{upcomingCount}</Text>
                        <Text className="text-xs text-muted-foreground">Upcoming</Text>
                    </View>
                </View>
            </CardContent>
        </Card>
    );
}
