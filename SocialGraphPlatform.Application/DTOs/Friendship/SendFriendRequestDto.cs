using System;
using System.ComponentModel.DataAnnotations;

namespace SocialGraphPlatform.Application.DTOs.Friendship
{
    /// <summary>
    /// DTO payload dùng để Gửi một lời mời kết bạn (POST).
    /// </summary>
    public class SendFriendRequestDto
    {
        [Required(ErrorMessage = "Mã người nhận lời mời (AddresseeId) là bắt buộc.")]
        public Guid AddresseeId { get; set; }
    }
}