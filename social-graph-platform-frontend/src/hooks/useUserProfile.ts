// src/hooks/useUserProfile.ts

import { useState, useEffect, useCallback } from 'react';
import userApi from '../api/userApi';
import type { UserProfileDto } from '../types/user';

export const USER_QUERY_KEY = 'user-profile';

type FetchType = 'me' | 'id' | 'username';

export default function useUserProfile(identifier?: string, type: FetchType = 'me') {
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Kỹ thuật React 18: Reset trạng thái ngay trong chu kỳ Render nếu tham số bị đổi
    const [prevIdentifier, setPrevIdentifier] = useState(identifier);
    const [prevType, setPrevType] = useState(type);

    if (identifier !== prevIdentifier || type !== prevType) {
        setPrevIdentifier(identifier);
        setPrevType(type);
        setIsLoading(true);
        setError(null);
        setProfile(null);
    }

    // Effect chỉ đảm nhiệm việc lấy dữ liệu ngầm (Asynchronous)
    useEffect(() => {
        let isMounted = true; // Cờ theo dõi component có bị unmount chưa

        const loadDataAsync = async () => {
            try {
                let res;
                // Hàm await đầu tiên đóng vai trò "chặn đứng" sự đồng bộ
                if (type === 'me' || !identifier) {
                    res = await userApi.getCurrentUserProfile();
                } else if (type === 'username') {
                    res = await userApi.getUserProfileByUsername(identifier);
                } else {
                    res = await userApi.getUserProfileById(identifier);
                }

                if (!isMounted) return; // Không cập nhật state nếu user đã sang trang khác

                if (res.isSuccess && res.data) {
                    setProfile(res.data);
                } else {
                    setError(res.message || 'Không thể tải thông tin người dùng.');
                }
            } catch (err: unknown) { // Đã FIX lỗi: Unexpected any
                if (!isMounted) return;

                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Lỗi kết nối đến hệ thống.');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadDataAsync();

        // Dọn dẹp cờ isMounted khi component unmount
        return () => {
            isMounted = false;
        };
    }, [identifier, type]);

    // Refetch độc lập (dành riêng cho việc gắn vào nút bấm onClick của giao diện)
    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let res;
            if (type === 'me' || !identifier) {
                res = await userApi.getCurrentUserProfile();
            } else if (type === 'username') {
                res = await userApi.getUserProfileByUsername(identifier);
            } else {
                res = await userApi.getUserProfileById(identifier);
            }

            if (res.isSuccess && res.data) {
                setProfile(res.data);
            } else {
                setError(res.message || 'Không thể tải thông tin người dùng.');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Lỗi kết nối đến hệ thống.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [identifier, type]);

    return { profile, isLoading, error, refetch, setProfile };
}