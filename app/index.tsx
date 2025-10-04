import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { UserMenu } from '@/components/user-menu';
import { useUser } from '@clerk/clerk-expo';
import { Link, Stack } from 'expo-router';
import { Pill, Clock, Plus, Bell, Activity, Calendar, User, Sun, Moon, Pill as PillIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

const MEDICAL_ICON = {
    light: PillIcon,
    dark: PillIcon,
};

const ICON_STYLE = {
    height: 40,
    width: 40,
    color: colors.primary.main,
};

const SCREEN_OPTIONS = {
    header: () => (
        <View className="bg-background px-4 py-2">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <PillIcon size={32} color={colors.primary.main} />
                    <Text className="ml-2 text-xl font-bold text-foreground">MedAlert</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <ThemeToggle />
                    <UserMenu />
                </View>
            </View>
        </View>
    ),
};

// Mock data for medications and reminders
const medications = [
    { id: '1', name: 'Lisinopril', dosage: '10mg', time: '8:00 AM', taken: true },
    { id: '2', name: 'Metformin', dosage: '500mg', time: '12:00 PM', taken: false },
    { id: '3', name: 'Atorvastatin', dosage: '20mg', time: '8:00 PM', taken: false },
];

const quickActions = [
    { id: '1', icon: Plus, label: 'Add Med', color: colors.primary.main },
    { id: '2', icon: Calendar, label: 'Schedule', color: colors.secondary.main },
    { id: '3', icon: Activity, label: 'History', color: colors.status.info },
    { id: '4', icon: User, label: 'Profile', color: colors.status.warning },
];

export default function Screen() {
    const { colorScheme } = useColorScheme();
    const { user } = useUser();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={SCREEN_OPTIONS} />
            <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
                {/* Welcome Section */}
                <View className="mb-8">
                    <Text className="text-muted-foreground">Good {getTimeOfDay()},</Text>
                    <Text className="text-2xl font-bold text-foreground">
                        {user?.firstName || 'User'}
                    </Text>
                    <View className="mt-2 flex-row items-center">
                        <Text className="ml-1 text-sm text-muted-foreground">
                            {currentTime} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                </View>
                {/* Medication Overview */}
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
                                <Text className="mt-2 text-sm font-medium">3</Text>
                                <Text className="text-xs text-muted-foreground">Active</Text>
                            </View>
                            <View className="items-center">
                                <View className="h-12 w-12 items-center justify-center rounded-full bg-success/10">
                                    <Bell size={24} color={colors.status.success} />
                                </View>
                                <Text className="mt-2 text-sm font-medium">1</Text>
                                <Text className="text-xs text-muted-foreground">Due Now</Text>
                            </View>
                            <View className="items-center">
                                <View className="h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                                    <Clock size={24} color={colors.status.warning} />
                                </View>
                                <Text className="mt-2 text-sm font-medium">2</Text>
                                <Text className="text-xs text-muted-foreground">Upcoming</Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <View className="mb-8">
                    <Text className="mb-4 text-lg font-semibold text-foreground">Quick Actions</Text>
                    <View className="flex-row justify-between gap-3">
                        {quickActions.map((action) => (
                            <Button
                                key={action.id}
                                variant="outline"
                                className="flex-1 h-28 items-center justify-center rounded-xl py-4"
                                style={{ borderColor: action.color }}
                            >
                                <View className="items-center">
                                    <action.icon size={24} color={action.color} />
                                    <Text className="mt-2 text-center text-xs" style={{ color: action.color }}>
                                        {action.label}
                                    </Text>
                                </View>
                            </Button>
                        ))}
                    </View>
                </View>

                {/* Upcoming Reminders */}
                <View className="mb-8">
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-lg font-semibold text-foreground">Upcoming Reminders</Text>
                        <Link href="/(auth)/sign-up">
                            <Text className="text-sm font-medium text-primary">See All</Text>
                        </Link>
                    </View>
                    <Card>
                        <CardContent className="p-0">
                            {medications.map((med, index) => (
                                <View
                                    key={med.id}
                                    className={`flex-row items-center justify-between py-5 px-4 ${index !== medications.length - 1 ? 'border-b border-border' : ''}`}
                                >
                                    <View className="flex-row items-center">
                                        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <Pill size={24} color={colors.primary.main} />
                                        </View>
                                        <View className="ml-4">
                                            <Text className="text-base font-medium text-foreground">{med.name}</Text>
                                            <Text className="text-sm text-muted-foreground mt-0.5">{med.dosage}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="font-medium text-foreground">{med.time}</Text>
                                        <View className={`mt-1 px-2 py-0.5 rounded-full ${med.taken ? 'bg-success/10' : 'bg-warning/10'}`}>
                                            <Text className={`text-xs font-medium ${med.taken ? 'text-success' : 'text-warning'}`}>
                                                {med.taken ? 'Taken' : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </CardContent>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const THEME_ICONS = {
    light: Sun,
    dark: Moon,
};

function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const Icon = THEME_ICONS[colorScheme ?? 'light'];
    return (
        <Button variant="ghost" size="icon" onPress={toggleColorScheme} className="h-10 w-10">
            <Icon className="size-5 text-foreground" />
        </Button>
    );
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
}
