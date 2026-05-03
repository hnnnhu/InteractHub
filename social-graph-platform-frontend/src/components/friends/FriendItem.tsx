// src/components/friends/FriendItem.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserX, Loader2, MoreHorizontal } from 'lucide-react';
import type { FriendshipResponseDto } from '../../types/friendship';
import useFriendshipActions from '../../hooks/useFriendshipActions';

interface FriendItemProps {
    friend: FriendshipResponseDto;
    currentUserId: string;
    onUnfriendSuccess: (friendId: string) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, currentUserId, onUnfriendSuccess }) => {
    const { unfriend, isMutating } = useFriendshipActions();

    // Xác định thông tin của "người kia"
    const isRequester = friend.requesterId === currentUserId;
    const targetId = isRequester ? friend.addresseeId : friend.requesterId;
    const targetName = isRequester ? friend.addresseeFullName : friend.requesterFullName;
    const targetUsername = isRequester ? friend.addresseeUserName : friend.requesterUserName;
    const targetAvatar = isRequester ? friend.addresseeAvatarUrl : friend.requesterAvatarUrl;

    const handleUnfriend = () => {
        if (window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${targetName}?`)) {
            unfriend(targetId, () => onUnfriendSuccess(targetId));
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center gap-4">
                <Link to={`/profile/${targetUsername}`}>
                    <img
                        src={targetAvatar || '/default-avatar.png'}
                        alt={targetName}
                        className="w-14 h-14 rounded-full object-cover border border-white/10"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                    />
                </Link>
                <div>
                    <Link to={`/profile/${targetUsername}`} className="hover:underline">
                        <h4 className="text-white font-semibold">{targetName}</h4>
                    </Link>
                    <p className="text-sm text-gray-400">@{targetUsername}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2.5 bg-[#4F6BFF]/10 hover:bg-[#4F6BFF]/20 text-[#4F6BFF] rounded-xl transition-colors" title="Nhắn tin">
                    <MessageCircle size={18} />
                </button>

                <div className="relative group">
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl transition-colors">
                        {isMutating ? <Loader2 size={18} className="animate-spin" /> : <MoreHorizontal size={18} />}
                    </button>
                    {/* Dropdown Menu Đơn giản */}
                    <div className="absolute right-0 mt-2 w-40 bg-[#1A1F2E] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                            onClick={handleUnfriend}
                            disabled={isMutating}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                        >
                            <UserX size={16} /> Hủy kết bạn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendItem;