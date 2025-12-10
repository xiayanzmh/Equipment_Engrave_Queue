import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, clearNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = (notificationId: string) => {
        markAsRead(notificationId);
    };

    const handleClearNotification = (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        clearNotification(notificationId);
    };

    const formatTime = (timestamp: any): string => {
        if (!timestamp) return '';

        let date: Date;
        if (timestamp.toDate) {
            // Firestore Timestamp
            date = timestamp.toDate();
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return '';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-slate-500">{unreadCount} unread</span>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${notification.read ? 'opacity-60' : 'bg-blue-50/30'
                                            }`}
                                        onClick={() => handleNotificationClick(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {notification.type === 'order_completed' && (
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                        <Check className="w-4 h-4 text-green-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 text-sm">{notification.title}</p>
                                                <p className="text-slate-600 text-xs mt-1">{notification.message}</p>
                                                <p className="text-slate-400 text-xs mt-2">{formatTime(notification.createdAt)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleClearNotification(e, notification.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                                                title="Clear notification"
                                            >
                                                <X className="w-4 h-4 text-slate-500" />
                                            </button>
                                        </div>
                                        {!notification.read && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center">
                            <a
                                href="/?tab=history"
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1"
                            >
                                View Order History <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
