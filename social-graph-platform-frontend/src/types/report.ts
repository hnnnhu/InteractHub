// types/report.ts

// ============================================================
// 1. ENUMS (const objects + union types – erasable, đồng bộ số)
// ============================================================

/**
 * Lý do báo cáo (ReportReason enum trong C#)
 */
export const ReportReason = {
    Spam: 1,                 // Rác / Quảng cáo trái phép
    Harassment: 2,           // Bắt nạt / Quấy rối
    HateSpeech: 3,           // Ngôn từ kích động thù địch
    NudityOrSexualContent: 4,// Ảnh khỏa thân / Nội dung tình dục
    Violence: 5,             // Bạo lực
    FalseInformation: 6,     // Thông tin sai lệch / Fake news
    Other: 7,                // Lý do khác
} as const;

export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

/**
 * Mô tả tiếng Việt cho từng lý do (dùng hiển thị)
 */
export const ReportReasonDescriptions: Record<ReportReason, string> = {
    [ReportReason.Spam]: 'Rác / Quảng cáo trái phép',
    [ReportReason.Harassment]: 'Bắt nạt / Quấy rối',
    [ReportReason.HateSpeech]: 'Ngôn từ kích động thù địch',
    [ReportReason.NudityOrSexualContent]: 'Ảnh khỏa thân / Nội dung tình dục',
    [ReportReason.Violence]: 'Bạo lực',
    [ReportReason.FalseInformation]: 'Thông tin sai lệch / Fake news',
    [ReportReason.Other]: 'Lý do khác',
};

/**
 * Trạng thái xử lý báo cáo (ReportStatus enum)
 */
export const ReportStatus = {
    Pending: 1,   // Đang chờ Admin xử lý
    Reviewed: 2,  // Admin đang xem xét
    Resolved: 3,  // Đã giải quyết
    Dismissed: 4, // Bị bác bỏ
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

// ============================================================
// 2. REQUEST DTOs
// ============================================================

/**
 * Dữ liệu gửi lên khi tạo báo cáo bài viết mới
 * (CreatePostReportDto)
 */
export interface CreatePostReportRequest {
    /** ID bài viết cần báo cáo */
    postId: string;
    /** Lý do báo cáo */
    reason: ReportReason;
    /** Chi tiết bổ sung (tối đa 1000 ký tự) */
    details?: string;
}

/**
 * Dữ liệu gửi lên khi Admin/Moderator xử lý (Resolve/Dismiss)
 * (ResolveReportDto)
 */
export interface ResolveReportRequest {
    /** Ghi chú từ người xử lý (tối đa 500 ký tự) */
    notes?: string | null;
}

// ============================================================
// 3. RESPONSE DTOs
// ============================================================

/**
 * Đối tượng Id đơn giản (IdDto)
 */
export interface IdDto {
    id: string;
}

/**
 * Một lý do báo cáo trong danh sách trả về
 * (ReportReasonDto)
 */
export interface ReportReasonItem {
    reason: ReportReason;
    /** Nhãn hiển thị (ví dụ "Spam") */
    label: string;
    /** Mô tả chi tiết bằng ngôn ngữ người dùng */
    description: string;
}

/**
 * Dữ liệu chi tiết một báo cáo bài viết
 * (PostReportResponseDto)
 */
export interface PostReportResponse {
    id: string;
    postId: string;
    reporterId: string;

    // Thông tin người báo cáo
    reporterUserName: string;
    reporterFullName: string;
    reporterAvatarUrl?: string | null;

    // Thông tin bài viết bị báo cáo
    postContent: string;
    postMediaUrl?: string | null;
    postAuthorUserName: string;

    // Nội dung báo cáo
    reason: ReportReason;
    reasonLabel: string;          // Chuỗi hóa của reason (vd: "Spam")
    details?: string | null;

    // Trạng thái xử lý
    status: ReportStatus;
    statusLabel: string;          // Chuỗi hóa của status (vd: "Pending")

    // Thời gian (ISO 8601)
    createdAt: string;
    updatedAt?: string | null;

    // Người xử lý (Admin/Mod)
    processedById?: string | null;
    processedByUserName?: string | null;
}

// ============================================================
// 4. GENERIC & PHÂN TRANG
// ============================================================

/**
 * Kết quả phân trang dùng chung (PagedResult<T>)
 */
export interface PagedResult<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    /** Tổng số trang */
    totalPages: number;
    /** Có trang trước không */
    hasPreviousPage?: boolean;
    /** Có trang sau không */
    hasNextPage?: boolean;
}

/**
 * Response chuẩn từ API (ApiResponse<T>)
 */
export interface ApiResponse<T = null> {
    isSuccess: boolean;
    /** Dữ liệu trả về (có thể null) */
    data: T;
    /** Thông báo từ server */
    message?: string;
    /** Lỗi chi tiết (có thể là mảng hoặc dictionary) */
    errors?: string[] | Record<string, string[]>;
}

/**
 * Response không có data (ApiResponse<null>)
 */
export type ApiResponseWithoutData = ApiResponse<null>;

// ============================================================
// 5. QUERY PARAMETERS (cho lọc & phân trang)
// ============================================================

/**
 * Tham số phân trang
 */
export interface PaginationParams {
    pageNumber?: number;
    pageSize?: number;
}

/**
 * Tham số lọc cho Admin/Mod khi lấy toàn bộ báo cáo
 */
export interface ReportFilterParams extends PaginationParams {
    status?: ReportStatus;          // Lọc theo trạng thái
    reason?: ReportReason;          // Lọc theo lý do
    fromDate?: string;              // ISO 8601, ngày bắt đầu
    toDate?: string;                // ISO 8601, ngày kết thúc
}