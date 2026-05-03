// SocialGraphPlatform.Infrastructure/Services/UserMuteService.cs

using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Infrastructure.Services;

public class UserMuteService : IUserMuteService
{
    private readonly IUserMuteRepository _repository;

    public UserMuteService(IUserMuteRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> IsMutedAsync(Guid userId, Guid targetUserId)
    {
        return await _repository.IsMutedAsync(userId, targetUserId);
    }

    public async Task MuteUserAsync(Guid userId, Guid targetUserId, DateTime? muteEnd = null)
    {
        var existing = await _repository.GetMuteAsync(userId, targetUserId);
        if (existing != null)
        {
            // Cập nhật thời gian kết thúc nếu muốn; nhưng vì entity chỉ có setter private,
            // ta có thể xóa và tạo lại, hoặc thêm method update trong entity.
            // Ở đây ta xóa và tạo mới cho đơn giản.
            await _repository.DeleteAsync(existing);
        }

        var mute = new UserMute(userId, targetUserId, muteEnd != null ? new DateTimeOffset?(muteEnd.Value) : null);
        await _repository.AddAsync(mute);
    }

    public async Task UnmuteUserAsync(Guid userId, Guid targetUserId)
    {
        var existing = await _repository.GetMuteAsync(userId, targetUserId);
        if (existing != null)
        {
            await _repository.DeleteAsync(existing);
        }
    }
}