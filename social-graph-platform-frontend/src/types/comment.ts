// src/types/comment.ts

// ==========================================
// 1. REQUEST DTOs (Dữ liệu gửi lên Backend)
// Map với CreateCommentDto.cs và UpdateCommentDto.cs
// ==========================================

export interface CreateCommentDto {
    postId: string;
    content: string;
    /** * ID của bình luận cha. 
     * - Nếu là null hoặc undefined -> Bình luận cấp 1 (gốc).
     * - Nếu truyền ID -> Trở thành bình luận con (Reply) cho ID đó.
     */
    parentCommentId?: string | null;
}

export interface UpdateCommentDto {
    content: string;
}

// ==========================================
// 2. RESPONSE DTOs (Dữ liệu nhận từ Backend)
// Map với CommentResponseDto.cs và CommentReplyDto.cs
// ==========================================

/**
 * Dùng cho danh sách bình luận gốc (Cấp 1) lấy từ /api/comments/post/{postId}
 */
export interface CommentResponseDto {
    id: string;
    postId: string;
    userId: string;

    // Thông tin tác giả
    userName: string;
    fullName: string;
    avatarUrl?: string | null;

    content: string;

    // Cấu trúc cây
    parentCommentId?: string | null;
    parentUserName?: string | null;

    // Thống kê đếm từ Database
    replyCount: number;

    // Thời gian
    createdAt: string;
    updatedAt?: string | null;

    // Thuộc tính UI hỗ trợ nhận biết chỉnh sửa
    isEdited?: boolean;

    // Danh sách reply đính kèm sẵn (Ví dụ: Take(2) từ backend)
    replies: CommentResponseDto[];
}

/**
 * Dùng cho danh sách câu trả lời lấy từ /api/comments/{id}/replies
 */
export interface CommentReplyDto {
    id: string;
    postId: string;
    parentCommentId: string;
    userId: string;

    // Thông tin tác giả
    userName: string;
    fullName: string;
    avatarUrl?: string | null;

    content: string;

    // Thời gian
    createdAt: string;
    updatedAt?: string | null;

    // Thuộc tính UI hỗ trợ nhận biết chỉnh sửa
    isEdited?: boolean;

    // [Hỗ trợ Optimistic UI] - Cho phép Reply tiếp tục chứa Reply con
    // Các thuộc tính này optional vì GetRepliesAsync của backend không trả về sẵn mảng con
    replyCount?: number;
    replies?: CommentReplyDto[];
}

/**
 * Interface cấu trúc cây đệ quy mở rộng (Nếu có nhu cầu hiển thị Dashboard)
 */
export interface CommentTreeDto {
    id: string;
    userId: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    content: string;
    createdAt: string;
    updatedAt?: string | null;
    isEdited?: boolean;
    replyCount: number;
    replies: CommentTreeDto[];
}

// ==========================================
// 3. PAGINATION (Phân trang - Dùng chung)
// Map với PagedResult<T> trong Backend
// ==========================================

export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}