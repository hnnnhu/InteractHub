// src/components/friends/FriendshipTabs.tsx

import React, { useState } from 'react';
import { Users, UserPlus, Send, Sparkles, Loader2 } from 'lucide-react';
import usePendingRequests from '../../hooks/usePendingRequests';
import useSentRequests from '../../hooks/useSentRequests';
import useFriendSuggestions from '../../hooks/useFriendSuggestions';
import FriendList from './FriendList';
import FriendRequestItem from './FriendRequestItem';
import SentRequestItem from './SentRequestItem';
import SuggestionCard from './SuggestionCard';

interface FriendshipTabsProps {
    currentUserId: string; // Truyền từ Context (VD: auth.user.id)
}

const FriendshipTabs: React.FC<FriendshipTabsProps> = ({ currentUserId }) => {
    const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent' | 'suggestions'>('suggestions');

    // Khởi tạo các hooks (Hooks tự động fetch khi được mount hoặc khi phụ thuộc thay đổi)
    const pendingHooks = usePendingRequests();
    const sentHooks = useSentRequests();
    const suggestionHooks = useFriendSuggestions();

    const tabs = [
        { id: 'suggestions', label: 'Gợi ý kết bạn', icon: Sparkles },
        { id: 'pending', label: `Lời mời (${pendingHooks.totalCount})`, icon: UserPlus },
        { id: 'friends', label: 'Bạn bè', icon: Users },
        { id: 'sent', label: 'Đã gửi', icon: Send },
    ] as const;

    return (
        <div className="w-full max-w-5xl mx-auto py-8 px-4">
            {/* Header & Menu Tabs */}
            <div className="mb-8 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4 min-w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${isActive
                                        ? 'bg-[#4F6BFF] text-white shadow-[0_0_15px_rgba(79,107,255,0.4)]'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Nội dung Tab */}
            <div className="min-h-[50vh]">
                {/* 1. GỢI Ý KẾT BẠN */}
                {activeTab === 'suggestions' && (
                    <div className="animate-in fade-in duration-300">
                        {suggestionHooks.isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#4F6BFF] animate-spin" /></div>
                        ) : suggestionHooks.suggestions.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">Hiện tại chưa có gợi ý nào mới cho bạn.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {suggestionHooks.suggestions.map(s => (
                                    <SuggestionCard key={s.userId} suggestion={s} onAddSuccess={suggestionHooks.removeSuggestionFromState} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. LỜI MỜI NHẬN ĐƯỢC (PENDING) */}
                {activeTab === 'pending' && (
                    <div className="animate-in fade-in duration-300 space-y-3">
                        {pendingHooks.isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#4F6BFF] animate-spin" /></div>
                        ) : pendingHooks.requests.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">Bạn không có lời mời kết bạn nào đang chờ duyệt.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {pendingHooks.requests.map(r => (
                                        <FriendRequestItem key={r.friendshipId} request={r} onActionSuccess={pendingHooks.removeRequestFromState} />
                                    ))}
                                </div>
                                {pendingHooks.hasMore && (
                                    <button onClick={pendingHooks.loadMore} className="mt-4 text-[#4F6BFF] hover:underline mx-auto block">Xem thêm</button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* 3. BẠN BÈ CỦA TÔI */}
                {activeTab === 'friends' && (
                    <FriendList userId={currentUserId} currentUserId={currentUserId} />
                )}

                {/* 4. LỜI MỜI ĐÃ GỬI (SENT) */}
                {activeTab === 'sent' && (
                    <div className="animate-in fade-in duration-300 space-y-3">
                        {sentHooks.isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#4F6BFF] animate-spin" /></div>
                        ) : sentHooks.requests.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">Bạn chưa gửi lời mời kết bạn nào.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {sentHooks.requests.map(r => (
                                        <SentRequestItem key={r.friendshipId} request={r} onCancelSuccess={sentHooks.removeRequestFromState} />
                                    ))}
                                </div>
                                {sentHooks.hasMore && (
                                    <button onClick={sentHooks.loadMore} className="mt-4 text-[#4F6BFF] hover:underline mx-auto block">Xem thêm</button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendshipTabs;