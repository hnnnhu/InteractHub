namespace SocialGraphPlatform.Application.Interfaces;

/// <summary>
/// Interface định nghĩa các phương thức gửi email trong hệ thống.
/// Implementation sẽ nằm ở Infrastructure layer.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Gửi email xác nhận tài khoản (Email Verification)
    /// </summary>
    /// <param name="toEmail">Email người nhận</param>
    /// <param name="fullName">Tên đầy đủ của người nhận</param>
    /// <param name="confirmationToken">Token xác nhận email</param>
    Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmationToken);

    /// <summary>
    /// Gửi email chứa link/token đặt lại mật khẩu
    /// </summary>
    /// <param name="toEmail">Email người nhận</param>
    /// <param name="fullName">Tên đầy đủ của người nhận</param>
    /// <param name="resetToken">Token đặt lại mật khẩu</param>
    Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetToken);

    /// <summary>
    /// Gửi email chào mừng người dùng mới đăng ký
    /// </summary>
    /// <param name="toEmail">Email người nhận</param>
    /// <param name="fullName">Tên đầy đủ của người nhận</param>
    Task SendWelcomeEmailAsync(string toEmail, string fullName);

    /// <summary>
    /// Gửi email thông báo chung (có thể dùng cho notification, thông báo hệ thống...)
    /// </summary>
    /// <param name="toEmail">Email người nhận</param>
    /// <param name="subject">Tiêu đề email</param>
    /// <param name="htmlBody">Nội dung HTML của email</param>
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
}