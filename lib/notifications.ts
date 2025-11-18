import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Medication } from '@/components/upcoming-reminders';
import { logger, withRetry, CircuitBreaker } from '@/lib/error-handling';
import { TimeUtils } from '@/lib/time-utils';


// Request notification permissions with Expo Go compatibility
export async function registerForPushNotificationsAsync() {
  try {
    // Check if running in Expo Go - push notifications are not supported
    if (Constants.appOwnership === 'expo') {
      logger.info('Running in Expo Go - skipping push notification registration', {}, 'Notifications');
      return null;
    }

    // Set notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Push notification permissions not granted', { finalStatus }, 'Notifications');
      return null;
    }

    // Get push token with error handling
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    logger.info('Push notification token registered successfully', {
      tokenLength: token.length,
      platform: Platform.OS
    }, 'Notifications');

    return token;
  } catch (error) {
    logger.warn('Failed to register for push notifications',
      error instanceof Error ? error : new Error(String(error)),
      { platform: Platform.OS, appOwnership: Constants.appOwnership },
      'Notifications'
    );
    return null;
  }
}

// Schedule a notification for a medication
export async function scheduleMedicationNotification(medication: Medication) {
    // Use robust time parsing instead of fragile regex
    const timeResult = TimeUtils.parseTime(medication.time);

    if (!timeResult.success) {
        logger.warn('Invalid medication time format, skipping notification',
          {
            medication: medication.name,
            time: medication.time,
            error: timeResult.error
          }, 'Notifications');
        return; // Skip medications with invalid time format
    }

    const hours = timeResult.hour24;
    const minutes = timeResult.minute;

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

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for your medication!',
        body: `Don't forget to take ${medication.name} (${medication.dosage}).`,
      },
      trigger,
    });

    logger.debug('Medication notification scheduled',
      { medicationId: medication.id, notificationId, time: medication.time },
      'Notifications');
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedule a test notification to fire in 5 seconds
export async function scheduleTestNotification() {
  try {
    // Check if running in Expo Go - notifications are limited
    if (Constants.appOwnership === 'expo') {
      logger.info('Test notification skipped - running in Expo Go', {}, 'Notifications');
      return null;
    }

    logger.info('Scheduling a test notification in 5 seconds...', {}, 'Notifications');
    const notificationId = await Notifications.scheduleNotificationAsync({
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
    logger.info('Test notification scheduled successfully', { notificationId }, 'Notifications');
    return notificationId;
  } catch (error) {
    logger.warn('Failed to schedule test notification', error instanceof Error ? error : new Error(String(error)),
      { error }, 'Notifications');
    return null;
  }
}

// Schedule notifications for all pending medications
export async function scheduleAllPendingMedications(medications: Medication[]) {
    try {
        // Skip notification scheduling in Expo Go
        if (Constants.appOwnership === 'expo') {
            logger.info('Notification scheduling skipped - running in Expo Go',
              { medicationCount: medications.length }, 'Notifications');
            return;
        }

        logger.info('Scheduling notifications for pending medications',
          { totalMedications: medications.length, pendingMedications: medications.filter(m => !m.taken).length },
          'Notifications');

        await cancelAllNotifications(); // Clear existing notifications

        let scheduledCount = 0;
        for (const med of medications) {
            if (!med.taken) {
                await scheduleMedicationNotification(med);
                scheduledCount++;
            }
        }

        logger.info('Medication notifications scheduling completed',
          { scheduledCount, skippedCount: medications.length - scheduledCount },
          'Notifications');
    } catch (error) {
        logger.warn('Failed to schedule all pending medications',
          error instanceof Error ? error : new Error(String(error)),
          { medicationCount: medications.length, appOwnership: Constants.appOwnership },
          'Notifications');
        // Don't throw - just log the warning to prevent app crashes
    }
}
