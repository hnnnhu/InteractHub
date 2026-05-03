using System.Security.Claims;

namespace SocialGraphPlatform.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Lấy UserId từ Claims của người dùng đang đăng nhập
    /// </summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        if (principal == null)
            return Guid.Empty;

        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? principal.FindFirstValue("sub")
                  ?? principal.FindFirstValue(ClaimTypes.Name);

        return Guid.TryParse(userId, out var guid) ? guid : Guid.Empty;
    }

    /// <summary>
    /// Lấy Username từ Claims (nếu cần)
    /// </summary>
    public static string GetUserName(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
    }
}