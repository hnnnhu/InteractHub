// src/components/settings/TwoFactorSetup.tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { KeyRound, QrCode, CheckCircle2, Loader2, Copy, Shield, ArrowRight } from 'lucide-react';
import userApi from '../../api/userApi';
import type { TwoFactorSetupDto } from '../../types/user';

const TwoFactorSetup: React.FC = () => {
    const [step, setStep] = useState<'idle' | 'setup' | 'enabled'>('idle');
    const [setupData, setSetupData] = useState<TwoFactorSetupDto | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

    // Tạo QR code từ authenticatorUri – chỉ set khi có URI, không set lại null
    useEffect(() => {
        if (setupData?.authenticatorUri) {
            let cancelled = false;
            QRCode.toDataURL(setupData.authenticatorUri, { width: 250 })
                .then((url) => {
                    if (!cancelled) setQrCodeUrl(url);
                })
                .catch((err) => {
                    console.error('Không thể tạo QR code:', err);
                    if (!cancelled) setError('Lỗi tạo mã QR. Vui lòng thử lại hoặc nhập mã thủ công.');
                });
            return () => {
                cancelled = true;
            };
        }
        // Không làm gì nếu không có URI – giữ nguyên trạng thái qrCodeUrl cũ
    }, [setupData]);

    const handleStartSetup = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await userApi.getTwoFactorSetup();
            if (res.isSuccess && res.data) {
                setSetupData(res.data);
                setStep('setup');
                setQrCodeUrl(null); // reset QR cũ nếu có
            } else {
                setError(res.message || 'Không thể lấy thông tin thiết lập 2FA.');
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi kết nối đến máy chủ.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Vui lòng nhập đủ 6 chữ số từ ứng dụng.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await userApi.enableTwoFactor(verificationCode);
            if (res.isSuccess) {
                setStep('enabled');
                setVerificationCode('');
            } else {
                setError(res.message || 'Mã xác thực không chính xác.');
            }
        } catch (err) {
            console.error(err);
            setError('Lỗi kết nối.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyKey = async () => {
        if (setupData?.sharedKey) {
            await navigator.clipboard.writeText(setupData.sharedKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
    };

    return (
        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl transition-all duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-[#00FF9F]/20 rounded-xl border border-[#00FF9F]/20">
                    <KeyRound className="text-[#00FF9F]" size={24} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-xl">Xác thực 2 yếu tố (2FA)</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Bảo vệ tài khoản bằng ứng dụng Authenticator</p>
                </div>
            </div>

            {error && (
                <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold">
                    {error}
                </div>
            )}

            {/* Bước 1: Chưa thiết lập */}
            {step === 'idle' && (
                <div className="text-center py-6 animate-in fade-in duration-500 space-y-6">
                    <Shield className="mx-auto text-gray-600" size={48} />
                    <p className="text-gray-400 text-sm leading-relaxed px-4">
                        Sử dụng ứng dụng như <strong>Google Authenticator</strong> hoặc <strong>Authy</strong> để quét mã QR và nhận
                        mã xác minh bảo mật mỗi khi đăng nhập.
                    </p>
                    <button
                        onClick={handleStartSetup}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-8 py-3.5 bg-[#00FF9F] hover:bg-[#00E68F] text-[#0A090F] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,159,0.2)] active:scale-95 disabled:opacity-50 mx-auto"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />}
                        Bắt đầu thiết lập
                    </button>
                </div>
            )}

            {/* Bước 2: Hiển thị QR và mã thủ công */}
            {step === 'setup' && setupData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-4 rounded-[2rem] w-52 h-52 mx-auto shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 flex items-center justify-center">
                        {qrCodeUrl ? (
                            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] text-gray-500 uppercase font-black tracking-widest ml-1">
                            Mã thiết lập thủ công
                        </label>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                            <code className="text-[#00FF9F] text-xs sm:text-sm font-mono font-bold tracking-wider break-all">
                                {setupData.sharedKey}
                            </code>
                            <button
                                onClick={handleCopyKey}
                                className="ml-3 text-gray-400 hover:text-white transition-colors p-2 shrink-0"
                                title="Sao chép mã"
                            >
                                {isCopied ? (
                                    <span className="text-[10px] font-bold text-[#00FF9F]">ĐÃ COPY</span>
                                ) : (
                                    <Copy size={18} />
                                )}
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-600">
                            Nếu không quét được mã QR, hãy nhập mã trên vào ứng dụng xác thực của bạn.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm text-gray-300 font-semibold ml-1">6 chữ số từ app</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={verificationCode}
                            onChange={handleCodeChange}
                            className="w-full bg-[#1A1825] border border-white/10 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:border-[#00FF9F] focus:ring-1 focus:ring-[#00FF9F]/30 outline-none transition-all placeholder:text-[14px] placeholder:tracking-normal placeholder:font-medium placeholder-gray-600"
                        />
                        <button
                            onClick={handleVerifyAndEnable}
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full py-4 bg-gradient-to-r from-[#4F6BFF] to-[#4F6BFF]/80 text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(79,107,255,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={22} />
                            ) : (
                                <>
                                    <ArrowRight size={18} />
                                    Xác nhận kích hoạt
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Bước 3: Thành công */}
            {step === 'enabled' && (
                <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-500">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 bg-[#00FF9F]/10 rounded-full flex items-center justify-center mx-auto border border-[#00FF9F]/20">
                            <CheckCircle2 className="text-[#00FF9F]" size={40} />
                        </div>
                        <div className="absolute inset-0 bg-[#00FF9F] rounded-full blur-2xl opacity-20 animate-pulse pointer-events-none" />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-xl">Bảo mật nâng cao đã sẵn sàng!</h4>
                        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                            Xác thực 2 yếu tố đã được kích hoạt. Tài khoản của bạn được bảo vệ an toàn tuyệt đối.
                        </p>
                    </div>
                    <button
                        onClick={() => setStep('idle')}
                        className="text-sm text-gray-500 hover:text-white underline decoration-dotted underline-offset-4 transition-colors"
                    >
                        Quay lại cài đặt
                    </button>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSetup;