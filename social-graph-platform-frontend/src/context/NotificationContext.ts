// context/NotificationContext.ts

import { createContext } from 'react';
import type { NotificationResponseDto, NotificationSettingsDto } from '../types/notification';

export interface NotificationContextValue {
    unreadCount: number | null;
    unreadLoading: boolean;
    unreadError: string | null;
    refreshUnreadCount: () => void;

    notifications: NotificationResponseDto[];
    notificationsLoading: boolean;
    notificationsError: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refreshNotifications: () => void;

    markAsRead: (notificationIds: string[]) => Promise<boolean>;
    markAllAsRead: () => Promise<boolean>;
    markLoading: boolean;
    markError: string | null;

    settings: NotificationSettingsDto | null;
    settingsLoading: boolean;
    settingsSaving: boolean;
    settingsError: string | null;
    saveSettings: (newSettings: NotificationSettingsDto) => Promise<boolean>;
    refreshSettings: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);