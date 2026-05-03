// hooks/useMentionSearch.ts
import { useQuery } from '@tanstack/react-query';
import userApi from '../api/userApi';
import type { UserSummaryDto } from '../types/user';

/**
 * Hook tìm kiếm người dùng nhanh để gợi ý khi gõ @mention.
 * Sử dụng React Query để tận dụng cache và tránh gọi API liên tục.
 *
 * @param keyword – chuỗi tìm kiếm (thường là phần sau dấu @)
 * @returns danh sách người dùng, trạng thái loading và lỗi (nếu có)
 */
export function useMentionSearch(keyword: string) {
    return useQuery<UserSummaryDto[], Error>({
        queryKey: ['mentionSearch', keyword],
        queryFn: async () => {
            const res = await userApi.searchUsers({
                keyword,
                pageNumber: 1,
                pageSize: 5, // chỉ cần 5 kết quả gần nhất
            });
            if (!res.isSuccess || !res.data) {
                throw new Error(res.message || 'Không thể tìm kiếm người dùng');
            }
            return res.data.items;
        },
        enabled: keyword.trim().length > 0, // chỉ gọi khi có từ khoá
        staleTime: 30 * 1000,               // cache 30 giây
        retry: false,                        // không thử lại nếu thất bại
    });
}