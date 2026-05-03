// src/context/useNotificationContext.ts

import { useContext } from 'react';
import { NotificationContext } from './NotificationContext';
import type { NotificationContextValue } from './NotificationContext';

export function useNotificationContext(): NotificationContextValue {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            'useNotificationContext must be used inside a <NotificationProvider>'
        );
    }
    return context;
}