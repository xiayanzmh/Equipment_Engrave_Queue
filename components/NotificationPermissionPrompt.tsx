import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission, getFCMToken } from '../utils/notificationService';
import { useAuth } from '../contexts/AuthContext';

const PROMPT_DISMISSED_KEY = 'notification_prompt_dismissed';

export const NotificationPermissionPrompt = () => {
    const { currentUser } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Only show if:
        // 1. User is logged in
        // 2. Notification permission is 'default' (not granted or denied)
        // 3. User hasn't dismissed the prompt before
        const isDismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);

        if (
            currentUser &&
            Notification.permission === 'default' &&
            !isDismissed
        ) {
            // Show prompt after a short delay so it's not jarring
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();

        if (granted && currentUser?.email) {
            // Get and save FCM token
            await getFCMToken(currentUser.email);
            setShowPrompt(false);
        } else {
            // Permission was denied
            setShowPrompt(false);
            localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    const handleDontAskAgain = () => {
        localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 right-6 max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Stay Updated!</h3>
                            <p className="text-xs opacity-90">Get notified when orders complete</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/80 hover:text-white p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">
                    Enable push notifications to receive instant alerts when your engraving orders are ready!
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={handleEnableNotifications}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        Enable Notifications
                    </button>
                    <button
                        onClick={handleDontAskAgain}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                    >
                        Don't ask again
                    </button>
                </div>
            </div>
        </div>
    );
};
