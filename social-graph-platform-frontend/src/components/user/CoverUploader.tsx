// src/components/user/CoverUploader.tsx
import React, { useRef, useState } from 'react';
import { ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import userApi from '../../api/userApi';

interface CoverUploaderProps {
    onUploadSuccess: (newUrl: string) => void;
    onUploadError?: (error: string) => void;
}

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

const CoverUploader: React.FC<CoverUploaderProps> = ({ onUploadSuccess, onUploadError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            const msg = 'Dung lượng ảnh không được vượt quá 5MB.';
            setError(msg);
            onUploadError?.(msg);
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            const msg = 'Chỉ chấp nhận định dạng JPG, PNG hoặc WebP.';
            setError(msg);
            onUploadError?.(msg);
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await userApi.uploadCoverPhoto(file);
            if (res.isSuccess) {
                setSuccess(true);
                // Trả về URL tạm để hiển thị ngay (nếu cần), nhưng thường backend trả URL thật
                // Ở đây ta dùng object URL để preview tạm thời (sẽ được thay bởi refetch sau)
                const tempUrl = URL.createObjectURL(file);
                onUploadSuccess(tempUrl);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const msg = res.message || extractErrorMessage(res.errors);
                setError(msg);
                onUploadError?.(msg);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.';
            setError(msg);
            onUploadError?.(msg);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border rounded-xl text-sm font-semibold transition-all shadow-lg ${error ? 'border-red-500/50 text-red-300' : 'border-white/20 text-white'
                    }`}
                title={error || 'Đổi ảnh bìa'}
            >
                {isUploading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : error ? (
                    <AlertCircle size={16} className="text-red-400" />
                ) : success ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                ) : (
                    <ImageIcon size={16} />
                )}
                {isUploading ? 'Đang tải...' : error ? 'Lỗi' : success ? 'Đã cập nhật' : 'Đổi ảnh bìa'}
            </button>

            {error && (
                <div className="absolute top-full mt-2 right-0 bg-red-500 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg z-20 whitespace-nowrap flex items-center gap-1">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-1 hover:text-white/80">×</button>
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

export default CoverUploader;