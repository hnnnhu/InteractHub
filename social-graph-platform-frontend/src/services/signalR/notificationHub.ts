// services/signalR/notificationHub.ts

import * as signalR from '@microsoft/signalr';
import axiosInstance from '../../api/axiosInstance';
import type { NotificationResponseDto } from '../../types/notification';

// ── Helper: build hub URL from API base ────────────────────────────────
function getHubUrl(): string {
    const apiBase = axiosInstance.defaults.baseURL || 'https://localhost:7042/api';
    // Replace "/api" with "/hubs" (or append if different backend convention)
    const root = apiBase.replace(/\/api\/?$/, '');
    return `${root}/hubs/notifications`;
}

// ── Event callback types ───────────────────────────────────────────────
export type NotificationReceivedCallback = (notification: NotificationResponseDto) => void;
export type UnreadCountUpdatedCallback = (unreadCount: number) => void;

// ── Singleton service ───────────────────────────────────────────────────
class NotificationHubService {
    private connection: signalR.HubConnection | null = null;

    // Callbacks registry
    private onNotificationReceivedCallbacks: NotificationReceivedCallback[] = [];
    private onUnreadCountUpdatedCallbacks: UnreadCountUpdatedCallback[] = [];

    /**
     * Start the SignalR connection. Safe to call multiple times.
     */
    async start(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('NotificationHub: No access token, skipping connection');
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(getHubUrl(), {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    // Exponential backoff up to 30 seconds
                    const delay = Math.min(
                        1000 * Math.pow(2, retryContext.previousRetryCount),
                        30000
                    );
                    return delay;
                },
            })
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // ── Register hub events ───────────────────────────────────────────
        this.connection.on('ReceiveNotification', (data: NotificationResponseDto) => {
            this.onNotificationReceivedCallbacks.forEach(cb => cb(data));
        });

        this.connection.on('UnreadCountUpdated', (count: number) => {
            this.onUnreadCountUpdatedCallbacks.forEach(cb => cb(count));
        });

        // ── Handle reconnection ───────────────────────────────────────────
        this.connection.onreconnecting(() => {
            console.log('NotificationHub: Reconnecting...');
        });

        this.connection.onreconnected(() => {
            console.log('NotificationHub: Reconnected');
            // Optionally re-fetch the latest state
        });

        this.connection.onclose(() => {
            console.log('NotificationHub: Connection closed');
        });

        try {
            await this.connection.start();
            console.log('NotificationHub: Connected successfully');
        } catch (err) {
            console.error('NotificationHub: Failed to connect', err);
            this.connection = null;
            throw err;
        }
    }

    /**
     * Stop the connection gracefully.
     */
    async stop(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }

    /**
     * Register callback for new notifications.
     * Returns an unsubscribe function.
     */
    onNotificationReceived(callback: NotificationReceivedCallback): () => void {
        this.onNotificationReceivedCallbacks.push(callback);
        return () => {
            this.onNotificationReceivedCallbacks = this.onNotificationReceivedCallbacks.filter(
                cb => cb !== callback
            );
        };
    }

    /**
     * Register callback for unread count updates.
     * Returns an unsubscribe function.
     */
    onUnreadCountUpdated(callback: UnreadCountUpdatedCallback): () => void {
        this.onUnreadCountUpdatedCallbacks.push(callback);
        return () => {
            this.onUnreadCountUpdatedCallbacks = this.onUnreadCountUpdatedCallbacks.filter(
                cb => cb !== callback
            );
        };
    }

    /**
     * Check if connected.
     */
    get isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }
}

// ── Export singleton ────────────────────────────────────────────────────
const notificationHub = new NotificationHubService();
export default notificationHub;