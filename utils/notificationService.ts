import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '../firebaseConfig';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

// VAPID key for web push (you'll need to generate this in Firebase Console)
// Go to: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'; // TODO: Replace with actual VAPID key

/**
 * Request notification permission from the browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Get FCM token for the current device
 */
export async function getFCMToken(userId: string): Promise<string | null> {
    try {
        const messaging = getMessagingInstance();
        if (!messaging) {
            console.log('Messaging not supported in this browser');
            return null;
        }

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
            console.log('FCM Token obtained:', token);
            // Save token to Firestore
            await saveFCMToken(userId, token);
            return token;
        } else {
            console.log('No registration token available');
            return null;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

/**
 * Save FCM token to Firestore
 */
async function saveFCMToken(userId: string, token: string): Promise<void> {
    try {
        // Check if token already exists for this user
        const tokensRef = collection(db, 'user_tokens');
        const q = query(tokensRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Update existing token
            const doc = querySnapshot.docs[0];
            await updateDoc(doc.ref, {
                fcmToken: token,
                lastUsed: serverTimestamp(),
            });
            console.log('FCM token updated in Firestore');
        } else {
            // Create new token record
            await addDoc(tokensRef, {
                userId: userId,
                fcmToken: token,
                createdAt: serverTimestamp(),
                lastUsed: serverTimestamp(),
            });
            console.log('FCM token saved to Firestore');
        }
    } catch (error) {
        console.error('Error saving FCM token:', error);
        throw error;
    }
}

/**
 * Set up listener for foreground messages
 */
export function setupForegroundMessageListener(callback: (payload: any) => void): void {
    const messaging = getMessagingInstance();
    if (!messaging) {
        console.log('Messaging not supported, skipping foreground listener');
        return;
    }

    onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);

        // Show browser notification if permission is granted
        if (Notification.permission === 'granted' && payload.notification) {
            new Notification(payload.notification.title || 'New Notification', {
                body: payload.notification.body,
                icon: payload.notification.icon || '/favicon.ico',
            });
        }
    });
}

/**
 * Check if notifications are supported and enabled
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window && getMessagingInstance() !== null;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    return Notification.permission;
}
