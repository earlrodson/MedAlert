import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { addMedication } from '@/lib/database';
import * as React from 'react';
import { Alert, ScrollView, View } from 'react-native';

interface AddMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMedicationAdded?: () => void;
}

export function AddMedicationModal({ open, onOpenChange, onMedicationAdded }: AddMedicationModalProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    time: '08:00',
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter medication name');
      return;
    }
    if (!formData.dosage.trim()) {
      Alert.alert('Validation Error', 'Please enter dosage');
      return;
    }

    try {
      setIsSubmitting(true);
      await addMedication({
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency,
        time: formData.time,
        instructions: formData.instructions.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      });

      Alert.alert('Success', 'Medication added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        dosage: '',
        frequency: 'Once daily',
        time: '08:00',
        instructions: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });

      onOpenChange(false);
      onMedicationAdded?.();
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', 'Failed to add medication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Medication</DialogTitle>
          <DialogDescription>
            Enter the details of your medication below.
          </DialogDescription>
        </DialogHeader>
        <ScrollView className="max-h-96">
          <View className="gap-4 py-4">
            {/* Medication Name */}
            <View className="gap-2">
              <Label nativeID="name">Medication Name *</Label>
              <Input
                placeholder="e.g., Lisinopril"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                aria-labelledby="name"
              />
            </View>

            {/* Dosage */}
            <View className="gap-2">
              <Label nativeID="dosage">Dosage *</Label>
              <Input
                placeholder="e.g., 10mg"
                value={formData.dosage}
                onChangeText={(text) => setFormData({ ...formData, dosage: text })}
                aria-labelledby="dosage"
              />
            </View>

            {/* Frequency */}
            <View className="gap-2">
              <Label nativeID="frequency">Frequency</Label>
              <Input
                placeholder="e.g., Once daily, Twice daily"
                value={formData.frequency}
                onChangeText={(text) => setFormData({ ...formData, frequency: text })}
                aria-labelledby="frequency"
              />
            </View>

            {/* Time */}
            <View className="gap-2">
              <Label nativeID="time">Time</Label>
              <Input
                placeholder="HH:MM (e.g., 08:00)"
                value={formData.time}
                onChangeText={(text) => setFormData({ ...formData, time: text })}
                aria-labelledby="time"
              />
              <Text className="text-xs text-muted-foreground">
                Use 24-hour format (e.g., 14:30 for 2:30 PM)
              </Text>
            </View>

            {/* Start Date */}
            <View className="gap-2">
              <Label nativeID="startDate">Start Date</Label>
              <Input
                placeholder="YYYY-MM-DD"
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                aria-labelledby="startDate"
              />
            </View>

            {/* End Date */}
            <View className="gap-2">
              <Label nativeID="endDate">End Date (Optional)</Label>
              <Input
                placeholder="YYYY-MM-DD"
                value={formData.endDate}
                onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                aria-labelledby="endDate"
              />
            </View>

            {/* Instructions */}
            <View className="gap-2">
              <Label nativeID="instructions">Instructions (Optional)</Label>
              <Textarea
                placeholder="e.g., Take with food"
                value={formData.instructions}
                onChangeText={(text) => setFormData({ ...formData, instructions: text })}
                aria-labelledby="instructions"
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <Button onPress={handleSubmit} disabled={isSubmitting}>
            <Text>{isSubmitting ? 'Adding...' : 'Add Medication'}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
