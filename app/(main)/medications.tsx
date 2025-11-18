import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { AddMedicationModal } from '@/components/add-medication-modal';
import { ViewMedicationDialog } from '@/components/view-medication-dialog';
import { Alert } from 'react-native';
import { database } from '@/lib/database-wrapper';
import { MedicationRecord } from '@/lib/database-types';
import { useAllMedications } from '@/lib/medication-status-provider';
import { DataTable } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { THEME } from '@/lib/theme';
import { Clock, CheckCircle, AlertCircle, MoreVertical, Info, Edit, Trash2, Plus } from 'lucide-react-native';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const getMedicationStatus = (time: string): { status: 'upcoming' | 'due' | 'missed'; label: string } => {
    const now = new Date();
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const medTime = new Date();
    medTime.setHours(hours, minutes, 0, 0);

    // Calculate time difference in minutes
    const diffMinutes = (medTime.getTime() - now.getTime()) / (1000 * 60);

    if (diffMinutes > 15) {
        return { status: 'upcoming', label: 'Upcoming' };
    } else if (diffMinutes >= -30) { // Within 30 minutes after scheduled time
        return { status: 'due', label: 'Due Now' };
    } else {
        return { status: 'missed', label: 'Missed' };
    }
};

export default function MedicationsScreen() {
    const { medications, loading, refreshMedications: globalRefreshMedications } = useAllMedications();
    const [refreshing, setRefreshing] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [editingMedication, setEditingMedication] = useState<MedicationRecord | null>(null);
    const [viewingMedication, setViewingMedication] = useState<MedicationRecord | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const colorScheme = useColorScheme() || 'light';

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await globalRefreshMedications();
        } catch (error) {
            console.error('Error refreshing medications:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Convert MedicationStatusInfo to MedicationRecord format for display
    const convertedMedications: MedicationRecord[] = medications.map(med => ({
        id: parseInt(med.medicationId),
        name: med.name,
        dosage: med.dosage,
        time: med.time24h,
        frequency: 'Once daily', // Default value - would need to be fetched from DB if needed
        instructions: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: med.taken ? 'taken' : 'pending'
    }));
    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <Text>Loading medications...</Text>
            </SafeAreaView>
        );
    }

    const handleAddMedication = () => {
        setEditingMedication(null);
        setIsAddModalVisible(true);
    };

    const handleEditMedication = (medication: MedicationRecord) => {
        setEditingMedication(medication);
        setIsAddModalVisible(true);
    };

    const handleMedicationAdded = () => {
        setIsAddModalVisible(false);
        setEditingMedication(null);
        globalRefreshMedications();
    };

    const handleDeleteMedication = async (id: number) => {
        try {
            setDeletingId(id);
            const deleteResult = await database.deleteMedication(id);
            if (deleteResult.success) {
                globalRefreshMedications();
            } else {
                console.error('Failed to delete medication:', deleteResult.error);
                Alert.alert('Error', 'Failed to delete medication. Please try again.');
            }
        } catch (error) {
            console.error('Unexpected error deleting medication:', error);
            Alert.alert('Error', 'An unexpected error occurred while deleting the medication.');
        } finally {
            setDeletingId(null);
        }
    };

    const confirmDelete = (med: MedicationRecord) => {
        Alert.alert(
            'Delete Medication',
            `Are you sure you want to delete ${med.name}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteMedication(med.id!)
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen
                options={{
                    title: 'Medications',
                    headerShown: true,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleAddMedication}
                            className="mr-4 p-1"
                        >
                            <Plus size={24} color={THEME[colorScheme].primary} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <ScrollView
                className="flex-1 p-4"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary}
                        colors={[colorScheme === 'dark' ? THEME.dark.primary : THEME.light.primary]}
                    />
                }
            >
                {medications.length === 0 ? (
                    <View className="flex-1 items-center justify-center p-8">
                        <Text className="text-muted-foreground text-center">
                            No medications found. Add your first medication to get started.
                        </Text>
                    </View>
                ) : (
                    <DataTable className="bg-card rounded-lg overflow-hidden">
                        <DataTable.Header className="bg-muted/50">
                            <DataTable.Title style={{ flex: 3 }}>Name</DataTable.Title>
                            <DataTable.Title style={{ flex: 2.5 }}>Dosage</DataTable.Title>
                            <DataTable.Title style={{ flex: 2.5 }}>Time</DataTable.Title>
                            <DataTable.Title style={{ flex: 1, justifyContent: 'center' }}>Status</DataTable.Title>
                            <DataTable.Title style={{ width: 48 }} >{""}</DataTable.Title>
                        </DataTable.Header>

                        {convertedMedications.map((med) => (
                            <DataTable.Row key={med.id} className="border-b border-border">
                                <DataTable.Cell style={{ flex: 3 }}>
                                    <Text className="font-medium text-foreground">{med.name}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell style={{ flex: 2.5 }}>
                                    <Text className="text-foreground">{med.dosage}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell style={{ flex: 2.5 }}>
                                    <Text className="text-foreground">{med.time}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell style={{ flex: 1, justifyContent: 'center' }}>
                                    {(() => {
                                        const { status } = getMedicationStatus(med.time);
                                        const color = {
                                            upcoming: THEME[colorScheme].primary,
                                            due: THEME[colorScheme].success,
                                            missed: THEME[colorScheme].destructive
                                        }[status];

                                        const Icon = {
                                            upcoming: Clock,
                                            due: CheckCircle,
                                            missed: AlertCircle
                                        }[status];

                                        return <Icon size={20} color={color} />;
                                    })()}
                                </DataTable.Cell>
                                <DataTable.Cell className="flex-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="p-2">
                                            <MoreVertical size={18} color={THEME[colorScheme].mutedForeground} />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-40">
                                            <DropdownMenuItem
                                                className="flex-row items-center gap-2 p-3"
                                                onPress={() => setViewingMedication(med)}
                                            >
                                                <Info size={16} color={THEME[colorScheme].mutedForeground} />
                                                <Text>Details</Text>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="flex-row items-center gap-2 p-3"
                                                onPress={() => handleEditMedication(med)}
                                            >
                                                <Edit size={16} color={THEME[colorScheme].mutedForeground} />
                                                <Text>Edit</Text>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="flex-row items-center gap-2 p-3"
                                                onPress={() => confirmDelete(med)}
                                                disabled={deletingId === med.id}
                                            >
                                                <Trash2 size={16} color={THEME[colorScheme].destructive} />
                                                <Text style={{ color: deletingId === med.id ? THEME[colorScheme].mutedForeground : THEME[colorScheme].destructive }}>
                                                    {deletingId === med.id ? 'Deleting...' : 'Delete'}
                                                </Text>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                )}

                <Text className="text-muted-foreground text-sm mt-4">
                    Showing {convertedMedications.length} medication{convertedMedications.length !== 1 ? 's' : ''}
                </Text>
            </ScrollView>

            <AddMedicationModal
                open={isAddModalVisible}
                onOpenChange={setIsAddModalVisible}
                onMedicationAdded={handleMedicationAdded}
                medication={editingMedication}
                isEditing={!!editingMedication}
            />

            <ViewMedicationDialog
                open={!!viewingMedication}
                onOpenChange={(open) => !open && setViewingMedication(null)}
                medication={viewingMedication}
            />
        </SafeAreaView>
    );
}
