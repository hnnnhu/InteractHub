// src/api/reportApi.ts

import axiosInstance from './axiosInstance';
import type {
    ApiResponse,
    CreatePostReportRequest,
    IdDto,
    PagedResult,
    PostReportResponse,
    ReportReasonItem,
    ReportFilterParams,
    PaginationParams,
} from '../types/report';

// ==========================================
// 1. HẰNG ENDPOINT (Định nghĩa tập trung)
// ==========================================

export const REPORT_ENDPOINTS = {
    BASE: '/reports',
    REASONS: '/reports/reasons',
    MY_REPORTS: '/reports/me',
    /** @returns `/reports/{id}` – Admin/Moderator xem chi tiết */
    ADMIN_DETAIL: (reportId: string) => `/reports/${reportId}`,
    /** @returns `/reports/me/{id}` – Người dùng xem chi tiết báo cáo của chính mình */
    MY_REPORT_DETAIL: (reportId: string) => `/reports/me/${reportId}`,
    /** @returns `/reports/{id}/resolve` */
    RESOLVE: (reportId: string) => `/reports/${reportId}/resolve`,
    /** @returns `/reports/{id}/review` */
    REVIEW: (reportId: string) => `/reports/${reportId}/review`,
    /** @returns `/reports/{id}/dismiss` */
    DISMISS: (reportId: string) => `/reports/${reportId}/dismiss`,
} as const;

// ==========================================
// 2. HELPER CHUẨN HÓA URL ẢNH / MEDIA
// ==========================================

const resolveUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseURL = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    const rootUrl = baseURL.replace(/\/api\/?$/, '');
    return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ==========================================
// 3. API FUNCTIONS
// ==========================================

export const reportApi = {
    /**
     * Gửi báo cáo vi phạm cho một bài viết
     * POST /api/reports
     */
    async createReport(data: CreatePostReportRequest): Promise<ApiResponse<IdDto>> {
        const response = await axiosInstance.post<ApiResponse<IdDto>>(
            REPORT_ENDPOINTS.BASE,
            data
        );
        return response.data;
    },

    /**
     * Lấy danh sách các lý do báo cáo (không yêu cầu đăng nhập)
     * GET /api/reports/reasons
     */
    async getReasons(): Promise<ApiResponse<ReportReasonItem[]>> {
        const response = await axiosInstance.get<ApiResponse<ReportReasonItem[]>>(
            REPORT_ENDPOINTS.REASONS
        );
        return response.data;
    },

    /**
     * Lấy lịch sử báo cáo của chính người dùng hiện tại
     * GET /api/reports/me
     */
    async getMyReports(
        params?: PaginationParams
    ): Promise<ApiResponse<PagedResult<PostReportResponse>>> {
        const response = await axiosInstance.get<ApiResponse<PagedResult<PostReportResponse>>>(
            REPORT_ENDPOINTS.MY_REPORTS,
            { params }
        );

        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map((item) => ({
                ...item,
                reporterAvatarUrl: resolveUrl(item.reporterAvatarUrl) ?? undefined,
                postMediaUrl: resolveUrl(item.postMediaUrl) ?? undefined,
            }));
        }
        return response.data;
    },

    /**
     * Người dùng xem chi tiết một báo cáo của chính mình
     * GET /api/reports/me/{id}
     */
    async getMyReportDetail(reportId: string): Promise<ApiResponse<PostReportResponse>> {
        const response = await axiosInstance.get<ApiResponse<PostReportResponse>>(
            REPORT_ENDPOINTS.MY_REPORT_DETAIL(reportId)
        );

        if (response.data?.data) {
            const report = response.data.data;
            report.reporterAvatarUrl = resolveUrl(report.reporterAvatarUrl) ?? undefined;
            report.postMediaUrl = resolveUrl(report.postMediaUrl) ?? undefined;
        }
        return response.data;
    },

    /**
     * Admin/Moderator lấy toàn bộ danh sách báo cáo (hỗ trợ lọc)
     * GET /api/reports
     */
    async getAllReports(
        params?: ReportFilterParams
    ): Promise<ApiResponse<PagedResult<PostReportResponse>>> {
        const response = await axiosInstance.get<ApiResponse<PagedResult<PostReportResponse>>>(
            REPORT_ENDPOINTS.BASE,
            { params }
        );

        if (response.data?.data?.items) {
            response.data.data.items = response.data.data.items.map((item) => ({
                ...item,
                reporterAvatarUrl: resolveUrl(item.reporterAvatarUrl) ?? undefined,
                postMediaUrl: resolveUrl(item.postMediaUrl) ?? undefined,
            }));
        }
        return response.data;
    },

    /**
     * Admin/Moderator xem chi tiết một báo cáo
     * GET /api/reports/{id}
     */
    async getReportDetail(reportId: string): Promise<ApiResponse<PostReportResponse>> {
        const response = await axiosInstance.get<ApiResponse<PostReportResponse>>(
            REPORT_ENDPOINTS.ADMIN_DETAIL(reportId)
        );

        if (response.data?.data) {
            const report = response.data.data;
            report.reporterAvatarUrl = resolveUrl(report.reporterAvatarUrl) ?? undefined;
            report.postMediaUrl = resolveUrl(report.postMediaUrl) ?? undefined;
        }
        return response.data;
    },

    /**
     * Admin/Moderator xử lý và hoàn tất báo cáo (Resolve)
     * POST /api/reports/{id}/resolve
     */
    async resolveReport(reportId: string, notes?: string | null): Promise<ApiResponse<null>> {
        const response = await axiosInstance.post<ApiResponse<null>>(
            REPORT_ENDPOINTS.RESOLVE(reportId),
            { notes }    // Gửi trong body thay vì query
        );
        return response.data;
    },

    /**
     * Admin/Moderator đánh dấu báo cáo đang xem xét (Review)
     * POST /api/reports/{id}/review
     */
    async markAsReviewed(reportId: string): Promise<ApiResponse<null>> {
        const response = await axiosInstance.post<ApiResponse<null>>(
            REPORT_ENDPOINTS.REVIEW(reportId)
        );
        return response.data;
    },

    /**
     * Admin/Moderator bác bỏ báo cáo (Dismiss)
     * POST /api/reports/{id}/dismiss
     */
    async dismissReport(reportId: string, notes?: string | null): Promise<ApiResponse<null>> {
        const response = await axiosInstance.post<ApiResponse<null>>(
            REPORT_ENDPOINTS.DISMISS(reportId),
            { notes }    // Gửi trong body
        );
        return response.data;
    },
};

export default reportApi;