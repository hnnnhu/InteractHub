namespace SocialGraphPlatform.Application.DTOs.Media;

public record UploadResultDto
{
    public List<string> Urls { get; init; } = new();
    public int TotalFiles { get; init; }
    public int SuccessCount { get; init; }
}