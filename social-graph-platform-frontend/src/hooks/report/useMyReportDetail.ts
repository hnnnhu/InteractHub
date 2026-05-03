// hooks/report/useMyReportDetail.ts
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import type { PostReportResponse } from '../../types/report';

/**
 * Người dùng xem chi tiết một báo cáo của chính mình.
 * Chỉ kích hoạt khi có reportId.
 */
export const useMyReportDetail = (reportId?: string) => {
    return useQuery<PostReportResponse>({
        queryKey: ['myReportDetail', reportId],
        queryFn: async () => {
            if (!reportId) throw new Error('Thiếu ID báo cáo');
            const res = await reportApi.getMyReportDetail(reportId);
            if (!res.isSuccess) throw new Error(res.message || 'Không tìm thấy báo cáo');
            return res.data;
        },
        enabled: !!reportId,
    });
};