// components/notification/NotificationList.tsx
import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useMarkAsRead } from '../../hooks/useMarkAsRead';
import NotificationItem from './NotificationItem';
import MarkAllReadButton from './MarkAllReadButton';
import type { NotificationResponseDto } from '../../types/notification';

interface NotificationListProps {
    typeFilter?: number;
    unreadOnly?: boolean;
    onNotificationClick?: (notification: NotificationResponseDto) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
    typeFilter,
    unreadOnly,
    onNotificationClick,
}) => {
    const { notifications, loading, error, hasMore, loadMore, refresh } = useNotifications({
        typeFilter,
        unreadOnly,
    });
    const { markAsRead, markAllAsRead } = useMarkAsRead();

    console.log('NotificationList - notifications:', notifications.length, 'loading:', loading, 'error:', error);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead([id]);
        refresh();
    };

    const handleMarkAll = async (): Promise<boolean> => {
        const success = await markAllAsRead();
        if (success) refresh();
        return success;
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16 px-4 text-red-600">
                <p className="mb-4 text-lg font-medium">Không tải được thông báo</p>
                <p className="mb-6 text-sm">{error}</p>
                <button
                    onClick={refresh}
                    className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium"
                >
                    Thử tải lại
                </button>
                <p className="mt-4 text-xs text-gray-500">Kiểm tra backend có chạy và có endpoint /api/notifications không?</p>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                <div className="mx-auto mb-6 text-6xl">🔔</div>
                <p className="text-xl">Chưa có thông báo nào</p>
                <p className="mt-2 text-sm">Khi có hoạt động mới, thông báo sẽ xuất hiện tại đây.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 text-sm">Thông báo</h3>
                <MarkAllReadButton onMarkAll={handleMarkAll} />
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
                {notifications.map((notif) => (
                    <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onMarkAsRead={handleMarkAsRead}
                        onClick={onNotificationClick}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="p-4 text-center border-t border-gray-100">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="w-full py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-medium disabled:opacity-50"
                    >
                        {loading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationList;