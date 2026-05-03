import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, User, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ──────────────────────────────────────────────────────────────
// Helpers – giải mã JWT và lấy roles (giống trong AuthContext)
// ──────────────────────────────────────────────────────────────
const parseJwtPayload = (token: string): Record<string, unknown> | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const extractRoles = (token: string): string[] => {
    const payload = parseJwtPayload(token);
    if (!payload) return [];
    const claimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    const raw = payload[claimKey] || payload['role'] || payload['roles'] || [];
    return typeof raw === 'string' ? [raw] : (raw as string[]);
};

// ──────────────────────────────────────────────────────────────
interface LoginFormInputs {
    emailOrUserName: string;
    password: string;
}

const Login: React.FC = () => {
    const { login } = useAuth();   // chỉ cần hàm login
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormInputs>();

    const onSubmit = async (data: LoginFormInputs) => {
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const response = await login({
                emailOrUserName: data.emailOrUserName,
                password: data.password,
            });

            if (response.isSuccess && response.data) {
                // Lấy token vừa được lưu và trích xuất roles
                const token = response.data.token;
                const userRoles = extractRoles(token);

                // Điều hướng dựa trên vai trò
                if (userRoles.includes('Admin')) {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/feed', { replace: true });
                }
            } else {
                setErrorMsg(response.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Sai email/tên đăng nhập hoặc mật khẩu.';
            setErrorMsg(message);
        } finally {
            setIsLoading(false);
        }
    };

    // ──────────────────────────────────────────────────────────────
    // JSX giữ nguyên như bạn đã cung cấp (giao diện đẹp)
    // ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#DCA3C8] via-[#DBC4E6] to-[#1B1931] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">

            {/* Khối Card chính - Kính mờ Glassmorphism */}
            <div className="flex w-full max-w-[1000px] min-h-[580px] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative z-10">

                {/* --- CỘT TRÁI: Branding & Logo Mạng lưới Neon --- */}
                <div className="hidden lg:flex w-1/2 bg-[#0D0C13] relative items-center justify-center flex-col overflow-hidden">

                    {/* Background Lưới Chéo (Diagonal Grid) */}
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
                        {/* 2 Vòng tròn quỹ đạo đứt nét/mờ */}
                        <div className="absolute w-full h-full border border-gray-500/30 rounded-full border-dashed animate-[spin_80s_linear_infinite]"></div>
                        <div className="absolute w-[200px] h-[200px] border border-gray-500/20 rounded-full"></div>

                        {/* Tam giác kết nối */}
                        <svg className="absolute w-full h-full pointer-events-none z-0" viewBox="0 0 280 280">
                            <polygon points="140,40 53,190 227,190" fill="none" stroke="#FF1493" strokeWidth="1.5" strokeOpacity="0.8" />
                            <circle cx="140" cy="15" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="96.5" cy="115" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="183.5" cy="115" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="140" cy="190" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="140" cy="245" r="2.5" fill="#FF1493" opacity="0.6" />
                        </svg>

                        {/* Node trên cùng */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-transform hover:scale-110 duration-300">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                            <span className="absolute -right-8 top-0 bg-[#FF1493] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">+12</span>
                        </div>

                        {/* Node góc dưới trái */}
                        <div className="absolute bottom-10 left-3 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-transform hover:scale-110 duration-300">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                        </div>

                        {/* Node góc dưới phải */}
                        <div className="absolute bottom-10 right-3 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-transform hover:scale-110 duration-300">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                            <span className="absolute -right-5 top-0 bg-[#FF1493] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
                        </div>

                        {/* Tâm Network Mở Rộng */}
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

                {/* --- CỘT PHẢI: Form Đăng nhập (Glassmorphism Kính mờ) --- */}
                <div className="w-full lg:w-1/2 p-10 sm:p-14 lg:px-16 flex flex-col justify-center bg-white/20 backdrop-blur-2xl border-t border-l border-white/40">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-[#2C243B] tracking-wide drop-shadow-sm">
                            Đăng Nhập
                        </h2>
                        <p className="text-[#2C243B]/80 mt-2 text-sm font-medium">
                            Chào mừng bạn trở lại với hệ thống InteractHub
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                        {/* Thông báo Lỗi */}
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-3 rounded-lg text-sm font-semibold text-center animate-in fade-in duration-300">
                                {errorMsg}
                            </div>
                        )}

                        {/* Input Tên đăng nhập/Email */}
                        <div className="relative group">
                            <input
                                {...register("emailOrUserName", { required: "Vui lòng nhập email hoặc tên đăng nhập" })}
                                type="text"
                                placeholder="Tên đăng nhập hoặc Email"
                                className={`w-full bg-transparent border-0 border-b-2 py-2.5 pr-10 text-[#2C243B] font-semibold placeholder-[#2C243B]/60 focus:ring-0 focus:outline-none transition-colors ${errors.emailOrUserName ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                    }`}
                                disabled={isLoading}
                            />
                            <User className={`absolute right-1 top-2.5 w-5 h-5 transition-colors ${errors.emailOrUserName ? 'text-red-500' : 'text-[#2C243B]/80 group-focus-within:text-[#2C243B]'
                                }`} />
                            {errors.emailOrUserName && (
                                <p className="absolute -bottom-5 left-0 text-[11px] text-red-600 font-bold">
                                    {errors.emailOrUserName.message}
                                </p>
                            )}
                        </div>

                        {/* Input Mật khẩu */}
                        <div className="relative group pt-2">
                            <input
                                {...register("password", {
                                    required: "Vui lòng nhập mật khẩu",
                                    minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                                })}
                                type={showPassword ? "text" : "password"}
                                placeholder="Mật khẩu"
                                className={`w-full bg-transparent border-0 border-b-2 py-2.5 pr-16 text-[#2C243B] font-semibold placeholder-[#2C243B]/60 focus:ring-0 focus:outline-none transition-colors ${errors.password ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                    }`}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="absolute right-8 top-2.5 text-[#2C243B]/60 hover:text-[#2C243B] transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            <Lock className={`absolute right-1 top-2.5 w-5 h-5 transition-colors pointer-events-none ${errors.password ? 'text-red-500' : 'text-[#2C243B]/80 group-focus-within:text-[#2C243B]'
                                }`} />
                            {errors.password && (
                                <p className="absolute -bottom-5 left-0 text-[11px] text-red-600 font-bold">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-1">
                            <Link to="/forgot-password" className="text-xs font-bold text-[#2C243B]/80 hover:text-[#2C243B] transition-colors">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-[#2A1B38] to-[#151221] hover:from-[#322044] hover:to-[#1c182d] text-white py-3.5 rounded-full font-bold tracking-wide shadow-lg shadow-black/20 transition-all focus:outline-none disabled:opacity-70 flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Đang xử lý...</>
                                ) : (
                                    "Đăng Nhập"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-sm text-[#2C243B]/80 font-medium text-center">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="font-bold text-[#2C243B] hover:underline transition-colors">
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;