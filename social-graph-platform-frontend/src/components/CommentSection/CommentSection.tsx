// src/components/CommentSection/CommentSection.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { isAxiosError } from 'axios';
import commentApi from '../../api/commentApi';
import type { CommentResponseDto } from '../../types/comment';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

interface CommentSectionProps {
    postId: string;
    initialCommentCount?: number;
    // Callback thông báo cho PostCard khi số lượng bình luận thay đổi
    onCommentCountChange?: (count: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
    postId,
    initialCommentCount = 0,
    onCommentCountChange
}) => {
    const [comments, setComments] = useState<CommentResponseDto[]>([]);

    // Trạng thái Loading
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Đếm tổng số lượng bình luận (Gốc + Con) để hiển thị UI Header
    const [totalCount, setTotalCount] = useState(initialCommentCount);

    // [TÙY CHỈNH]: Đặt pageSize = 3 để test chức năng "Xem thêm bình luận gốc" dễ hơn.
    // Khi deploy thật có thể tăng lên 5 hoặc 10.
    const pageSize = 3;

    // ================= 1. ĐỒNG BỘ SỐ LƯỢNG LÊN POSTCARD =================
    useEffect(() => {
        if (onCommentCountChange) {
            onCommentCountChange(totalCount);
        }
    }, [totalCount, onCommentCountChange]);

    // ================= 2. FETCH DỮ LIỆU BÌNH LUẬN GỐC =================
    const fetchCommentsData = useCallback(async (page: number) => {
        setError(null);
        try {
            const response = await commentApi.getCommentsByPost(postId, page, pageSize);

            if (response.isSuccess && response.data) {
                // Biến hasNextPage từ Backend xác định xem còn BÌNH LUẬN GỐC nào chưa tải không
                const { items, hasNextPage } = response.data;

                setComments(prev => {
                    // Nếu gọi lại trang đầu, reset danh sách
                    if (page === 1) return items;

                    // Lọc trùng lặp (tránh render 2 lần cùng 1 comment do React Strict Mode)
                    const existingIds = new Set(prev.map(c => c.id));
                    const newItems = items.filter(c => !existingIds.has(c.id));
                    return [...prev, ...newItems];
                });

                setHasMore(hasNextPage);
                setCurrentPage(page);
            } else {
                setError(response.message || 'Không thể tải bình luận');
            }
        } catch (err: unknown) {
            console.error('Lỗi khi tải bình luận:', err);
            let errorMessage = 'Có lỗi xảy ra khi kết nối máy chủ';

            if (isAxiosError(err) && err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        }
    }, [postId]);

    // ================= 3. EFFECT KHỞI TẠO =================
    useEffect(() => {
        let isMounted = true;
        const loadInitialComments = async () => {
            await fetchCommentsData(1);
            if (isMounted) setIsLoading(false);
        };
        loadInitialComments();
        return () => { isMounted = false; };
    }, [fetchCommentsData]);

    // ================= 4. TƯƠNG TÁC NGƯỜI DÙNG =================
    const handleLoadMore = async () => {
        if (isLoadingMore) return;
        setIsLoadingMore(true);
        await fetchCommentsData(currentPage + 1);
        setIsLoadingMore(false);
    };

    const handleRetry = async () => {
        setIsLoading(true);
        await fetchCommentsData(1);
        setIsLoading(false);
    };

    // ================= 5. HANDLERS (OPTIMISTIC UI) =================
    const handleCommentAdded = useCallback((newComment: CommentResponseDto) => {
        // Đẩy bình luận mới lên đầu danh sách
        setComments(prev => [newComment, ...prev]);
        setTotalCount(prev => prev + 1);
    }, []);

    const handleCommentDeleted = useCallback((commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setTotalCount(prev => Math.max(0, prev - 1));
    }, []);

    const handleCommentUpdated = useCallback((commentId: string, newContent: string) => {
        setComments(prev =>
            prev.map(c =>
                c.id === commentId
                    ? { ...c, content: newContent, updatedAt: new Date().toISOString(), isEdited: true }
                    : c
            )
        );
    }, []);

    // ================= 6. RENDER =================
    return (
        <div className="mt-4 pt-5 border-t border-white/10 animate-in fade-in duration-500">

            {/* Header số lượng */}
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="bg-[#4F6BFF]/10 p-1.5 rounded-lg border border-[#4F6BFF]/20">
                        <MessageCircle size={18} className="text-[#4F6BFF]" />
                    </div>
                    <h3 className="text-white font-bold text-[16px] tracking-wide">
                        Bình luận <span className="text-gray-400 font-semibold ml-1.5 bg-white/5 px-2 py-0.5 rounded-md">{totalCount}</span>
                    </h3>
                </div>
            </div>

            {/* Form nhập liệu (Cấp 1) */}
            <div className="mb-8">
                <CommentForm
                    postId={postId}
                    onCommentAdded={handleCommentAdded}
                />
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <div className="mb-6 p-4 bg-[#FF1493]/10 border border-[#FF1493]/20 rounded-xl text-[#FF1493] text-sm flex justify-between items-center shadow-[0_0_15px_rgba(255,20,147,0.1)]">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} />
                        <span className="font-medium">{error}</span>
                    </div>
                    <button
                        onClick={handleRetry}
                        className="font-bold bg-[#FF1493]/20 hover:bg-[#FF1493]/30 px-4 py-1.5 rounded-lg transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Khung chứa Danh sách bình luận */}
            {isLoading ? (
                <div className="flex flex-col justify-center items-center py-14 space-y-4">
                    <Loader2 size={36} className="text-[#4F6BFF] animate-spin" />
                    <span className="text-gray-400 text-sm font-medium animate-pulse tracking-wide">Đang đồng bộ hội thoại...</span>
                </div>
            ) : (
                <div className="space-y-2 relative">
                    {comments.map(comment => (
                        <div key={comment.id} className="transition-all duration-300">
                            <CommentItem
                                comment={comment}
                                postId={postId}
                                onDelete={handleCommentDeleted}
                                onUpdate={handleCommentUpdated}
                            />
                        </div>
                    ))}

                    {/* Trạng thái trống (Empty State) Xịn xò */}
                    {!isLoading && comments.length === 0 && !error && (
                        <div className="text-center py-16 bg-[#1A1825]/30 border border-white/5 rounded-[2rem] shadow-inner mt-4 backdrop-blur-sm group hover:bg-[#1A1825]/50 transition-colors duration-500">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                                <Sparkles size={32} className="text-gray-400 group-hover:text-[#4F6BFF] transition-colors duration-500" />
                            </div>
                            <p className="text-white text-[16px] font-bold tracking-wide">Chưa có bình luận nào</p>
                            <p className="text-gray-500 text-[14px] mt-2 font-medium max-w-[250px] mx-auto leading-relaxed">Hãy là người đầu tiên để lại dấu ấn cho bài viết này!</p>
                        </div>
                    )}

                    {/* Nút Xem thêm Bình luận Gốc */}
                    {hasMore && (
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="w-full mt-8 py-3.5 bg-gradient-to-b from-[#4F6BFF]/10 to-transparent hover:from-[#4F6BFF]/20 border border-[#4F6BFF]/20 text-[#4F6BFF] hover:text-white rounded-[1.25rem] text-[14px] font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[#4F6BFF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {isLoadingMore ? (
                                <><Loader2 size={18} className="animate-spin relative z-10" /> <span className="relative z-10">Đang tải thêm...</span></>
                            ) : (
                                <span className="relative z-10">Xem thêm bình luận gốc</span>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentSection;