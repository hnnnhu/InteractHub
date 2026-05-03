using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Hashtag;
using SocialGraphPlatform.Application.Interfaces;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/hashtags")]
[ApiController]
[Authorize] // Người dùng cần đăng nhập để xem nội dung chi tiết và tương tác
public class HashtagsController : ControllerBase
{
    private readonly IHashtagService _hashtagService;

    public HashtagsController(IHashtagService hashtagService)
    {
        _hashtagService = hashtagService;
    }

    /// <summary>
    /// Helper: Lấy UserId từ JWT Token
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out Guid userId)) return userId;
        throw new UnauthorizedAccessException("Không thể xác thực danh tính.");
    }

    /// <summary>
    /// Tìm kiếm hashtag theo từ khóa hoặc liệt kê theo tiêu chí sắp xếp
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<HashtagDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] HashtagSearchDto request)
    {
        // Sử dụng [FromQuery] để nhận các tham số như Keyword, SortBy từ URL
        var response = await _hashtagService.SearchHashtagsAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Lấy danh sách các hashtag nổi bật (Trending)
    /// </summary>
    [HttpGet("trending")]
    [ProducesResponseType(typeof(ApiResponse<List<TrendingHashtagDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrending([FromQuery] int count = 10)
    {
        var response = await _hashtagService.GetTrendingHashtagsAsync(count);
        return Ok(response);
    }

    /// <summary>
    /// Lấy thông tin chi tiết một hashtag và các bài viết gắn thẻ này
    /// </summary>
    [HttpGet("{name}")]
    [ProducesResponseType(typeof(ApiResponse<HashtagWithPostsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByName(string name, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        // Loại bỏ dấu # nếu người dùng nhập vào để đảm bảo tính chuẩn hóa
        var normalizedName = name.TrimStart('#');

        var response = await _hashtagService.GetHashtagWithPostsAsync(userId, normalizedName, pageNumber, pageSize);

        if (!response.IsSuccess) return NotFound(response);
        return Ok(response);
    }
}