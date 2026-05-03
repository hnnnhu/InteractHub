// hooks/report/useMyReports.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import type { PaginationParams, PagedResult, PostReportResponse } from '../../types/report';

/**
 * Lấy lịch sử báo cáo của người dùng hiện tại (phân trang)
 */
export const useMyReports = (params: PaginationParams = { pageNumber: 1, pageSize: 10 }) => {
    return useQuery<PagedResult<PostReportResponse>>({
        queryKey: ['myReports', params],
        queryFn: async () => {
            const res = await reportApi.getMyReports(params);
            if (!res.isSuccess) throw new Error(res.message || 'Lỗi tải danh sách báo cáo');
            return res.data;
        },
        placeholderData: keepPreviousData,
    });
};