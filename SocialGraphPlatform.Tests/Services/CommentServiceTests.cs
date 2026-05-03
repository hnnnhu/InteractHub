using Moq;
using Xunit;
using SocialGraphPlatform.Infrastructure.Services;
using SocialGraphPlatform.Application.Interfaces.Repositories;
using SocialGraphPlatform.Application.Interfaces;
using SocialGraphPlatform.Application.DTOs.Comment;
using SocialGraphPlatform.Application.DTOs.Common;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Tests.Services
{
    public class CommentServiceTests
    {
        private readonly Mock<ICommentRepository> _commentRepoMock;
        private readonly Mock<IPostRepository> _postRepoMock;
        private readonly Mock<INotificationService> _notiServiceMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly CommentService _commentService;

        public CommentServiceTests()
        {
            _commentRepoMock = new Mock<ICommentRepository>();
            _postRepoMock = new Mock<IPostRepository>();
            _notiServiceMock = new Mock<INotificationService>();
            _userRepoMock = new Mock<IUserRepository>();
            _commentService = new CommentService(
                _commentRepoMock.Object,
                _postRepoMock.Object,
                _notiServiceMock.Object,
                _userRepoMock.Object);
        }

        // ── CreateComment ─────────────────────────────────────────

        [Fact]
        public async Task CreateComment_ValidInput_ShouldSucceed()
        {
            var userId = Guid.NewGuid();
            var postId = Guid.NewGuid();
            var request = new CreateCommentDto { PostId = postId, Content = "Nice post!" };

            _postRepoMock.Setup(r => r.ExistsActiveAsync(postId)).ReturnsAsync(true);
            _commentRepoMock.Setup(r => r.AddAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _userRepoMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(new User { Id = userId });

            var result = await _commentService.CreateCommentAsync(userId, request);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            _commentRepoMock.Verify(r => r.AddAsync(It.IsAny<Comment>()), Times.Once);
        }

        [Fact]
        public async Task CreateComment_WhenPostNotExist_ShouldReturnNotFound()
        {
            var postId = Guid.NewGuid();
            _postRepoMock.Setup(r => r.ExistsActiveAsync(postId)).ReturnsAsync(false);

            var result = await _commentService.CreateCommentAsync(Guid.NewGuid(), new CreateCommentDto { PostId = postId, Content = "comment" });

            Assert.False(result.IsSuccess);
        }

        // ── UpdateComment ─────────────────────────────────────────

        [Fact]
        public async Task UpdateComment_NotOwner_ShouldReturnForbidden()
        {
            var commentId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            _commentRepoMock.Setup(r => r.IsOwnerAsync(commentId, userId)).ReturnsAsync(false);

            var result = await _commentService.UpdateCommentAsync(userId, commentId, new Application.DTOs.Comments.UpdateCommentDto { Content = "updated" });

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task UpdateComment_WhenOwner_ShouldSucceed()
        {
            var commentId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var comment = new Comment(Guid.NewGuid(), userId, "original comment");

            _commentRepoMock.Setup(r => r.IsOwnerAsync(commentId, userId)).ReturnsAsync(true);
            _commentRepoMock.Setup(r => r.GetByIdAsync(commentId)).ReturnsAsync(comment);
            _commentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _commentService.UpdateCommentAsync(userId, commentId, new Application.DTOs.Comments.UpdateCommentDto { Content = "new content" });

            Assert.True(result.IsSuccess);
            Assert.Equal("new content", comment.Content);
        }

        // ── DeleteComment ─────────────────────────────────────────

        [Fact]
        public async Task DeleteComment_NotOwner_ShouldReturnForbidden()
        {
            var commentId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            _commentRepoMock.Setup(r => r.IsOwnerAsync(commentId, userId)).ReturnsAsync(false);

            var result = await _commentService.DeleteCommentAsync(userId, commentId);

            Assert.False(result.IsSuccess);
        }

        [Fact]
        public async Task DeleteComment_WhenOwner_ShouldSucceed()
        {
            var commentId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var comment = new Comment(Guid.NewGuid(), userId, "test comment");

            _commentRepoMock.Setup(r => r.IsOwnerAsync(commentId, userId)).ReturnsAsync(true);
            _commentRepoMock.Setup(r => r.GetByIdAsync(commentId)).ReturnsAsync(comment);
            _commentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _commentService.DeleteCommentAsync(userId, commentId);

            Assert.True(result.IsSuccess);
            Assert.True(comment.IsDeleted);
        }

        // ── GetCommentsByPostIdAsync ──────────────────────────────

        [Fact]
        public async Task GetCommentsByPostId_WhenPostExists_ShouldReturnComments()
        {
            var userId = Guid.NewGuid();
            var postId = Guid.NewGuid();
            _postRepoMock.Setup(r => r.ExistsActiveAsync(postId)).ReturnsAsync(true);
            var pagedComments = new PagedResult<Comment>(new List<Comment>(), 1, 10, 0);
            _commentRepoMock.Setup(r => r.GetCommentsByPostIdAsync(postId, 1, 10)).ReturnsAsync(pagedComments);
            _commentRepoMock.Setup(r => r.GetReplyCountsAsync(It.IsAny<List<Guid>>())).ReturnsAsync(new Dictionary<Guid, int>());

            var result = await _commentService.GetCommentsByPostIdAsync(userId, postId, 1, 10);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task GetCommentsByPostId_WhenPostNotExist_ShouldReturnNotFound()
        {
            var postId = Guid.NewGuid();
            _postRepoMock.Setup(r => r.ExistsActiveAsync(postId)).ReturnsAsync(false);

            var result = await _commentService.GetCommentsByPostIdAsync(Guid.NewGuid(), postId, 1, 10);

            Assert.False(result.IsSuccess);
        }

        // ── GetRepliesAsync ───────────────────────────────────────

        [Fact]
        public async Task GetReplies_WhenParentCommentExists_ShouldReturnReplies()
        {
            var userId = Guid.NewGuid();
            var parentId = Guid.NewGuid();
            var pagedReplies = new PagedResult<Comment>(new List<Comment>(), 1, 10, 0);
            _commentRepoMock.Setup(r => r.GetRepliesAsync(parentId, 1, 10)).ReturnsAsync(pagedReplies);
            _commentRepoMock.Setup(r => r.GetReplyCountsAsync(It.IsAny<List<Guid>>())).ReturnsAsync(new Dictionary<Guid, int>());

            var result = await _commentService.GetRepliesAsync(userId, parentId, 1, 10);

            Assert.True(result.IsSuccess);
        }
    }
}