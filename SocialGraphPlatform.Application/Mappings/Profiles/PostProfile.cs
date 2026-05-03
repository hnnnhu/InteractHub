using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Post;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class PostProfile : Profile
{
    public PostProfile()
    {
        CreateMap<Post, PostResponseDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.User.AvatarUrl))
            .ForMember(dest => dest.LikeCount, opt => opt.Ignore())
            .ForMember(dest => dest.CommentCount, opt => opt.Ignore())
            .ForMember(dest => dest.IsLikedByCurrentUser, opt => opt.Ignore())
            .ForMember(dest => dest.IsSavedByCurrentUser, opt => opt.Ignore());

        CreateMap<Post, PostSummaryDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.User.AvatarUrl))
            .ForMember(dest => dest.FirstMediaUrl, opt => opt.MapFrom(src => src.MediaItems.FirstOrDefault().MediaUrl))
            .ForMember(dest => dest.MediaCount, opt => opt.MapFrom(src => src.MediaItems.Count))
            .ForMember(dest => dest.LikeCount, opt => opt.Ignore())
            .ForMember(dest => dest.CommentCount, opt => opt.Ignore())
            .ForMember(dest => dest.IsLikedByCurrentUser, opt => opt.Ignore())
            .ForMember(dest => dest.IsSavedByCurrentUser, opt => opt.Ignore());

        CreateMap<CreatePostDto, Post>()
            .ForMember(dest => dest.MediaItems, opt => opt.Ignore())
            .ForMember(dest => dest.PostHashtags, opt => opt.Ignore());

        CreateMap<UpdatePostDto, Post>()
            .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Content))
            .ForMember(dest => dest.Privacy, opt => opt.MapFrom(src => src.Privacy));
    }
}