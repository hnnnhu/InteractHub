using Moq;
using Xunit;
using Microsoft.Extensions.Logging;
using SocialGraphPlatform.Infrastructure.Services;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.DTOs.Friendship;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Tests.Services
{
    public class FriendshipServiceTests
    {
        private readonly Mock<IFriendshipRepository> _friendshipRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<INotificationService> _notiServiceMock;
        private readonly Mock<ILogger<FriendshipService>> _loggerMock;
        private readonly FriendshipService _friendshipService;

        public FriendshipServiceTests()
        {
            _friendshipRepoMock = new Mock<IFriendshipRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _notiServiceMock = new Mock<INotificationService>();
            _loggerMock = new Mock<ILogger<FriendshipService>>();
            _friendshipService = new FriendshipService(
                _friendshipRepoMock.Object,
                _userRepoMock.Object,
                _notiServiceMock.Object,
                _loggerMock.Object);
        }

        // ── SendFriendRequest ──────────────────────────────────────

        [Fact]
        public async Task SendFriendRequest_ToExistingUser_ShouldSucceed()
        {
            var userId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            _userRepoMock.Setup(r => r.GetByIdAsync(addresseeId)).ReturnsAsync(new User { Id = addresseeId });
            _friendshipRepoMock.Setup(r => r.GetFriendshipAnyStateAsync(userId, addresseeId)).ReturnsAsync((Friendship?)null);
            _friendshipRepoMock.Setup(r => r.AddAsync(It.IsAny<Friendship>())).Returns(Task.CompletedTask);
            _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _friendshipService.SendFriendRequestAsync(userId, new SendFriendRequestDto { AddresseeId = addresseeId });

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task SendFriendRequest_ToSelf_ShouldFail()
        {
            var userId = Guid.NewGuid();
            var result = await _friendshipService.SendFriendRequestAsync(userId, new SendFriendRequestDto { AddresseeId = userId });
            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task SendFriendRequest_WhenAlreadyFriends_ShouldFail()
        {
            var userId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            var friendship = new Friendship(userId, addresseeId);
            friendship.Accept(addresseeId);

            _userRepoMock.Setup(r => r.GetByIdAsync(addresseeId)).ReturnsAsync(new User { Id = addresseeId });
            _friendshipRepoMock.Setup(r => r.GetFriendshipAnyStateAsync(userId, addresseeId)).ReturnsAsync(friendship);

            var result = await _friendshipService.SendFriendRequestAsync(userId, new SendFriendRequestDto { AddresseeId = addresseeId });

            Assert.False(result.IsSuccess);
        }

        // ── AcceptFriendRequest ────────────────────────────────────

        [Fact]
        public async Task AcceptFriendRequest_ByAddressee_ShouldSucceed()
        {
            var friendshipId = Guid.NewGuid();
            var requesterId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            var friendship = new Friendship(requesterId, addresseeId);
            _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);
            _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _friendshipService.AcceptFriendRequestAsync(addresseeId, friendshipId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task AcceptFriendRequest_ByRequester_ShouldReturnForbidden()
        {
            var friendshipId = Guid.NewGuid();
            var requesterId = Guid.NewGuid();
            var friendship = new Friendship(requesterId, Guid.NewGuid());
            _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);

            var result = await _friendshipService.AcceptFriendRequestAsync(requesterId, friendshipId);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task AcceptFriendRequest_WhenAlreadyAccepted_ShouldFail()
        {
            var friendshipId = Guid.NewGuid();
            var requesterId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            var friendship = new Friendship(requesterId, addresseeId);
            friendship.Accept(addresseeId); // Đã chấp nhận
            _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);

            var result = await _friendshipService.AcceptFriendRequestAsync(addresseeId, friendshipId);

            Assert.False(result.IsSuccess);
        }

        // ── RejectFriendRequest ────────────────────────────────────

        [Fact]
        public async Task RejectFriendRequest_ByAddressee_ShouldSucceed()
        {
            var friendshipId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            var requesterId = Guid.NewGuid();
            var friendship = new Friendship(requesterId, addresseeId);
            _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);
            _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _friendshipService.RejectFriendRequestAsync(addresseeId, friendshipId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task RejectFriendRequest_ByRequester_ShouldFail()
        {
            var friendshipId = Guid.NewGuid();
            var requesterId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            var friendship = new Friendship(requesterId, addresseeId);
            _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);

            var result = await _friendshipService.RejectFriendRequestAsync(requesterId, friendshipId);

            Assert.False(result.IsSuccess);
        }

        // ── CancelFriendRequest ────────────────────────────────────

        [Fact]
        public async Task CancelFriendRequest_ByRequester_ShouldSucceed()
        {
            var friendshipId = Guid.NewGuid();
            var requesterId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            var friendship = new Friendship(requesterId, addresseeId);
            _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);
            _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _friendshipService.CancelFriendRequestAsync(requesterId, friendshipId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task CancelFriendRequest_ByAddressee_ShouldFail()
        {
            var friendshipId = Guid.NewGuid();
            var requesterId = Guid.NewGuid();
            var addresseeId = Guid.NewGuid();
            var friendship = new Friendship(requesterId, addresseeId);
            _friendshipRepoMock.Setup(r => r.GetByIdAsync(friendshipId)).ReturnsAsync(friendship);

            var result = await _friendshipService.CancelFriendRequestAsync(addresseeId, friendshipId);

            Assert.False(result.IsSuccess);
        }

        // ── Unfriend ───────────────────────────────────────────────

        [Fact]
        public async Task Unfriend_WhenFriends_ShouldSucceed()
        {
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            var friendship = new Friendship(userId, friendId);
            friendship.Accept(friendId);
            _friendshipRepoMock.Setup(r => r.GetFriendshipAsync(userId, friendId)).ReturnsAsync(friendship);
            _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _friendshipService.UnfriendAsync(userId, friendId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task Unfriend_WhenNotFriends_ShouldFail()
        {
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            _friendshipRepoMock.Setup(r => r.GetFriendshipAsync(userId, friendId)).ReturnsAsync((Friendship?)null);

            var result = await _friendshipService.UnfriendAsync(userId, friendId);

            Assert.False(result.IsSuccess);
        }

        // ── Close Friend ───────────────────────────────────────────

        [Fact]
        public async Task AddCloseFriend_WhenAlreadyFriend_ShouldSucceed()
        {
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            var friendship = new Friendship(userId, friendId);
            friendship.Accept(friendId);
            _userRepoMock.Setup(r => r.GetByIdAsync(friendId)).ReturnsAsync(new User { Id = friendId });
            _friendshipRepoMock.Setup(r => r.GetFriendshipAsync(userId, friendId)).ReturnsAsync(friendship);
            _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _friendshipService.AddCloseFriendAsync(userId, friendId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task AddCloseFriend_WhenNotFriend_ShouldFail()
        {
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            _userRepoMock.Setup(r => r.GetByIdAsync(friendId)).ReturnsAsync(new User { Id = friendId });
            _friendshipRepoMock.Setup(r => r.GetFriendshipAsync(userId, friendId)).ReturnsAsync((Friendship?)null);

            var result = await _friendshipService.AddCloseFriendAsync(userId, friendId);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task AddCloseFriend_ToSelf_ShouldFail()
        {
            var userId = Guid.NewGuid();

            var result = await _friendshipService.AddCloseFriendAsync(userId, userId);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task RemoveCloseFriend_WhenCloseFriend_ShouldSucceed()
        {
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            var friendship = new Friendship(userId, friendId);
            friendship.Accept(friendId);
            friendship.MarkAsCloseFriend();
            _friendshipRepoMock.Setup(r => r.GetFriendshipAsync(userId, friendId)).ReturnsAsync(friendship);
            _friendshipRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _friendshipService.RemoveCloseFriendAsync(userId, friendId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task RemoveCloseFriend_WhenNotCloseFriend_ShouldFail()
        {
            var userId = Guid.NewGuid();
            var friendId = Guid.NewGuid();
            var friendship = new Friendship(userId, friendId);
            friendship.Accept(friendId); // là bạn nhưng chưa phải bạn thân
            _friendshipRepoMock.Setup(r => r.GetFriendshipAsync(userId, friendId)).ReturnsAsync(friendship);

            var result = await _friendshipService.RemoveCloseFriendAsync(userId, friendId);

            Assert.False(result.IsSuccess);
        }

        // ── GetFriendCount ─────────────────────────────────────────

        [Fact]
        public async Task GetFriendCount_WhenUserExists_ShouldReturnCount()
        {
            var userId = Guid.NewGuid();
            _userRepoMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(new User { Id = userId });
            _friendshipRepoMock.Setup(r => r.GetFriendCountAsync(userId)).ReturnsAsync(10);

            var result = await _friendshipService.GetFriendCountAsync(userId);

            Assert.True(result.IsSuccess);
            Assert.Equal(10, result.Data.Count);
        }

        [Fact]
        public async Task GetFriendCount_WhenUserNotFound_ShouldFail()
        {
            var userId = Guid.NewGuid();
            _userRepoMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            var result = await _friendshipService.GetFriendCountAsync(userId);

            Assert.False(result.IsSuccess);
        }

        // ── GetFriends ─────────────────────────────────────────────

        [Fact]
        public async Task GetFriends_ShouldReturnPagedResult()
        {
            var userId = Guid.NewGuid();
            var paged = new PagedResult<FriendshipResponseDto>(new List<FriendshipResponseDto>(), 1, 20, 0);
            _friendshipRepoMock.Setup(r => r.GetFriendsAsync(userId, 1, 20)).ReturnsAsync(paged);

            var result = await _friendshipService.GetFriendsAsync(userId, 1, 20);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task GetPendingRequests_ShouldReturnPagedResult()
        {
            var userId = Guid.NewGuid();
            var paged = new PagedResult<FriendRequestResponseDto>(new List<FriendRequestResponseDto>(), 1, 20, 5);
            _friendshipRepoMock.Setup(r => r.GetPendingRequestsAsync(userId, 1, 20)).ReturnsAsync(paged);

            var result = await _friendshipService.GetPendingRequestsAsync(userId, 1, 20);

            Assert.True(result.IsSuccess);
            Assert.Equal(5, result.Data.TotalCount);
        }

        [Fact]
        public async Task GetSentRequests_ShouldReturnPagedResult()
        {
            var userId = Guid.NewGuid();
            var paged = new PagedResult<SentFriendRequestResponseDto>(new List<SentFriendRequestResponseDto>(), 1, 20, 3);
            _friendshipRepoMock.Setup(r => r.GetSentRequestsAsync(userId, 1, 20)).ReturnsAsync(paged);

            var result = await _friendshipService.GetSentRequestsAsync(userId, 1, 20);

            Assert.True(result.IsSuccess);
            Assert.Equal(3, result.Data.TotalCount);
        }

        [Fact]
        public async Task GetFriendSuggestions_ShouldReturnList()
        {
            var userId = Guid.NewGuid();
            var suggestions = new List<FriendSuggestionDto>
            {
                new FriendSuggestionDto { UserId = Guid.NewGuid(), UserName = "user1", MutualFriendsCount = 5 },
                new FriendSuggestionDto { UserId = Guid.NewGuid(), UserName = "user2", MutualFriendsCount = 3 }
            };
            _friendshipRepoMock.Setup(r => r.GetFriendSuggestionsAsync(userId, 10)).ReturnsAsync(suggestions);

            var result = await _friendshipService.GetFriendSuggestionsAsync(userId);

            Assert.True(result.IsSuccess);
            Assert.Equal(2, result.Data.Count);
        }
    }
}