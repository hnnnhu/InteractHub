// src/components/user/ChangePasswordForm.tsx

import React, { useState } from 'react';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';
import userApi from '../../api/userApi';
import type { ChangePasswordRequest } from '../../types/user';

const ChangePasswordForm: React.FC = () => {
    const [formData, setFormData] = useState<ChangePasswordRequest>({
        currentPassword: '', newPassword: '', confirmNewPassword: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(null); setSuccess(null);

        if (formData.newPassword !== formData.confirmNewPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            setIsLoading(false); return;
        }

        try {
            const res = await userApi.changePassword(formData);
            if (res.isSuccess) {
                setSuccess('Đổi mật khẩu thành công!');
                setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            } else {
                setError(res.message || 'Thất bại.');
            }
        } catch (err) {
            setError(err.message || 'Lỗi kết nối.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 bg-[#12101A] p-6 rounded-3xl border border-white/10">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">{error}</div>}
            {success && <div className="p-3 bg-[#00FF9F]/10 border border-[#00FF9F]/20 text-[#00FF9F] rounded-xl text-sm font-bold flex items-center gap-2"><CheckCircle2 size={18} /> {success}</div>}

            <div className="space-y-1">
                <label className="text-sm text-gray-400 font-medium">Mật khẩu hiện tại</label>
                <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required className="w-full bg-[#1A1825] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition-colors" />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm text-gray-400 font-medium">Mật khẩu mới</label>
                <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required minLength={6} className="w-full bg-[#1A1825] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition-colors" />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm text-gray-400 font-medium">Xác nhận mật khẩu mới</label>
                <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="password" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} required minLength={6} className="w-full bg-[#1A1825] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-[#4F6BFF] transition-colors" />
                </div>
            </div>

            <button disabled={isLoading} type="submit" className="w-full py-3.5 bg-gradient-to-r from-red-500 to-[#FF1493] hover:opacity-90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-50">
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Đổi Mật Khẩu'}
            </button>
        </form>
    );
};

export default ChangePasswordForm;