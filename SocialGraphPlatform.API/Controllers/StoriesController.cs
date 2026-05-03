using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Stories;
using SocialGraphPlatform.Application.DTOs.Story;
using SocialGraphPlatform.Application.Interfaces;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/stories")]
[ApiController]
[Authorize]
public class StoriesController : ControllerBase
{
    private readonly IStoryService _storyService;

    public StoriesController(IStoryService storyService)
    {
        _storyService = storyService;
    }

    /// <summary>
    /// Lấy UserId từ JWT claims
    /// </summary>
    private Guid? TryGetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out Guid userId))
            return userId;

        return null;
    }

    // =========================================================
    // 1. QUẢN LÝ STORY CỦA TÔI (MY STORIES)
    // =========================================================

    /// <summary>
    /// Xem danh sách các Story đang hoạt động của chính mình
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<ActiveStoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyStories()
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        var response = await _storyService.GetMyStoriesAsync(userId.Value);
        return Ok(response);
    }

    /// <summary>
    /// Đăng một Story mới (Tin 24h)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<IdDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStory([FromBody] CreateStoryDto request)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        var response = await _storyService.CreateStoryAsync(userId.Value, request);

        if (!response.IsSuccess)
            return BadRequest(response);

        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Xóa Story trước khi hết hạn
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStory(Guid id)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        var response = await _storyService.DeleteStoryAsync(userId.Value, id);

        if (!response.IsSuccess)
        {
            return response.StatusCode switch
            {
                403 => StatusCode(StatusCodes.Status403Forbidden, response),
                404 => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    // =========================================================
    // 2. TRUY VẤN VÀ TƯƠNG TÁC (FEED & VIEWS)
    // =========================================================

    /// <summary>
    /// Lấy bảng tin Story của bạn bè (Nhóm theo từng người dùng)
    /// </summary>
    [HttpGet("feed")]
    [ProducesResponseType(typeof(ApiResponse<List<ActiveStoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveStoriesFeed()
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        var response = await _storyService.GetActiveStoriesFeedAsync(userId.Value);
        return Ok(response);
    }

    /// <summary>
    /// Lấy chi tiết một Story cụ thể theo ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<StoryResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStoryById(Guid id)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        var response = await _storyService.GetStoryByIdAsync(userId.Value, id);

        if (!response.IsSuccess)
        {
            return response.StatusCode switch
            {
                403 => StatusCode(StatusCodes.Status403Forbidden, response),
                404 => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Đánh dấu đã xem một Story
    /// </summary>
    [HttpPost("{id}/view")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsViewed(Guid id)
    {
        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        var response = await _storyService.MarkStoryAsViewedAsync(userId.Value, id);

        if (!response.IsSuccess)
        {
            if (response.StatusCode == 404)
                return NotFound(response);
            return BadRequest(response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Lấy danh sách những người đã xem Story (Chỉ dành cho chính tác giả)
    /// </summary>
    [HttpGet("{id}/views")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StoryViewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStoryViews(
        Guid id,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        // Chuẩn hóa tham số phân trang
        pageSize = Math.Min(pageSize, 100);
        pageNumber = Math.Max(pageNumber, 1);

        var userId = TryGetCurrentUserId();
        if (userId == null) return Unauthorized();

        var response = await _storyService.GetStoryViewsAsync(userId.Value, id, pageNumber, pageSize);

        if (!response.IsSuccess)
        {
            return response.StatusCode switch
            {
                403 => StatusCode(StatusCodes.Status403Forbidden, response),
                404 => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }
}