// components/report/ReportReasonLabel.tsx
import React from 'react';
import { ReportReason, ReportReasonDescriptions } from '../../types/report';

interface Props {
    reason: ReportReason;
}

const ReportReasonLabel: React.FC<Props> = ({ reason }) => {
    const desc = ReportReasonDescriptions[reason] ?? 'Lý do khác';
    return (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <span className="font-medium">{ReportReason[reason] ?? reason}</span>
            <span className="text-gray-400">-</span>
            <span>{desc}</span>
        </span>
    );
};

export default ReportReasonLabel;