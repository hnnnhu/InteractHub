// hooks/report/useReasons.ts
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import type { ReportReasonItem } from '../../types/report';

/**
 * Lấy danh sách lý do báo cáo (cache lâu vì ít thay đổi)
 */
export const useReasons = () => {
    return useQuery<ReportReasonItem[]>({
        queryKey: ['reportReasons'],
        queryFn: async () => {
            const res = await reportApi.getReasons();
            if (!res.isSuccess) throw new Error(res.message || 'Lỗi tải lý do báo cáo');
            return res.data;
        },
        staleTime: Infinity,
        gcTime: 24 * 60 * 60 * 1000, // 1 ngày
    });
};