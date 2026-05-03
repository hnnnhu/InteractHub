using System;
using System.Collections.Generic;

namespace SocialGraphPlatform.Application.DTOs.SavedPost;

public class CollectionDto
{
    public string Name { get; set; } = "Mặc định";

    // TRẢ LẠI TÊN CŨ ĐỂ TRÁNH LỖI BIÊN DỊCH
    public int SavedPostCount { get; set; }

    public DateTimeOffset? LastSavedAt { get; set; }

    public List<SavedPostSummaryDto> PreviewPosts { get; set; } = new List<SavedPostSummaryDto>();
}