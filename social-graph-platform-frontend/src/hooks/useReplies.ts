// src/hooks/useReplies.ts

import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { commentApi } from '../api/commentApi';
import type { CommentReplyDto, CommentResponseDto } from '../types/comment';

interface UseRepliesResult {
    replies: (CommentReplyDto | CommentResponseDto)[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    totalCount: number;
    currentPage: number;
    fetchReplies: (pageNumber?: number) => Promise<void>;
    addReplyToState: (newReply: CommentReplyDto) => void;
    updateReplyInState: (replyId: string, content: string) => void;
    deleteReplyFromState: (replyId: string) => void;
}

export const useReplies = (
    parentCommentId: string,
    initialReplies: (CommentReplyDto | CommentResponseDto)[] = [],
    initialTotalCount: number = 0,
    pageSize: number = 5
): UseRepliesResult => {
    // Khởi tạo State bằng dữ liệu preloaded từ Backend thay vì mảng rỗng
    const [replies, setReplies] = useState<(CommentReplyDto | CommentResponseDto)[]>(initialReplies);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [currentPage, setCurrentPage] = useState(1);

    /**
     * Hàm gọi API để lấy danh sách trả lời con (Replies)
     * - Tự động tính toán trang cần lấy nếu không truyền tham số.
     */
    const fetchReplies = useCallback(
        async (pageNumber?: number) => {
            if (isLoading) return; // Chặn spam click khi đang tải

            // Logic tính trang thông minh:
            // 1. Nếu có truyền số cụ thể (VD: 1 để reset) -> dùng số đó
            // 2. Nếu không truyền: Còn hasMore thì tăng 1, hết thì gọi trang 1 để fallback.
            const targetPage = pageNumber ?? (hasMore ? currentPage + 1 : 1);

            setIsLoading(true);
            setError(null);

            try {
                const response = await commentApi.getReplies(parentCommentId, targetPage, pageSize);

                if (response.isSuccess && response.data) {
                    const { items, hasNextPage, totalCount: newTotalCount } = response.data;

                    setReplies((prev) => {
                        // Nếu là trang 1, ghi đè danh sách mới nhất từ Backend
                        if (targetPage === 1) return items;

                        // Tránh duplicate keys khi load more (Nối mảng và lọc trùng)
                        const existingIds = new Set(prev.map((r) => r.id));
                        const newItems = items.filter((r) => !existingIds.has(r.id));
                        return [...prev, ...newItems];
                    });

                    setHasMore(hasNextPage);
                    setTotalCount(newTotalCount);
                    setCurrentPage(targetPage);
                } else {
                    setError(response.message || 'Lỗi khi tải câu trả lời');
                }
            } catch (err: unknown) {
                console.error(`Lỗi fetch replies cho comment ${parentCommentId}:`, err);
                let errorMessage = 'Có lỗi xảy ra khi tải câu trả lời';

                // Bóc tách lỗi từ Backend C# gửi về
                if (isAxiosError(err) && err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err instanceof Error) {
                    errorMessage = err.message;
                }

                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [parentCommentId, pageSize, isLoading, hasMore, currentPage]
    );

    /**
     * Thêm bình luận mới vào danh sách (Sử dụng cho Optimistic UI)
     */
    const addReplyToState = useCallback((newReply: CommentReplyDto) => {
        const safeReply: CommentReplyDto = {
            ...newReply,
            replyCount: newReply.replyCount || 0,
            replies: newReply.replies || [],
        };
        setReplies((prev) => [...prev, safeReply]);
        setTotalCount((prev) => prev + 1);
    }, []);

    /**
     * Cập nhật nội dung bình luận khi User chỉnh sửa
     */
    const updateReplyInState = useCallback((replyId: string, content: string) => {
        setReplies((prev) =>
            prev.map((reply) =>
                reply.id === replyId
                    ? { ...reply, content, updatedAt: new Date().toISOString(), isEdited: true }
                    : reply
            )
        );
    }, []);

    /**
     * Gỡ bình luận khỏi UI khi User xóa
     */
    const deleteReplyFromState = useCallback((replyId: string) => {
        setReplies((prev) => prev.filter((reply) => reply.id !== replyId));
        setTotalCount((prev) => Math.max(0, prev - 1));
    }, []);

    return {
        replies,
        isLoading,
        error,
        hasMore,
        totalCount,
        currentPage,
        fetchReplies,
        addReplyToState,
        updateReplyInState,
        deleteReplyFromState,
    };
};

export default useReplies;