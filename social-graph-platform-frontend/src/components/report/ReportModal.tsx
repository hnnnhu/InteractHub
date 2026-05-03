// components/report/ReportModal.tsx
import React, { useState } from 'react';
import { useReasons } from '../../hooks/report/useReasons';
import { useCreateReport } from '../../hooks/report/useCreateReport';
import { ReportReason } from '../../types/report';
import { Loader2, X, Flag, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
    postId: string;
    onClose: () => void;
    onSuccess?: () => void;
    entityDescription?: string;
}

const EMOJI_MAP: Record<ReportReason, string> = {
    [ReportReason.Spam]: '📢',
    [ReportReason.Harassment]: '😠',
    [ReportReason.HateSpeech]: '💢',
    [ReportReason.NudityOrSexualContent]: '🔞',
    [ReportReason.Violence]: '⚔️',
    [ReportReason.FalseInformation]: '📰',
    [ReportReason.Other]: '❗',
};

const ReportModal: React.FC<ReportModalProps> = ({
    postId,
    onClose,
    onSuccess,
    entityDescription,
}) => {
    const { data: reasons, isLoading: loadingReasons } = useReasons();
    const { mutate: submitReport, isPending: submitting } = useCreateReport();

    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [details, setDetails] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedReason === null) {
            setError('Vui lòng chọn lý do báo cáo');
            return;
        }
        setError(null);
        submitReport(
            {
                postId,
                reason: selectedReason,
                details: details.trim() || undefined,
            },
            {
                onSuccess: () => {
                    onSuccess?.();
                    onClose();
                },
                onError: (err: unknown) => {
                    setError(
                        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gửi báo cáo'
                    );
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1A1825]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] w-full max-w-lg mx-4 shadow-2xl shadow-black/40 relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Flag className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Báo cáo bài viết</h2>
                            {entityDescription && (
                                <p className="text-sm text-gray-400 mt-0.5">{entityDescription}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {loadingReasons ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#4F6BFF]" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Reasons list */}
                        <div className="px-6 pb-4 max-h-[320px] overflow-y-auto custom-scrollbar space-y-2">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Chọn lý do báo cáo <span className="text-red-400">*</span>
                            </label>
                            {reasons?.map((r) => (
                                <label
                                    key={r.reason}
                                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedReason === r.reason
                                            ? 'bg-[#4F6BFF]/10 border-[#4F6BFF]/40 shadow-[0_0_10px_rgba(79,107,255,0.15)]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="relative flex items-center justify-center mt-0.5">
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={r.reason}
                                            checked={selectedReason === r.reason}
                                            onChange={() => setSelectedReason(r.reason)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedReason === r.reason
                                                    ? 'border-[#4F6BFF]'
                                                    : 'border-gray-600'
                                                }`}
                                        >
                                            {selectedReason === r.reason && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#4F6BFF]" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg leading-none">
                                                {EMOJI_MAP[r.reason] || '❓'}
                                            </span>
                                            <span className="font-semibold text-white text-sm">
                                                {r.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            {r.description}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Details textarea */}
                        <div className="px-6 pb-4">
                            <label
                                htmlFor="report-details"
                                className="block text-sm font-medium text-gray-300 mb-2"
                            >
                                Chi tiết bổ sung <span className="text-gray-500">(tối đa 1000 ký tự)</span>
                            </label>
                            <textarea
                                id="report-details"
                                rows={3}
                                className="w-full bg-[#0D0C13] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#4F6BFF] focus:ring-1 focus:ring-[#4F6BFF]/50 transition-all text-sm resize-none"
                                placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                maxLength={1000}
                            />
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors text-sm"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || selectedReason === null}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F6BFF] to-[#6C5CE7] hover:from-[#5b75ff] hover:to-[#7C6EFF] text-white font-semibold transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#4F6BFF]/20"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Flag size={16} />
                                        Gửi báo cáo
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportModal;