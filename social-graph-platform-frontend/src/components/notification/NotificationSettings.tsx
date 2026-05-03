// components/notification/NotificationSettings.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Bell, Moon, Sun, Volume2, Mail } from 'lucide-react';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import type { NotificationSettingsDto } from '../../types/notification';

const NOTIFICATION_TYPES = [
    { key: 'friendRequest' as const, label: 'Lời mời kết bạn', description: 'Khi ai đó gửi lời mời kết bạn cho bạn' },
    { key: 'friendAccepted' as const, label: 'Chấp nhận kết bạn', description: 'Khi ai đó chấp nhận lời mời kết bạn của bạn' },
    { key: 'postReaction' as const, label: 'Cảm xúc bài viết', description: 'Khi ai đó thả cảm xúc vào bài viết của bạn' },
    { key: 'postComment' as const, label: 'Bình luận bài viết', description: 'Khi ai đó bình luận về bài viết của bạn' },
    { key: 'storyReaction' as const, label: 'Cảm xúc Story', description: 'Khi ai đó thả cảm xúc vào story của bạn' },
    { key: 'mention' as const, label: 'Nhắc đến (@mention)', description: 'Khi ai đó nhắc đến bạn trong bài viết hoặc bình luận' },
];

const NotificationSettings: React.FC = () => {
    const { settings, loading, saving, error: fetchError, saveSettings, refresh } = useNotificationSettings();

    const [localSettings, setLocalSettings] = useState<NotificationSettingsDto | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const prevSettingsStr = useRef('');

    // Đồng bộ localSettings với settings từ server chỉ khi có thay đổi thực sự
    useEffect(() => {
        if (!settings) return;
        const currentStr = JSON.stringify(settings);
        if (currentStr !== prevSettingsStr.current) {
            setLocalSettings(settings);
            prevSettingsStr.current = currentStr;
        }
    }, [settings]);

    const toggle = (key: keyof NotificationSettingsDto) => {
        setLocalSettings((prev) => {
            if (!prev) return prev;
            return { ...prev, [key]: !prev[key] };
        });
        setSaveSuccess(false);
    };

    const updateNumber = (key: 'quietHoursStart' | 'quietHoursEnd', value: number) => {
        if (value < 0 || value > 23) return;
        setLocalSettings((prev) => {
            if (!prev) return prev;
            return { ...prev, [key]: value };
        });
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        if (!localSettings) return;
        const success = await saveSettings(localSettings);
        if (success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF1493]" />
                <span className="ml-3 text-gray-400 text-sm">Đang tải cài đặt...</span>
            </div>
        );
    }

    if (fetchError && !localSettings) {
        return (
            <div className="text-center py-8 text-red-400">
                <p className="mb-3">{fetchError}</p>
                <button
                    onClick={refresh}
                    className="px-4 py-2 bg-[#FF1493]/10 text-[#FF1493] rounded-xl hover:bg-[#FF1493]/20 transition-colors text-sm font-medium"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    if (!localSettings) return null;

    const isMasterOn = localSettings.enableAllNotifications;
    const anyTypeOn =
        localSettings.friendRequest ||
        localSettings.friendAccepted ||
        localSettings.postReaction ||
        localSettings.postComment ||
        localSettings.storyReaction ||
        localSettings.mention;
    const quietHoursConflict =
        localSettings.quietHoursEnabled && localSettings.quietHoursStart === localSettings.quietHoursEnd;

    return (
        <div className="space-y-8">
            {/* Master Toggle */}
            <div className="bg-[#1A1825]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#FF1493]/10">
                            <Bell size={20} className="text-[#FF1493]" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm">Tất cả thông báo</h3>
                            <p className="text-gray-500 text-xs mt-0.5">
                                {isMasterOn ? 'Đang bật tất cả thông báo' : 'Tất cả thông báo đang tắt'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => toggle('enableAllNotifications')}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${isMasterOn ? 'bg-[#FF1493] shadow-[0_0_12px_rgba(255,20,147,0.4)]' : 'bg-white/10'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${isMasterOn ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Notification Types */}
            <div className="bg-[#1A1825]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Loại thông báo
                </h4>
                <div className="space-y-4">
                    {NOTIFICATION_TYPES.map(({ key, label, description }) => (
                        <div
                            key={key}
                            className={`flex items-center justify-between py-2 transition-opacity duration-300 ${!isMasterOn ? 'opacity-40 pointer-events-none' : ''
                                }`}
                        >
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-white text-sm font-medium">{label}</p>
                                <p className="text-gray-500 text-xs mt-0.5 truncate">{description}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggle(key)}
                                disabled={!isMasterOn}
                                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-all duration-300 ${localSettings[key]
                                        ? 'bg-[#4F6BFF] shadow-[0_0_10px_rgba(79,107,255,0.3)]'
                                        : 'bg-white/10'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${localSettings[key] ? 'translate-x-5' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
                {isMasterOn && !anyTypeOn && (
                    <p className="text-xs text-red-400 mt-3 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        Phải bật ít nhất một loại thông báo
                    </p>
                )}
            </div>

            {/* Push Notifications */}
            <div className="bg-[#1A1825]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#4F6BFF]/10">
                            <Volume2 size={20} className="text-[#4F6BFF]" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm">Push thông báo</h3>
                            <p className="text-gray-500 text-xs mt-0.5">Nhận thông báo đẩy trên thiết bị</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => toggle('pushEnabled')}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-all duration-300 ${localSettings.pushEnabled
                                ? 'bg-[#4F6BFF] shadow-[0_0_10px_rgba(79,107,255,0.3)]'
                                : 'bg-white/10'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${localSettings.pushEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-[#1A1825]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-400/10">
                            <Mail size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm">Thông báo qua Email</h3>
                            <p className="text-gray-500 text-xs mt-0.5">Nhận thông báo qua địa chỉ email đã đăng ký</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => toggle('enableEmailNotification')}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-all duration-300 ${localSettings.enableEmailNotification
                                ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                                : 'bg-white/10'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${localSettings.enableEmailNotification ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-[#1A1825]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-yellow-400/10">
                            <Moon size={20} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-sm">Không làm phiền</h3>
                            <p className="text-gray-500 text-xs mt-0.5">Tạm dừng thông báo trong khung giờ</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => toggle('quietHoursEnabled')}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-all duration-300 ${localSettings.quietHoursEnabled
                                ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                                : 'bg-white/10'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${localSettings.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                        />
                    </button>
                </div>

                {localSettings.quietHoursEnabled && (
                    <div className="mt-4 pl-11">
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <Sun size={16} className="text-yellow-400" />
                                <span>Từ</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={localSettings.quietHoursStart}
                                    onChange={(e) => updateNumber('quietHoursStart', parseInt(e.target.value) || 0)}
                                    className="w-16 bg-[#0D0C13] border border-white/10 rounded-lg px-2 py-1.5 text-white text-center focus:outline-none focus:border-[#4F6BFF] transition-colors"
                                />
                                <span className="text-gray-500">giờ</span>
                            </div>
                            <span className="text-gray-500">–</span>
                            <div className="flex items-center gap-2">
                                <Moon size={16} className="text-gray-400" />
                                <span>đến</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={localSettings.quietHoursEnd}
                                    onChange={(e) => updateNumber('quietHoursEnd', parseInt(e.target.value) || 0)}
                                    className="w-16 bg-[#0D0C13] border border-white/10 rounded-lg px-2 py-1.5 text-white text-center focus:outline-none focus:border-[#4F6BFF] transition-colors"
                                />
                                <span className="text-gray-500">giờ</span>
                            </div>
                        </div>
                        {quietHoursConflict && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                Giờ bắt đầu và kết thúc không được trùng nhau
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving || (isMasterOn && !anyTypeOn) || quietHoursConflict}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${saveSuccess
                        ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                        : 'bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] text-white shadow-lg shadow-[#FF1493]/20 hover:shadow-[#FF1493]/40 hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100'
                    }`}
            >
                {saving ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                        Đang lưu...
                    </>
                ) : saveSuccess ? (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Đã lưu thay đổi
                    </>
                ) : (
                    'Lưu cài đặt'
                )}
            </button>

            {fetchError && <p className="text-sm text-red-400 text-center">{fetchError}</p>}
        </div>
    );
};

export default NotificationSettings;