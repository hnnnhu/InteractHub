// src/types/block.ts

// ==========================================
// 1. ENUMS & WRAPPERS (Import từ common nếu cần, nếu chưa có thì định nghĩa cục bộ)
// ==========================================

/**
 * Wrapper phân trang chuẩn của toàn hệ thống.
 * (Bạn có thể import từ một file common nếu đã có, nhưng để tự chứa tôi định nghĩa lại)
 */
export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * Wrapper API Response chuẩn.
 * (Tham khảo ApiResponse.cs trong backend)
 */
export interface ApiResponse<T = void> {
    isSuccess: boolean;
    message?: string | null;
    data?: T | null;
    errors?: string[] | null;
}

// ==========================================
// 2. REQUEST DTOs (Dữ liệu gửi lên Backend)
// ==========================================

/**
 * Payload gửi lên để chặn một người dùng.
 * Tương ứng với BlockUserDto.cs
 */
export interface BlockUserRequest {
    /** ID của người dùng cần chặn (Guid) */
    blockedId: string;
}

// ==========================================
// 3. RESPONSE DTOs (Dữ liệu nhận từ Backend)
// ==========================================

/**
 * Thông tin một người dùng đã bị chặn (xuất hiện trong danh sách chặn).
 * Tương ứng với BlockedUserDto.cs
 */
export interface BlockedUserInfo {
    /** ID của bản ghi Block */
    blockId: string;
    /** ID của người bị chặn */
    blockedId: string;
    /** Username của người bị chặn */
    userName: string;
    /** Họ tên đầy đủ của người bị chặn */
    fullName: string;
    /** URL ảnh đại diện */
    avatarUrl?: string | null;
    /** Tiểu sử (bio) */
    bio?: string | null;
    /** Thời điểm bắt đầu chặn (ISO 8601) */
    blockedAt: string;
    /** Thời điểm cập nhật gần nhất (có thể null) */
    updatedAt?: string | null;
}

/**
 * Trạng thái chặn hai chiều giữa người dùng hiện tại và một người dùng khác.
 * Tương ứng với BlockStatusDto.cs
 */
export interface BlockStatus {
    /** Người dùng hiện tại có đang chặn đối phương không */
    isBlockedByMe: boolean;
    /** Đối phương có đang chặn người dùng hiện tại không */
    hasBlockedMe: boolean;
    /** Tổng hợp: true nếu bất kỳ bên nào chặn bên kia (không thể tương tác) */
    isAnyBlocked: boolean;
}

// ==========================================
// 4. QUERY PARAMS (Dành cho GET /api/blocks)
// ==========================================

/**
 * Các tham số truy vấn khi lấy danh sách người dùng bị chặn.
 * Hỗ trợ tìm kiếm, sắp xếp và phân trang.
 */
export interface GetBlockedUsersParams {
    /** Từ khóa tìm kiếm theo tên hoặc username */
    search?: string;
    /** Cột sắp xếp: 'createdat', 'name', 'username' */
    sortBy?: string;
    /** Hướng sắp xếp: 'asc' hoặc 'desc' */
    sortDirection?: string;
    /** Số trang (bắt đầu từ 1) */
    pageNumber?: number;
    /** Số lượng bản ghi mỗi trang */
    pageSize?: number;
}