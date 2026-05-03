// src/pages/settings/PrivacyPage.tsx

import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Loader2,
    Save,
    AlertTriangle,
    Globe,
    Users,
    Lock,
    Star,
} from 'lucide-react';
import useUserProfile from '../../hooks/useUserProfile';
import { userApi } from '../../api/userApi';
import type { PrivacyLevel } from '../../types/user';

const PRIVACY_OPTIONS = [
    {
        value: 1 as PrivacyLevel,
        label: 'Công khai',
        description: 'Bất kỳ ai cũng có thể xem hồ sơ và bài viết của bạn.',
        icon: Globe,
        gradient: 'from-emerald-400 to-teal-500',
        ring: 'ring-emerald-400/20',
    },
    {
        value: 2 as PrivacyLevel,
        label: 'Bạn bè',
        description: 'Chỉ bạn bè mới xem được nội dung bạn chia sẻ.',
        icon: Users,
        gradient: 'from-blue-400 to-indigo-500',
        ring: 'ring-blue-400/20',
    },
    {
        value: 3 as PrivacyLevel,
        label: 'Riêng tư',
        description: 'Chỉ mình bạn có thể xem mọi thứ.',
        icon: Lock,
        gradient: 'from-violet-400 to-purple-500',
        ring: 'ring-violet-400/20',
    },
    {
        value: 4 as PrivacyLevel,
        label: 'Bạn thân',
        description: 'Chỉ những người trong danh sách bạn thân mới thấy.',
        icon: Star,
        gradient: 'from-amber-400 to-yellow-500',
        ring: 'ring-amber-400/20',
    },
];

const PrivacyPage: React.FC = () => {
    const { profile, isLoading, error, refetch } = useUserProfile('me', 'me');

    const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(1);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Đồng bộ giá trị từ profile sau khi load (tránh cascading render)
    useEffect(() => {
        if (profile && !initialized) {
            const timer = setTimeout(() => {
                setPrivacyLevel(profile.profileVisibility ?? 1);
                setInitialized(true);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [profile, initialized]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await userApi.updatePrivacy({
                profileVisibility: privacyLevel,
            });
            if (res.isSuccess) {
                setMessage({
                    type: 'success',
                    text: 'Đã cập nhật quyền riêng tư thành công.',
                });
                refetch();
            } else {
                setMessage({
                    type: 'error',
                    text: res.message || 'Không thể lưu cài đặt.',
                });
            }
        } catch {
            setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
        } finally {
            setSaving(false);
        }
    };

    // ---- Loading State ----
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-[#4F6BFF]" size={40} />
                    <p className="text-gray-400 text-sm animate-pulse">
                        Đang tải cài đặt...
                    </p>
                </div>
            </div>
        );
    }

    // ---- Error State ----
    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-red-500/10 rounded-full">
                    <AlertTriangle size={48} className="text-red-400" />
                </div>
                <p className="text-lg font-semibold text-white">
                    Không thể tải cài đặt
                </p>
                <p className="text-sm text-gray-400 max-w-md text-center">
                    {error || 'Vui lòng kiểm tra kết nối và thử lại.'}
                </p>
            </div>
        );
    }

    // ---- Main Content ----
    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#4F6BFF]/20 to-[#7B5AFF]/20 rounded-xl">
                        <ShieldCheck className="text-[#4F6BFF]" size={28} />
                    </div>
                    Quyền riêng tư
                </h1>
                <p className="text-gray-400 text-sm max-w-2xl">
                    Kiểm soát ai có thể xem hồ sơ và tương tác với bạn. Mọi thay đổi
                    sẽ có hiệu lực ngay lập tức.
                </p>
            </div>

            {/* Privacy Card */}
            <div className="p-6 sm:p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl space-y-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#4F6BFF]/10">
                        <ShieldCheck className="text-[#4F6BFF]" size={22} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">
                            Ai có thể xem trang cá nhân của bạn?
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Chọn một trong các mức độ hiển thị bên dưới.
                        </p>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {PRIVACY_OPTIONS.map((option) => {
                        const isActive = privacyLevel === option.value;
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setPrivacyLevel(option.value)}
                                className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${isActive
                                        ? 'bg-white/10 border-[#4F6BFF]/40 shadow-[0_0_20px_rgba(79,107,255,0.15)]'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div
                                    className={`p-3 rounded-xl shrink-0 transition-colors ${isActive
                                            ? `bg-gradient-to-br ${option.gradient} text-white`
                                            : 'bg-white/5 text-gray-400'
                                        }`}
                                >
                                    <Icon size={20} />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p
                                        className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-300'
                                            }`}
                                    >
                                        {option.label}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                        {option.description}
                                    </p>
                                </div>
                                {isActive && (
                                    <div
                                        className={`w-4 h-4 rounded-full bg-gradient-to-br ${option.gradient} shadow-[0_0_10px_currentColor] ring-4 ${option.ring} shrink-0 mt-1`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Feedback message */}
                {message && (
                    <div
                        className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${message.type === 'success'
                                ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                                : 'bg-red-500/10 text-red-300 border border-red-500/20'
                            }`}
                    >
                        {message.type === 'success' ? (
                            <ShieldCheck size={18} className="text-green-400" />
                        ) : (
                            <AlertTriangle size={18} className="text-red-400" />
                        )}
                        {message.text}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3.5 bg-gradient-to-r from-[#4F6BFF] to-[#7B5AFF] hover:from-[#5b75ff] hover:to-[#8b6aff] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(79,107,255,0.3)] active:scale-95"
                >
                    {saving ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <>
                            <Save size={20} />
                            Lưu thay đổi
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PrivacyPage;