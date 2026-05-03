// src/pages/FriendsPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    UserPlus,
    Send,
    Sparkles,
    Loader2,
    Star,
    MessageCircle,
    UserX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePendingRequests from '../hooks/usePendingRequests';
import useSentRequests from '../hooks/useSentRequests';
import useFriendSuggestions from '../hooks/useFriendSuggestions';
import useFriends from '../hooks/useFriends';
import useFriendshipActions from '../hooks/useFriendshipActions';
import { useCloseFriendsActions } from '../hooks/useCloseFriendsActions';
import type { FriendshipResponseDto } from '../types/friendship';

// ─── Unified compact user card ─────────────────────────
interface UserCardProps {
    avatarUrl?: string | null;
    fullName: string;
    userName: string;
    contextLine?: string;
    linkTo: string;
    actionButtons: React.ReactNode;
}

const UserCard: React.FC<UserCardProps> = ({
    avatarUrl,
    fullName,
    userName,
    contextLine,
    linkTo,
    actionButtons,
}) => {
    const [imgError, setImgError] = useState(false);
    const resolvedAvatar = !imgError ? avatarUrl : null;
    const fallbackChar = fullName.charAt(0).toUpperCase();

    return (
        <div className="bg-[#1C1C1E] border border-white/[0.07] rounded-2xl p-4 hover:bg-[#252529] transition-colors flex items-center gap-4">
            <Link to={linkTo} className="shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF1493]/20 to-[#4F6BFF]/20 p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#1C1C1E] flex items-center justify-center overflow-hidden">
                        {resolvedAvatar ? (
                            <img
                                src={resolvedAvatar}
                                alt={fullName}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <span className="text-[#FF1493] font-bold text-xl">{fallbackChar}</span>
                        )}
                    </div>
                </div>
            </Link>
            <div className="flex-1 min-w-0">
                <Link to={linkTo} className="hover:underline">
                    <p className="text-white font-semibold text-sm truncate">{fullName}</p>
                </Link>
                <p className="text-xs text-[#8E8E93] truncate">@{userName}</p>
                {contextLine && (
                    <p className="text-[11px] text-[#6E6E73] mt-0.5 line-clamp-1">{contextLine}</p>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">{actionButtons}</div>
        </div>
    );
};

// ─── Sub‑component: FriendActions ──────────────────────
const FriendActions: React.FC<{
    friend: FriendshipResponseDto;
    currentUserId: string;
    onUnfriendSuccess: (friendId: string) => void;
}> = ({ friend, currentUserId, onUnfriendSuccess }) => {
    const { unfriend, isMutating } = useFriendshipActions();
    const { addCloseFriend, removeCloseFriend, isAdding, isRemoving } = useCloseFriendsActions();
    const [isCloseFriend, setIsCloseFriend] = useState(friend.isCloseFriend);

    const isRequester = friend.requesterId === currentUserId;
    const targetId = isRequester ? friend.addresseeId : friend.requesterId;

    const toggleCloseFriend = async () => {
        try {
            if (isCloseFriend) {
                await removeCloseFriend(targetId);
                setIsCloseFriend(false);
            } else {
                await addCloseFriend(targetId);
                setIsCloseFriend(true);
            }
        } catch {
            /* không làm gì */
        }
    };

    const handleUnfriend = async () => {
        const targetName = isRequester ? friend.addresseeFullName : friend.requesterFullName;
        if (window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${targetName}?`)) {
            await unfriend(targetId, () => onUnfriendSuccess(targetId));
        }
    };

    return (
        <div style={{ display: 'contents' }}>
            <button
                onClick={toggleCloseFriend}
                disabled={isAdding || isRemoving}
                title={isCloseFriend ? 'Bỏ bạn thân' : 'Thêm bạn thân'}
                className={`p-2 rounded-full transition-colors ${isCloseFriend ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20' : 'text-gray-400 hover:text-amber-400 hover:bg-white/5'}`}
            >
                {isAdding || isRemoving ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} fill={isCloseFriend ? 'currentColor' : 'none'} />}
            </button>
            <button className="p-2 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 rounded-full transition-colors" title="Nhắn tin">
                <MessageCircle size={18} />
            </button>
            <button
                onClick={handleUnfriend}
                disabled={isMutating}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                title="Hủy kết bạn"
            >
                {isMutating ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />}
            </button>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────
const FriendsPage: React.FC = () => {
    const { user } = useAuth();
    const currentUserId = user?.userId || '';

    const [activeTab, setActiveTab] = useState<'suggestions' | 'pending' | 'friends' | 'sent'>('suggestions');

    const pendingHook = usePendingRequests(20);
    const sentHook = useSentRequests(20);
    const { suggestions, isLoading: loadingSuggestions, removeSuggestionFromState } = useFriendSuggestions();
    const { friends, isLoading: loadingFriends, isLoadingMore: loadingMoreFriends, hasMore: hasMoreFriends, loadMore: loadMoreFriends, removeFriendFromState } = useFriends(currentUserId, 20);

    const { acceptRequest, rejectRequest, cancelRequest, sendRequest, isMutating } = useFriendshipActions();

    const tabs = [
        { id: 'suggestions', label: 'Gợi ý', icon: Sparkles },
        { id: 'pending', label: `Lời mời (${pendingHook.totalCount})`, icon: UserPlus },
        { id: 'friends', label: 'Bạn bè', icon: Users },
        { id: 'sent', label: `Đã gửi (${sentHook.totalCount})`, icon: Send },
    ] as const;

    return (
        <div className="w-full pb-8">
            {/* Compact header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Users size={24} className="text-[#4F6BFF]" />
                    <h1 className="text-2xl font-bold text-white">Bạn bè</h1>
                    {pendingHook.totalCount > 0 && (
                        <span className="ml-2 px-2.5 py-1 bg-[#4F6BFF]/10 text-[#4F6BFF] text-xs font-semibold rounded-full">
                            {pendingHook.totalCount} lời mời
                        </span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === id
                                ? 'bg-[#4F6BFF] text-white shadow-lg'
                                : 'bg-[#1C1C1E] text-[#8E8E93] hover:bg-[#252529] border border-white/[0.07]'
                            }`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {/* Gợi ý */}
                {activeTab === 'suggestions' && (
                    <>
                        {loadingSuggestions ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#4F6BFF]" size={32} /></div>
                        ) : suggestions.length === 0 ? (
                            <p className="text-center text-[#8E8E93] py-20">Chưa có gợi ý kết bạn nào.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestions.slice(0, 8).map((s) => (
                                    <UserCard
                                        key={s.userId}
                                        avatarUrl={s.avatarUrl}
                                        fullName={s.fullName}
                                        userName={s.userName}
                                        contextLine={s.mutualFriendsCount > 0 ? `${s.mutualFriendsCount} bạn chung` : s.suggestionReason || 'Gợi ý kết bạn'}
                                        linkTo={`/profile/${s.userName}`}
                                        actionButtons={
                                            <button
                                                onClick={() => sendRequest(s.userId, () => removeSuggestionFromState(s.userId))}
                                                disabled={isMutating}
                                                className="px-4 py-2 bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white rounded-xl font-medium text-sm flex items-center gap-1 disabled:opacity-70 hover:shadow-[0_0_15px_rgba(255,20,147,0.3)]"
                                            >
                                                {isMutating ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                                Thêm bạn
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Lời mời */}
                {activeTab === 'pending' && (
                    <>
                        {pendingHook.isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#4F6BFF]" size={32} /></div>
                        ) : pendingHook.requests.length === 0 ? (
                            <p className="text-center text-[#8E8E93] py-20">Không có lời mời nào.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingHook.requests.map((req) => (
                                    <UserCard
                                        key={req.friendshipId}
                                        avatarUrl={req.requesterAvatarUrl}
                                        fullName={req.requesterFullName}
                                        userName={req.requesterUserName}
                                        contextLine={req.requesterBio || undefined}
                                        linkTo={`/profile/${req.requesterUserName}`}
                                        actionButtons={
                                            <>
                                                <button
                                                    onClick={() => acceptRequest(req.friendshipId, () => pendingHook.removeRequestFromState(req.friendshipId))}
                                                    disabled={isMutating}
                                                    className="px-4 py-2 bg-[#4F6BFF] hover:bg-[#5b75ff] text-white rounded-xl font-medium text-sm flex items-center gap-1 disabled:opacity-70"
                                                >
                                                    {isMutating ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    onClick={() => rejectRequest(req.friendshipId, () => pendingHook.removeRequestFromState(req.friendshipId))}
                                                    disabled={isMutating}
                                                    className="px-4 py-2 bg-[#252529] hover:bg-red-500/10 text-[#8E8E93] hover:text-red-400 rounded-xl font-medium text-sm flex items-center gap-1 disabled:opacity-70 border border-white/[0.07]"
                                                >
                                                    {isMutating ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                                                    Xóa
                                                </button>
                                            </>
                                        }
                                    />
                                ))}
                                {pendingHook.hasMore && (
                                    <div className="col-span-full flex justify-center mt-4">
                                        <button onClick={pendingHook.loadMore} disabled={pendingHook.isLoadingMore} className="px-4 py-2 bg-[#252529] rounded-full text-sm text-white hover:bg-[#2E2E33]">
                                            {pendingHook.isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Xem thêm'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Bạn bè */}
                {activeTab === 'friends' && (
                    <>
                        {loadingFriends ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#4F6BFF]" size={32} /></div>
                        ) : friends.length === 0 ? (
                            <p className="text-center text-[#8E8E93] py-20">Chưa có bạn bè nào.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {friends.map((friend) => {
                                    const target = friend.requesterId === currentUserId
                                        ? { name: friend.addresseeFullName, username: friend.addresseeUserName, avatar: friend.addresseeAvatarUrl }
                                        : { name: friend.requesterFullName, username: friend.requesterUserName, avatar: friend.requesterAvatarUrl };
                                    return (
                                        <UserCard
                                            key={friend.id}
                                            avatarUrl={target.avatar}
                                            fullName={target.name}
                                            userName={target.username}
                                            linkTo={`/profile/${target.username}`}
                                            actionButtons={
                                                <FriendActions
                                                    friend={friend}
                                                    currentUserId={currentUserId}
                                                    onUnfriendSuccess={removeFriendFromState}
                                                />
                                            }
                                        />
                                    );
                                })}
                                {hasMoreFriends && (
                                    <div className="col-span-full flex justify-center mt-4">
                                        <button onClick={loadMoreFriends} disabled={loadingMoreFriends} className="px-4 py-2 bg-[#252529] rounded-full text-sm text-white hover:bg-[#2E2E33]">
                                            {loadingMoreFriends ? <Loader2 size={16} className="animate-spin" /> : 'Xem thêm'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Đã gửi */}
                {activeTab === 'sent' && (
                    <>
                        {sentHook.isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#4F6BFF]" size={32} /></div>
                        ) : sentHook.requests.length === 0 ? (
                            <p className="text-center text-[#8E8E93] py-20">Chưa gửi lời mời nào.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sentHook.requests.map((req) => (
                                    <UserCard
                                        key={req.friendshipId}
                                        avatarUrl={req.addresseeAvatarUrl}
                                        fullName={req.addresseeFullName}
                                        userName={req.addresseeUserName}
                                        contextLine={`Đã gửi ${new Date(req.createdAt).toLocaleDateString('vi-VN')}`}
                                        linkTo={`/profile/${req.addresseeUserName}`}
                                        actionButtons={
                                            <button
                                                onClick={() => cancelRequest(req.friendshipId, () => sentHook.removeRequestFromState(req.friendshipId))}
                                                disabled={isMutating}
                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium text-sm flex items-center gap-1 disabled:opacity-70 border border-red-500/20"
                                            >
                                                {isMutating ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                                                Hủy
                                            </button>
                                        }
                                    />
                                ))}
                                {sentHook.hasMore && (
                                    <div className="col-span-full flex justify-center mt-4">
                                        <button onClick={sentHook.loadMore} disabled={sentHook.isLoadingMore} className="px-4 py-2 bg-[#252529] rounded-full text-sm text-white hover:bg-[#2E2E33]">
                                            {sentHook.isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Xem thêm'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FriendsPage;