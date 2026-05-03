// SocialGraphPlatform.Infrastructure/Services/Messaging/EmailService.cs
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Infrastructure.Settings.Email;
using System.Net;
using System.Net.Mail;

namespace SocialGraphPlatform.Infrastructure.Services.Messaging;

/// <summary>
/// Implementation của IEmailService sử dụng SMTP.
/// Nên chuyển sang MailKit khi dự án phát triển mạnh.
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> options, ILogger<EmailService> logger)
    {
        _settings = options.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger;

        _settings.Validate();   // Validate ngay khi khởi tạo
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetToken)
    {
        var resetLink = $"{_settings.FrontendBaseUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(toEmail)}";
        var subject = "🔐 Đặt lại mật khẩu - SocialGraphPlatform";
        var body = GeneratePasswordResetBody(fullName, resetLink);

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmationToken)
    {
        var confirmLink = $"{_settings.FrontendBaseUrl}/confirm-email?token={Uri.EscapeDataString(confirmationToken)}&email={Uri.EscapeDataString(toEmail)}";
        var subject = "✅ Xác nhận email - SocialGraphPlatform";
        var body = GenerateConfirmationBody(fullName, confirmLink);

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string fullName)
    {
        var subject = "🎉 Chào mừng đến với SocialGraphPlatform!";
        var body = GenerateWelcomeBody(fullName);

        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            using var smtpClient = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
            {
                Credentials = new NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword),
                EnableSsl = _settings.EnableSsl,
                Timeout = _settings.TimeoutSeconds * 1000,
                UseDefaultCredentials = _settings.UseDefaultCredentials
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);

            _logger.LogInformation("Email sent successfully to {ToEmail} | Subject: {Subject}", toEmail, subject);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "SMTP error sending email to {ToEmail}. Status: {StatusCode}", toEmail, ex.StatusCode);
            throw new InvalidOperationException($"Gửi email thất bại: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending email to {ToEmail}", toEmail);
            throw;
        }
    }

    #region Email Body Generators

    private string GeneratePasswordResetBody(string fullName, string resetLink)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }}
        .container {{ max-width: 600px; margin: 20px auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }}
        .button {{ background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }}
        .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'><h1 style='margin:0'>🔐 Đặt lại mật khẩu</h1></div>
        <div class='content'>
            <p>Xin chào <strong>{fullName}</strong>,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>SocialGraphPlatform</strong>.</p>
            <div style='text-align: center;'><a href='{resetLink}' class='button'>Đặt lại mật khẩu ngay</a></div>
            <p>Hoặc sao chép liên kết sau vào trình duyệt:</p>
            <p style='word-break: break-all; background: #f8f9fa; padding: 12px; font-size: 13px; border-radius: 4px;'>{resetLink}</p>
            <div class='warning'>
                <strong>⚠️ Lưu ý:</strong> Liên kết này sẽ hết hạn sau <strong>30 phút</strong>.<br>
                Nếu bạn không yêu cầu, vui lòng bỏ qua email này.
            </div>
        </div>
        <div class='footer'>
            <p>© {DateTime.Now.Year} SocialGraphPlatform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateConfirmationBody(string fullName, string confirmLink)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }}
        .container {{ max-width: 600px; margin: 20px auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }}
        .button {{ background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'><h1 style='margin:0'>✅ Xác nhận email của bạn</h1></div>
        <div class='content'>
            <p>Xin chào <strong>{fullName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>SocialGraphPlatform</strong>!</p>
            <p>Vui lòng xác nhận địa chỉ email bằng cách nhấp vào nút bên dưới:</p>
            <div style='text-align: center;'><a href='{confirmLink}' class='button'>Xác nhận email ngay</a></div>
            <p>Hoặc sao chép liên kết sau:</p>
            <p style='word-break: break-all; background: #f8f9fa; padding: 12px; font-size: 13px; border-radius: 4px;'>{confirmLink}</p>
            <p>⏰ Liên kết này sẽ hết hạn sau <strong>24 giờ</strong>.</p>
        </div>
        <div class='footer'>
            <p>© {DateTime.Now.Year} SocialGraphPlatform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateWelcomeBody(string fullName)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }}
        .container {{ max-width: 600px; margin: 20px auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }}
        .feature {{ display: flex; align-items: center; margin: 18px 0; }}
        .feature-icon {{ font-size: 28px; margin-right: 15px; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'><h1 style='margin:0'>🎉 Chào mừng, {fullName}!</h1></div>
        <div class='content'>
            <p>Cảm ơn bạn đã tham gia <strong>SocialGraphPlatform</strong> - nơi kết nối bạn với cộng đồng.</p>
            <h3 style='color:#667eea;'>✨ Những gì bạn có thể làm ngay:</h3>
            <div class='feature'><span class='feature-icon'>📸</span><div><strong>Chia sẻ khoảnh khắc</strong></div></div>
            <div class='feature'><span class='feature-icon'>👥</span><div><strong>Kết nối bạn bè</strong></div></div>
            <div class='feature'><span class='feature-icon'>💬</span><div><strong>Tương tác thực tế</strong></div></div>
            <p>Chúc bạn có những trải nghiệm tuyệt vời!</p>
        </div>
        <div class='footer'>
            <p>© {DateTime.Now.Year} SocialGraphPlatform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
    }

    #endregion
}