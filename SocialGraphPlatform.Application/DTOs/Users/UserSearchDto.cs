namespace SocialGraphPlatform.Application.DTOs.User;

public record UserSearchDto
{
    public string? Keyword { get; init; }           // Tìm theo FullName hoặc UserName
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}