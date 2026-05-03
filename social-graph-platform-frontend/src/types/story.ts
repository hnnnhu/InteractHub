// types/story.ts

// ──────────────────────────────────────────────────────────────
// Enums (thay thế bằng const objects do erasableSyntaxOnly)
// ──────────────────────────────────────────────────────────────

export const MediaType = {
    None: 0,
    Image: 1,
    Video: 2,
    Audio: 3,
    Document: 4,
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const PrivacyLevel = {
    Public: 1,
    FriendsOnly: 2,
    Private: 3,
    CloseFriends: 4,
} as const;

export type PrivacyLevel = (typeof PrivacyLevel)[keyof typeof PrivacyLevel];

// ──────────────────────────────────────────────────────────────
// DTOs
// ──────────────────────────────────────────────────────────────

/** Đại diện cho một lượt xem Story (chỉ tác giả mới xem được danh sách này) */
export interface StoryViewDto {
    id: string; // Guid
    storyId: string;
    viewerId: string;
    viewerDisplayName: string;
    viewerAvatarUrl?: string | null;
    viewedAt: string; // DateTimeOffset
}

/** Thông tin chi tiết của một Story */
export interface StoryResponseDto {
    id: string;
    userId: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    content?: string | null;
    mediaUrl?: string | null;
    type: MediaType;
    privacy: PrivacyLevel;
    privacyLabel: string; // computed from Privacy
    expiresAt: string; // DateTimeOffset
    createdAt: string;
    isActive: boolean;
    isExpired: boolean;
    secondsRemaining: number;
    /** Tổng số lượt xem. Chỉ có giá trị thực nếu người xem là tác giả, ngược lại null */
    viewCount?: number | null;
    /** Danh sách người xem gần đây (tác giả xem) */
    recentViewers?: StoryViewDto[];
}

/** Nhóm các Story đang hoạt động của một người dùng (dùng cho Story Tray) */
export interface ActiveStoryDto {
    userId: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    /** Danh sách các story đang active, sắp xếp cũ nhất trước */
    stories: StoryResponseDto[];
    /** Tổng số story đang active */
    storyCount: number;
    /** Số story người dùng hiện tại chưa xem */
    unviewedCount: number;
    /** Đã xem hết tất cả story của người này chưa */
    isAllViewed: boolean;
    /** Thời điểm story mới nhất được đăng */
    latestStoryCreatedAt: string;
}

/** Payload để tạo Story mới */
export interface CreateStoryDto {
    content?: string | null;
    mediaUrl: string;
    type: MediaType;
    privacy?: PrivacyLevel;
    /** Thời gian tồn tại (giờ). Mặc định 24 */
    durationHours?: number;
}

// ──────────────────────────────────────────────────────────────
// Request / Response Wrappers (tuỳ chọn, đồng bộ với ApiResponse<T>)
// ──────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    isSuccess: boolean;
    message: string;
    data?: T;
    errors?: string[];
    traceId?: string | null;
    timestamp: string;
    statusCode: number;
}

export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}