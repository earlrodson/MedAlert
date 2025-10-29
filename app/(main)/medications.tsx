import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AddMedicationModal } from '@/components/add-medication-modal';
import { ViewMedicationDialog } from '@/components/view-medication-dialog';
import { Alert } from 'react-native';
import { deleteMedication, getAllMedications } from '@/lib/database';
import { MedicationRecord } from '@/lib/database';
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
    const [medications, setMedications] = useState<MedicationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [editingMedication, setEditingMedication] = useState<MedicationRecord | null>(null);
    const [viewingMedication, setViewingMedication] = useState<MedicationRecord | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const colorScheme = useColorScheme() || 'light';

    const refreshMedications = async () => {
        try {
            const meds = await getAllMedications();
            setMedications(meds);
        } catch (error) {
            console.error('Failed to load medications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadMedications = async () => {
            try {
                const meds = await getAllMedications();
                setMedications(meds);
            } catch (error) {
                console.error('Failed to load medications:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMedications();
    }, []);

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
        refreshMedications();
    };

    const handleDeleteMedication = async (id: number) => {
        try {
            setDeletingId(id);
            await deleteMedication(id);
            await refreshMedications();
        } catch (error) {
            console.error('Failed to delete medication:', error);
            Alert.alert('Error', 'Failed to delete medication. Please try again.');
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
            <ScrollView className="flex-1 p-4">
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

                        {medications.map((med) => (
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
                                            missed: THEME[colorScheme].danger
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
                                                <Trash2 size={16} color={THEME[colorScheme].danger} />
                                                <Text style={{ color: deletingId === med.id ? THEME[colorScheme].mutedForeground : THEME[colorScheme].danger }}>
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
                    Showing {medications.length} medication{medications.length !== 1 ? 's' : ''}
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
