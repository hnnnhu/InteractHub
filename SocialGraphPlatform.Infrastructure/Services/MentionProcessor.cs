// SocialGraphPlatform.Infrastructure.Services/MentionProcessor.cs

using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Infrastructure.Services
{
    public static class MentionProcessor
    {
        // Regex hỗ trợ username chứa chữ cái Unicode, số, dấu gạch dưới và dấu chấm
        private static readonly Regex MentionRegex = new Regex(
            @"@([\p{L}\p{N}_.]+)",
            RegexOptions.Compiled
        );

        public static async Task ProcessMentionsAsync(
            string content,
            Guid authorId,
            string targetUrl,
            Guid? relatedEntityId,
            IUserRepository userRepository,
            INotificationService notificationService,
            ILogger? logger = null)
        {
            if (string.IsNullOrWhiteSpace(content))
                return;

            var mentionedUsernames = MentionRegex.Matches(content)
                .Select(m => m.Groups[1].Value)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            logger?.LogDebug("Mention tìm thấy: {Usernames}", string.Join(", ", mentionedUsernames));

            foreach (var username in mentionedUsernames)
            {
                var mentionedUser = await userRepository.GetUserByUsernameAsync(username);
                if (mentionedUser == null)
                {
                    logger?.LogWarning("Mention bị bỏ qua: username {Username} không tồn tại.", username);
                    continue;
                }
                if (mentionedUser.Id == authorId)
                {
                    logger?.LogDebug("Bỏ qua mention chính tác giả: {Username}", username);
                    continue;
                }
                if (mentionedUser.IsDeleted)
                {
                    logger?.LogDebug("Bỏ qua mention user đã bị xóa: {Username}", username);
                    continue;
                }

                var notificationDto = new CreateNotificationDto
                {
                    ReceiverId = mentionedUser.Id,
                    TriggeredById = authorId,
                    Type = NotificationType.Mention,
                    Content = $"Bạn đã được nhắc đến trong một nội dung.",
                    TargetUrl = targetUrl,
                    RelatedEntityId = relatedEntityId,
                    BypassUserSettings = true   // ← ĐÃ SỬA: bỏ qua cài đặt thông báo để mention luôn được gửi
                };

                var result = await notificationService.CreateNotificationAsync(notificationDto);
                logger?.LogInformation(
                    "Gửi thông báo mention đến {Username}: kết quả {IsSuccess} - {Message}",
                    username,
                    result.IsSuccess,
                    result.Message);
            }
        }

        // Overload không có logger – giữ tương thích ngược
        public static Task ProcessMentionsAsync(
            string content,
            Guid authorId,
            string targetUrl,
            Guid? relatedEntityId,
            IUserRepository userRepository,
            INotificationService notificationService)
        {
            return ProcessMentionsAsync(content, authorId, targetUrl, relatedEntityId,
                userRepository, notificationService, null);
        }
    }
}