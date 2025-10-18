// app/lib/notifications.ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Appearance, ColorSchemeName, Platform } from 'react-native';
import { getCurrentUserId, getFCMToken, onFCMMessage, saveDocument, updateDocument } from './firebase';
// ====================
// NOTIFICATION TYPES
// ====================

export interface NotificationToken {
  id?: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  type: 'expo' | 'fcm';
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface NotificationMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  channelId?: string;
}

// ====================
// NOTIFICATION CONFIGURATION
// ====================

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({

    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Configure dark-mode aware channels and categories
async function configureNotificationUX(colorScheme: ColorSchemeName) {
  try {
    const isDark = colorScheme === 'dark';

    // Android channels
    if (Platform.OS === 'android') {
      const lightColor = isDark ? '#80D8FF' : '#007AFF';

      await Notifications.setNotificationChannelAsync('aura-daily', {
        name: 'Aura Daily',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lightColor,
        vibrationPattern: [0, 200, 150, 200],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      await Notifications.setNotificationChannelAsync('aura-habits', {
        name: 'Aura Habits',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lightColor,
        vibrationPattern: [0, 150, 100, 150],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // iOS/Android categories with actions
    await Notifications.setNotificationCategoryAsync('AURA_DAILY', [
      {
        identifier: 'VIEW_PLAN',
        buttonTitle: 'View plan',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'SNOOZE_15',
        buttonTitle: 'Snooze 15 min',
      },
    ]);
  } catch (e) {
    console.warn('Notification UX configuration failed:', e);
  }
}

// ====================
// PERMISSION FUNCTIONS
// ====================

/**
 * Request notification permissions
 * @returns Promise<boolean> - Whether permissions were granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // For web, we'll use FCM which handles permissions differently
      return true;
    }

    if (!Device.isDevice) {
      console.log('❌ Must use physical device for push notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
 
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // After permission, configure UX with current scheme
    await configureNotificationUX(Appearance.getColorScheme());
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// ====================
// TOKEN MANAGEMENT
// ====================

/**
 * Register for push notifications and get token
 * @returns Promise<string | null> - Push token or null if failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
      console.log('❌ No permission to register for push notifications');
      return null;
    }

    if (Platform.OS === 'web') {
      // Use FCM for web
      return await getFCMToken();
    } else {
      // Use Expo Push Notifications for mobile
      const projectId =
        (Constants.expoConfig as any)?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        undefined;
      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } as any : undefined
      );
      
      return tokenResponse.data;
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save notification token to user profile
 * @param token - Push notification token
 * @param userId - User ID (optional, defaults to current user)
 * @returns Promise<void>
 */
export async function saveNotificationToken(
  token: string,
  userId?: string
): Promise<void> {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');

    const tokenData: NotificationToken = {
      userId: uid,
      token,
      platform: Platform.OS as 'ios' | 'android' | 'web',
      type: Platform.OS === 'web' ? 'fcm' : 'expo',
      active: true,
    };

    // Save token to user's notification tokens collection
    await saveDocument(`users/${uid}/notificationTokens`, tokenData);
    
    // Also update user profile with latest token info
    await updateDocument('users', uid, {
      pushToken: token,
      pushTokenPlatform: Platform.OS,
      pushTokenActive: true,
      pushTokenUpdatedAt: new Date(),
    });

    console.log('✅ Notification token saved successfully');
  } catch (error) {
    console.error('❌ Error saving notification token:', error);
    throw error;
  }
}

/**
 * Register push notifications and save token
 * @param userId - User ID (optional, defaults to current user)
 * @returns Promise<string | null> - Token if successful, null otherwise
 */
export async function registerPushAndActivate(userId?: string): Promise<string | null> {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');

    const token = await registerForPushNotifications();
    if (!token) {
      // Mark user as inactive for notifications
      await updateDocument('users', uid, { 
        pushTokenActive: false,
        pushTokenUpdatedAt: new Date(),
      });
      return null;
    }

    await saveNotificationToken(token, uid);
    return token;
  } catch (error) {
    console.error('❌ Error registering push notifications:', error);
    return null;
  }
}

/**
 * Toggle notification active status
 * @param active - Whether notifications should be active
 * @param userId - User ID (optional, defaults to current user)
 * @returns Promise<void>
 */
export async function toggleNotificationActive(
  active: boolean,
  userId?: string
): Promise<void> {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) throw new Error('User not authenticated');

    await updateDocument('users', uid, { 
      notifications: active,
      pushTokenUpdatedAt: new Date(),
    });

    console.log(`✅ Notifications ${active ? 'enabled' : 'disabled'} for user ${uid}`);
  } catch (error) {
    console.error('❌ Error toggling notification status:', error);
    throw error;
  }
}

// ====================
// MESSAGE HANDLING
// ====================

/**
 * Set up notification message listeners
 * @param onNotificationReceived - Callback for when notification is received
 * @param onNotificationTapped - Callback for when notification is tapped
 * @returns Object with unsubscribe functions
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (notification: Notifications.NotificationResponse) => void
) {
  const listeners: any[] = [];

  if (Platform.OS === 'web') {
    // Set up FCM message listener for web
    const unsubscribeFCM = onFCMMessage((payload) => {
      console.log('FCM message received:', payload);
      
      // Convert FCM payload to notification format
      const notification: Notifications.Notification = {
        request: {
          content: {
            title: payload.notification?.title || 'Notification',
            subtitle: null,
            body: payload.notification?.body || '',
            data: payload.data || {},
            categoryIdentifier: null,
            sound: 'default',
          },
          identifier: payload.messageId || Date.now().toString(),
          trigger: null,
        },
        date: Date.now(),
      };

      onNotificationReceived?.(notification);
    });

    listeners.push(unsubscribeFCM);
  } else {
    // Set up Expo notification listeners for mobile
    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        onNotificationTapped?.(response);
      }
    );

    listeners.push(receivedListener, responseListener);
  }

  // Return unsubscribe function
  return () => {
    listeners.forEach(unsubscribe => unsubscribe());
  };
}

// ====================
// NOTIFICATION SCHEDULING
// ====================

/**
 * Schedule a local notification
 * @param notification - Notification content
 * @param trigger - When to show the notification
 * @returns Promise<string> - Notification ID
 */
export async function scheduleLocalNotification(
  notification: NotificationMessage,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { ...(notification.data || {}), categoryIdentifier: 'AURA_DAILY' },
        sound: notification.sound !== false,
        badge: notification.badge,
        categoryIdentifier: 'AURA_DAILY',
      },
      trigger: trigger || null,
    });

    console.log('✅ Local notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling local notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 * @param notificationId - Notification ID to cancel
 * @returns Promise<void>
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('✅ Notification cancelled:', notificationId);
  } catch (error) {
    console.error('❌ Error cancelling notification:', error);
    throw error;
  }
}

/**
 * Cancel all scheduled notifications
 * @returns Promise<void>
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
    throw error;
  }
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get all scheduled notifications
 * @returns Promise<Notifications.NotificationRequest[]>
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Check if notifications are enabled
 * @returns Promise<boolean>
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return 'Notification' in window && Notification.permission === 'granted';
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ Error checking notification status:', error);
    return false;
  }
}

// ====================
// EXPORTS
// ====================

/**
 * Initialize notifications (convenience function)
 */
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    const token = await registerPushAndActivate();
    return token !== null;
  } catch (error) {
    console.error('❌ Error initializing notifications:', error);
    return false;
  }
};

export default {
  // Permissions
  requestNotificationPermissions,
  
  // Token Management
  registerForPushNotifications,
  saveNotificationToken,
  registerPushAndActivate,
  toggleNotificationActive,
  initializeNotifications,
  
  // Message Handling
  setupNotificationListeners,
  
  // Local Notifications
  scheduleLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  
  // Utilities
  areNotificationsEnabled,
};
