// src/components/reaction/ReactionUsersModal.tsx

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Users } from 'lucide-react';
import useReactionUsers from '../../hooks/useReactionUsers';
import { getReactionConfig } from '../../utils/reactionIcons';

interface ReactionUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
}

const ReactionUsersModal: React.FC<ReactionUsersModalProps> = ({ isOpen, onClose, postId }) => {
    const {
        users, isLoading, isLoadingMore, hasMore, error,
        fetchFirstPage, loadMoreUsers
    } = useReactionUsers(postId, 15);

    useEffect(() => {
        if (isOpen) {
            fetchFirstPage();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, fetchFirstPage]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <div className="bg-[#1A1825] border border-white/10 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1A1825]/90 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                            <Users size={18} className="text-gray-300" />
                        </div>
                        <h3 className="font-bold text-white text-[16px]">Cảm xúc bài viết</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#4F6BFF] animate-spin mb-3" />
                            <p className="text-gray-400 text-sm font-medium">Đang tải danh sách...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-400 font-medium">{error}</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">Chưa có ai thả cảm xúc.</div>
                    ) : (
                        <div className="flex flex-col">
                            {users.map((user) => {
                                const config = getReactionConfig(user.type);
                                return (
                                    <div key={user.userId} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3 relative">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-[#0D0C13] border border-white/10 overflow-hidden relative">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[#FF1493] font-bold">
                                                        {user.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Huy hiệu Cảm xúc nhỏ gắn góc dưới Avatar */}
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-[#1A1825] flex items-center justify-center shadow-md bg-black/50" title={config.label}>
                                                <span className="text-[12px]">{config.emoji}</span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[14.5px] text-gray-200 group-hover:text-white transition-colors">{user.fullName}</span>
                                                <span className="text-[12.5px] text-gray-500 font-medium">@{user.userName}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="mt-4 mb-2 text-center">
                                    <button
                                        onClick={loadMoreUsers}
                                        disabled={isLoadingMore}
                                        className="text-[13px] font-bold text-[#4F6BFF] hover:text-white px-4 py-2 rounded-lg hover:bg-[#4F6BFF]/10 transition-colors disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
                                    >
                                        {isLoadingMore ? <><Loader2 size={14} className="animate-spin" /> Đang tải...</> : 'Xem thêm'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ReactionUsersModal;