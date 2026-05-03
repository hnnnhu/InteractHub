// hooks/report/useDismissReport.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';

/**
 * Admin/Moderator: Bác bỏ (Dismiss) báo cáo.
 */
export const useDismissReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reportId, notes }: { reportId: string; notes?: string | null }) =>
            reportApi.dismissReport(reportId, notes),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['allReports'] });
            queryClient.invalidateQueries({ queryKey: ['reportDetail', variables.reportId] });
        },
    });
};