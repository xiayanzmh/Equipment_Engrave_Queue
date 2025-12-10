// Firebase Cloud Messaging Service Worker
// This runs in the background to handle push notifications when the app is closed

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyDtm-13Eavq9c6zVy1qjB65WyY39SHO6zI",
    authDomain: "gen-lang-client-0550598157.firebaseapp.com",
    projectId: "gen-lang-client-0550598157",
    storageBucket: "gen-lang-client-0550598157.firebasestorage.app",
    messagingSenderId: "641579937846",
    appId: "1:641579937846:web:2fbc2859fd4a4ab9a3e897",
    measurementId: "G-9DCBN2E3S0"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: payload.data?.orderId || 'notification',
        data: {
            url: payload.data?.url || '/?tab=history',
        },
        requireInteraction: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked');
    event.notification.close();

    // Navigate to the URL specified in the notification data
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there is already a window open
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
