// src/pages/EditProfilePage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Loader2, Save, ShieldAlert, User, Calendar, Info,
    CheckCircle2, XCircle, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import useUserProfile from '../hooks/useUserProfile';
import AvatarUploader from '../components/user/AvatarUploader';
import { userApi } from '../api/userApi';
import type { UpdateProfileRequest, UpdatePrivacyRequest, PrivacyLevel } from '../types/user';

// ============================================================
//  LOCAL COMPONENTS
// ============================================================

/** Toast thông báo */
const ToastMessage: React.FC<{
    type: 'success' | 'error';
    message: string;
    onClose?: () => void;
}> = ({ type, message, onClose }) => (
    <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-xl border shadow-2xl animate-in slide-in-from-right-full duration-300 ${type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-200'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
    >
        {type === 'success' ? (
            <CheckCircle2 size={22} className="text-green-400" />
        ) : (
            <XCircle size={22} className="text-red-400" />
        )}
        <span className="text-sm font-semibold">{message}</span>
        {onClose && (
            <button onClick={onClose} className="ml-2 text-white/50 hover:text-white transition">
                ✕
            </button>
        )}
    </div>
);

/** Chọn quyền riêng tư */
const PrivacySelector: React.FC<{
    value: PrivacyLevel;
    onChange: (val: PrivacyLevel) => void;
    disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
    <div className="space-y-2">
        <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
            <ShieldAlert size={14} className="text-[#FFB800]" /> Ai có thể xem hồ sơ của bạn?
        </label>
        <select
            value={value}
            onChange={(e) => onChange(Number(e.target.value) as PrivacyLevel)}
            disabled={disabled}
            className="w-full bg-[#1A1825] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition-colors"
        >
            <option value={1}>Công khai</option>
            <option value={2}>Bạn bè</option>
            <option value={3}>Chỉ mình tôi</option>
            <option value={4}>Bạn thân</option>
        </select>
    </div>
);

// ============================================================
//  COVER CROP UPLOADER (tích hợp react‑easy‑crop)
// ============================================================
interface CoverCropUploaderProps {
    currentCoverUrl?: string | null;
    onUploadSuccess: () => void;
}

const CoverCropUploader: React.FC<CoverCropUploaderProps> = ({
    currentCoverUrl,
    onUploadSuccess,
}) => {
    const [mode, setMode] = useState<'view' | 'crop'>('view');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chọn file
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setMode('crop');
            // reset crop state
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Xử lý khi crop hoàn tất
    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Tạo ảnh đã crop từ canvas
    const createCroppedImage = async (): Promise<Blob> => {
        if (!imageSrc || !croppedAreaPixels) throw new Error('Không có dữ liệu crop');

        const image = new Image();
        image.src = imageSrc;
        await new Promise<void>((resolve) => { image.onload = () => resolve(); });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Xoay và vẽ ảnh
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        return new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else throw new Error('Không thể tạo ảnh');
            }, 'image/jpeg', 0.9);
        });
    };

    // Lưu ảnh bìa
    const handleSaveCrop = async () => {
        if (!imageSrc) return;
        setIsSaving(true);
        try {
            const blob = await createCroppedImage();
            const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
            const res = await userApi.uploadCoverPhoto(file);
            if (res.isSuccess) {
                onUploadSuccess();
                setMode('view');
                setImageSrc(null);
            } else {
                alert(res.message || 'Lỗi khi lưu ảnh bìa');
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Lỗi khi xử lý ảnh');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative w-full h-48 sm:h-64 lg:h-80 bg-[#1A1825] group">
            {/* Chế độ xem bình thường */}
            {mode === 'view' && (
                <>
                    {currentCoverUrl ? (
                        <img
                            src={currentCoverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#1E293B] to-[#0F172A] flex items-center justify-center">
                            <ImageIcon size={48} className="text-gray-600" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="opacity-0 group-hover:opacity-100 px-6 py-3 bg-white/20 backdrop-blur-md rounded-xl text-white font-semibold flex items-center gap-2 transition"
                        >
                            <ImageIcon size={18} /> Đổi ảnh bìa
                        </button>
                    </div>
                </>
            )}

            {/* Chế độ crop */}
            {mode === 'crop' && imageSrc && (
                <div className="absolute inset-0 z-20 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={3 / 1} // tỉ lệ ảnh bìa 3:1
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                    />
                    {/* Thanh điều khiển */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 text-white">
                        <button onClick={() => setZoom(z => Math.max(1, z - 0.1))}><ZoomOut size={20} /></button>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-24 accent-indigo-500"
                        />
                        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn size={20} /></button>
                        <button onClick={() => setRotation(r => (r + 90) % 360)}><RotateCw size={20} /></button>
                        <button
                            onClick={handleSaveCrop}
                            disabled={isSaving}
                            className="ml-2 px-4 py-1.5 bg-indigo-600 rounded-lg text-sm font-semibold"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Lưu'}
                        </button>
                        <button onClick={() => { setMode('view'); setImageSrc(null); }} className="text-sm">Hủy</button>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
            />
        </div>
    );
};

// ============================================================
//  MAIN EDIT PROFILE PAGE
// ============================================================
const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { profile, isLoading, error, refetch } = useUserProfile('me', 'me');

    const [form, setForm] = useState<UpdateProfileRequest>({
        fullName: '',
        bio: '',
        dateOfBirth: '',
    });
    const [privacy, setPrivacy] = useState<PrivacyLevel>(1);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Điền dữ liệu vào form khi profile đã load
    useEffect(() => {
        if (profile) {
            const id = setTimeout(() => {
                setForm({
                    fullName: profile.fullName || '',
                    bio: profile.bio || '',
                    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                });
                setPrivacy(profile.profileVisibility ?? 1);
            }, 0);
            return () => clearTimeout(id);
        }
    }, [profile]);

    // Tự động ẩn toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await userApi.updateProfile(form);
            if (res.isSuccess) {
                setToast({ type: 'success', message: 'Hồ sơ đã được cập nhật thành công.' });
                refetch();
            } else {
                setToast({ type: 'error', message: res.message || 'Cập nhật thất bại.' });
            }
        } catch {
            setToast({ type: 'error', message: 'Lỗi kết nối đến máy chủ.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePrivacySave = async () => {
        setSavingPrivacy(true);
        try {
            const payload: UpdatePrivacyRequest = { profileVisibility: privacy };
            const res = await userApi.updatePrivacy(payload);
            if (res.isSuccess) {
                setToast({ type: 'success', message: 'Quyền riêng tư đã được lưu.' });
                refetch();
            } else {
                setToast({ type: 'error', message: res.message || 'Lỗi khi lưu quyền riêng tư.' });
            }
        } catch {
            setToast({ type: 'error', message: 'Lỗi kết nối.' });
        } finally {
            setSavingPrivacy(false);
        }
    };

    const handleAvatarSuccess = useCallback(() => {
        setToast({ type: 'success', message: 'Ảnh đại diện đã được cập nhật.' });
        refetch();
    }, [refetch]);

    const handleCoverSuccess = useCallback(() => {
        setToast({ type: 'success', message: 'Ảnh bìa đã được cập nhật.' });
        refetch();
    }, [refetch]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center pt-[76px]">
                <Loader2 size={40} className="animate-spin text-[#4F6BFF]" />
            </div>
        );
    }

    // Error state
    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] pt-[76px] gap-4">
                <XCircle size={48} className="text-red-400" />
                <h2 className="text-white font-bold text-xl">Không thể tải thông tin hồ sơ</h2>
                <p className="text-gray-400 text-sm">{error || 'Vui lòng thử lại sau.'}</p>
                <button onClick={() => navigate('/profile/me')} className="px-6 py-2.5 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition">
                    Về trang cá nhân
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0D15] pt-[76px] pb-20">
            {toast && <ToastMessage type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Nút Quay lại */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Quay lại</span>
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-white">Chỉnh sửa hồ sơ</h1>
                    <p className="text-gray-400 mt-2">
                        Cập nhật ảnh đại diện, ảnh bìa và thông tin cá nhân của bạn.
                    </p>
                </div>

                {/* Ảnh bìa với crop */}
                <CoverCropUploader
                    currentCoverUrl={profile.coverPhotoUrl}
                    onUploadSuccess={handleCoverSuccess}
                />

                {/* Card chỉnh sửa */}
                <div className="bg-[#1A1825]/80 backdrop-blur-2xl border border-white/5 rounded-b-3xl -mt-16 sm:-mt-20 lg:-mt-24 relative z-10 p-6 sm:p-8 space-y-8 shadow-2xl">
                    {/* Avatar */}
                    <div className="flex justify-center -mt-16 sm:-mt-20 lg:-mt-24">
                        <AvatarUploader
                            currentAvatarUrl={profile.avatarUrl}
                            fullName={profile.fullName}
                            onUploadSuccess={handleAvatarSuccess}
                        />
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <User size={20} className="text-[#4F6BFF]" /> Thông tin cơ bản
                        </h2>

                        <div className="space-y-1">
                            <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                <User size={14} /> Họ và tên
                            </label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                                required
                                className="w-full bg-[#1A1825] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                <Info size={14} /> Tiểu sử
                            </label>
                            <textarea
                                value={form.bio || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                                rows={3}
                                className="w-full bg-[#1A1825] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition resize-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                <Calendar size={14} /> Ngày sinh
                            </label>
                            <input
                                type="date"
                                value={form.dateOfBirth || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                                className="w-full bg-[#1A1825] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] [color-scheme:dark]"
                            />
                        </div>

                        <PrivacySelector value={privacy} onChange={setPrivacy} disabled={savingPrivacy} />

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="flex-1 py-3 bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] hover:opacity-90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                {savingProfile ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Lưu hồ sơ
                            </button>
                            <button
                                type="button"
                                onClick={handlePrivacySave}
                                disabled={savingPrivacy}
                                className="px-6 py-3 bg-[#4F6BFF]/20 hover:bg-[#4F6BFF]/30 text-white font-bold rounded-xl flex items-center gap-2 border border-[#4F6BFF]/30 transition disabled:opacity-50"
                            >
                                {savingPrivacy ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                                Lưu quyền riêng tư
                            </button>
                        </div>
                    </form>

                    <div className="text-center pt-4 border-t border-white/5">
                        <Link
                            to={`/profile/${profile.userName}`}
                            className="text-sm text-gray-400 hover:text-white transition underline underline-offset-2"
                        >
                            Xem trang cá nhân của bạn
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;