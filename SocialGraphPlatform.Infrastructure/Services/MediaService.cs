using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SocialGraphPlatform.Application.DTOs.Media;
using SocialGraphPlatform.Application.Interfaces;

namespace SocialGraphPlatform.Infrastructure.Services;

public class MediaService : IMediaService
{
    private readonly string _uploadRootPath;
    private readonly string _baseUrl;   // ← Thêm dòng này

    public MediaService(IConfiguration configuration)
    {
        _uploadRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

        // Tạo thư mục nếu chưa tồn tại
        if (!Directory.Exists(_uploadRootPath))
            Directory.CreateDirectory(_uploadRootPath);

        // Lấy Base URL từ appsettings.json hoặc environment
        _baseUrl = configuration["BaseUrl"] ?? "https://localhost:7042";
    }

    public async Task<UploadResultDto> UploadFilesAsync(List<IFormFile> files, Guid userId)
    {
        var urls = new List<string>();
        var successCount = 0;

        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            // Tạo tên file an toàn
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"{userId}_{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid().ToString()[..8]}{fileExtension}";

            var savePath = Path.Combine(_uploadRootPath, fileName);

            await using var stream = new FileStream(savePath, FileMode.Create);
            await file.CopyToAsync(stream);

            // === TRẢ VỀ URL ĐẦY ĐỦ (quan trọng) ===
            var fullUrl = $"{_baseUrl}/uploads/{fileName}";

            urls.Add(fullUrl);
            successCount++;
        }

        return new UploadResultDto
        {
            Urls = urls,
            TotalFiles = files.Count,
            SuccessCount = successCount
        };
    }
}