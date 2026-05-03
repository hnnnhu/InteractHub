// src/types/savedPost.ts

/**
 * DTO dùng để gửi yêu cầu lưu một bài viết
 */
export interface SavePostDto {
    postId: string;
    collectionName?: string; // Sẽ lấy "Mặc định" nếu để trống
}

/**
 * DTO dùng để tạo mới một bộ sưu tập (rỗng)
 */
export interface CreateCollectionDto {
    name: string;
}

/**
 * DTO dùng để cập nhật đổi tên một bộ sưu tập
 */
export interface UpdateCollectionDto {
    newName: string; // Khớp chính xác với thuộc tính NewName của C# DTO
}

/**
 * DTO chứa thông tin tóm tắt của một bài viết (dùng làm thumbnail/preview)
 */
export interface SavedPostSummaryDto {
    postId: string;
    mediaUrl?: string | null;
    savedAt: string;
}

/**
 * DTO đại diện cho một bộ sưu tập tổng quan (kèm số lượng và ảnh preview)
 */
export interface CollectionDto {
    name: string;
    savedPostCount: number;
    lastSavedAt?: string | null;
    previewPosts: SavedPostSummaryDto[];
}

/**
 * DTO chứa thông tin chi tiết đầy đủ của một bài viết đã lưu (khi xem chi tiết bộ sưu tập)
 */
export interface SavedPostResponseDto {
    // Thông tin định danh thao tác lưu
    id: string;
    postId: string;
    userId: string;
    collectionName: string;

    // Thông tin nội dung bài viết
    postContent: string;
    postMediaUrl?: string | null;
    postCreatedAt: string;

    // Thông tin tác giả bài viết
    postAuthorUserName: string;
    postAuthorFullName: string;
    postAuthorAvatarUrl?: string | null;

    // Thời gian thao tác
    savedAt: string;
    updatedAt?: string | null;
}