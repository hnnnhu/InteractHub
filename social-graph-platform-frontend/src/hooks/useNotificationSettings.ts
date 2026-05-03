// hooks/useNotificationSettings.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../api/notificationApi';
import type { NotificationSettingsDto } from '../types/notification';

interface UseNotificationSettingsReturn {
    settings: NotificationSettingsDto | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    saveSettings: (newSettings: NotificationSettingsDto) => Promise<boolean>;
    refresh: () => void;
}

const DEFAULT_SETTINGS: NotificationSettingsDto = {
    enableAllNotifications: true,
    friendRequest: true,
    friendAccepted: true,
    postReaction: true,
    postComment: true,
    storyReaction: true,
    mention: true,
    pushEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 7,
    enableEmailNotification: false,
};

const getToken = (): string | null => localStorage.getItem('accessToken');

export const useNotificationSettings = (): UseNotificationSettingsReturn => {
    const [settings, setSettings] = useState<NotificationSettingsDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchSettings = useCallback(async () => {
        if (!getToken()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await notificationApi.getNotificationSettings();
            if (!isMounted.current) return;
            if (res.isSuccess && res.data) {
                setSettings(res.data);
            } else {
                setSettings(DEFAULT_SETTINGS);
            }
        } catch {
            if (isMounted.current) {
                setSettings(DEFAULT_SETTINGS);
                setError('Không thể tải cài đặt, dùng mặc định');
            }
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const load = () => {
            if (getToken()) fetchSettings();
        };
        load();
        window.addEventListener('storage', load);
        window.addEventListener('auth-change', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('auth-change', load);
        };
    }, [fetchSettings]);

    const saveSettings = useCallback(async (newSettings: NotificationSettingsDto): Promise<boolean> => {
        setSaving(true);
        setError(null);
        try {
            const res = await notificationApi.updateNotificationSettings(newSettings);
            if (!isMounted.current) return false;
            if (res.isSuccess) {
                setSettings(newSettings);
                return true;
            }
            setError(res.message ?? 'Lưu thất bại');
            return false;
        } catch {
            if (isMounted.current) setError('Lỗi kết nối');
            return false;
        } finally {
            if (isMounted.current) setSaving(false);
        }
    }, []);

    const refresh = useCallback(() => {
        if (getToken()) fetchSettings();
    }, [fetchSettings]);

    return { settings, loading, saving, error, saveSettings, refresh };
};