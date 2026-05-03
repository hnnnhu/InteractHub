// src/components/story/StoryViewersList.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStoryViews } from '../../hooks/story/useStoryViews';
import { X, RefreshCw, Eye, Loader2, User } from 'lucide-react';

interface StoryViewersListProps {
    storyId: string;
    onClose: () => void;
}

/**
 * StoryViewersList – Modal hiển thị danh sách người đã xem story.
 * Chỉ hiển thị khi người dùng là chủ sở hữu của story.
 */
export const StoryViewersList: React.FC<StoryViewersListProps> = ({
    storyId,
    onClose,
}) => {
    const { views, loading, error, loadMore, hasMore, refresh } =
        useStoryViews(storyId, 20);
    const [now, setNow] = useState(Date.now);

    // Cập nhật `now` mỗi 30 giây để hiển thị "Vừa xong" chính xác
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(timer);
    }, []);

    // Format thời gian đã xem (tương đối)
    const formatViewedTime = useCallback(
        (dateStr: string) => {
            const viewed = new Date(dateStr).getTime();
            const diffSec = Math.floor((now - viewed) / 1000);
            if (diffSec < 10) return 'Vừa xong';
            if (diffSec < 60) return `${diffSec} giây trước`;
            const mins = Math.floor(diffSec / 60);
            if (mins < 60) return `${mins} phút trước`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `${hours} giờ trước`;
            const days = Math.floor(hours / 24);
            if (days === 1) return 'Hôm qua';
            if (days < 7) return `${days} ngày trước`;
            return new Date(viewed).toLocaleDateString('vi-VN');
        },
        [now],
    );

    // Danh sách xem đã sắp xếp theo thời gian (mới nhất trước) – mặc định API trả về như vậy
    const viewerList = useMemo(() => views ?? [], [views]);

    // ── Trạng thái ──
    const isLoading = loading && viewerList.length === 0;
    const isLoadingMore = loading && viewerList.length > 0;
    const hasError = !!error && !loading;
    const isEmpty = !loading && !error && viewerList.length === 0;
    const canShowList = !isLoading && !hasError && !isEmpty;

    return (
        <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="p-1.5 bg-white/10 rounded-lg">
                            <Eye size={18} className="text-gray-300" />
                        </div>
                        Người đã xem
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-1">
                    {/* Loading (lần đầu) */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="animate-spin text-[#4F6BFF]" size={36} />
                            <p className="text-gray-400 text-sm font-medium">
                                Đang tải danh sách...
                            </p>
                        </div>
                    )}

                    {/* Lỗi */}
                    {hasError && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="p-3 bg-red-500/10 rounded-full">
                                <Eye size={28} className="text-red-400" />
                            </div>
                            <p className="text-red-400 text-sm text-center max-w-xs">
                                {error}
                            </p>
                            <button
                                onClick={refresh}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                            >
                                <RefreshCw size={16} />
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Trống */}
                    {isEmpty && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="p-4 bg-white/5 rounded-full">
                                <Eye size={32} className="text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">
                                Chưa có ai xem story này
                            </p>
                        </div>
                    )}

                    {/* Danh sách */}
                    {canShowList && (
                        <ul className="divide-y divide-white/5">
                            {viewerList.map((viewer) => (
                                <li
                                    key={viewer.id}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10">
                                        {viewer.viewerAvatarUrl ? (
                                            <img
                                                src={viewer.viewerAvatarUrl}
                                                alt={viewer.viewerDisplayName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                <User size={20} className="text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Tên & thời gian */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {viewer.viewerDisplayName}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            {formatViewedTime(viewer.viewedAt)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Load more (manual) */}
                    {hasMore && !loading && (
                        <button
                            onClick={loadMore}
                            className="w-full py-2.5 text-sm text-[#4F6BFF] hover:bg-[#4F6BFF]/10 rounded-lg transition-colors font-medium"
                        >
                            Xem thêm
                        </button>
                    )}

                    {/* Loading more */}
                    {isLoadingMore && (
                        <div className="flex justify-center py-3">
                            <Loader2 className="animate-spin text-[#4F6BFF]" size={20} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};