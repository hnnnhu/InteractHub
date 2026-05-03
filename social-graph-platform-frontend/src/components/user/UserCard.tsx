// src/components/user/UserCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import FriendshipButton from './FriendshipButton';
import type { UserSummaryDto } from '../../types/user';

interface UserCardProps {
    user: UserSummaryDto;
    onFriendAction?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onFriendAction }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/profile/${user.userName}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#FF1493]/30 rounded-2xl cursor-pointer transition-all duration-300 ease-out hover:shadow-[0_8px_30px_rgba(255,20,147,0.15)] hover:-translate-y-1"
            role="button"
            tabIndex={0}
        >
            {/* Left Side: Avatar & Info */}
            <div className="flex items-center gap-4 overflow-hidden">
                <UserAvatar
                    userName={user.userName}
                    fullName={user.fullName}
                    avatarUrl={user.avatarUrl}
                    size="md"
                    disableLink // Vô hiệu hóa link vì cả card đã có onClick
                />

                <div className="flex flex-col min-w-0">
                    <span className="font-bold text-white text-[16px] truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#FF1493] group-hover:to-[#4F6BFF] transition-all duration-300">
                        {user.fullName}
                    </span>
                    <span className="text-gray-400 text-[13px] font-medium truncate">
                        @{user.userName}
                    </span>
                </div>
            </div>

            {/* Right Side: Action Button */}
            <div className="ml-4 shrink-0">
                <FriendshipButton
                    targetUserId={user.id}
                    isFriend={user.isFriend}
                    status={user.friendshipStatus}
                    // Lưu ý: Search list thường không có friendshipId, 
                    // nên nếu user bấm Hủy Lời Mời, ta sẽ báo họ vào trang Profile.
                    onAction={() => onFriendAction && onFriendAction(user.id)}
                />
            </div>
        </div>
    );
};

export default React.memo(UserCard);