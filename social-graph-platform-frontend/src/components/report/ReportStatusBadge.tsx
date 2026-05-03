// components/report/ReportStatusBadge.tsx
import React from 'react';
import { ReportStatus } from '../../types/report';

const statusConfig: Record<number, { label: string; className: string }> = {
    [ReportStatus.Pending]: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
    [ReportStatus.Reviewed]: { label: 'Đang xem xét', className: 'bg-blue-100 text-blue-800' },
    [ReportStatus.Resolved]: { label: 'Đã xử lý', className: 'bg-green-100 text-green-800' },
    [ReportStatus.Dismissed]: { label: 'Đã bác bỏ', className: 'bg-gray-100 text-gray-800' },
};

interface Props {
    status: ReportStatus;
}

const ReportStatusBadge: React.FC<Props> = ({ status }) => {
    const config = statusConfig[status] ?? { label: 'Không xác định', className: 'bg-gray-100 text-gray-800' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
};

export default ReportStatusBadge;