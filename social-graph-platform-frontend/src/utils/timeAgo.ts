// utils/timeAgo.ts

/**
 * Chuyển đổi một thời điểm (ISO string hoặc Date) thành chuỗi thời gian tương đối
 * Ví dụ: "Vừa xong", "2 phút trước", "1 giờ trước", "3 ngày trước"
 */
export function getTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - past.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 5) return 'Vừa xong';
    if (seconds < 60) return `${seconds} giây trước`;
    if (minutes === 1) return '1 phút trước';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours === 1) return '1 giờ trước';
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    if (weeks === 1) return '1 tuần trước';
    if (weeks < 5) return `${weeks} tuần trước`;
    if (months === 1) return '1 tháng trước';
    if (months < 12) return `${months} tháng trước`;
    if (years === 1) return '1 năm trước';
    return `${years} năm trước`;
}