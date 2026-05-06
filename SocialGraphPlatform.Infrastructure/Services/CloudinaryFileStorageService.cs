using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Application.Interfaces;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

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
        _cloudName = configuration["Cloudinary:CloudName"] ?? "";
        _apiKey = configuration["Cloudinary:ApiKey"] ?? "";
        _apiSecret = configuration["Cloudinary:ApiSecret"] ?? "";
        _logger = logger;
    }

    public async Task<string?> UploadFileAsync(IFormFile file, string subFolder = "general")
    {
        if (file == null || file.Length == 0) return null;

        _logger.LogInformation("Uploading file {FileName} to Cloudinary...", file.FileName);

        using var form = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
        form.Add(fileContent, "file", file.FileName);
        form.Add(new StringContent($"interacthub/{subFolder}"), "folder");

        var cloudinaryUrl = $"https://api.cloudinary.com/v1_1/{_cloudName}/image/upload";

        var byteArray = Encoding.ASCII.GetBytes($"{_apiKey}:{_apiSecret}");
        var request = new HttpRequestMessage(HttpMethod.Post, cloudinaryUrl)
        {
            Content = form
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(byteArray));

        try
        {
            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Cloudinary upload failed: {StatusCode} {Response}", response.StatusCode, responseBody);
                return null;
            }

            _logger.LogInformation("Cloudinary raw response: {Response}", responseBody);

            var cloudinaryResponse = JsonSerializer.Deserialize<CloudinaryUploadResponse>(responseBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            var secureUrl = cloudinaryResponse?.SecureUrl?.ToString();
            if (string.IsNullOrEmpty(secureUrl))
            {
                _logger.LogWarning("Cloudinary upload succeeded but no secure_url returned. Response: {Response}", responseBody);
                return null;
            }

            _logger.LogInformation("Cloudinary upload success: {Url}", secureUrl);
            return secureUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudinary upload exception for file {FileName}", file.FileName);
            return null;
        }
    }

    public Task<bool> DeleteFileAsync(string fileUrl) => Task.FromResult(true);

    private class CloudinaryUploadResponse
    {
        public string SecureUrl { get; set; } = string.Empty;
    }
}