import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AddMedicationModal } from '@/components/add-medication-modal';
import { Plus, Calendar, Activity, User } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { colors } from '@/lib/theme';
import type { LucideIcon } from 'lucide-react-native';

interface QuickAction {
    id: string;
    icon: LucideIcon;
    label: string;
    color: string;
    onPress?: () => void;
}

interface QuickActionsProps {
    onMedicationAdded?: () => void;
}

export function QuickActions({ onMedicationAdded }: QuickActionsProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleAddMed = () => {
        setIsModalOpen(true);
    };

    const quickActionsData: QuickAction[] = [
        { id: '1', icon: Plus, label: 'Add Med', color: colors.primary.main, onPress: handleAddMed },
        { id: '2', icon: Calendar, label: 'Schedule', color: colors.secondary.main },
        { id: '3', icon: Activity, label: 'History', color: colors.status.info },
        { id: '4', icon: User, label: 'Profile', color: colors.status.warning },
    ];

    return (
        <>
            <View className="mb-8">
                <Text className="mb-4 text-lg font-semibold text-foreground">Quick Actions</Text>
                <View className="flex-row justify-between gap-3">
                    {quickActionsData.map((action) => (
                        <Button
                            key={action.id}
                            variant="outline"
                            className="flex-1 h-28 items-center justify-center rounded-xl py-4"
                            style={{ borderColor: action.color }}
                            onPress={action.onPress}
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

            <AddMedicationModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onMedicationAdded={onMedicationAdded}
            />
        </>
    );
}
