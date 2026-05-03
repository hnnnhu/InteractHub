import React, { useEffect, useState } from 'react';
import { Smartphone, Monitor, ShieldAlert, LogOut, Loader2, Globe, Clock, Server } from 'lucide-react';
import userApi from '../../api/userApi';
import type { SessionDto } from '../../types/user';

const SessionsList: React.FC = () => {
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchSessions = async () => {
            try {
                const res = await userApi.getMySessions();
                if (!isMounted) return;

                if (res.isSuccess && res.data) {
                    const sorted = [...res.data].sort((a, b) => {
                        if (a.isCurrent) return -1;
                        if (b.isCurrent) return 1;
                        return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
                    });
                    setSessions(sorted);
                }
            } catch {
                // Chỉ log nếu component vẫn còn mount (tuỳ chọn)
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchSessions();

        return () => {
            isMounted = false;
        };
    }, []);

    const refreshSessions = async () => {
        try {
            const res = await userApi.getMySessions();
            if (res.isSuccess && res.data) {
                const sorted = [...res.data].sort((a, b) => {
                    if (a.isCurrent) return -1;
                    if (b.isCurrent) return 1;
                    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
                });
                setSessions(sorted);
            }
        } catch {
            console.error('Không thể tải lại phiên đăng nhập');
        }
    };

    const handleRevoke = async (sessionId: string) => {
        setProcessingId(sessionId);
        try {
            const res = await userApi.revokeSession(sessionId);
            if (res.isSuccess) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
            }
        } catch {
            alert('Có lỗi xảy ra khi yêu cầu đăng xuất thiết bị.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleLogoutAll = async () => {
        if (!window.confirm('Hành động này sẽ đăng xuất tài khoản của bạn khỏi tất cả các thiết bị khác. Tiếp tục?')) return;

        setIsLoading(true);
        try {
            const res = await userApi.logoutOtherDevices();
            if (res.isSuccess) {
                await refreshSessions();
            }
        } catch {
            alert('Lỗi khi thực hiện đăng xuất hàng loạt.');
        } finally {
            setIsLoading(false);
        }
    };

    const getDeviceInfo = (deviceInfo?: string | null) => {
        const info = deviceInfo?.toLowerCase() || '';
        if (info.includes('iphone') || info.includes('ios'))
            return { icon: Smartphone, color: 'text-[#FF1493]', label: 'iPhone / iOS' };
        if (info.includes('android'))
            return { icon: Smartphone, color: 'text-[#00FF9F]', label: 'Android Device' };
        if (info.includes('windows'))
            return { icon: Monitor, color: 'text-[#4F6BFF]', label: 'Windows PC' };
        if (info.includes('macintosh'))
            return { icon: Monitor, color: 'text-[#A2AAAD]', label: 'MacBook / iMac' };
        return { icon: Globe, color: 'text-gray-400', label: deviceInfo || 'Thiết bị lạ' };
    };

    if (isLoading && sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="animate-spin text-[#4F6BFF]" size={40} />
                <p className="text-gray-400 animate-pulse">Đang kiểm tra bảo mật các phiên...</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-8 shadow-2xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-[#FFB800]/20 rounded-xl">
                            <ShieldAlert className="text-[#FFB800]" size={24} />
                        </div>
                        Thiết bị đã đăng nhập
                    </h3>
                    <p className="text-sm text-gray-400 max-w-md">
                        Dưới đây là danh sách các thiết bị hiện đang truy cập vào tài khoản <strong>InteractHub</strong> của bạn.
                        Hãy đăng xuất nếu thấy có hoạt động lạ.
                    </p>
                </div>
                {sessions.length > 1 && (
                    <button
                        type="button"
                        onClick={handleLogoutAll}
                        disabled={isLoading}
                        className="w-full md:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl text-sm font-black transition-all duration-300 shadow-lg shadow-red-500/5 active:scale-95 disabled:opacity-50"
                    >
                        Đăng xuất tất cả thiết bị khác
                    </button>
                )}
            </div>

            {/* Danh sách phiên */}
            <div className="grid gap-4">
                {sessions.map((session) => {
                    const { icon: DeviceIcon, color, label } = getDeviceInfo(session.deviceInfo);
                    const isRevoking = processingId === session.id;

                    return (
                        <div
                            key={session.id}
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${session.isCurrent
                                    ? 'bg-gradient-to-r from-[#4F6BFF]/10 to-transparent border-[#4F6BFF]/30 shadow-[0_0_20px_rgba(79,107,255,0.1)]'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-start gap-5">
                                <div className={`p-4 bg-[#1A1825] rounded-2xl border border-white/10 shadow-inner ${color}`}>
                                    <DeviceIcon size={28} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h4 className="text-white font-bold text-lg">{label}</h4>
                                        {session.isCurrent && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00FF9F]/10 text-[#00FF9F] text-[10px] font-black uppercase border border-[#00FF9F]/30 shadow-[0_0_10px_rgba(0,255,159,0.2)]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9F] animate-ping"></span>
                                                Phiên hiện tại
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[13px] text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Server size={14} className="opacity-60" />
                                            <span>IP: {session.ipAddress || 'Địa chỉ ẩn'}</span>
                                        </div>
                                        <span className="hidden sm:inline opacity-30">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="opacity-60" />
                                            <span>Hoạt động: {new Date(session.lastActiveAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!session.isCurrent && (
                                <button
                                    type="button"
                                    onClick={() => handleRevoke(session.id)}
                                    disabled={!!processingId}
                                    className="mt-4 sm:mt-0 p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all group"
                                    title="Đăng xuất thiết bị này"
                                >
                                    {isRevoking ? (
                                        <Loader2 size={20} className="animate-spin text-red-500" />
                                    ) : (
                                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mẹo bảo mật */}
            <div className="p-4 bg-[#FFB800]/5 border border-[#FFB800]/10 rounded-2xl flex gap-3 items-start">
                <ShieldAlert size={18} className="text-[#FFB800] shrink-0 mt-0.5" />
                <p className="text-[12px] text-gray-500 italic">
                    <strong>Mẹo bảo mật:</strong> Nếu bạn nhận thấy có thiết bị lạ, hãy thực hiện Đăng xuất và ngay lập tức thay
                    đổi mật khẩu tài khoản tại phần cài đặt mật khẩu.
                </p>
            </div>
        </div>
    );
};

export default React.memo(SessionsList);