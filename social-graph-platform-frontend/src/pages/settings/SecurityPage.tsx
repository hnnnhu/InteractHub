// src/pages/settings/SecurityPage.tsx

import React from 'react';
import { Shield, Lock, KeyRound, Monitor, AlertTriangle, ChevronRight } from 'lucide-react';
import ChangePasswordForm from '../../components/user/ChangePasswordForm';
import TwoFactorSetup from '../../components/settings/TwoFactorSetup';
import SessionsList from '../../components/user/SessionsList';
import AccountActions from '../../components/settings/AccountActions';

/**
 * Trang Bảo mật & Đăng nhập – Tổng hợp tất cả các thiết lập bảo mật.
 * Nội dung nằm hoàn toàn trong flow của MainLayout, không bị Topbar che.
 */
const SecurityPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ========== HERO BANNER ========== */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1825] via-[#151320] to-[#0F0D15] border border-white/10 p-6 sm:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4F6BFF]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#FF1493]/3 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="p-3.5 bg-gradient-to-br from-[#FFB800]/20 to-[#FFB800]/10 rounded-2xl border border-[#FFB800]/30 shadow-[0_0_25px_rgba(255,184,0,0.15)]">
                        <Shield className="text-[#FFB800]" size={36} />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Bảo mật & Đăng nhập
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base mt-1 max-w-2xl">
                            Quản lý mật khẩu, xác thực hai yếu tố, thiết bị đăng nhập và các tùy chọn an toàn cho tài khoản của bạn.
                        </p>
                    </div>
                </div>
            </div>

            {/* ========== SECTION: MẬT KHẨU & 2FA (2 CỘT) ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-lg font-bold text-white whitespace-nowrap">Thông tin đăng nhập</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mật khẩu */}
                    <div className="group rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#FF1493]/30 transition-all duration-300 overflow-hidden">
                        <div className="flex items-center gap-3 p-5 pb-0">
                            <div className="p-2.5 bg-[#FF1493]/10 rounded-xl">
                                <Lock size={20} className="text-[#FF1493]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Đổi mật khẩu</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Cập nhật mật khẩu mới để bảo vệ tài khoản</p>
                            </div>
                            <ChevronRight size={18} className="ml-auto text-gray-600 group-hover:text-[#FF1493] transition-colors" />
                        </div>
                        <div className="p-5 pt-4">
                            <ChangePasswordForm />
                        </div>
                    </div>

                    {/* 2FA */}
                    <div className="group rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00FF9F]/30 transition-all duration-300 overflow-hidden">
                        <div className="flex items-center gap-3 p-5 pb-0">
                            <div className="p-2.5 bg-[#00FF9F]/10 rounded-xl">
                                <KeyRound size={20} className="text-[#00FF9F]" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Xác thực 2 yếu tố</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Thêm lớp bảo vệ bằng mã xác thực</p>
                            </div>
                            <ChevronRight size={18} className="ml-auto text-gray-600 group-hover:text-[#00FF9F] transition-colors" />
                        </div>
                        <div className="p-5 pt-4">
                            <TwoFactorSetup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== SECTION: THIẾT BỊ ĐĂNG NHẬP ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-lg font-bold text-white whitespace-nowrap">Phiên đăng nhập</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#4F6BFF]/30 transition-all duration-300 overflow-hidden">
                    <div className="flex items-center gap-3 p-5 pb-0">
                        <div className="p-2.5 bg-[#4F6BFF]/10 rounded-xl">
                            <Monitor size={20} className="text-[#4F6BFF]" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Thiết bị đã đăng nhập</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Quản lý các thiết bị đang truy cập tài khoản của bạn</p>
                        </div>
                    </div>
                    <div className="p-5 pt-4">
                        <SessionsList />
                    </div>
                </div>
            </section>

            {/* ========== SECTION: VÙNG NGUY HIỂM ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                    <h2 className="text-lg font-bold text-red-400 whitespace-nowrap flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Vùng nguy hiểm
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                </div>

                <div className="rounded-2xl bg-white/[0.02] border border-red-500/20 hover:border-red-500/40 transition-all duration-300 overflow-hidden">
                    <AccountActions />
                </div>
            </section>
        </div>
    );
};

export default SecurityPage;