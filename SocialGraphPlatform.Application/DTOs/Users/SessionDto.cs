namespace SocialGraphPlatform.Application.DTOs.User;

public record SessionDto
{
    /// <summary>
    /// ID của phiên đăng nhập (Dùng để gửi lên yêu cầu hủy phiên)
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Thông tin thiết bị (Ví dụ: "Chrome on Windows", "iPhone 15 Pro")
    /// </summary>
    public string? DeviceInfo { get; init; }

    /// <summary>
    /// Địa chỉ IP thực hiện đăng nhập
    /// </summary>
    public string? IpAddress { get; init; }

    /// <summary>
    /// Thời điểm đăng nhập lần đầu
    /// </summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>
    /// Thời điểm hoạt động cuối cùng của phiên này
    /// </summary>
    public DateTime LastActiveAt { get; init; }

    /// <summary>
    /// Đánh dấu đây có phải là phiên mà người dùng đang sử dụng để gọi API hay không
    /// </summary>
    public bool IsCurrent { get; init; }
}