using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.SavedPost;
using SocialGraphPlatform.Application.Interfaces;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/saved-posts")]
[ApiController]
[Authorize] // 🔒 Yêu cầu đăng nhập để quản lý kho lưu trữ cá nhân
public class SavedPostsController : ControllerBase
{
    private readonly ISavedPostService _savedPostService;

    public SavedPostsController(ISavedPostService savedPostService)
    {
        _savedPostService = savedPostService;
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

    // =========================================================
    // 1. THAO TÁC LƯU BÀI VIẾT (POSTS)
    // =========================================================

    /// <summary>
    /// Lưu một bài viết vào bộ sưu tập
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SavePost([FromBody] SavePostDto request)
    {
        var userId = GetCurrentUserId();
        var response = await _savedPostService.SavePostAsync(userId, request);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Bỏ lưu một bài viết
    /// </summary>
    [HttpDelete("post/{postId}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UnsavePost(Guid postId)
    {
        var userId = GetCurrentUserId();
        var response = await _savedPostService.UnsavePostAsync(userId, postId);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Lấy danh sách tất cả bài viết đã lưu (có thể lọc theo bộ sưu tập)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<SavedPostResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSavedPosts([FromQuery] string? collection, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        var response = await _savedPostService.GetSavedPostsAsync(userId, collection, pageNumber, pageSize);
        return Ok(response);
    }

    // =========================================================
    // 2. QUẢN LÝ BỘ SƯU TẬP (COLLECTIONS)
    // =========================================================

    /// <summary>
    /// Lấy danh sách các bộ sưu tập hiện có của người dùng
    /// </summary>
    [HttpGet("collections")]
    [ProducesResponseType(typeof(ApiResponse<List<CollectionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCollections()
    {
        var userId = GetCurrentUserId();
        var response = await _savedPostService.GetCollectionsAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// Tạo bộ sưu tập mới
    /// </summary>
    [HttpPost("collections")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCollection([FromBody] CreateCollectionDto request)
    {
        var userId = GetCurrentUserId();
        var response = await _savedPostService.CreateCollectionAsync(userId, request);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Cập nhật tên bộ sưu tập
    /// </summary>
    [HttpPut("collections/{oldName}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateCollection(string oldName, [FromBody] UpdateCollectionDto request)
    {
        var userId = GetCurrentUserId();
        var response = await _savedPostService.UpdateCollectionAsync(userId, oldName, request);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Xóa hoàn toàn một bộ sưu tập
    /// </summary>
    [HttpDelete("collections/{name}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteCollection(string name)
    {
        var userId = GetCurrentUserId();
        var response = await _savedPostService.DeleteCollectionAsync(userId, name);
        if (!response.IsSuccess) return BadRequest(response);
        return Ok(response);
    }
}