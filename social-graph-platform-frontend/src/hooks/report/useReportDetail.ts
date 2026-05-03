// hooks/report/useReportDetail.ts
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import type { PostReportResponse } from '../../types/report';

/**
 * Admin/Moderator: Xem chi tiết một báo cáo.
 */
export const useReportDetail = (reportId?: string) => {
    return useQuery<PostReportResponse>({
        queryKey: ['reportDetail', reportId],
        queryFn: async () => {
            if (!reportId) throw new Error('Thiếu ID báo cáo');
            const res = await reportApi.getReportDetail(reportId);
            if (!res.isSuccess) throw new Error(res.message || 'Không tìm thấy báo cáo');
            return res.data;
        },
        enabled: !!reportId,
    });
};