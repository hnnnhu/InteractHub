import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, User, Mail, AtSign } from 'lucide-react';
import authApi from '../../api/authApi';

interface RegisterFormInputs {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const Register: React.FC = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<RegisterFormInputs>();

    const password = watch("password");

    const onSubmit = async (data: RegisterFormInputs) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsLoading(true);

        try {
            const response = await authApi.register({
                fullName: data.fullName,
                userName: data.userName,
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmPassword
            });

            if (response.isSuccess) {
                setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setErrorMsg(response.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại.');
            }
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            const backendMessage = err.response?.data?.message;

            if (validationErrors && typeof validationErrors === 'object') {
                const firstErrorKey = Object.keys(validationErrors)[0];
                setErrorMsg(validationErrors[firstErrorKey][0]);
            } else {
                setErrorMsg(backendMessage || 'Máy chủ không phản hồi. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#DCA3C8] via-[#DBC4E6] to-[#1B1931] flex items-center justify-center p-4 sm:p-8">

            <div className="flex w-full max-w-[1050px] min-h-[620px] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative z-10">

                {/* --- CỘT TRÁI: Form Đăng ký (Glassmorphism) --- */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white/20 backdrop-blur-2xl border-t border-l border-white/40">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-[#2C243B] tracking-wide">
                            Tạo Tài Khoản
                        </h2>
                        <p className="text-[#2C243B]/70 mt-2 text-sm font-medium">
                            Tham gia mạng xã hội InteractHub ngay hôm nay
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-3 rounded-lg text-sm font-medium text-center">
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-[#1B1931]/80 border border-[#1B1931] text-[#DCA3C8] p-3 rounded-lg text-sm font-medium text-center shadow-lg">
                                {successMsg}
                            </div>
                        )}

                        {/* Hàng 1: Họ tên & Tên đăng nhập */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="relative group">
                                <input
                                    {...register("fullName", { required: "Vui lòng nhập họ tên" })}
                                    type="text"
                                    placeholder="Họ và tên"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.fullName ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                        }`}
                                    disabled={isLoading || !!successMsg}
                                />
                                <User className="absolute right-1 top-2 w-4 h-4 text-[#2C243B]/80" />
                                {errors.fullName && <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">{errors.fullName.message}</p>}
                            </div>

                            <div className="relative group mt-2 sm:mt-0">
                                <input
                                    {...register("userName", { required: "Vui lòng nhập tên đăng nhập" })}
                                    type="text"
                                    placeholder="Tên đăng nhập"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.userName ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                        }`}
                                    disabled={isLoading || !!successMsg}
                                />
                                <AtSign className="absolute right-1 top-2 w-4 h-4 text-[#2C243B]/80" />
                                {errors.userName && <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">{errors.userName.message}</p>}
                            </div>
                        </div>

                        {/* Hàng 2: Email */}
                        <div className="relative group pt-1">
                            <input
                                {...register("email", {
                                    required: "Vui lòng nhập email",
                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Email không hợp lệ" }
                                })}
                                type="email"
                                placeholder="Địa chỉ Email"
                                className={`w-full bg-transparent border-0 border-b-2 py-2.5 pr-10 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.email ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                    }`}
                                disabled={isLoading || !!successMsg}
                            />
                            <Mail className="absolute right-1 top-3 w-5 h-5 text-[#2C243B]/80" />
                            {errors.email && <p className="absolute -bottom-4 left-0 text-[11px] text-red-600 font-bold">{errors.email.message}</p>}
                        </div>

                        {/* Hàng 3: Mật khẩu & Xác nhận */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                            <div className="relative group">
                                <input
                                    {...register("password", {
                                        required: "Vui lòng nhập mật khẩu",
                                        minLength: { value: 6, message: "Tối thiểu 6 ký tự" }
                                    })}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mật khẩu"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.password ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                        }`}
                                    disabled={isLoading || !!successMsg}
                                />
                                <button
                                    type="button"
                                    className="absolute right-0 top-2 text-[#2C243B]/80 hover:text-[#2C243B] transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {errors.password && <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">{errors.password.message}</p>}
                            </div>

                            <div className="relative group mt-2 sm:mt-0">
                                <input
                                    {...register("confirmPassword", {
                                        validate: (value) => value === password || "Mật khẩu không khớp"
                                    })}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Xác nhận mật khẩu"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.confirmPassword ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'
                                        }`}
                                    disabled={isLoading || !!successMsg}
                                />
                                <button
                                    type="button"
                                    className="absolute right-0 top-2 text-[#2C243B]/80 hover:text-[#2C243B] transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {errors.confirmPassword && <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        {/* Nút Submit */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !!successMsg}
                                className="w-full bg-gradient-to-r from-[#322842] to-[#151221] hover:opacity-90 text-white py-3.5 rounded-full font-bold tracking-wide shadow-lg transition-all focus:outline-none disabled:opacity-70 flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Đang xử lý...</>
                                ) : (
                                    "Đăng Ký"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-sm text-[#2C243B]/80 font-medium text-center">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="font-bold text-[#2C243B] hover:underline transition-colors">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>

                {/* --- CỘT PHẢI: Branding & Logo Mạng lưới Neon (Đồng bộ Login) --- */}
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
                            {/* Đỉnh: (140, 40) - Đáy Trái: (53, 190) - Đáy Phải: (227, 190) */}
                            <polygon points="140,40 53,190 227,190" fill="none" stroke="#FF1493" strokeWidth="1.5" strokeOpacity="0.8" />
                            {/* Các chấm nhỏ trang trí dọc theo mạng lưới */}
                            <circle cx="140" cy="15" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="96.5" cy="115" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="183.5" cy="115" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="140" cy="190" r="2.5" fill="#FF1493" opacity="0.6" />
                            <circle cx="140" cy="245" r="2.5" fill="#FF1493" opacity="0.6" />
                        </svg>

                        {/* Node trên cùng */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)]">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                            <span className="absolute -right-8 top-0 bg-[#FF1493] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">+24</span>
                        </div>

                        {/* Node góc dưới trái */}
                        <div className="absolute bottom-10 left-3 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)]">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                        </div>

                        {/* Node góc dưới phải */}
                        <div className="absolute bottom-10 right-3 flex flex-col items-center z-10">
                            <div className="w-[52px] h-[52px] bg-[#1A1825] border border-[#FF1493] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,20,147,0.4)]">
                                <User className="w-[26px] h-[26px] text-[#FF1493]" fill="#FF1493" />
                            </div>
                            <span className="absolute -right-5 top-0 bg-[#FF1493] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">8</span>
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
            </div>
        </div>
    );
};

export default Register;