// src/components/block/BlockedUsersList.tsx
import React, { useState, useEffect } from 'react';
import { Search, Loader2, UserX, AlertCircle, RefreshCw, Unlock, ArrowDown, ArrowUp } from 'lucide-react';
import { useBlockedUsers } from '../../hooks/useBlockedUsers';
import { useBlockActions } from '../../hooks/useBlockActions';
import type { BlockedUserInfo } from '../../types/block';

// ------------------------------------------------------------
//  Component hiển thị một người bị chặn
// ------------------------------------------------------------
const BlockedUserItem: React.FC<{
    user: BlockedUserInfo;
    onUnblock: (userId: string) => void;
    isUnblocking: boolean;
}> = ({ user, onUnblock, isUnblocking }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
        <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DCA3C8] to-[#FF1493] p-[2px] shrink-0">
                <div className="w-full h-full bg-[#0D0C13] rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-300 text-sm font-bold">{user.fullName?.charAt(0) || 'U'}</span>
                    )}
                </div>
            </div>
            <div className="min-w-0">
                <h4 className="text-white font-semibold text-sm truncate">{user.fullName}</h4>
                <p className="text-gray-500 text-xs truncate">@{user.userName}</p>
                <p className="text-gray-600 text-[11px] mt-0.5">
                    Đã chặn từ {new Date(user.blockedAt).toLocaleDateString('vi-VN')}
                </p>
            </div>
        </div>
        <button
            onClick={() => onUnblock(user.blockedId)}
            disabled={isUnblocking}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 border border-white/10 hover:border-green-500/30 rounded-xl transition-all disabled:opacity-50 shrink-0 ml-3"
        >
            {isUnblocking ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
            Bỏ chặn
        </button>
    </div>
);

// ------------------------------------------------------------
//  Component chính – Danh sách người bị chặn
// ------------------------------------------------------------
const BlockedUsersList: React.FC = () => {
    const [searchInput, setSearchInput] = useState('');
    const [sortBy, setSortBy] = useState('createdat');
    const [sortDir, setSortDir] = useState('desc');

    const {
        blockedUsers,
        totalCount,
        isLoading,
        isFetching,
        isError,
        error,
        hasMore,
        loadMore,
        setSearch,
        setSorting,
        refresh,
    } = useBlockedUsers(20);

    const { unblockUser, isUnblocking } = useBlockActions();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim() || ''), 400);
        return () => clearTimeout(timer);
    }, [searchInput, setSearch]);

    // Gọi refresh khi mount lần đầu
    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            const newDir = sortDir === 'asc' ? 'desc' : 'asc';
            setSortDir(newDir);
            setSorting(field, newDir);
        } else {
            setSortBy(field);
            setSortDir('desc');
            setSorting(field, 'desc');
        }
    };

    const handleUnblock = async (userId: string) => {
        try {
            await unblockUser(userId);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
           

            {/* Thanh công cụ */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Tìm kiếm theo tên hoặc username..."
                        className="w-full bg-[#1A1825] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#4F6BFF] transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSort('name')}
                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            sortBy === 'name'
                                ? 'bg-[#4F6BFF]/20 border-[#4F6BFF]/40 text-[#4F6BFF]'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        Tên
                        {sortBy === 'name' && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </button>
                    <button
                        onClick={() => handleSort('createdat')}
                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            sortBy === 'createdat'
                                ? 'bg-[#4F6BFF]/20 border-[#4F6BFF]/40 text-[#4F6BFF]'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                    >
                        Ngày chặn
                        {sortBy === 'createdat' && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </button>
                </div>
            </div>

            {/* Thông báo lỗi */}
            {isError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-200">
                    <AlertCircle size={20} className="text-red-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Không thể tải danh sách chặn</p>
                        <p className="text-xs mt-1 text-red-400/80">{error}</p>
                    </div>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Loading lần đầu */}
            {isLoading && !isFetching && blockedUsers.length === 0 && (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-[#4F6BFF]" size={40} />
                </div>
            )}

            {/* Trạng thái trống */}
            {!isLoading && !isError && blockedUsers.length === 0 && (
                <div className="py-16 text-center bg-white/5 border border-white/10 rounded-3xl">
                    <UserX size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-300 font-medium text-lg">Chưa có ai trong danh sách chặn</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Khi bạn chặn một người dùng, họ sẽ xuất hiện tại đây.
                    </p>
                    <button
                        onClick={refresh}
                        className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 transition-colors inline-flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>
                </div>
            )}

            {/* Danh sách */}
            {blockedUsers.length > 0 && (
                <div className="space-y-3">
                    {blockedUsers.map((user) => (
                        <BlockedUserItem
                            key={user.blockId}
                            user={user}
                            onUnblock={handleUnblock}
                            isUnblocking={isUnblocking}
                        />
                    ))}
                </div>
            )}

            {/* Load More */}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={loadMore}
                        disabled={isFetching}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-full font-semibold hover:bg-white/10 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {isFetching && <Loader2 className="animate-spin" size={18} />}
                        Xem thêm
                    </button>
                </div>
            )}

            {/* Tổng số + Làm mới */}
            {totalCount > 0 && (
                <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-white/5">
                    <p>
                        Hiển thị {blockedUsers.length} / {totalCount} người dùng bị chặn
                    </p>
                    <button
                        onClick={refresh}
                        className="flex items-center gap-1 hover:text-gray-400 transition-colors"
                        title="Làm mới danh sách"
                    >
                        <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>
            )}
        </div>
    );
};

export default BlockedUsersList;