// src/types/reaction.ts

// ==========================================
// 1. ENUMS & CONSTANTS
// Map với SocialGraphPlatform.Domain.Enums.ReactionType
// ==========================================

/**
 * Các loại cảm xúc được hỗ trợ trong hệ thống.
 * Dùng Object + as const để thay thế cho enum truyền thống.
 */
export const ReactionType = {
    Like: 1,
    Love: 2,
    Haha: 3,
    Wow: 4,
    Sad: 5,
    Angry: 6
} as const;

/**
 * Trích xuất kiểu dữ liệu từ Object (Giải quyết triệt để lỗi erasableSyntaxOnly của TypeScript)
 */
export type ReactionType = typeof ReactionType[keyof typeof ReactionType];

// ==========================================
// 2. RESPONSE DTOs (Dữ liệu nhận về từ Server)
// ==========================================

/**
 * Map với SocialGraphPlatform.Application.DTOs.User.UserSummaryDto
 */
export interface UserSummaryDto {
    id: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
}

/**
 * Map với SocialGraphPlatform.Application.DTOs.Reaction.ReactionSummaryDto
 */
export interface ReactionSummaryDto {
    type: ReactionType;
    typeName: string; // Trả về dạng text như "Like", "Love", "Haha"...
    count: number;
    recentUsers: UserSummaryDto[]; // Chứa danh sách tối đa 5 người thả cảm xúc gần nhất
}

/**
 * Map với SocialGraphPlatform.Application.DTOs.Reaction.ReactionCountDto
 * Dùng để hiển thị thống kê tổng quan trên PostCard hoặc PostDetailModal
 */
export interface ReactionCountDto {
    totalReactions: number;
    reactions: ReactionSummaryDto[];
    currentUserReaction?: ReactionType | null; // Null nếu user chưa thả cảm xúc
    isLikedByCurrentUser: boolean;
}

/**
 * Map với SocialGraphPlatform.Application.DTOs.Reaction.UserReactionDto
 * Dùng cho danh sách phân trang khi click vào xem "Những ai đã thả cảm xúc"
 */
export interface UserReactionDto {
    userId: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    type: ReactionType;
    reactedAt: string; // ISO Date String map với DateTimeOffset
}

// ==========================================
// 3. REQUEST DTOs (Dữ liệu gửi lên Server)
// ==========================================

/**
 * Map với SocialGraphPlatform.Application.DTOs.Reaction.AddReactionDto
 */
export interface AddReactionDto {
    postId: string;
    type: ReactionType;
}

// Nếu sau này bạn mở rộng thả cảm xúc cho cả Bình luận thì có thể thêm interface ở đây
// Ví dụ: export interface AddCommentReactionDto { commentId: string, type: ReactionType }