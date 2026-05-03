// types/friendship.ts

// ============================================================================
// 1. ENUMS
// ============================================================================

/**
 * Trạng thái của một mối quan hệ bạn bè.
 * Khớp hoàn toàn với enum FriendshipStatus (.NET)
 */
export const FriendshipStatus = {
    Pending: 1,
    Accepted: 2,
    Declined: 3,
    Removed: 4,
    Canceled: 5
} as const;

export type FriendshipStatus = (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

// ============================================================================
// 2. REQUEST DTOs
// ============================================================================

export interface SendFriendRequestDto {
    addresseeId: string;
}

export interface AddCloseFriendDto {
    friendId: string;
}

export interface RemoveCloseFriendDto {
    friendId: string;
}

// ============================================================================
// 3. RESPONSE DTOs
// ============================================================================

export interface FriendRequestResponseDto {
    friendshipId: string;
    requesterId: string;
    requesterUserName: string;
    requesterFullName: string;
    requesterAvatarUrl?: string | null;
    requesterBio?: string | null;
    status: FriendshipStatus;
    createdAt: string;
}

export interface SentFriendRequestResponseDto {
    friendshipId: string;
    addresseeId: string;
    addresseeUserName: string;
    addresseeFullName: string;
    addresseeAvatarUrl?: string | null;
    status: FriendshipStatus;
    createdAt: string;
}

export interface FriendshipResponseDto {
    id: string;
    requesterId: string;
    requesterUserName: string;
    requesterFullName: string;
    requesterAvatarUrl?: string | null;
    addresseeId: string;
    addresseeUserName: string;
    addresseeFullName: string;
    addresseeAvatarUrl?: string | null;
    status: FriendshipStatus;
    statusLabel: string;
    isCloseFriend: boolean;       // <-- ĐÃ THÊM
    createdAt: string;
    updatedAt?: string | null;
}

export interface FriendSuggestionDto {
    userId: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    suggestionReason?: string | null;
    mutualFriendsCount: number;
}

export interface FriendCountResponseDto {
    userId: string;
    count: number;
}

/**
 * DTO tóm tắt người dùng (dùng trong danh sách bạn thân)
 */
export interface UserSummaryDto {
    id: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;
    isFriend: boolean;
    friendshipStatus?: FriendshipStatus | null;
    isCloseFriend: boolean;       // <-- ĐÃ THÊM
}

// ============================================================================
// 4. COMMON WRAPPERS
// ============================================================================

export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}


export interface ApiResponse<T = void> {
    isSuccess: boolean;
    message?: string | null;
    data?: T | null;
    errors?: string[] | null;
}