// src/components/user/EditProfileForm.tsx
import React, { useState } from 'react';
import { Loader2, User, Info, Calendar } from 'lucide-react';
import userApi from '../../api/userApi';
import AvatarUploader from './AvatarUploader';
import CoverUploader from './CoverUploader';
import type { UserProfileDto, UpdateProfileRequest } from '../../types/user';

interface EditProfileFormProps {
    profile: UserProfileDto;
    onSuccess: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ profile, onSuccess }) => {
    const [formData, setFormData] = useState<UpdateProfileRequest>({
        fullName: profile.fullName,
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(null);
        try {
            const res = await userApi.updateProfile(formData);
            if (res.isSuccess) onSuccess();
            else setError(res.message || 'Cập nhật thất bại.');
        } catch (err) {
            setError(err.message || 'Lỗi kết nối.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-[#12101A] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Khu vực Upload Ảnh */}
            <CoverUploader currentCoverUrl={profile.coverPhotoUrl} onUploadSuccess={() => { }} />

            <div className="-mt-12 sm:-mt-16 mb-6 z-20 relative">
                <AvatarUploader currentAvatarUrl={profile.avatarUrl} fullName={profile.fullName} onUploadSuccess={() => { }} />
            </div>

            {/* Form Thông tin */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">{error}</div>}

                <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2"><User size={14} /> Họ và tên</label>
                    <input
                        type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                        className="w-full bg-[#1A1825] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition-colors"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2"><Info size={14} /> Tiểu sử</label>
                    <textarea
                        name="bio" value={formData.bio || ''} onChange={handleChange} rows={3}
                        className="w-full bg-[#1A1825] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition-colors resize-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2"><Calendar size={14} /> Ngày sinh</label>
                    <input
                        type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange}
                        className="w-full bg-[#1A1825] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] [color-scheme:dark]"
                    />
                </div>

                <button disabled={isLoading} type="submit" className="w-full py-3.5 mt-4 bg-gradient-to-r from-[#FF1493] to-[#4F6BFF] hover:opacity-90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 shadow-lg">
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Lưu Thay Đổi'}
                </button>
            </form>
        </div>
    );
};

export default EditProfileForm;