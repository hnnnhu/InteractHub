// src/components/user/FriendshipButton.tsx
import React, { useState } from 'react';
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react';
import friendshipApi from '../../api/friendshipApi';
import { FriendshipStatus } from '../../types/user';

export interface FriendshipButtonProps {
    targetUserId: string;
    isFriend?: boolean;
    status?: FriendshipStatus | null;
    friendshipId?: string | null; // Cần khi muốn Hủy lời mời đang chờ
    onAction?: () => void;
    className?: string;
}

const FriendshipButton: React.FC<FriendshipButtonProps> = ({
    targetUserId,
    isFriend = false,
    status = null,
    friendshipId,
    onAction,
    className = ''
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Xử lý các action gọi API
    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Ngăn sự kiện click nổi bọt lên UserCard
        if (isLoading) return;

        setIsLoading(true);
        try {
            if (isFriend || status === FriendshipStatus.Accepted) {
                // Hủy kết bạn
                if (window.confirm('Bạn có chắc chắn muốn hủy kết bạn?')) {
                    await friendshipApi.unfriend(targetUserId);
                    if (onAction) onAction();
                }
            } else if (status === FriendshipStatus.Pending) {
                // Hủy lời mời (Yêu cầu phải có friendshipId)
                if (friendshipId) {
                    await friendshipApi.cancelRequest(friendshipId);
                    if (onAction) onAction();
                } else {
                    // Nếu card không có friendshipId (như ở Search), thông báo người dùng
                    alert('Vui lòng vào trang cá nhân của người này để quản lý lời mời.');
                }
            } else {
                // Gửi lời mời kết bạn
                await friendshipApi.sendRequest({ addresseeId: targetUserId });
                if (onAction) onAction();
            }
        } catch (error) {
            console.error("Lỗi thao tác kết bạn:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Xác định Giao diện (Màu sắc, Text, Icon) dựa trên trạng thái
    const getButtonConfig = () => {
        if (isLoading) {
            return {
                text: 'Đang xử lý...',
                icon: Loader2,
                style: 'bg-white/10 text-gray-400 cursor-not-allowed',
                iconStyle: 'animate-spin'
            };
        }

        // Đã là bạn bè
        if (isFriend || status === FriendshipStatus.Accepted) {
            return {
                text: isHovered ? 'Hủy kết bạn' : 'Bạn bè',
                icon: isHovered ? UserX : UserCheck,
                style: isHovered
                    ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                    : 'bg-white/10 text-white border border-white/10',
                iconStyle: ''
            };
        }

        // Đang chờ chấp nhận (Đã gửi lời mời)
        if (status === FriendshipStatus.Pending) {
            return {
                text: (isHovered && friendshipId) ? 'Hủy lời mời' : 'Đã gửi',
                icon: (isHovered && friendshipId) ? UserX : Clock,
                style: isHovered
                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                    : 'bg-white/10 text-gray-300 border border-white/10',
                iconStyle: ''
            };
        }

        // Mặc định: Chưa kết bạn
        return {
            text: 'Kết bạn',
            icon: UserPlus,
            style: 'bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white shadow-[0_0_15px_rgba(255,20,147,0.3)] hover:scale-105 border border-transparent',
            iconStyle: ''
        };
    };

    const config = getButtonConfig();
    const Icon = config.icon;

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-[13px] transition-all duration-300 ${config.style} ${className}`}
        >
            <Icon size={16} className={config.iconStyle} />
            <span className="hidden sm:inline transition-colors duration-300">{config.text}</span>
        </button>
    );
};

export default FriendshipButton;