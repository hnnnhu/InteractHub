namespace SocialGraphPlatform.Infrastructure.Settings.Email;

/// <summary>
/// Cấu hình gửi email qua SMTP
/// </summary>
public class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "SocialGraphPlatform";
    public bool EnableSsl { get; set; } = true;
    public bool UseDefaultCredentials { get; set; } = false;
    public int TimeoutSeconds { get; set; } = 30;
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

    /// <summary>
    /// Kiểm tra cấu hình email có hợp lệ không
    /// </summary>
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(SmtpHost))
            throw new InvalidOperationException($"{SectionName}.SmtpHost is required.");

        if (SmtpPort <= 0)
            throw new InvalidOperationException($"{SectionName}.SmtpPort must be greater than 0.");

        if (string.IsNullOrWhiteSpace(SmtpUser))
            throw new InvalidOperationException($"{SectionName}.SmtpUser is required.");

        if (string.IsNullOrWhiteSpace(SmtpPassword))
            throw new InvalidOperationException($"{SectionName}.SmtpPassword is required.");

        if (string.IsNullOrWhiteSpace(FromEmail))
            throw new InvalidOperationException($"{SectionName}.FromEmail is required.");

        if (string.IsNullOrWhiteSpace(FrontendBaseUrl))
            throw new InvalidOperationException($"{SectionName}.FrontendBaseUrl is required.");
    }
}