// SocialGraphPlatform.Application/DTOs/Friendship/FriendCountResponseDto.cs
using System;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO trả về số lượng bạn bè của một người dùng.
    /// </summary>
    public class FriendCountResponseDto
    {
        public Guid UserId { get; set; }
        public int Count { get; set; }
    }
}