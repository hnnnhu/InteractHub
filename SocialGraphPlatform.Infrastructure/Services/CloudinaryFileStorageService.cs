// Infrastructure/Services/CloudinaryFileStorageService.cs
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Application.Interfaces;
using System.Net.Http.Json;

namespace SocialGraphPlatform.Infrastructure.Services;

public class CloudinaryFileStorageService : IFileStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly ILogger<CloudinaryFileStorageService> _logger;

    public CloudinaryFileStorageService(HttpClient httpClient,
                                         IConfiguration configuration,
                                         ILogger<CloudinaryFileStorageService> logger)
    {
        _httpClient = httpClient;
        _cloudName = configuration["Cloudinary:CloudName"];
        _apiKey = configuration["Cloudinary:ApiKey"];
        _apiSecret = configuration["Cloudinary:ApiSecret"];
        _logger = logger;
    }

    public async Task<string?> UploadFileAsync(IFormFile file, string subFolder = "general")
    {
        if (file == null || file.Length == 0)
            return null;

        using var form = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
        form.Add(fileContent, "file", file.FileName);
        form.Add(new StringContent($"interacthub/{subFolder}"), "folder");
        // Thêm upload preset nếu cần (không bắt buộc)
        // form.Add(new StringContent("your_preset"), "upload_preset");

        var cloudinaryUrl = $"https://api.cloudinary.com/v1_1/{_cloudName}/image/upload";

        // Xác thực basic auth (apiKey:apiSecret)
        var byteArray = System.Text.Encoding.ASCII.GetBytes($"{_apiKey}:{_apiSecret}");
        var request = new HttpRequestMessage(HttpMethod.Post, cloudinaryUrl)
        {
            Content = form
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", Convert.ToBase64String(byteArray));

        var response = await _httpClient.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadFromJsonAsync<CloudinaryUploadResponse>();
            return result?.SecureUrl?.ToString();
        }
        else
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Cloudinary upload failed: {StatusCode} {Error}", response.StatusCode, error);
            return null;
        }
    }

    public Task<bool> DeleteFileAsync(string fileUrl) => Task.FromResult(true);

    // Class để map kết quả JSON trả về
    private class CloudinaryUploadResponse
    {
        public Uri SecureUrl { get; set; }
    }
}