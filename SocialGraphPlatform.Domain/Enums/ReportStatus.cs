namespace SocialGraphPlatform.Domain.Enums
{
    public enum ReportStatus
    {
        Pending = 1,   // Đang chờ Admin xử lý
        Reviewed = 2,  // Admin đang xem xét
        Resolved = 3,  // Đã giải quyết (VD: Xóa bài, cảnh cáo User)
        Dismissed = 4  // Bị bác bỏ (Bài viết không vi phạm)
    }
}