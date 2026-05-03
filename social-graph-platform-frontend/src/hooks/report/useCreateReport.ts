// hooks/report/useCreateReport.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../../api/reportApi';
import type { CreatePostReportRequest } from '../../types/report';

/**
 * Mutation tạo báo cáo mới.
 * Tự động invalidate danh sách báo cáo của user sau khi thành công.
 */
export const useCreateReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostReportRequest) => reportApi.createReport(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myReports'] });
        },
    });
};