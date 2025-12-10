import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, NotificationContextType } from '../types';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    writeBatch,
} from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children?: ReactNode }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Real-time listener for user's notifications
    useEffect(() => {
        if (!currentUser || !currentUser.email) {
            setNotifications([]);
            return;
        }

        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', currentUser.email),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const notifs: Notification[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as Notification));
                setNotifications(notifs);
                console.log(`Loaded ${notifs.length} notifications for ${currentUser.email}`);
            },
            (error: any) => {
                console.error('Error loading notifications:', error);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = async (id: string) => {
        try {
            const notifRef = doc(db, 'notifications', id);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            const unreadNotifs = notifications.filter((n) => !n.read);

            unreadNotifs.forEach((notif) => {
                const notifRef = doc(db, 'notifications', notif.id);
                batch.update(notifRef, { read: true });
            });

            await batch.commit();
            console.log(`Marked ${unreadNotifs.length} notifications as read`);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const clearNotification = async (id: string) => {
        try {
            const notifRef = doc(db, 'notifications', id);
            await deleteDoc(notifRef);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                clearNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
