// src/components/friends/SentRequestItem.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserMinus, Loader2, Clock } from 'lucide-react';
import type { SentFriendRequestResponseDto } from '../../types/friendship';
import useFriendshipActions from '../../hooks/useFriendshipActions';

interface SentRequestItemProps {
    request: SentFriendRequestResponseDto;
    onCancelSuccess: (friendshipId: string) => void;
}

const SentRequestItem: React.FC<SentRequestItemProps> = ({ request, onCancelSuccess }) => {
    const { cancelRequest, isMutating } = useFriendshipActions();
    const [imgError, setImgError] = useState(false);

    const handleCancel = () => {
        cancelRequest(request.friendshipId, () => onCancelSuccess(request.friendshipId));
    };

    const avatarUrl = !imgError ? request.addresseeAvatarUrl : null;
    const fullName = request.addresseeFullName || 'Người dùng';
    const userName = request.addresseeUserName || 'user';
    const avatarFallback = fullName.charAt(0).toUpperCase();

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#1C1C1E] border border-white/[0.07] rounded-2xl hover:bg-[#252529] transition-colors">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <Link to={`/profile/${userName}`} className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF1493]/20 to-[#4F6BFF]/20 p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#1C1C1E] flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="text-[#4F6BFF] font-bold text-lg">
                                    {avatarFallback}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
                <div className="min-w-0">
                    <Link to={`/profile/${userName}`} className="hover:underline">
                        <h4 className="text-sm font-semibold text-white truncate">{fullName}</h4>
                    </Link>
                    <p className="text-xs text-[#8E8E93] truncate">@{userName}</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-[#6E6E73]">
                        <Clock size={12} />
                        <span>Đã gửi {new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleCancel}
                disabled={isMutating}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium text-sm transition-colors disabled:opacity-70 border border-red-500/20"
            >
                {isMutating ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                <span className="hidden sm:inline">Hủy yêu cầu</span>
            </button>
        </div>
    );
};

export default SentRequestItem;