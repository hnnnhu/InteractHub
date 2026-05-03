// src/components/friends/FriendList.tsx

import React from 'react';
import { Loader2, Users } from 'lucide-react';
import useFriends from '../../hooks/useFriends';
import FriendItem from './FriendItem';

interface FriendListProps {
    userId: string;         // ID của người dùng cần xem danh sách bạn bè
    currentUserId: string;  // ID của người dùng đang đăng nhập (để so sánh)
}

const FriendList: React.FC<FriendListProps> = ({ userId, currentUserId }) => {
    const { friends, isLoading, isLoadingMore, hasMore, loadMore, removeFriendFromState } = useFriends(userId, 20);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-[#4F6BFF] animate-spin" />
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                <Users size={48} className="mx-auto text-gray-500 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Chưa có bạn bè nào</h3>
                <p className="text-gray-400">Hãy kết nối thêm nhiều bạn mới để khám phá bảng tin nhé!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                    <FriendItem
                        key={friend.id}
                        friend={friend}
                        currentUserId={currentUserId}
                        onUnfriendSuccess={removeFriendFromState}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="text-center pt-4">
                    <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                        {isLoadingMore && <Loader2 size={16} className="animate-spin" />}
                        {isLoadingMore ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FriendList;