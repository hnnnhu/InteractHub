import type { BlockedUserInfo } from '../../types/block';

interface BlockedUserItemProps {
    user: BlockedUserInfo;
    onUnblock: (userId: string) => void;
    isUnblocking: boolean;
}

export default function BlockedUserItem({ user, onUnblock, isUnblocking }: BlockedUserItemProps) {
    const avatarUrl = user.avatarUrl || '/default-avatar.png';
    const displayName = user.fullName || user.userName || 'Người dùng ẩn danh';
    const blockedDate = new Date(user.blockedAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg">
            <div className="flex items-center space-x-3">
                <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    loading="lazy"
                />
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{user.userName}</p>
                    {user.bio && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{user.bio}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Đã chặn từ {blockedDate}
                    </p>
                </div>
            </div>
            <button
                onClick={() => onUnblock(user.blockedId)}
                disabled={isUnblocking}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isUnblocking
                        ? 'bg-gray-100 text-gray-400 cursor-wait dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                    }`}
                title="Bỏ chặn người dùng này"
            >
                {isUnblocking ? 'Đang gỡ...' : 'Bỏ chặn'}
            </button>
        </div>
    );
}