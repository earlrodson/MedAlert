import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { MedicationRecord } from '@/lib/database';
import { Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react-native';
import { View } from 'react-native';

interface ViewMedicationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    medication: MedicationRecord | null;
}

export function ViewMedicationDialog({ open, onOpenChange, medication }: ViewMedicationDialogProps) {
    if (!medication) return null;

    const getStatusInfo = () => {
        const now = new Date();
        const [hours, minutes] = medication.time.split(':').map(Number);
        const medTime = new Date();
        medTime.setHours(hours, minutes, 0, 0);

        const diffMinutes = (now.getTime() - medTime.getTime()) / (1000 * 60);

        if (diffMinutes < -30) {
            return { status: 'Upcoming', icon: Clock, color: '#3b82f6' }; // blue-500
        } else if (diffMinutes < 30) {
            return { status: 'Due Now', icon: AlertCircle, color: '#ef4444' }; // red-500
        } else {
            return { status: 'Taken', icon: CheckCircle, color: '#10b981' }; // emerald-500
        }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        <Text className="text-xl">Medication Details</Text>
                    </DialogTitle>
                </DialogHeader>

                <Card className="mb-4">
                    <CardHeader className="pb-2">
                        <View className="flex-row justify-between items-center">
                            <CardTitle>
                                <Text className="text-lg">{medication.name}</Text>
                            </CardTitle>
                            <View className="flex-row items-center gap-1">
                                <StatusIcon size={16} color={statusInfo.color} />
                                <Text style={{ color: statusInfo.color }}>{statusInfo.status}</Text>
                            </View>
                        </View>
                    </CardHeader>

                    <CardContent className="gap-3">
                        <View className="flex-row items-center gap-2">
                            <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
                                <Calendar size={14} color="#3b82f6" />
                            </View>
                            <Text className="text-foreground">
                                <Text className="font-medium">Dosage: </Text>
                                <Text>{medication.dosage}</Text>
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                            <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center">
                                <Clock size={14} color="#8b5cf6" />
                            </View>
                            <Text className="text-foreground">
                                <Text className="font-medium">Time: </Text>
                                <Text>{medication.time}</Text>
                            </Text>
                        </View>

                        {medication.frequency && (
                            <View className="flex-row items-center gap-2">
                                <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center">
                                    <Clock size={14} color="#f59e0b" />
                                </View>
                                <Text className="text-foreground">
                                    <Text className="font-medium">Frequency: </Text>
                                    <Text>{medication.frequency}</Text>
                                </Text>
                            </View>
                        )}

                        {medication.instructions && (
                            <View className="mt-2">
                                <Text className="font-medium mb-1">Instructions:</Text>
                                <Text className="text-foreground">{medication.instructions}</Text>
                            </View>
                        )}

                        <View className="mt-2 flex-row justify-between">
                            <View>
                                <Text className="text-sm text-muted-foreground">Start Date</Text>
                                <Text className="text-foreground">
                                    {new Date(medication.startDate).toLocaleDateString()}
                                </Text>
                            </View>
                            {medication.endDate && (
                                <View>
                                    <Text className="text-sm text-muted-foreground">End Date</Text>
                                    <Text className="text-foreground">
                                        {new Date(medication.endDate).toLocaleDateString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </CardContent>
                </Card>

                <View className="flex-row justify-end gap-2 mt-4">
                    <Button variant="outline" onPress={() => onOpenChange(false)}>
                        <Text>Close</Text>
                    </Button>
                </View>
            </DialogContent>
        </Dialog>
    );
}
