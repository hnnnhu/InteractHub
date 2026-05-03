// SocialGraphPlatform.Application/DTOs/Friendship/RemoveCloseFriendDto.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO dùng để xóa một người bạn khỏi danh sách bạn thân.
    /// </summary>
    public class RemoveCloseFriendDto
    {
        [Required(ErrorMessage = "Mã người bạn (friendId) là bắt buộc.")]
        public Guid FriendId { get; set; }
    }
}