// src/pages/settings/BlockedUsersPage.tsx
import React from 'react';
import { UserX } from 'lucide-react';
import BlockedUsersList from '../../components/block/BlockedUsersList';

const BlockedUsersPage: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <UserX className="text-[#FF1493]" size={28} />
                    Danh sách chặn
                </h2>
                <p className="text-gray-400 mt-2">
                    Những người bạn đã chặn không thể xem hồ sơ, gửi lời mời kết bạn hoặc nhắn tin cho bạn.
                </p>
            </div>

            {/* Sử dụng component BlockedUsersList đã được xây dựng sẵn */}
            <BlockedUsersList />
        </div>
    );
};

export default BlockedUsersPage;