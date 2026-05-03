import { useState } from 'react';
import { useBlockActions } from '../../hooks/useBlockActions';
import { useBlockStatus } from '../../hooks/useBlockStatus';

interface BlockButtonProps {
    targetUserId: string;
    className?: string;
    onSuccess?: () => void;
}

export default function BlockButton({ targetUserId, className = '', onSuccess }: BlockButtonProps) {
    const { blockUser, unblockUser, isBlocking, isUnblocking, error } = useBlockActions();
    const { isBlockedByMe, isLoading: isStatusLoading } = useBlockStatus(targetUserId);
    const [actionError, setActionError] = useState<string | null>(null);

    const isMutating = isBlocking || isUnblocking;
    const isLoading = isStatusLoading || isMutating;

    const handleToggle = async () => {
        setActionError(null);
        try {
            if (isBlockedByMe) {
                await unblockUser(targetUserId);
            } else {
                await blockUser(targetUserId);
            }
            onSuccess?.();
        } catch (err) {
            setActionError(err.message || 'Thao tác thất bại');
        }
    };

    const buttonText = isMutating ? 'Đang xử lý...' : isBlockedByMe ? 'Bỏ chặn' : 'Chặn';
    const baseStyle = `px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${isLoading ? 'opacity-60 cursor-wait' : 'hover:opacity-90'
        }`;
    const blockStyle = isBlockedByMe
        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600';

    return (
        <div className={className}>
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`${baseStyle} ${blockStyle}`}
                title={isBlockedByMe ? 'Nhấn để bỏ chặn người dùng này' : 'Nhấn để chặn người dùng này'}
            >
                {buttonText}
            </button>
            {actionError && (
                <p className="text-xs text-red-500 mt-1">{actionError}</p>
            )}
            {error && !actionError && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
        </div>
    );
}