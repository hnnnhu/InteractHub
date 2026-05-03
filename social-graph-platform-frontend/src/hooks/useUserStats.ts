// src/hooks/useUserStats.ts

import { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import userApi from '../api/userApi';
import type { UserStatsDto } from '../types/user';

export default function useUserStats(userId?: string) {
    const [stats, setStats] = useState<UserStatsDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!userId);
    const [error, setError] = useState<string | null>(null);

    // Kỹ thuật React 18: Reset trạng thái ngay trong chu kỳ Render nếu tham số (userId) bị đổi
    const [prevUserId, setPrevUserId] = useState(userId);

    if (userId !== prevUserId) {
        setPrevUserId(userId);
        setIsLoading(!!userId); // Chỉ bật loading nếu có userId truyền vào
        setError(null);
        setStats(null);
    }

    // Effect thực thi lấy dữ liệu ngầm (Asynchronous)
    useEffect(() => {
        let isMounted = true; // Cờ theo dõi component có bị unmount chưa

        const loadStatsAsync = async () => {
            if (!userId) return; // Bỏ qua nếu chưa có ID

            try {
                const res = await userApi.getUserStats(userId);

                if (!isMounted) return; // Nếu user đã sang trang khác, hủy bỏ việc cập nhật state

                if (res.isSuccess && res.data) {
                    setStats(res.data);
                } else {
                    setError(res.message || 'Không thể tải thống kê.');
                }
            } catch (err: unknown) {
                if (!isMounted) return;

                console.error("Lỗi tải thống kê user:", err);
                if (isAxiosError(err) && err.response?.data?.message) {
                    setError(err.response.data.message);
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Lỗi kết nối máy chủ.');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadStatsAsync();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [userId]);

    // Hàm gọi lại dữ liệu thủ công (Ví dụ: Dùng khi người dùng bấm nút "Làm mới")
    const refetch = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await userApi.getUserStats(userId);
            if (res.isSuccess && res.data) {
                setStats(res.data);
            } else {
                setError(res.message || 'Không thể tải thống kê.');
            }
        } catch (err: unknown) {
            console.error("Lỗi refetch thống kê user:", err);
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
    }, [userId]);

    return { stats, isLoading, error, refetch, setStats };
}