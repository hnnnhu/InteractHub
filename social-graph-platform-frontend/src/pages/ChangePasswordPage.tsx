// src/pages/ChangePasswordPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import ChangePasswordForm from '../components/user/ChangePasswordForm';

const ChangePasswordPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-xl mx-auto py-10 px-4 min-h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Nút quay lại */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 group transition-colors w-fit"
            >
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#4F6BFF]/20 transition-all">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-medium">Quay lại</span>
            </button>

            {/* Header trang */}
            <div className="text-center mb-10">
                <div className="relative inline-block">
                    {/* Hiệu ứng hào quang phía sau icon */}
                    <div className="absolute inset-0 bg-[#FF1493] blur-[40px] opacity-20 rounded-full"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-tr from-red-500/20 to-[#FF1493]/20 rounded-3xl border border-white/10 flex items-center justify-center mb-6 mx-auto rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ShieldCheck size={40} className="text-[#FF1493]" />
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    Bảo mật tài khoản
                </h1>
                <p className="text-gray-400 mt-3 text-lg max-w-sm mx-auto leading-relaxed">
                    Cập nhật mật khẩu thường xuyên để đảm bảo an toàn cho dữ liệu của bạn.
                </p>
            </div>

            {/* Form chính */}
            <div className="relative">
                {/* Trang trí góc form */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#4F6BFF]/10 blur-[50px] rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#FF1493]/10 blur-[50px] rounded-full"></div>

                <div className="relative z-10">
                    <ChangePasswordForm />
                </div>
            </div>

            {/* Thông tin bổ sung/Gợi ý bảo mật */}
            <div className="mt-10 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-[#FFB800]/10 text-[#FFB800]">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Mẹo đặt mật khẩu mạnh</h4>
                        <ul className="text-sm text-gray-400 space-y-1 list-disc ml-4">
                            <li>Sử dụng ít nhất 8 ký tự.</li>
                            <li>Kết hợp chữ cái, số và ký hiệu đặc biệt.</li>
                            <li>Không sử dụng thông tin cá nhân dễ đoán như ngày sinh.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;