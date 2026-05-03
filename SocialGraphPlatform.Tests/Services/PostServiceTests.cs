using Moq;
using Xunit;
using SocialGraphPlatform.Infrastructure.Services;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.DTOs.Post;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;
using SocialGraphPlatform.Domain.Enums;

namespace SocialGraphPlatform.Tests.Services
{
    public class PostServiceTests
    {
        private readonly Mock<IPostRepository> _postRepoMock;
        private readonly Mock<IHashtagRepository> _hashtagRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<INotificationService> _notiServiceMock;
        private readonly PostService _postService;

        public PostServiceTests()
        {
            _postRepoMock = new Mock<IPostRepository>();
            _hashtagRepoMock = new Mock<IHashtagRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _notiServiceMock = new Mock<INotificationService>();
            _postService = new PostService(
                _postRepoMock.Object,
                _hashtagRepoMock.Object,
                _userRepoMock.Object,
                _notiServiceMock.Object);
        }

        [Fact]
        public async Task CreatePost_ValidData_ShouldSucceed()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePostDto
            {
                Content = "Hello world",
                Privacy = PrivacyLevel.Public,
                Hashtags = new List<string>(),
                MediaUrls = new List<string>()
            };
            _postRepoMock.Setup(r => r.AddAsync(It.IsAny<Post>())).Returns(Task.CompletedTask);
            _postRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _hashtagRepoMock.Setup(r => r.GetByNameAsync(It.IsAny<string>())).ReturnsAsync((Hashtag?)null);

            // Act
            var result = await _postService.CreatePostAsync(userId, request);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            _postRepoMock.Verify(r => r.AddAsync(It.Is<Post>(p => p.Content == request.Content)), Times.Once);
            _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreatePost_WithHashtags_ShouldCreateNewHashtagIfNotExist()
        {
            var userId = Guid.NewGuid();
            var request = new CreatePostDto
            {
                Content = "Test #dotnet",
                Privacy = PrivacyLevel.Public,
                Hashtags = new List<string> { "dotnet" },
                MediaUrls = new List<string>()
            };
            _postRepoMock.Setup(r => r.AddAsync(It.IsAny<Post>())).Returns(Task.CompletedTask);
            _postRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _hashtagRepoMock.Setup(r => r.GetByNameAsync("dotnet")).ReturnsAsync((Hashtag?)null);
            _hashtagRepoMock.Setup(r => r.AddAsync(It.IsAny<Hashtag>())).Returns(Task.CompletedTask);

            var result = await _postService.CreatePostAsync(userId, request);

            Assert.True(result.IsSuccess);
            _hashtagRepoMock.Verify(r => r.AddAsync(It.Is<Hashtag>(h => h.Name == "dotnet")), Times.Once);
        }

        [Fact]
        public async Task UpdatePost_WhenNotOwner_ShouldReturnForbidden()
        {
            var postId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var differentUser = Guid.NewGuid();
            var post = new Post(ownerId, "Original content", PrivacyLevel.Public);
            var request = new UpdatePostDto { PostId = postId, Content = "Edited", Privacy = PrivacyLevel.Public };

            _postRepoMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);

            var result = await _postService.UpdatePostAsync(differentUser, request);

            Assert.False(result.IsSuccess);
            _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdatePost_WhenOwner_ShouldSucceed()
        {
            var postId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var post = new Post(userId, "Original", PrivacyLevel.Public);
            var request = new UpdatePostDto { PostId = postId, Content = "Updated", Privacy = PrivacyLevel.FriendsOnly };

            _postRepoMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            _postRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _postService.UpdatePostAsync(userId, request);

            Assert.True(result.IsSuccess);
            _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeletePost_WhenNotOwner_ShouldReturnForbidden()
        {
            var postId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var differentUser = Guid.NewGuid();
            var post = new Post(ownerId, "Test", PrivacyLevel.Public);

            _postRepoMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);

            var result = await _postService.DeletePostAsync(differentUser, postId);

            Assert.False(result.IsSuccess);
            _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task DeletePost_WhenOwner_ShouldSucceed()
        {
            var postId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var post = new Post(userId, "Test", PrivacyLevel.Public);

            _postRepoMock.Setup(r => r.GetByIdAsync(postId)).ReturnsAsync(post);
            _postRepoMock.Setup(r => r.GetPostWithDetailsAsync(postId)).ReturnsAsync(post);
            _postRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _postService.DeletePostAsync(userId, postId);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task GetPostById_WhenPostExists_ShouldReturnPostResponseDto()
        {
            var postId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var post = new Post(userId, "Post content", PrivacyLevel.Public);
            _postRepoMock.Setup(r => r.GetPostWithDetailsAsync(postId)).ReturnsAsync(post);
            _postRepoMock.Setup(r => r.CanUserViewPostAsync(postId, userId)).ReturnsAsync(true);

            var result = await _postService.GetPostByIdAsync(userId, postId);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
        }

        [Fact]
        public async Task SearchPosts_WhenKeywordIsEmpty_ShouldReturnNewsFeed()
        {
            var userId = Guid.NewGuid();
            // Mock GetNewsFeedAsync to return empty feed
            var emptyPaged = new PagedResult<Post>(new List<Post>(), 1, 10, 0);
            _postRepoMock.Setup(r => r.GetNewsFeedAsync(userId, 1, 10)).ReturnsAsync(emptyPaged);

            var result = await _postService.SearchPostsAsync(userId, "", 1, 10);

            Assert.True(result.IsSuccess);
            _postRepoMock.Verify(r => r.SearchPostsByKeywordAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }
    }
}