// components/notification/MarkAllReadButton.tsx

import React, { useState } from 'react';

interface MarkAllReadButtonProps {
    onMarkAll: () => Promise<boolean>;
    className?: string;
}

const MarkAllReadButton: React.FC<MarkAllReadButtonProps> = ({ onMarkAll, className = '' }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await onMarkAll();
        } catch {
            // Lỗi đã xử lý bên trong hook
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 
        bg-blue-50 text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? (
                <>
                    <svg
                        className="animate-spin h-3.5 w-3.5 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Đang xử lý...
                </>
            ) : (
                'Đánh dấu tất cả đã đọc'
            )}
        </button>
    );
};

export default MarkAllReadButton;