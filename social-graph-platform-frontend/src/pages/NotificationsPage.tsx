// pages/NotificationsPage.tsx

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Bell, Settings, Check, Loader2, Trash2,
    Sparkles, ExternalLink, X, Layers, AtSign, RefreshCw
} from 'lucide-react';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { notificationApi } from '../api/notificationApi';
import { NotificationType } from '../types/notification';
import type { NotificationResponseDto } from '../types/notification';
import NotificationSettingsComponent from '../components/notification/NotificationSettings';
import { resolveUrl } from '../utils/notificationHelpers';   // ← đã xóa getNotificationTypeLabel

// ─── Tab Definitions ────────────────────────────────────────
interface Tab {
    key: string;
    label: string;
    types?: number[];
    unreadOnly?: boolean;
}

const TABS: Tab[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc', unreadOnly: true },
    { key: 'system', label: 'Hệ thống', types: [NotificationType.System] },
    { key: 'friend', label: 'Bạn bè', types: [NotificationType.FriendRequest, NotificationType.FriendAccepted] },
    { key: 'reaction', label: 'Cảm xúc', types: [NotificationType.PostReaction, NotificationType.StoryReaction] },
    { key: 'comment', label: 'Bình luận', types: [NotificationType.PostComment] },
    { key: 'mention', label: 'Nhắc đến', types: [NotificationType.Mention] },
];

// ─── Helpers ────────────────────────────────────────────────
const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} ngày trước`;
    return then.toLocaleDateString('vi-VN');
};

const getNotificationText = (item: NotificationResponseDto): string => {
    if (item.content?.trim()) return item.content;
    const userName = item.triggeredByUserName ?? 'Ai đó';
    switch (item.type) {
        case NotificationType.Mention:
            return `${userName} đã nhắc đến bạn trong một bài viết`;
        case NotificationType.FriendRequest:
            return `${userName} đã gửi lời mời kết bạn`;
        case NotificationType.FriendAccepted:
            return `${userName} đã chấp nhận lời mời kết bạn`;
        case NotificationType.PostReaction:
            return `${userName} đã thả cảm xúc vào bài viết của bạn`;
        case NotificationType.PostComment:
            return `${userName} đã bình luận về bài viết của bạn`;
        case NotificationType.StoryReaction:
            return `${userName} đã thả cảm xúc vào story của bạn`;
        case NotificationType.System:
            return 'Thông báo hệ thống';
        default:
            return 'Bạn có một thông báo mới';
    }
};

// ─── Main Component ─────────────────────────────────────────
const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { unreadCount, refresh: refreshUnreadCount } = useUnreadCount();
    const { markAllAsRead } = useMarkAsRead();

    const [activeTab, setActiveTab] = useState('all');
    const [cleaning, setCleaning] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const currentTab = TABS.find(t => t.key === activeTab) ?? TABS[0];

    const {
        data: notifications = [],
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery<NotificationResponseDto[]>({
        queryKey: ['notifications', { tab: activeTab, types: currentTab.types, unreadOnly: currentTab.unreadOnly }],
        queryFn: async () => {
            if (currentTab.types?.length) {
                const results = await Promise.all(
                    currentTab.types.map(type =>
                        notificationApi.getNotifications(1, 50, type, currentTab.unreadOnly)
                    )
                );
                const allItems = results
                    .filter(r => r.isSuccess && r.data?.items)
                    .flatMap(r => r.data!.items!);
                const unique = Array.from(
                    new Map(allItems.map(item => [item.id, item])).values()
                );
                return unique.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            }
            const res = await notificationApi.getNotifications(1, 50, undefined, currentTab.unreadOnly);
            if (!res.isSuccess) throw new Error(res.message ?? 'Không thể tải thông báo');
            return res.data?.items ?? [];
        },
        staleTime: 10_000,
        placeholderData: prev => prev,
    });

    // ─── Điều hướng ──────────────────────────────────────────
    const getTargetUrl = useCallback((notification: NotificationResponseDto): string | null => {
        if (notification.targetUrl) {
            const url = notification.targetUrl.trim();
            if (url.startsWith('http')) return url; // external
            let normalized = url.startsWith('/posts/') ? url.replace('/posts/', '/post/') : url;
            if (!normalized.startsWith('/')) normalized = `/${normalized}`;
            return normalized;
        }

        const entityId = notification.relatedEntityId;
        switch (notification.type) {
            case NotificationType.Mention:
            case NotificationType.PostReaction:
            case NotificationType.PostComment:
                if (entityId) return `/post/${entityId}`;
                break;
            case NotificationType.StoryReaction:
                if (entityId) return `/story/${entityId}`;
                break;
            case NotificationType.FriendRequest:
            case NotificationType.FriendAccepted:
                if (notification.triggeredByUserName) return `/profile/${notification.triggeredByUserName}`;
                return '/friends/requests';
            default:
                return null;
        }
        return null;
    }, []);

    const handleNotificationClick = useCallback(
        (notification: NotificationResponseDto) => {
            if (!notification.isRead) {
                notificationApi.markAsRead({ notificationIds: [notification.id], markAll: false })
                    .then(() => refreshUnreadCount())
                    .catch(() => { });
            }
            const target = getTargetUrl(notification);
            if (!target) return;
            if (target.startsWith('http')) {
                window.open(target, '_blank', 'noopener,noreferrer');
                return;
            }
            navigate(target);
        },
        [navigate, refreshUnreadCount, getTargetUrl]
    );

    const handleMarkAll = async () => {
        const ok = await markAllAsRead();
        if (ok) {
            refreshUnreadCount();
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    };

    const handleCleanup = async () => {
        if (!window.confirm('Xóa tất cả thông báo đã đọc quá 90 ngày?')) return;
        setCleaning(true);
        try {
            const res = await notificationApi.deleteOldNotifications(90);
            if (res.isSuccess) {
                refreshUnreadCount();
                setActiveTab('all');
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } else {
                alert(res.message ?? 'Dọn dẹp thất bại');
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi khi dọn dẹp thông báo');
        } finally {
            setCleaning(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────
    return (
        <div className="w-full max-w-3xl mx-auto pt-20 md:pt-24 pb-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#FF1493]/20 to-[#4F6BFF]/20 border border-[#FF1493]/20 shadow-[0_0_20px_rgba(255,20,147,0.15)]">
                        <Bell size={24} className="text-[#FF1493]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Thông báo</h1>
                        {unreadCount !== null && unreadCount > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-sm text-emerald-400 font-medium">{unreadCount} thông báo mới</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => refetch()} disabled={isFetching} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl" title="Tải lại">
                        <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleMarkAll} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:bg-[#FF1493]/10 hover:text-[#FF1493] hover:border-[#FF1493]/30 transition-all group">
                        <Check size={16} className="group-hover:scale-110" />
                        <span className="hidden sm:inline">Đánh dấu đã đọc</span>
                    </button>
                    <button onClick={() => setShowSettings(true)} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                        <Settings size={20} />
                    </button>
                    <button onClick={handleCleanup} disabled={cleaning} className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl disabled:opacity-50">
                        {cleaning ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white shadow-lg shadow-[#FF1493]/25 scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                }`}
                        >
                            {tab.label}
                            {tab.key === 'unread' && unreadCount !== null && unreadCount > 0 && (
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-400/20 text-emerald-400'}`}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Danh sách thông báo */}
            <div className="bg-[#1C1C1E]/70 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
                {isLoading ? (
                    <div className="divide-y divide-white/5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-5 animate-pulse">
                                <div className="w-14 h-14 rounded-full bg-white/10" />
                                <div className="flex-1 space-y-3 py-1"><div className="h-4 bg-white/10 rounded-full w-3/4" /><div className="h-3 bg-white/10 rounded-full w-1/2" /></div>
                                <div className="w-16 h-4 bg-white/10 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-red-400 mb-4">{(error as Error)?.message || 'Lỗi tải thông báo'}</p>
                        <button onClick={() => refetch()} className="px-4 py-2 bg-white/10 rounded-xl text-sm">Thử lại</button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-24 h-24 bg-[#1A1825] rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                            <Bell size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
                        </h3>
                        <p className="text-gray-400 text-sm max-w-sm mb-8">
                            {activeTab === 'mention'
                                ? 'Chưa có ai nhắc đến bạn. Khi có người dùng @username của bạn trong bài viết, thông báo sẽ xuất hiện ở đây.'
                                : 'Khi có tương tác mới từ bạn bè, thông báo sẽ hiển thị tại đây.'}
                        </p>
                        <button onClick={() => navigate('/explore')} className="px-6 py-3 bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white font-semibold rounded-full shadow-lg">
                            <Sparkles size={18} className="mr-2 inline" /> Khám phá ngay
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications.map((item, index) => {
                            const avatar = resolveUrl(item.triggeredByAvatarUrl);
                            const initials = (item.triggeredByUserName ?? 'U').charAt(0).toUpperCase();
                            const text = getNotificationText(item);
                            const isMention = item.type === NotificationType.Mention;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
                                    className={`group flex items-start gap-4 p-5 cursor-pointer transition-all duration-300 hover:bg-white/5 ${!item.isRead ? 'bg-[#4F6BFF]/5 border-l-[3px] border-l-[#4F6BFF]' : ''
                                        }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF1493]/20 to-[#4F6BFF]/20 p-[2px] group-hover:from-[#FF1493]/40 group-hover:to-[#4F6BFF]/40 transition-all">
                                            <div className="w-full h-full rounded-full bg-[#1C1C1E] flex items-center justify-center overflow-hidden">
                                                {avatar ? (
                                                    <img src={avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                ) : (
                                                    <span className="text-white font-bold text-lg">{initials}</span>
                                                )}
                                            </div>
                                        </div>
                                        {!item.isRead && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#1C1C1E] shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-white text-[16px] truncate">
                                                {item.triggeredByUserName ?? 'Hệ thống'}
                                            </p>
                                            {isMention && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF1493]/15 text-[#FF1493] text-[10px] font-bold rounded-full border border-[#FF1493]/30">
                                                    <AtSign size={12} /> nhắc đến
                                                </span>
                                            )}
                                            {!item.isRead && !isMention && (
                                                <span className="inline-block w-2 h-2 bg-[#4F6BFF] rounded-full shadow-[0_0_6px_rgba(79,107,255,0.8)] animate-pulse" />
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-[14px] leading-snug line-clamp-2">{text}</p>
                                        {isMention && (
                                            <div className="mt-1.5 flex items-center gap-1 text-[#4F6BFF] text-xs font-medium">
                                                <ExternalLink size={12} />
                                                <span>Nhấn để xem bài viết</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(item.createdAt)}</span>
                                        {!item.isRead && <span className="w-2 h-2 bg-[#4F6BFF] rounded-full shadow-[0_0_6px_rgba(79,107,255,0.8)]" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {notifications.length > 0 && notifications.some(n => !n.isRead) && (
                <div className="mt-6 flex justify-center">
                    <button onClick={handleMarkAll} className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95">
                        <Check size={20} /> Đánh dấu tất cả đã đọc
                    </button>
                </div>
            )}

            {showSettings && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-[#151221] border border-white/10 p-6 rounded-[2.5rem] w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <Layers size={22} className="text-[#FF1493]" /> Cài đặt thông báo
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <NotificationSettingsComponent />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default NotificationsPage;