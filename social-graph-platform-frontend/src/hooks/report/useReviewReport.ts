// hooks/report/useReviewReport.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';

/**
 * Admin/Moderator: Đánh dấu báo cáo đang xem xét (Review).
 */
export const useReviewReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (reportId: string) => reportApi.markAsReviewed(reportId),
        onSuccess: (_data, reportId) => {
            queryClient.invalidateQueries({ queryKey: ['allReports'] });
            queryClient.invalidateQueries({ queryKey: ['reportDetail', reportId] });
        },
    });
};