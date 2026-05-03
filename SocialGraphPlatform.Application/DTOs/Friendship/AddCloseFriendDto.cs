// SocialGraphPlatform.Application/DTOs/Friendship/AddCloseFriendDto.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO dùng để thêm một người bạn vào danh sách bạn thân.
    /// </summary>
    public class AddCloseFriendDto
    {
        [Required(ErrorMessage = "Mã người bạn (friendId) là bắt buộc.")]
        public Guid FriendId { get; set; }
    }
}