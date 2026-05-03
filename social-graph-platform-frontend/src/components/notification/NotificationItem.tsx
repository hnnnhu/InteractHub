// components/notification/NotificationItem.tsx

import React from 'react';
import type { NotificationResponseDto } from '../../types/notification';
import { getNotificationTypeIcon } from '../../types/notification';

interface NotificationItemProps {
    notification: NotificationResponseDto;
    onMarkAsRead: (id: string) => void;
    onClick?: (notification: NotificationResponseDto) => void;
    className?: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onClick,
    className = '',
}) => {
    const {
        id,
        triggeredByAvatarUrl,
        triggeredByFullName,
        triggeredByUserName,
        content,
        type,
        timeAgo,
        isRead,
        groupedCount,
    } = notification;

    const displayName = triggeredByFullName || triggeredByUserName || 'Hệ thống';

    const handleClick = () => {
        if (!isRead) {
            onMarkAsRead(id);
        }
        onClick?.(notification);
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-start p-4 cursor-pointer transition-colors duration-200 border-b border-gray-100 
        hover:bg-gray-50 ${!isRead ? 'bg-blue-50/40' : 'bg-white'} ${className}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            {/* Avatar / Icon */}
            <div className="flex-shrink-0 mr-4">
                {triggeredByAvatarUrl ? (
                    <img
                        src={triggeredByAvatarUrl}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <span className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl shadow-sm">
                        {getNotificationTypeIcon(type)}
                    </span>
                )}
            </div>

            {/* Nội dung */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                        {groupedCount > 1 && (
                            <span className="font-bold text-blue-600">{groupedCount} người </span>
                        )}
                        {displayName}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{timeAgo}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 break-words leading-relaxed">{content}</p>
            </div>

            {/* Chỉ báo chưa đọc */}
            {!isRead && (
                <div className="flex-shrink-0 ml-3 mt-1">
                    <span className="block w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-blue-100" />
                </div>
            )}
        </div>
    );
};

export default NotificationItem;