using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Post;
using SocialGraphPlatform.Application.Interfaces;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/posts")]
[ApiController]
[Authorize] // Yêu cầu đăng nhập để thực hiện bất kỳ thao tác nào
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    /// <summary>
    /// Tiện ích: Lấy UserId từ JWT Token đang đăng nhập
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(userIdClaim, out Guid userId)
            ? userId
            : throw new UnauthorizedAccessException("Không thể xác thực danh tính người dùng.");
    }

    // ================================================
    //                  CRUD BÀI VIẾT
    // ================================================

    /// <summary>
    /// Đăng bài viết mới (Hỗ trợ text, danh sách media URL và hashtags)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<IdDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto request)
    {
        var currentUserId = GetCurrentUserId();

        // Gọi service xử lý logic lưu bài viết và bóc tách hashtag
        var response = await _postService.CreatePostAsync(currentUserId, request);

        if (!response.IsSuccess)
            return BadRequest(response);

        // Trả về 201 Created kèm link truy cập bài viết vừa tạo
        return CreatedAtAction(nameof(GetPostById), new { id = response.Data?.Id }, response);
    }

    /// <summary>
    /// Xem chi tiết một bài viết theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PostResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPostById(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _postService.GetPostByIdAsync(currentUserId, id);

        return response.IsSuccess ? Ok(response) : NotFound(response);
    }

    /// <summary>
    /// Cập nhật nội dung hoặc quyền riêng tư của bài viết
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePost(Guid id, [FromBody] UpdatePostDto request)
    {
        if (id != request.PostId)
            return BadRequest(ApiResponse.Fail("ID bài viết không khớp giữa URL và nội dung."));

        var currentUserId = GetCurrentUserId();
        var response = await _postService.UpdatePostAsync(currentUserId, request);

        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// Xóa bài viết (Soft Delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _postService.DeletePostAsync(currentUserId, id);

        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    // ================================================
    //                  TRUY VẤN BẢNG TIN VÀ TÌM KIẾM
    // ================================================

    /// <summary>
    /// Lấy danh sách bài viết trên Bảng tin (News Feed)
    /// </summary>
    [HttpGet("feed")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PostSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNewsFeed([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _postService.GetNewsFeedAsync(currentUserId, pageNumber, pageSize);
        return Ok(response);
    }

    /// <summary>
    /// Lấy toàn bộ bài viết của một người dùng cụ thể (Profile Timeline)
    /// </summary>
    [HttpGet("user/{targetUserId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PostSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserPosts(Guid targetUserId,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _postService.GetUserPostsAsync(currentUserId, targetUserId, pageNumber, pageSize);
        return Ok(response);
    }

    /// <summary>
    /// Tìm kiếm bài viết theo từ khóa (nội dung bài viết)
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PostSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchPosts(
        [FromQuery] string keyword,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var currentUserId = GetCurrentUserId();

        // Gọi tới hàm SearchPostsAsync trong IPostService (bạn cần đảm bảo đã định nghĩa hàm này ở Service)
        var response = await _postService.SearchPostsAsync(currentUserId, keyword ?? string.Empty, pageNumber, pageSize);

        return Ok(response);
    }

    // Lưu ý: Các endpoint về Reactions đã được tách riêng ra ReactionsController để dễ quản lý.
}