// src/components/user/AvatarUploader.tsx
import React, { useRef, useState } from 'react';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import userApi from '../../api/userApi';

interface AvatarUploaderProps {
    currentAvatarUrl?: string | null;
    fullName: string;
    onUploadSuccess: (newUrl: string) => void;
    onUploadError?: (error: string) => void;
}

/**
 * Hàm tiện ích trích xuất thông báo lỗi từ response
 */
function extractErrorMessage(errors): string {
    if (!errors) return 'Lỗi không xác định.';
    if (typeof errors === 'string') return errors;
    if (Array.isArray(errors)) return errors.join(', ');
    if (typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        return Array.isArray(errors[firstKey]) ? errors[firstKey].join(', ') : 'Dữ liệu không hợp lệ.';
    }
    return 'Lỗi không xác định.';
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
    currentAvatarUrl,
    fullName,
    onUploadSuccess,
    onUploadError,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Kiểm tra kích thước file (5MB)
        if (file.size > 5 * 1024 * 1024) {
            const msg = 'Dung lượng ảnh không được vượt quá 5MB.';
            setError(msg);
            onUploadError?.(msg);
            return;
        }

        // Kiểm tra định dạng file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            const msg = 'Chỉ chấp nhận định dạng JPG, PNG hoặc WebP.';
            setError(msg);
            onUploadError?.(msg);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setIsUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await userApi.uploadAvatar(file);
            if (res.isSuccess) {
                setSuccess(true);
                onUploadSuccess(objectUrl);
                // Tự động ẩn trạng thái success sau 3 giây
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const msg = res.message || extractErrorMessage(res.errors);
                setError(msg);
                onUploadError?.(msg);
                setPreviewUrl(currentAvatarUrl || null);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.';
            setError(msg);
            onUploadError?.(msg);
            setPreviewUrl(currentAvatarUrl || null);
        } finally {
            setIsUploading(false);
            // Reset input để có thể chọn lại cùng file nếu cần
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative group w-24 h-24 sm:w-32 sm:h-32 mx-auto">
            {/* Vòng ngoài Gradient với hiệu ứng pulse */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF1493] to-[#4F6BFF] p-[3px] animate-pulse-slow">
                <div className="w-full h-full bg-[#1A1825] rounded-full overflow-hidden relative">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={fullName}
                            className="w-full h-full object-cover"
                            onError={() => {
                                setPreviewUrl(null);
                                setError('Không thể tải ảnh xem trước.');
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-white/5 to-white/10">
                            <span className="bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] bg-clip-text text-transparent">
                                {fullName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                    )}

                    {/* Lớp phủ khi hover hoặc đang upload */}
                    <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity cursor-pointer ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-1">
                                <Loader2 className="animate-spin text-white" size={24} />
                                <span className="text-white text-[10px] font-medium">Đang tải</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <Camera className="text-white" size={24} />
                                <span className="text-white text-[10px] font-medium">Đổi ảnh</span>
                            </div>
                        )}
                    </div>

                    {/* Hiển thị trạng thái success/error nhỏ ở góc */}
                    {success && !isUploading && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-[#1A1825]">
                            <CheckCircle2 size={16} className="text-white" />
                        </div>
                    )}
                    {error && !isUploading && (
                        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-[#1A1825] cursor-pointer"
                            onClick={() => setError(null)}
                            title={error}
                        >
                            <AlertCircle size={16} className="text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Thông báo lỗi dạng tooltip nhỏ khi hover vào icon error */}
            {error && !isUploading && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-20">
                    {error}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
            />
        </div>
    );
};

export default AvatarUploader;