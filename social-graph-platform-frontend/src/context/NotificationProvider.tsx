// src/context/NotificationProvider.tsx

import React, { useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { NotificationContext } from './NotificationContext';
import type { NotificationContextValue } from './NotificationContext';

interface NotificationProviderProps {
  children: ReactNode;
  pollingInterval?: number;
  pageSize?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  pollingInterval = 30000,
  pageSize = 10,
}) => {
  const {
    unreadCount,
    loading: unreadLoading,
    error: unreadError,
    refresh: refreshUnreadCount,
  } = useUnreadCount({ pollingInterval });

  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    hasMore,
    loadMore,
    refresh: refreshNotifications,
  } = useNotifications({ pageSize });

  const {
    loading: markLoading,
    error: markError,
    markAsRead: markAsReadBase,
    markAllAsRead: markAllAsReadBase,
  } = useMarkAsRead();

  const markAsRead = useCallback(
    async (ids: string[]) => {
      const success = await markAsReadBase(ids);
      if (success) refreshNotifications();
      return success;
    },
    [markAsReadBase, refreshNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    const success = await markAllAsReadBase();
    if (success) refreshNotifications();
    return success;
  }, [markAllAsReadBase, refreshNotifications]);

  const {
    settings,
    loading: settingsLoading,
    saving: settingsSaving,
    error: settingsError,
    saveSettings,
    refresh: refreshSettings,
  } = useNotificationSettings();

  const value = useMemo<NotificationContextValue>(
    () => ({
      unreadCount,
      unreadLoading,
      unreadError,
      refreshUnreadCount,
      notifications,
      notificationsLoading,
      notificationsError,
      hasMore,
      loadMore,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      markLoading,
      markError,
      settings,
      settingsLoading,
      settingsSaving,
      settingsError,
      saveSettings,
      refreshSettings,
    }),
    [
      unreadCount,
      unreadLoading,
      unreadError,
      refreshUnreadCount,
      notifications,
      notificationsLoading,
      notificationsError,
      hasMore,
      loadMore,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      markLoading,
      markError,
      settings,
      settingsLoading,
      settingsSaving,
      settingsError,
      saveSettings,
      refreshSettings,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};