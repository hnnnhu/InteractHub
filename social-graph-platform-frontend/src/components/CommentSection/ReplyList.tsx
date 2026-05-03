// src/components/CommentSection/ReplyList.tsx

import React from 'react';
import { CornerDownRight, Loader2 } from 'lucide-react';
import CommentItem from './CommentItem';
import type { CommentReplyDto, CommentResponseDto } from '../../types/comment';

interface ReplyListProps {
    // Sử dụng Union Type để tương thích với cả mảng lồng nhau (từ API Comment gốc) và mảng fetch từ API (Replies)
    replies: (CommentReplyDto | CommentResponseDto)[];
    postId: string;
    totalReplyCount: number;
    isLoading: boolean;
    hasMore: boolean;
    currentPage?: number; // Giữ lại optional để đảm bảo tương thích ngược
    onFetchMore: () => void;
    onDeleteReply: (id: string) => void;
    onUpdateReply: (id: string, newContent: string) => void;
}

const ReplyList: React.FC<ReplyListProps> = ({
    replies,
    postId,
    totalReplyCount,
    isLoading,
    hasMore,
    onFetchMore,
    onDeleteReply,
    onUpdateReply
}) => {
    // Tính toán số lượng câu trả lời còn lại chưa được hiển thị
    const remainingRepliesCount = totalReplyCount - replies.length;

    // Ẩn Component nếu không có reply nào và cũng không còn dữ liệu trên server
    if (replies.length === 0 && remainingRepliesCount <= 0) {
        return null;
    }

    // Logic hiển thị Text động cho nút "Xem thêm"
    const getLoadMoreText = () => {
        if (isLoading) return 'Đang tải...';
        if (remainingRepliesCount > 0) return `Xem thêm ${remainingRepliesCount} câu trả lời`;
        return 'Hiển thị thêm câu trả lời...';
    };

    // Chỉ hiện nút nếu còn item chưa load HOẶC backend báo vẫn còn trang tiếp theo (hasMore)
    const shouldShowLoadMoreButton = remainingRepliesCount > 0 || hasMore;

    return (
        <div className="mt-1 sm:mt-2 relative pl-1 sm:pl-2 animate-in fade-in duration-500">

            {/* THREAD CONNECTOR (Đường kẻ dọc luồng reply chính) 
                Sử dụng gradient mờ dần về cuối để tạo cảm giác sâu (depth)
            */}
            <div className="absolute left-[-22px] sm:left-[-26px] top-1 bottom-8 w-[2px] bg-gradient-to-b from-white/20 via-white/10 to-transparent rounded-full z-0"></div>

            {/* DANH SÁCH BÌNH LUẬN CON */}
            <div className="flex flex-col gap-1 sm:gap-2 relative z-10">
                {replies.map((reply) => (
                    <div key={reply.id} className="relative">
                        {/* Nhánh rẽ ngang trỏ vào giữa từng Avatar con */}
                        <div className="absolute left-[-22px] sm:left-[-26px] top-[1.65rem] sm:top-[1.85rem] w-[16px] sm:w-[20px] h-[2px] bg-white/20 rounded-r-full"></div>

                        {/* Đệ quy gọi lại CommentItem */}
                        <CommentItem
                            comment={reply}
                            postId={postId}
                            isChild={true} // Đánh dấu cấp con để lùi lề & thu nhỏ Avatar
                            onDelete={onDeleteReply}
                            onUpdate={onUpdateReply}
                        />
                    </div>
                ))}
            </div>

            {/* NÚT TẢI THÊM (Load More) ĐƯỢC REDESIGN */}
            {shouldShowLoadMoreButton && (
                <button
                    onClick={onFetchMore}
                    disabled={isLoading}
                    className="flex items-center gap-2 mt-3 ml-1 px-3 py-1.5 text-[13px] font-bold text-[#4F6BFF] hover:text-white hover:bg-[#4F6BFF]/10 rounded-lg transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CornerDownRight
                        size={16}
                        className="text-[#4F6BFF]/70 group-hover:text-white transition-colors"
                    />
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> Đang đồng bộ...
                        </span>
                    ) : (
                        <span>{getLoadMoreText()}</span>
                    )}
                </button>
            )}
        </div>
    );
};

export default ReplyList;