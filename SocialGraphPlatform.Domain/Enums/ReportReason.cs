namespace SocialGraphPlatform.Domain.Enums
{
    public enum ReportReason
    {
        Spam = 1,                 // Rác / Quảng cáo trái phép
        Harassment = 2,           // Bắt nạt / Quấy rối
        HateSpeech = 3,           // Ngôn từ kích động thù địch
        NudityOrSexualContent = 4,// Ảnh khỏa thân / Nội dung tình dục
        Violence = 5,             // Bạo lực
        FalseInformation = 6,     // Thông tin sai lệch / Fake news
        Other = 7                 // Lý do khác
    }
}