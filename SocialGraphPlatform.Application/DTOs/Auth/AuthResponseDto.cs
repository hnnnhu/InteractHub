// SocialGraphPlatform.Application/DTOs/Auth/AuthResponseDto.cs
using System;

namespace SocialGraphPlatform.Application.DTOs.Auth;

public record AuthResponseDto
{
    public string Token { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;

    // 🚀 ĐÃ THÊM: ID của phiên đăng nhập hiện tại để Client quản lý
    public Guid SessionId { get; init; }

    public DateTimeOffset ExpiresAt { get; init; }
    public DateTimeOffset RefreshTokenExpiresAt { get; init; }

    public Guid UserId { get; init; }

    public string Email { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public string? Bio { get; init; }
}