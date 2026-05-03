// src/components/friends/SuggestionCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users, Loader2 } from 'lucide-react';
import type { FriendSuggestionDto } from '../../types/friendship';
import useFriendshipActions from '../../hooks/useFriendshipActions';

interface SuggestionCardProps {
    suggestion: FriendSuggestionDto;
    onAddSuccess: (userId: string) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onAddSuccess }) => {
    const { sendRequest, isMutating } = useFriendshipActions();
    const [imgError, setImgError] = useState(false);

    const handleAddFriend = () => {
        sendRequest(suggestion.userId, () => onAddSuccess(suggestion.userId));
    };

    const avatarUrl = !imgError ? suggestion.avatarUrl : null;
    const fullName = suggestion.fullName || 'Người dùng';
    const userName = suggestion.userName || 'user';
    const avatarFallback = fullName.charAt(0).toUpperCase();

    return (
        <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-2xl p-5 hover:bg-[#252529] transition-colors">
            <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <Link to={`/profile/${userName}`} className="relative mb-4 inline-block">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF1493]/20 to-[#4F6BFF]/20 p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#1C1C1E] flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="text-[#FF1493] font-bold text-2xl">
                                    {avatarFallback}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* Tên & username */}
                <Link to={`/profile/${userName}`} className="hover:underline decoration-white/50">
                    <h4 className="text-white font-semibold text-base leading-tight line-clamp-1">{fullName}</h4>
                    <p className="text-[#8E8E93] text-sm mt-0.5">@{userName}</p>
                </Link>

                {/* Bạn chung / lý do gợi ý */}
                <div className="flex items-center justify-center gap-1.5 mt-3 mb-5 text-xs text-[#8E8E93] bg-[#252529] px-3 py-1.5 rounded-full">
                    {suggestion.mutualFriendsCount > 0 ? (
                        <>
                            <Users size={14} className="text-[#4F6BFF]" />
                            <span>{suggestion.mutualFriendsCount} bạn chung</span>
                        </>
                    ) : (
                        <span>{suggestion.suggestionReason || 'Gợi ý kết bạn'}</span>
                    )}
                </div>

                {/* Nút thêm bạn */}
                <button
                    onClick={handleAddFriend}
                    disabled={isMutating}
                    className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95 bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white hover:shadow-[0_0_15px_rgba(255,20,147,0.3)] disabled:opacity-70"
                >
                    {isMutating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    Thêm bạn bè
                </button>
            </div>
        </div>
    );
};

export default SuggestionCard;