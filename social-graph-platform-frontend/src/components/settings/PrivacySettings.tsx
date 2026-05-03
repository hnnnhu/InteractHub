// src/components/settings/PrivacySettings.tsx
import React, { useState } from 'react';
import { Globe, Users, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import userApi from '../../api/userApi';
import { PrivacyLevel } from '../../types/user';

interface PrivacySettingsProps {
    initialLevel?: PrivacyLevel;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ initialLevel = PrivacyLevel.Public }) => {
    const [level, setLevel] = useState<PrivacyLevel>(initialLevel);
    const [isLoading, setIsLoading] = useState(false);

    const options = [
        { id: PrivacyLevel.Public, label: 'Công khai', desc: 'Bất kỳ ai cũng có thể thấy trang cá nhân của bạn.', icon: Globe },
        { id: PrivacyLevel.FriendsOnly, label: 'Bạn bè', desc: 'Chỉ những người bạn đã kết bạn mới có thể xem.', icon: Users },
        { id: PrivacyLevel.Private, label: 'Riêng tư', desc: 'Chỉ mình bạn mới có quyền xem thông tin chi tiết.', icon: Lock },
    ];

    const handleUpdate = async (newLevel: PrivacyLevel) => {
        setIsLoading(true);
        try {
            const res = await userApi.updatePrivacy({ profileVisibility: newLevel });
            if (res.isSuccess) {
                setLevel(newLevel);
            } else {
                alert(res.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#4F6BFF]/20 rounded-lg">
                    <ShieldCheck className="text-[#4F6BFF]" size={20} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Quyền riêng tư</h3>
                    <p className="text-gray-400 text-sm">Kiểm soát ai có thể xem profile của bạn</p>
                </div>
            </div>

            <div className="space-y-3">
                {options.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = level === opt.id;
                    return (
                        <button
                            key={opt.id}
                            disabled={isLoading}
                            onClick={() => handleUpdate(opt.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${isActive
                                    ? 'bg-[#4F6BFF]/10 border-[#4F6BFF] shadow-[0_0_15px_rgba(79,107,255,0.2)]'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className={`p-3 rounded-xl ${isActive ? 'bg-[#4F6BFF] text-white' : 'bg-white/5 text-gray-400'}`}>
                                {isLoading && isActive ? <Loader2 className="animate-spin" size={20} /> : <Icon size={20} />}
                            </div>
                            <div className="text-left flex-1">
                                <p className={`font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>{opt.label}</p>
                                <p className="text-xs text-gray-500">{opt.desc}</p>
                            </div>
                            {isActive && <div className="w-2 h-2 rounded-full bg-[#4F6BFF] shadow-[0_0_8px_#4F6BFF]"></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PrivacySettings;