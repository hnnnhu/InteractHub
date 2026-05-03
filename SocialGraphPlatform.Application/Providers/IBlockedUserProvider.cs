// SocialGraphPlatform.Application/Providers/IBlockedUserProvider.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SocialGraphPlatform.Application.Providers;

public interface IBlockedUserProvider
{
    /// <summary>
    /// Lấy danh sách ID của những người: Mình chặn họ HOẶC Họ chặn mình.
    /// Dùng HashSet để check .Contains(id) với độ phức tạp O(1).
    /// </summary>
    Task<HashSet<Guid>> GetExcludedUserIdsAsync();

    /// <summary>
    /// Xóa cache hiện tại. Được gọi khi có thao tác Chặn/Gỡ chặn xảy ra.
    /// </summary>
    void InvalidateCache();
}