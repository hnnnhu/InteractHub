// src/components/settings/AccountActions.tsx
import React, { useState } from 'react';
import { UserX, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import userApi from '../../api/userApi';

const AccountActions: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDeactivate = async () => {
        const confirm = window.confirm("Bạn có chắc chắn muốn vô hiệu hóa tài khoản? Bạn có thể khôi phục lại trong vòng 30 ngày.");
        if (!confirm) return;

        setIsLoading(true);
        try {
            const res = await userApi.deactivateAccount();
            if (res.isSuccess) {
                alert("Tài khoản đã được vô hiệu hóa. Bạn sẽ được đăng xuất.");
                window.location.href = '/login';
            } else {
                alert(res.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#FF1493]/5 backdrop-blur-xl border border-[#FF1493]/20 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#FF1493]/20 rounded-lg">
                    <AlertTriangle className="text-[#FF1493]" size={20} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Vùng nguy hiểm</h3>
                    <p className="text-gray-400 text-sm">Quản lý trạng thái hoạt động của tài khoản</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="text-white font-semibold text-sm mb-1">Vô hiệu hóa tài khoản</h4>
                    <p className="text-gray-500 text-xs mb-4">Mọi dữ liệu của bạn sẽ bị ẩn cho đến khi bạn đăng nhập trở lại.</p>

                    <button
                        onClick={handleDeactivate}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-red-500 border border-red-500/20 font-bold transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <UserX size={18} />}
                        Vô hiệu hóa ngay
                    </button>
                </div>

                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <h4 className="text-white font-semibold text-sm mb-1">Khôi phục tài khoản</h4>
                    <p className="text-gray-500 text-xs mb-4">Nếu bạn vừa yêu cầu vô hiệu hóa nhầm, hãy nhấn vào đây.</p>

                    <button
                        onClick={async () => {
                            setIsLoading(true);
                            const res = await userApi.restoreAccount();
                            alert(res.message);
                            setIsLoading(false);
                        }}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-[#4F6BFF]/10 text-[#4F6BFF] border border-[#4F6BFF]/20 font-bold transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        Gửi yêu cầu khôi phục
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountActions;