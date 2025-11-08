import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medication } from '@/components/upcoming-reminders';


// Request notification permissions
export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);

  return token;
}

// Schedule a notification for a medication
export async function scheduleMedicationNotification(medication: Medication) {
    const medTimeParts = medication.time.match(/(\d+):(\d+)\s*(AM|PM)/);

    if (!medTimeParts) {
        return; // Skip medications with invalid time format
    }

    let hours = parseInt(medTimeParts[1], 10);
    const minutes = parseInt(medTimeParts[2], 10);
    const ampm = medTimeParts[3];

    if (ampm === 'PM' && hours < 12) {
        hours += 12;
    }
    if (ampm === 'AM' && hours === 12) {
        hours = 0; // Midnight case
    }

    // Platform-specific trigger configuration
    const trigger = Platform.OS === 'android' 
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
          repeats: true,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for your medication!',
        body: `Don't forget to take ${medication.name} (${medication.dosage}).`,
      },
      trigger,
    });
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedule a test notification to fire in 5 seconds
export async function scheduleTestNotification() {
  console.log('Scheduling a test notification in 5 seconds...');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test notification from MedAlert!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
  console.log('Test notification scheduled.');
}

// Schedule notifications for all pending medications
export async function scheduleAllPendingMedications(medications: Medication[]) {
    await cancelAllNotifications(); // Clear existing notifications
    for (const med of medications) {
        if (!med.taken) {
            await scheduleMedicationNotification(med);
        }
    }
}
