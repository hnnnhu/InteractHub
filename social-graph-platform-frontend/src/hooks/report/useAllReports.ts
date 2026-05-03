// hooks/report/useAllReports.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import type { ReportFilterParams, PagedResult, PostReportResponse } from '../../types/report';

/**
 * Admin/Moderator: Lấy toàn bộ danh sách báo cáo (có lọc, phân trang).
 * Sử dụng placeholderData để tránh giật layout khi chuyển trang.
 */
export const useAllReports = (params: ReportFilterParams = { pageNumber: 1, pageSize: 20 }) => {
    return useQuery<PagedResult<PostReportResponse>>({
        queryKey: ['allReports', params],
        queryFn: async () => {
            const res = await reportApi.getAllReports(params);
            if (!res.isSuccess) throw new Error(res.message || 'Lỗi tải danh sách báo cáo');
            return res.data;
        },
        placeholderData: keepPreviousData,
    });
};