using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Reaction;
using SocialGraphPlatform.Application.Interfaces;
using System.Security.Claims;

namespace SocialGraphPlatform.Api.Controllers;

[Route("api/reactions")]
[ApiController]
[Authorize]
public class ReactionsController : ControllerBase
{
    private readonly IReactionService _reactionService;

    public ReactionsController(IReactionService reactionService)
    {
        _reactionService = reactionService;
    }

    /// <summary>
    /// Helper: Lấy UserId từ JWT Token
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;   // fallback cho một số JWT

        if (Guid.TryParse(userIdClaim, out Guid userId))
            return userId;

        throw new UnauthorizedAccessException("Không thể xác thực danh tính người dùng.");
    }

    // ====================== THAO TÁC (Commands) ======================

    /// <summary>
    /// Thả cảm xúc cho bài viết (Like, Love, Haha, Wow, Sad, Angry...)
    /// - Nếu chưa có → thêm mới
    /// - Nếu cùng loại → gỡ cảm xúc (toggle)
    /// - Nếu khác loại → thay đổi cảm xúc
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ReactionCountDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddOrUpdateReaction([FromBody] AddReactionDto request)
    {
        var currentUserId = GetCurrentUserId();

        var response = await _reactionService.AddOrUpdateReactionAsync(currentUserId, request);

        return response.IsSuccess
            ? Ok(response)
            : BadRequest(response);
    }

    /// <summary>
    /// Gỡ bỏ cảm xúc của người dùng hiện tại khỏi bài viết
    /// </summary>
    [HttpDelete("post/{postId}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveReaction(Guid postId)
    {
        var currentUserId = GetCurrentUserId();

        var response = await _reactionService.RemoveReactionAsync(currentUserId, postId);

        return response.IsSuccess
            ? Ok(response)
            : BadRequest(response);
    }

    // ====================== TRUY VẤN (Queries) ======================

    /// <summary>
    /// Lấy tóm tắt cảm xúc của bài viết (tổng số, theo từng loại, cảm xúc hiện tại của user)
    /// </summary>
    [HttpGet("post/{postId}/summary")]
    [ProducesResponseType(typeof(ApiResponse<ReactionCountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReactionSummary(Guid postId)
    {
        var currentUserId = GetCurrentUserId();

        var response = await _reactionService.GetReactionSummaryAsync(currentUserId, postId);

        return Ok(response);
    }

    /// <summary>
    /// Lấy danh sách người dùng đã thả cảm xúc (dùng khi click vào số lượt react)
    /// Hỗ trợ phân trang
    /// </summary>
    [HttpGet("post/{postId}/users")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserReactionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsersReacted(
        Guid postId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var response = await _reactionService.GetUsersReactedAsync(postId, pageNumber, pageSize);

        return Ok(response);
    }
}