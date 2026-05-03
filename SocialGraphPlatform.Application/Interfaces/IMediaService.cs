using Microsoft.AspNetCore.Http;
using SocialGraphPlatform.Application.DTOs.Media;

namespace SocialGraphPlatform.Application.Interfaces;

public interface IMediaService
{
    Task<UploadResultDto> UploadFilesAsync(List<IFormFile> files, Guid userId);
}