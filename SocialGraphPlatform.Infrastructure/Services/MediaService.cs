// SocialGraphPlatform.Infrastructure/Services/MediaService.cs
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Application.DTOs.Media;
using SocialGraphPlatform.Application.Interfaces;

namespace SocialGraphPlatform.Infrastructure.Services;

public class MediaService : IMediaService
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<MediaService> _logger;

    public MediaService(IFileStorageService fileStorageService,
                        IConfiguration configuration,
                        ILogger<MediaService> logger)
    {
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    public async Task<UploadResultDto> UploadFilesAsync(List<IFormFile> files, Guid userId)
    {
        var urls = new List<string>();
        var successCount = 0;

        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            // Gọi Cloudinary (hoặc bất kỳ implementation nào của IFileStorageService)
            var url = await _fileStorageService.UploadFileAsync(file, "posts");

            if (!string.IsNullOrEmpty(url))
            {
                urls.Add(url);
                successCount++;
            }
            else
            {
                _logger.LogWarning("Upload failed for file: {FileName}", file.FileName);
            }
        }

        return new UploadResultDto
        {
            Urls = urls,
            TotalFiles = files.Count,
            SuccessCount = successCount
        };
    }
}