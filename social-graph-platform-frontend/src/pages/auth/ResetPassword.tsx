import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, User } from 'lucide-react';
import authApi from '../../api/authApi';

interface ResetPasswordInputs {
    newPassword: string;
    confirmNewPassword: string;
}

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();

    // Trích xuất email và token từ đường dẫn URL
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<ResetPasswordInputs>();

    const newPassword = watch("newPassword");

    const onSubmit = async (data: ResetPasswordInputs) => {
        if (!email || !token) {
            setErrorMsg("Đường dẫn không hợp lệ hoặc đã hết hạn.");
            return;
        }

        setErrorMsg(null);
        setIsLoading(true);

        try {
            const response = await authApi.resetPassword({
                email: email,
                token: token,
                newPassword: data.newPassword,
                confirmNewPassword: data.confirmNewPassword
            });

            if (response.isSuccess) {
                setIsSuccess(true);
            } else {
                setErrorMsg(response.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            const backendMessage = err.response?.data?.message;

            if (validationErrors && typeof validationErrors === 'object') {
                const firstErrorKey = Object.keys(validationErrors)[0];
                setErrorMsg(validationErrors[firstErrorKey][0]);
            } else {
                setErrorMsg(backendMessage || 'Mã xác nhận đã hết hạn hoặc không hợp lệ.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Giao diện khi đường dẫn thiếu email hoặc token (Vẫn giữ nguyên phong cách Glassmorphism)
    if (!email || !token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#DCA3C8] via-[#DBC4E6] to-[#1B1931] flex items-center justify-center p-4 relative overflow-hidden">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center z-10 relative">
                    <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] z-[-1]"></div>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-[#2C243B] mb-3">Đường dẫn không hợp lệ</h2>
                    <p className="text-[#2C243B]/80 text-sm mb-8 font-medium">
                        Liên kết đặt lại mật khẩu của bạn bị thiếu thông tin hoặc đã bị thay đổi. Vui lòng yêu cầu cấp lại liên kết mới.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="inline-block w-full bg-gradient-to-r from-[#2C243B] to-[#151221] text-white py-3.5 rounded-full font-bold tracking-wide shadow-lg hover:opacity-90 transition-opacity"
                    >
                        Yêu cầu liên kết mới
                    </Link>
                </div>
            </div>
        );
    }

    return (
        // Lớp nền Gradient: Hồng Phấn -> Tím Nhạt -> Xanh Đen
        <div className="min-h-screen bg-gradient-to-br from-[#DCA3C8] via-[#DBC4E6] to-[#1B1931] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">

            {/* Khối Card chính - Kính mờ */}
            <div className="flex w-full max-w-[1000px] min-h-[580px] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 bg-white/10 backdrop-blur-xl border border-white/20">

                {/* --- CỘT TRÁI: Form Đặt lại mật khẩu (Mặt kính sáng) --- */}
                <div className="w-full lg:w-1/2 p-10 sm:p-14 lg:px-16 flex flex-col justify-center bg-white/30 backdrop-blur-2xl border-r border-white/30">

                    {!isSuccess ? (
                        <>
                            <div className="text-center lg:text-left mb-10">
                                <h2 className="text-3xl font-extrabold text-[#2C243B] tracking-wide drop-shadow-sm">
                                    Tạo Mật Khẩu Mới
                                </h2>
                                <p className="text-[#2C243B]/80 mt-2 text-sm font-medium">
                                    Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Thông báo Lỗi */}
                                {errorMsg && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-3 rounded-lg text-sm font-semibold text-center">
                                        {errorMsg}
                                    </div>
                                )}

                                {/* Input Mật khẩu mới */}
                                <div className="relative group">
                                    <input
                                        {...register("newPassword", {
                                            required: "Vui lòng nhập mật khẩu mới",
                                            minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" }
                                        })}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mật khẩu mới"
                                        className={`w-full bg-transparent border-0 border-b-2 py-2.5 pr-10 text-[#2C243B] font-semibold placeholder-[#2C243B]/60 focus:ring-0 focus:outline-none transition-colors ${errors.newPassword ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-1 top-2.5 text-[#2C243B]/80 hover:text-[#2C243B] transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                    {errors.newPassword && (
                                        <p className="absolute -bottom-5 left-0 text-[11px] text-red-600 font-bold">{errors.newPassword.message}</p>
                                    )}
                                </div>

                                {/* Input Xác nhận mật khẩu mới */}
                                <div className="relative group mt-8">
                                    <input
                                        {...register("confirmNewPassword", {
                                            validate: (value) => value === newPassword || "Mật khẩu không khớp"
                                        })}
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Xác nhận mật khẩu mới"
                                        className={`w-full bg-transparent border-0 border-b-2 py-2.5 pr-10 text-[#2C243B] font-semibold placeholder-[#2C243B]/60 focus:ring-0 focus:outline-none transition-colors ${errors.confirmNewPassword ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-1 top-2.5 text-[#2C243B]/80 hover:text-[#2C243B] transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                    {errors.confirmNewPassword && (
                                        <p className="absolute -bottom-5 left-0 text-[11px] text-red-600 font-bold">{errors.confirmNewPassword.message}</p>
                                    )}
                                </div>

                                {/* Nút Submit */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-[#2C243B] to-[#151221] hover:opacity-90 text-white py-3.5 rounded-full font-bold tracking-wide shadow-lg shadow-black/20 transition-all focus:outline-none disabled:opacity-70 flex justify-center items-center"
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Đang xử lý...</>
                                        ) : (
                                            "Đổi Mật Khẩu"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* Giao diện Thành công */
                        <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-8 relative z-10">
                            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <CheckCircle2 className="w-10 h-10 text-green-700" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-[#2C243B] mb-3 tracking-wide drop-shadow-sm">Thành Công!</h3>
                            <p className="text-[#2C243B]/80 font-semibold text-sm mb-10 max-w-[260px] leading-relaxed">
                                Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể sử dụng mật khẩu mới để truy cập hệ thống.
                            </p>
                            <Link
                                to="/login"
                                className="w-full bg-gradient-to-r from-[#2C243B] to-[#151221] hover:opacity-90 text-white py-3.5 rounded-full font-bold tracking-wide shadow-lg transition-all focus:outline-none flex justify-center items-center"
                            >
                                Đi đến Đăng Nhập
                            </Link>
                        </div>
                    )}
                </div>

                {/* --- CỘT PHẢI: Branding & Logo Mạng lưới Neon --- */}
                <div className="hidden lg:flex w-1/2 bg-[#0D0C13] relative items-center justify-center flex-col overflow-hidden">

                    {/* Background Lưới Chéo */}
                    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="diagonalGrid" width="40" height="40" patternTransform="rotate(45)">
                                <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="0.5" />
                                <line x1="0" y1="0" x2="40" y2="0" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diagonalGrid)" />
                    </svg>

                    {/* Khối mô phỏng Social Graph Logo */}
                    <div className="relative w-[280px] h-[280px] flex items-center justify-center mb-8">
                        <div className="absolute w-full h-full border border-gray-500/30 rounded-full border-dashed animate-[spin_80s_linear_infinite]"></div>
                        <div className="absolute w-[200px] h-[200px] border border-gray-500/20 rounded-full"></div>

                        <svg className="absolute w-full h-full pointer-events-none z-0" viewBox="0 0 280 280">
                            <polygon points="140,40 53,190 227,190" fill="none" stroke="#FF1493" strokeWidth="1.5" strokeOpacity="0.8" />
                            <circle cx="140" cy="15" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="96.5" cy="115" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="183.5" cy="115" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="140" cy="190" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="140" cy="245" r="2.5" fill="#FF1493" opacity="0.6" />
                        </svg>

                        {/* Nodes */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)]">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                            <span className="absolute -right-8 top-0 bg-[#FF1493] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">+24</span>
                        </div>

                        <div className="absolute bottom-10 left-3 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)]">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                        </div>

                        <div className="absolute bottom-10 right-3 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)]">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                            <span className="absolute -right-5 top-0 bg-[#FF1493] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">8</span>
                        </div>

                        <div className="w-[72px] h-[72px] bg-[#1A1825] border-[3px] border-[#FF1493] rounded-full flex items-center justify-center z-20 relative shadow-[0_0_25px_rgba(255,20,147,0.5)]">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="6" r="3.5" fill="#FF1493" />
                                <circle cx="6" cy="17" r="3.5" fill="#FF1493" />
                                <circle cx="18" cy="17" r="3.5" fill="#FF1493" />
                                <line x1="10.5" y1="9" x2="7.5" y2="14" stroke="#FF1493" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="13.5" y1="9" x2="16.5" y2="14" stroke="#FF1493" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="8.5" y1="17" x2="15.5" y2="17" stroke="#FF1493" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Logo Text & Slogan */}
                    <div className="text-center z-10">
                        <div className="h-[1px] w-48 bg-white/20 mx-auto mb-6"></div>
                        <h1 className="text-5xl font-medium tracking-tight text-white mb-3 font-sans">
                            Interact<span className="text-[#FF1493] font-bold">Hub</span>
                        </h1>
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-8 h-[2px] bg-[#FF1493]"></div>
                            <div className="w-16 h-[2px] bg-[#FF1493]/40 ml-1"></div>
                        </div>
                        <p className="text-xs text-[#FF1493] font-semibold tracking-[0.2em] uppercase">
                            KẾT NỐI • CHIA SẺ • KIẾN TẠO
                        </p>
                    </div>

                    <div className="absolute bottom-8 text-[10px] text-gray-500 font-bold tracking-widest w-full text-center uppercase border-t border-white/10 pt-4 px-12 mx-12">
                        Nền tảng mạng xã hội InteractHub
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;