using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Application.DTOs.Friendship;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Application.Interfaces;

namespace SocialGraphPlatform.Api.Controllers
{
    [Route("api/friendships")]
    [ApiController]
    [Authorize]
    public class FriendshipsController : ControllerBase
    {
        private readonly IFriendshipService _friendshipService;

        public FriendshipsController(IFriendshipService friendshipService)
        {
            _friendshipService = friendshipService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out Guid userId))
                return userId;

            throw new UnauthorizedAccessException("Không thể xác thực danh tính.");
        }

        #region 1. Actions (Kết bạn / Chấp nhận / Từ chối / Thu hồi / Hủy kết bạn)

        [HttpPost("requests")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestDto request)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.SendFriendRequestAsync(currentUserId, request);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpPut("requests/{id}/accept")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AcceptRequest(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.AcceptFriendRequestAsync(currentUserId, id);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpPut("requests/{id}/reject")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RejectRequest(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.RejectFriendRequestAsync(currentUserId, id);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("requests/{id}/cancel")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CancelRequest(Guid id)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.CancelFriendRequestAsync(currentUserId, id);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("friends/{friendId}")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Unfriend(Guid friendId)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.UnfriendAsync(currentUserId, friendId);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        #endregion

        #region 2. Close Friend Actions

        [HttpPost("close-friends")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AddCloseFriend([FromBody] AddCloseFriendDto request)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.AddCloseFriendAsync(currentUserId, request.FriendId);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("close-friends/{friendId}")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RemoveCloseFriend(Guid friendId)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.RemoveCloseFriendAsync(currentUserId, friendId);
            return response.IsSuccess ? Ok(response) : BadRequest(response);
        }

        [HttpGet("close-friends")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<UserSummaryDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCloseFriends([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.GetCloseFriendsAsync(currentUserId, pageNumber, pageSize);
            return Ok(response);
        }

        #endregion

        #region 3. Queries

        [HttpGet("requests/pending")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<FriendRequestResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPendingRequests([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.GetPendingRequestsAsync(currentUserId, pageNumber, pageSize);
            return Ok(response);
        }

        [HttpGet("requests/sent")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<SentFriendRequestResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSentRequests([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.GetSentRequestsAsync(currentUserId, pageNumber, pageSize);
            return Ok(response);
        }

        [HttpGet("user/{userId}")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<FriendshipResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFriends(Guid userId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var response = await _friendshipService.GetFriendsAsync(userId, pageNumber, pageSize);
            return Ok(response);
        }

        [HttpGet("suggestions")]
        [ProducesResponseType(typeof(ApiResponse<List<FriendSuggestionDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSuggestions()
        {
            var currentUserId = GetCurrentUserId();
            var response = await _friendshipService.GetFriendSuggestionsAsync(currentUserId);
            return Ok(response);
        }

        [HttpGet("user/{userId}/count")]
        [ProducesResponseType(typeof(ApiResponse<FriendCountResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetFriendCount(Guid userId)
        {
            var response = await _friendshipService.GetFriendCountAsync(userId);
            return response.IsSuccess ? Ok(response) : NotFound(response);
        }

        #endregion
    }
}