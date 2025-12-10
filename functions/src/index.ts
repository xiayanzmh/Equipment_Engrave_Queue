import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get Firestore instance for the 'customer-orders' database
const db = admin.firestore();
db.settings({ databaseId: 'customer-orders' });

/**
 * Cloud Function triggered when a document in the 'queue' collection is updated.
 * Sends push notifications and creates in-app notifications when order status changes to 'completed'.
 */
export const onOrderStatusChange = functions.firestore
    .document('queue/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const orderId = context.params.orderId;

        // Only trigger when status changes to 'completed'
        if (before.status !== 'completed' && after.status === 'completed') {
            console.log(`Order ${orderId} completed for ${after.email}`);

            try {
                // 1. Create in-app notification
                await createInAppNotification(orderId, after);

                // 2. Send push notification (if user has FCM token)
                await sendPushNotification(orderId, after);

                console.log(`Notifications sent successfully for order ${orderId}`);
            } catch (error) {
                console.error(`Error sending notifications for order ${orderId}:`, error);
            }
        }

        return null;
    });

/**
 * Creates an in-app notification record in Firestore
 */
async function createInAppNotification(orderId: string, orderData: any) {
    const notification = {
        userId: orderData.email,
        orderId: orderId,
        type: 'order_completed',
        title: 'Order Complete! 🎉',
        message: `Your ${orderData.type} ${orderData.item} engraving is ready${orderData.engravingText ? ` - "${orderData.engravingText}"` : ''
            }`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('notifications').add(notification);
    console.log(`In-app notification created for ${orderData.email}`);
}

/**
 * Sends push notification via FCM if user has registered token
 */
async function sendPushNotification(orderId: string, orderData: any) {
    // Query for user's FCM token
    const tokenSnapshot = await db
        .collection('user_tokens')
        .where('userId', '==', orderData.email)
        .limit(1)
        .get();

    if (tokenSnapshot.empty) {
        console.log(`No FCM token found for ${orderData.email}, skipping push notification`);
        return;
    }

    const fcmToken = tokenSnapshot.docs[0].data().fcmToken;

    // Prepare notification payload
    const payload = {
        notification: {
            title: 'Order Complete! 🎉',
            body: `Your ${orderData.type} ${orderData.item} engraving is ready!`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `order-${orderId}`,
            requireInteraction: false,
        },
        data: {
            orderId: orderId,
            type: 'order_completed',
            url: '/?tab=history',
        },
        token: fcmToken,
    };

    try {
        const response = await admin.messaging().send(payload);
        console.log(`Push notification sent successfully to ${orderData.email}:`, response);

        // Update last used timestamp for the token
        await tokenSnapshot.docs[0].ref.update({
            lastUsed: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error: any) {
        console.error(`Failed to send push notification to ${orderData.email}:`, error);

        // If token is invalid, delete it from database
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            console.log(`Removing invalid FCM token for ${orderData.email}`);
            await tokenSnapshot.docs[0].ref.delete();
        }
    }
}
