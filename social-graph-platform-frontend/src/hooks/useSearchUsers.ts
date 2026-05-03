// src/hooks/useSearchUsers.ts

import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import userApi from '../api/userApi';
import type { UserSummaryDto } from '../types/user';

export default function useSearchUsers(initialPageSize: number = 10) {
    const [users, setUsers] = useState<UserSummaryDto[]>([]);

    // Quản lý trạng thái tải (Load lần đầu vs Load thêm)
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Quản lý phân trang
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [currentKeyword, setCurrentKeyword] = useState<string>('');

    /**
     * Hàm gọi tìm kiếm mới hoàn toàn (Reset trang về 1)
     */
    const search = useCallback(async (keyword: string) => {
        setIsLoading(true);
        setError(null);
        setCurrentKeyword(keyword);
        setCurrentPage(1);

        try {
            const res = await userApi.searchUsers({
                keyword,
                pageNumber: 1,
                pageSize: initialPageSize
            });

            if (res.isSuccess && res.data) {
                setUsers(res.data.items);
                setHasMore(res.data.hasNextPage);
            } else {
                setError(res.message || 'Không thể lấy kết quả tìm kiếm.');
            }
        } catch (err: unknown) {
            console.error("Lỗi tìm kiếm:", err);
            // Xử lý lỗi an toàn, không dùng 'any'
            if (isAxiosError(err) && err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Lỗi kết nối máy chủ.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [initialPageSize]);

    /**
     * Hàm tải thêm kết quả (Load More / Infinite Scroll)
     */
    const loadMore = useCallback(async () => {
        // Chặn spam click nếu đang tải hoặc đã hết dữ liệu
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        setError(null);
        const nextPage = currentPage + 1;

        try {
            const res = await userApi.searchUsers({
                keyword: currentKeyword,
                pageNumber: nextPage,
                pageSize: initialPageSize
            });

            if (res.isSuccess && res.data) {
                setUsers(prev => {
                    // Lọc trùng lặp bằng Set (Đảm bảo an toàn nếu Backend vô tình trả về trùng ID)
                    const existingIds = new Set(prev.map(u => u.id));
                    const newUsers = res.data!.items.filter(u => !existingIds.has(u.id));
                    return [...prev, ...newUsers];
                });
                setHasMore(res.data.hasNextPage);
                setCurrentPage(nextPage);
            }
        } catch (err: unknown) {
            console.error('Lỗi khi tải thêm danh sách:', err);
            setError('Không thể tải thêm dữ liệu');
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, currentKeyword, hasMore, isLoadingMore, initialPageSize]);

    return {
        users,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        search,
        loadMore,
        setUsers // Xuất thêm setUsers để component cha có thể tự cập nhật UI (Optimistic UI) nếu cần
    };
}