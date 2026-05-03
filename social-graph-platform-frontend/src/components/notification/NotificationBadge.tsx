// components/notification/NotificationBadge.tsx

import React from 'react';
import { useUnreadCount } from '../../hooks/useUnreadCount';

interface NotificationBadgeProps {
    onClick?: () => void;
    className?: string;
    pollingInterval?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
    onClick,
    className = '',
    pollingInterval = 30000,
}) => {
    const { unreadCount, loading } = useUnreadCount({ pollingInterval });

    return (
        <button
            onClick={onClick}
            className={`relative inline-flex items-center justify-center p-2 rounded-full transition-colors 
        text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 
        focus-visible:ring-blue-500 ${loading ? 'opacity-60' : ''} ${className}`}
            aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
            disabled={loading}
        >
            {/* Icon chuông */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>

            {/* Badge số lượng chưa đọc */}
            {!loading && unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBadge;