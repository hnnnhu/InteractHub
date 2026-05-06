import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, User, Mail, AtSign, AlertCircle, CheckCircle2, XCircle, WifiOff } from 'lucide-react';
import { isAxiosError } from 'axios';
import authApi from '../../api/authApi';
import type { ApiResponse, AuthResponse } from '../../api/authApi';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface RegisterFormInputs {
    fullName: string;
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

type ErrorSeverity = 'business' | 'validation' | 'network' | 'server';

interface UIError {
    message: string;
    severity: ErrorSeverity;
    field?: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getErrorSeverity(response: ApiResponse<AuthResponse>): ErrorSeverity {
    if (!response.isSuccess) {
        if (response.errors && (Array.isArray(response.errors) ? response.errors.length > 0 : Object.keys(response.errors).length > 0)) {
            return 'validation';
        }
        const msg = response.message?.toLowerCase() || '';
        if (msg.includes('đã được sử dụng') || msg.includes('đã tồn tại') || msg.includes('không đúng')) {
            return 'business';
        }
        return 'business';
    }
    return 'business';
}

function getFieldFromMessage(message: string): string | undefined {
    const mapping: Record<string, string> = {
        'email': 'email',
        'tên đăng nhập': 'userName',
        'họ tên': 'fullName',
        'mật khẩu': 'password',
    };
    for (const [key, field] of Object.entries(mapping)) {
        if (message.toLowerCase().includes(key)) return field;
    }
    return undefined;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
const Register: React.FC = () => {
    const navigate = useNavigate();

    // Refs cho các input (auto-focus khi lỗi)
    const fullNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    const refsMap: Record<string, React.RefObject<HTMLInputElement | null>> = {
        fullName: fullNameRef,
        userName: userNameRef,
        email: emailRef,
        password: passwordRef,
        confirmPassword: confirmPasswordRef,
    };

    // State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uiError, setUiError] = useState<UIError | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const {
        register,
        handleSubmit,
        watch,
        getValues,
        formState: { errors }
    } = useForm<RegisterFormInputs>();

    const password = watch("password");

    // Clear UI error khi user sửa bất kỳ field nào
    const watchedFields = watch();
    useEffect(() => {
        if (uiError) setUiError(null);
        if (Object.keys(fieldErrors).length > 0) setFieldErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ muốn chạy khi form values thay đổi
    }, [watchedFields.fullName, watchedFields.userName, watchedFields.email, watchedFields.password, watchedFields.confirmPassword]);

    /**
     * Focus vào field lỗi đầu tiên
     */
    const focusFirstErrorField = (field?: string) => {
        if (field && refsMap[field]?.current) {
            refsMap[field].current?.focus();
            return;
        }
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey && refsMap[firstErrorKey]?.current) {
            refsMap[firstErrorKey].current?.focus();
        }
    };

    /**
     * Xử lý submit chính
     */
    const onSubmit = async (data: RegisterFormInputs) => {
        setUiError(null);
        setSuccessMsg(null);
        setFieldErrors({});
        setIsLoading(true);

        try {
            const response = await authApi.register({
                fullName: data.fullName,
                userName: data.userName,
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmPassword
            });

            // Thành công
            if (response.isSuccess) {
                setSuccessMsg(response.message || 'Đăng ký thành công! Đang chuyển hướng...');
                setTimeout(() => navigate('/login', { replace: true }), 2000);
                return;
            }

            // Thất bại từ server
            const severity = getErrorSeverity(response);
            const errorField = getFieldFromMessage(response.message || '');

            if (response.errors && typeof response.errors === 'object' && !Array.isArray(response.errors)) {
                const fieldErrorMap: Record<string, string> = {};
                for (const [field, messages] of Object.entries(response.errors)) {
                    if (Array.isArray(messages) && messages.length > 0) {
                        fieldErrorMap[field] = messages[0];
                    }
                }
                setFieldErrors(fieldErrorMap);
                const firstServerField = Object.keys(fieldErrorMap)[0];
                focusFirstErrorField(firstServerField);
                setUiError({
                    message: response.message || 'Vui lòng kiểm tra lại thông tin.',
                    severity: 'validation'
                });
                return;
            }

            if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
                setUiError({
                    message: response.errors.join('\n'),
                    severity: 'validation'
                });
                focusFirstErrorField(errorField);
                return;
            }

            setUiError({
                message: response.message || 'Đăng ký thất bại.',
                severity: severity
            });
            focusFirstErrorField(errorField);

        } catch (err: unknown) {
            console.error('[Register] Unexpected error:', err);

            if (isAxiosError(err)) {
                if (err.response?.data) {
                    const data = err.response.data as ApiResponse;
                    setUiError({
                        message: data.message || 'Máy chủ gặp sự cố.',
                        severity: 'server'
                    });
                    return;
                }
                if (err.code === 'ECONNABORTED') {
                    setUiError({
                        message: 'Yêu cầu bị timeout. Vui lòng thử lại.',
                        severity: 'network'
                    });
                    return;
                }
                if (!err.response) {
                    setUiError({
                        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
                        severity: 'network'
                    });
                    return;
                }
                if (err.response.status >= 500) {
                    setUiError({
                        message: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
                        severity: 'server'
                    });
                    return;
                }
                if (err.response.status === 429) {
                    setUiError({
                        message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lát.',
                        severity: 'network'
                    });
                    return;
                }
            }

            setUiError({
                message: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
                severity: 'network'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Styles dựa trên severity
    const getErrorStyles = (severity: ErrorSeverity) => {
        switch (severity) {
            case 'validation':
                return {
                    container: 'bg-amber-50 border-amber-300 text-amber-800',
                    icon: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                };
            case 'business':
                return {
                    container: 'bg-red-50 border-red-300 text-red-700',
                    icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                };
            case 'network':
                return {
                    container: 'bg-orange-50 border-orange-300 text-orange-700',
                    icon: <WifiOff className="w-5 h-5 text-orange-500 flex-shrink-0" />
                };
            case 'server':
                return {
                    container: 'bg-red-100 border-red-400 text-red-800',
                    icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                };
        }
    };

    const errorStyles = uiError ? getErrorStyles(uiError.severity) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#DCA3C8] via-[#DBC4E6] to-[#1B1931] flex items-center justify-center p-4 sm:p-8">

            <div className="flex w-full max-w-[1050px] min-h-[620px] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative z-10">

                {/* CỘT TRÁI: Form */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white/20 backdrop-blur-2xl border-t border-l border-white/40">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-[#2C243B] tracking-wide">Tạo Tài Khoản</h2>
                        <p className="text-[#2C243B]/70 mt-2 text-sm font-medium">Tham gia mạng xã hội InteractHub ngay hôm nay</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {uiError && errorStyles && (
                            <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-2 ${errorStyles.container}`}>
                                {errorStyles.icon}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold whitespace-pre-line">{uiError.message}</p>
                                    {uiError.severity === 'network' && (
                                        <button
                                            type="button"
                                            onClick={() => onSubmit(getValues())}
                                            className="mt-2 text-xs font-bold underline hover:no-underline"
                                        >
                                            Thử lại
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setUiError(null)}
                                    className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {successMsg && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <p className="text-sm font-semibold">{successMsg}</p>
                            </div>
                        )}

                        {/* Họ tên & Tên đăng nhập */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="relative group">
                                <input
                                    {...register("fullName", { required: "Vui lòng nhập họ tên" })}
                                    ref={(e) => {
                                        fullNameRef.current = e;
                                        register("fullName").ref(e);
                                    }}
                                    type="text"
                                    placeholder="Họ và tên"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.fullName || fieldErrors.fullName ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'}`}
                                    disabled={isLoading || !!successMsg}
                                    onFocus={() => {
                                        if (fieldErrors.fullName) {
                                            const newFieldErrors = { ...fieldErrors };
                                            delete newFieldErrors.fullName;
                                            setFieldErrors(newFieldErrors);
                                        }
                                    }}
                                />
                                <User className="absolute right-1 top-2 w-4 h-4 text-[#2C243B]/80" />
                                {(errors.fullName || fieldErrors.fullName) && (
                                    <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">
                                        {errors.fullName?.message || fieldErrors.fullName}
                                    </p>
                                )}
                            </div>

                            <div className="relative group mt-2 sm:mt-0">
                                <input
                                    {...register("userName", { required: "Vui lòng nhập tên đăng nhập" })}
                                    ref={(e) => {
                                        userNameRef.current = e;
                                        register("userName").ref(e);
                                    }}
                                    type="text"
                                    placeholder="Tên đăng nhập"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.userName || fieldErrors.userName ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'}`}
                                    disabled={isLoading || !!successMsg}
                                    onFocus={() => {
                                        if (fieldErrors.userName) {
                                            const newFieldErrors = { ...fieldErrors };
                                            delete newFieldErrors.userName;
                                            setFieldErrors(newFieldErrors);
                                        }
                                    }}
                                />
                                <AtSign className="absolute right-1 top-2 w-4 h-4 text-[#2C243B]/80" />
                                {(errors.userName || fieldErrors.userName) && (
                                    <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">
                                        {errors.userName?.message || fieldErrors.userName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="relative group pt-1">
                            <input
                                {...register("email", {
                                    required: "Vui lòng nhập email",
                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Email không hợp lệ" }
                                })}
                                ref={(e) => {
                                    emailRef.current = e;
                                    register("email").ref(e);
                                }}
                                type="email"
                                placeholder="Địa chỉ Email"
                                className={`w-full bg-transparent border-0 border-b-2 py-2.5 pr-10 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.email || fieldErrors.email ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'}`}
                                disabled={isLoading || !!successMsg}
                                onFocus={() => {
                                    if (fieldErrors.email) {
                                        const newFieldErrors = { ...fieldErrors };
                                        delete newFieldErrors.email;
                                        setFieldErrors(newFieldErrors);
                                    }
                                }}
                            />
                            <Mail className="absolute right-1 top-3 w-5 h-5 text-[#2C243B]/80" />
                            {(errors.email || fieldErrors.email) && (
                                <p className="absolute -bottom-4 left-0 text-[11px] text-red-600 font-bold">
                                    {errors.email?.message || fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password & Confirm */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                            <div className="relative group">
                                <input
                                    {...register("password", {
                                        required: "Vui lòng nhập mật khẩu",
                                        minLength: { value: 6, message: "Tối thiểu 6 ký tự" }
                                    })}
                                    ref={(e) => {
                                        passwordRef.current = e;
                                        register("password").ref(e);
                                    }}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mật khẩu"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.password || fieldErrors.password ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'}`}
                                    disabled={isLoading || !!successMsg}
                                    onFocus={() => {
                                        if (fieldErrors.password) {
                                            const newFieldErrors = { ...fieldErrors };
                                            delete newFieldErrors.password;
                                            setFieldErrors(newFieldErrors);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="absolute right-0 top-2 text-[#2C243B]/80 hover:text-[#2C243B] transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {(errors.password || fieldErrors.password) && (
                                    <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">
                                        {errors.password?.message || fieldErrors.password}
                                    </p>
                                )}
                            </div>

                            <div className="relative group mt-2 sm:mt-0">
                                <input
                                    {...register("confirmPassword", {
                                        validate: (value) => value === password || "Mật khẩu không khớp"
                                    })}
                                    ref={(e) => {
                                        confirmPasswordRef.current = e;
                                        register("confirmPassword").ref(e);
                                    }}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Xác nhận mật khẩu"
                                    className={`w-full bg-transparent border-0 border-b-2 py-2 pr-8 text-[#2C243B] font-medium placeholder-[#2C243B]/70 focus:ring-0 focus:outline-none transition-colors ${errors.confirmPassword || fieldErrors.confirmPassword ? 'border-red-400' : 'border-[#2C243B]/30 focus:border-[#2C243B]'}`}
                                    disabled={isLoading || !!successMsg}
                                    onFocus={() => {
                                        if (fieldErrors.confirmPassword) {
                                            const newFieldErrors = { ...fieldErrors };
                                            delete newFieldErrors.confirmPassword;
                                            setFieldErrors(newFieldErrors);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="absolute right-0 top-2 text-[#2C243B]/80 hover:text-[#2C243B] transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {(errors.confirmPassword || fieldErrors.confirmPassword) && (
                                    <p className="absolute -bottom-4 left-0 text-[10px] text-red-600 font-bold">
                                        {errors.confirmPassword?.message || fieldErrors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
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

                {/* CỘT PHẢI: Branding */}
                <div className="hidden lg:flex w-1/2 bg-[#0D0C13] relative items-center justify-center flex-col overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="diagonalGrid" width="40" height="40" patternTransform="rotate(45)">
                                <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="0.5" />
                                <line x1="0" y1="0" x2="40" y2="0" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diagonalGrid)" />
                    </svg>

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