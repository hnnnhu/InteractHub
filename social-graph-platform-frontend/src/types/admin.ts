// src/types/admin.ts

// ============================================================
// 1. CÁC KIỂU DỮ LIỆU CHUNG
// ============================================================

/**
 * Response wrapper chuẩn từ API.
 * Tương đồng với ApiResponse<T> trong backend.
 */
export interface ApiResponse<T = void> {
    isSuccess: boolean;
    message?: string;
    data?: T;
    errors?: string[] | null;
}

/**
 * Kết quả phân trang có đầy đủ meta‑data.
 */
export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
}

// ============================================================
// 2. DASHBOARD
// ============================================================

/** Dữ liệu cho trang Dashboard admin – GET /api/admin/dashboard */
export interface AdminDashboard {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalReactions: number;
    pendingReports: number;
}

// ============================================================
// 3. QUẢN LÝ NGƯỜI DÙNG
// ============================================================

/**
 * Thông tin tóm tắt của một người dùng dùng trong danh sách,
 * đã mở rộng để phục vụ đầy đủ bảng admin.
 */
export interface AdminUserSummary {
    id: string;
    userName: string;
    fullName: string;
    avatarUrl?: string | null;

    /** Email (chỉ admin mới thấy) */
    email?: string;

    /** Số người theo dõi */
    followerCount?: number;
    /** Số bài viết */
    postCount?: number;


    /** Trạng thái tài khoản: Active / Banned / Unverified */
    status?: string;

    /** Ngày tạo tài khoản (ISO 8601) */
    createdAt?: string;

    // Giữ lại một số trường để tương thích ngược (nếu có)
    isFriend?: boolean;
    friendshipStatus?: number | null;
    isCloseFriend?: boolean;
}

/**
 * Chi tiết một người dùng (dành cho trang chi tiết hoặc drawer).
 * GET /api/admin/users/{userId}
 */
export interface AdminUserDetail {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    bio?: string | null;

    /** Cấp độ hiển thị profile (dạng chuỗi: Public, FriendsOnly…) */
    profileVisibility: string;

    /** Ngày tạo tài khoản */
    createdAt: string;

    /** Đã xoá mềm chưa */
    isDeleted: boolean;
    /** Đang bị khoá không */
    isBanned: boolean;

    /** Danh sách vai trò (vd: ["User", "Admin"]) */
    roles: string[];

    // Các thống kê bổ sung
    followerCount?: number;
    postCount?: number;
    storyCount?: number;
}

/** Tham số truy vấn khi lấy danh sách người dùng */
export interface AdminUsersQuery {
    keyword?: string;
    pageNumber?: number;
    pageSize?: number;
}

// ============================================================
// 4. QUẢN LÝ BÀI VIẾT
// ============================================================

/** Một bài viết trong danh sách quản trị */
export interface AdminPost {
    id: string;
    userId: string;
    authorName: string;
    content?: string;
    privacy: string;
    createdAt: string;
    isDeleted: boolean;
    // Các trường bổ sung cho giao diện Card
    firstMediaUrl?: string;      // thumbnail
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
}

/** Tham số truy vấn cho danh sách bài viết */
export interface AdminPostsQuery {
    keyword?: string;
    pageNumber?: number;
    pageSize?: number;
}

// ============================================================
// 5. QUẢN LÝ BÁO CÁO
// (Các interface chính đã có trong report.ts,
//  Admin chỉ cần sử dụng lại: PostReportResponse, ReportFilterParams, …)
// ============================================================

// ============================================================
// 6. TYPE ALIASES CHO RESPONSE (tiện lợi khi gọi API)
// ============================================================

/** Response cho GET /api/admin/dashboard */
export type DashboardResponse = ApiResponse<AdminDashboard>;

/** Response cho GET /api/admin/users (danh sách người dùng) */
export type AdminUsersResponse = ApiResponse<PagedResult<AdminUserSummary>>;

/** Response cho GET /api/admin/users/{id} (chi tiết người dùng) */
export type AdminUserDetailResponse = ApiResponse<AdminUserDetail>;

/** Response cho các thao tác POST/DELETE (ban, unban, gán/xoá role) */
export type AdminActionResponse = ApiResponse;   // tương đương ApiResponse<void>

/** Response cho GET /api/admin/posts */
export type AdminPostsResponse = ApiResponse<PagedResult<AdminPost>>;