using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Media;
using SocialGraphPlatform.Application.Interfaces;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/media")]
[ApiController]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;

    public MediaController(IMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(userIdClaim, out Guid userId)
            ? userId
            : throw new UnauthorizedAccessException("Không thể xác thực người dùng.");
    }

    [HttpPost("upload")]
    [ProducesResponseType(typeof(ApiResponse<UploadResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadMedia([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
            return BadRequest(ApiResponse.Fail("Không có file nào được chọn."));

        var userId = GetCurrentUserId();
        var result = await _mediaService.UploadFilesAsync(files, userId);

        if (result.SuccessCount == 0)
            return BadRequest(ApiResponse.Fail("Không có file hợp lệ nào được upload."));

        return Ok(ApiResponse<UploadResultDto>.Ok(result, "Upload file thành công"));
    }
}