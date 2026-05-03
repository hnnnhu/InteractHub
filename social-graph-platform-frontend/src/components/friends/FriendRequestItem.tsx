// src/components/friends/FriendRequestItem.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import type { FriendRequestResponseDto } from '../../types/friendship';
import useFriendshipActions from '../../hooks/useFriendshipActions';

interface FriendRequestItemProps {
    request: FriendRequestResponseDto;
    onActionSuccess: (friendshipId: string) => void;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({ request, onActionSuccess }) => {
    const { acceptRequest, rejectRequest, isMutating } = useFriendshipActions();
    const [imgError, setImgError] = useState(false);

    const handleAccept = () => acceptRequest(request.friendshipId, () => onActionSuccess(request.friendshipId));
    const handleReject = () => rejectRequest(request.friendshipId, () => onActionSuccess(request.friendshipId));

    const avatarUrl = !imgError ? request.requesterAvatarUrl : null;
    const fullName = request.requesterFullName || 'Người dùng';
    const userName = request.requesterUserName || 'user';
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
                                <span className="text-[#FF1493] font-bold text-lg">
                                    {avatarFallback}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
                <div className="min-w-0">
                    <Link
                        to={`/profile/${userName}`}
                        className="hover:underline"
                    >
                        <h4 className="text-sm font-semibold text-white truncate">{fullName}</h4>
                    </Link>
                    <p className="text-xs text-[#8E8E93] truncate">@{userName}</p>
                    {request.requesterBio && (
                        <p className="text-xs text-[#6E6E73] mt-1 line-clamp-1">{request.requesterBio}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                    onClick={handleAccept}
                    disabled={isMutating}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#4F6BFF] hover:bg-[#5b75ff] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                >
                    {isMutating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Chấp nhận
                </button>
                <button
                    onClick={handleReject}
                    disabled={isMutating}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#252529] hover:bg-red-500/10 text-[#8E8E93] hover:text-red-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70 border border-white/[0.07]"
                >
                    {isMutating ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    Xóa
                </button>
            </div>
        </div>
    );
};

export default FriendRequestItem;