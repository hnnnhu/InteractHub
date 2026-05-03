using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Comment;
using SocialGraphPlatform.Application.DTOs.Comments;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.Interfaces;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Bắt buộc đăng nhập
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    /// <summary>
    /// Lấy ID của user đang gọi API từ JWT Token
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out Guid userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("Không thể xác thực danh tính người dùng.");
    }

    // =========================================================
    // 1. TẠO, SỬA, XÓA BÌNH LUẬN
    // =========================================================

    /// <summary>
    /// Đăng bình luận mới (cho bài viết hoặc reply một bình luận khác)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<IdDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto request)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _commentService.CreateCommentAsync(currentUserId, request);

        if (!response.IsSuccess)
            return BadRequest(response);

        // Trả về HTTP 201 Created
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Chỉnh sửa nội dung bình luận
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateComment(Guid id, [FromBody] UpdateCommentDto request)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _commentService.UpdateCommentAsync(currentUserId, id, request);

        if (!response.IsSuccess)
            return BadRequest(response);

        return Ok(response);
    }

    /// <summary>
    /// Xóa bình luận
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _commentService.DeleteCommentAsync(currentUserId, id);

        if (!response.IsSuccess)
            return BadRequest(response);

        return Ok(response);
    }

    // =========================================================
    // 2. TRUY VẤN DỮ LIỆU (GET)
    // =========================================================

    /// <summary>
    /// Lấy danh sách bình luận (cấp 1) của một bài viết cụ thể
    /// </summary>
    [HttpGet("post/{postId}")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CommentResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCommentsByPost(Guid postId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserId = GetCurrentUserId();
        var response = await _commentService.GetCommentsByPostIdAsync(currentUserId, postId, pageNumber, pageSize);
        return Ok(response);
    }

    /// <summary>
    /// Lấy danh sách trả lời (replies) của một bình luận cha
    /// </summary>
    [HttpGet("{id}/replies")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CommentReplyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReplies(Guid id, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserId = GetCurrentUserId();
        // Chú ý: Ở đây id chính là ParentCommentId
        var response = await _commentService.GetRepliesAsync(currentUserId, id, pageNumber, pageSize);
        return Ok(response);
    }
}