# FCM (Firebase Cloud Messaging) Setup Guide

This guide will help you complete the FCM setup for your Aura Wellness Coach app.

## 🎯 What's Already Set Up

✅ **Firebase Configuration**: FCM messaging is configured in `app/lib/firebase.ts`
✅ **Notification Service**: Comprehensive notification management in `app/lib/notifications.ts`
✅ **Helper Functions**: FCM utilities added to `app/lib/firebaseHelpers.ts`
✅ **Notification Service**: High-level notification service in `app/lib/notificationService.ts`
✅ **App Integration**: Notifications initialize automatically when users sign in

## 🔧 Required Configuration Steps

### 1. Firebase Console Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `aura-wellness-coach-d3f9f`
3. **Enable Cloud Messaging**:
   - Go to "Project Settings" → "Cloud Messaging"
   - Note your **Server Key** (you'll need this for backend)

### 2. Web Platform Setup (FCM)

For web notifications, you need to add your VAPID key:

1. **Generate VAPID Key**:
   - In Firebase Console → Project Settings → Cloud Messaging
   - Click "Generate key pair" under "Web configuration"
   - Copy the key pair

2. **Update Firebase Configuration**:
   ```typescript
   // In app/lib/firebase.ts, line 626
   const token = await getToken(messaging, {
     vapidKey: "YOUR_VAPID_KEY_HERE" // Replace with your VAPID key
   })
   ```

### 3. Mobile Platform Setup (Expo Push Notifications)

For mobile notifications, you need to configure Expo:

1. **Update app.config.ts**:
   ```typescript
   export default {
     // ... existing config
     plugins: [
       // ... existing plugins
       [
         "expo-notifications",
         {
           icon: "./assets/images/notification-icon.png",
           color: "#ffffff",
           defaultChannel: "default",
         },
       ],
     ],
   };
   ```

2. **Add notification icon** (optional but recommended):
   - Create `assets/images/notification-icon.png` (24x24px, white icon on transparent background)

### 4. Backend Setup (Optional but Recommended)

To send push notifications from your backend, you'll need:

1. **Install Firebase Admin SDK**:
   ```bash
   npm install firebase-admin
   ```

2. **Create service account**:
   - Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file

3. **Backend implementation example**:
   ```javascript
   const admin = require('firebase-admin');
   const serviceAccount = require('./path/to/serviceAccountKey.json');

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });

   // Send notification
   const message = {
     notification: {
       title: 'Habit Reminder',
       body: 'Time to complete your habit!'
     },
     token: 'USER_FCM_TOKEN', // Get from user's profile
   };

   admin.messaging().send(message);
   ```

## 📱 How to Use

### Basic Usage

```typescript
import { getNotificationService } from './lib/notificationService';

// Initialize (happens automatically on user sign-in)
const service = getNotificationService();
await service.initialize();

// Send a local notification
await service.sendHabitReminder('Drink Water', new Date());

// Send habit completion celebration
await service.sendHabitCompleted('Morning Exercise');

// Send motivational message
await service.sendDailyMotivation('Keep up the great work! 💪');
```

### Advanced Usage

```typescript
import { 
  registerPushAndActivate,
  setupNotificationListeners,
  scheduleLocalNotification 
} from './lib/notifications';

// Register for push notifications
const token = await registerPushAndActivate();

// Set up listeners
const unsubscribe = setupNotificationListeners(
  (notification) => {
    console.log('Notification received:', notification);
  },
  (response) => {
    console.log('Notification tapped:', response);
  }
);

// Schedule a custom notification
await scheduleLocalNotification({
  title: 'Custom Reminder',
  body: 'This is a custom notification',
  data: { customData: 'value' }
}, { seconds: 60 }); // Show in 60 seconds
```

## 🎨 Notification Templates

The app includes pre-built notification templates:

- `HABIT_REMINDER`: Reminds users to complete habits
- `HABIT_COMPLETED`: Celebrates habit completion
- `STREAK_MILESTONE`: Congratulates on streak achievements
- `GOAL_ACHIEVED`: Celebrates goal completion
- `WEIGHT_LOG_REMINDER`: Reminds to log weight
- `DAILY_MOTIVATION`: Sends motivational messages
- `WEEKLY_PROGRESS`: Weekly progress reports
- `APP_UPDATE`: App update notifications

## 🔍 Testing Notifications

### Test Local Notifications

```typescript
import { sendNotification } from './lib/notificationService';

// Test a notification
await sendNotification('DAILY_MOTIVATION', { 
  message: 'Test notification! 🎉' 
});
```

### Test Push Notifications

1. **Get user's FCM token**:
   ```typescript
   import { registerForPushNotifications } from './lib/notifications';
   const token = await registerForPushNotifications();
   console.log('FCM Token:', token);
   ```

2. **Send test notification via Firebase Console**:
   - Go to Firebase Console → Cloud Messaging
   - Click "Send your first message"
   - Enter title and body
   - Paste the FCM token in "Target" → "Single device"

## 🐛 Troubleshooting

### Common Issues

1. **"FCM only available on web platform"**:
   - This is normal for mobile devices
   - Mobile uses Expo Push Notifications instead

2. **"Must use physical device for push notifications"**:
   - Push notifications don't work in simulators
   - Test on a real device

3. **Notifications not showing**:
   - Check notification permissions
   - Verify FCM token is generated
   - Check Firebase project configuration

### Debug Steps

1. **Check console logs**:
   ```typescript
   // Enable debug logging
   console.log('🔔 Notification debug info');
   ```

2. **Verify token generation**:
   ```typescript
   const token = await registerForPushNotifications();
   if (token) {
     console.log('✅ Token generated:', token);
   } else {
     console.log('❌ Token generation failed');
   }
   ```

3. **Check permissions**:
   ```typescript
   import { areNotificationsEnabled } from './lib/notifications';
   const enabled = await areNotificationsEnabled();
   console.log('Notifications enabled:', enabled);
   ```

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Push Notifications](https://reactnative.dev/docs/push-notifications-overview)

## 🚀 Next Steps

1. **Complete VAPID key setup** for web notifications
2. **Test notifications** on both web and mobile
3. **Implement backend** for server-side notifications
4. **Add notification preferences** in user settings
5. **Set up notification analytics** to track engagement

Your FCM setup is now complete! The app will automatically handle notification permissions, token management, and message handling when users sign in.
