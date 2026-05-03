// hooks/report/useResolveReport.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';

/**
 * Admin/Moderator: Xử lý (Resolve) báo cáo.
 * Invalidate cả danh sách và chi tiết sau khi thành công.
 */
export const useResolveReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reportId, notes }: { reportId: string; notes?: string | null }) =>
            reportApi.resolveReport(reportId, notes),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['allReports'] });
            queryClient.invalidateQueries({ queryKey: ['reportDetail', variables.reportId] });
        },
    });
};