// src/hooks/useUpdateProfile.ts

import { useState } from 'react';
import userApi from '../api/userApi';
import type { UpdateProfileRequest } from '../types/user';

export default function useUpdateProfile() {
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const updateProfile = async (data: UpdateProfileRequest, onSuccessCallback?: () => void) => {
        setIsUpdating(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await userApi.updateProfile(data);
            if (res.isSuccess) {
                setSuccess(true);
                if (onSuccessCallback) onSuccessCallback();
            } else {
                setError(res.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại.');
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi kết nối khi cập nhật hồ sơ.');
        } finally {
            setIsUpdating(false);
        }
    };

    return { updateProfile, isUpdating, error, success, setError };
}