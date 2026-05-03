// src/hooks/useFriendshipActions.ts

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { friendshipApi } from '../api/friendshipApi';
import type { ApiResponse } from '../types/friendship'; // Import kiểu trả về chuẩn xác

export default function useFriendshipActions() {
    const [isMutating, setIsMutating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async (
        action: () => Promise<ApiResponse>, // Đã thay thế Promise<any> bằng Promise<ApiResponse>
        onSuccess?: () => void,
        onError?: (errMessage: string) => void
    ) => {
        setIsMutating(true);
        setError(null);
        try {
            const res = await action();
            if (res.isSuccess) {
                if (onSuccess) onSuccess();
                return true;
            } else {
                throw new Error(res.message || 'Thao tác không thành công.');
            }
        } catch (err: unknown) {
            let errMsg = 'Lỗi hệ thống khi thực hiện thao tác.';
            if (isAxiosError(err) && err.response?.data?.message) {
                errMsg = err.response.data.message;
            } else if (err instanceof Error) {
                errMsg = err.message;
            }
            setError(errMsg);
            if (onError) onError(errMsg);
            return false;
        } finally {
            setIsMutating(false);
        }
    };

    // --- Các phương thức public ---

    const sendRequest = (addresseeId: string, onSuccess?: () => void, onError?: (msg: string) => void) => {
        return handleAction(() => friendshipApi.sendRequest({ addresseeId }), onSuccess, onError);
    };

    const acceptRequest = (friendshipId: string, onSuccess?: () => void, onError?: (msg: string) => void) => {
        return handleAction(() => friendshipApi.acceptRequest(friendshipId), onSuccess, onError);
    };

    const rejectRequest = (friendshipId: string, onSuccess?: () => void, onError?: (msg: string) => void) => {
        return handleAction(() => friendshipApi.rejectRequest(friendshipId), onSuccess, onError);
    };

    const cancelRequest = (friendshipId: string, onSuccess?: () => void, onError?: (msg: string) => void) => {
        return handleAction(() => friendshipApi.cancelRequest(friendshipId), onSuccess, onError);
    };

    const unfriend = (friendId: string, onSuccess?: () => void, onError?: (msg: string) => void) => {
        return handleAction(() => friendshipApi.unfriend(friendId), onSuccess, onError);
    };

    return {
        sendRequest,
        acceptRequest,
        rejectRequest,
        cancelRequest,
        unfriend,
        isMutating,
        error
    };
}