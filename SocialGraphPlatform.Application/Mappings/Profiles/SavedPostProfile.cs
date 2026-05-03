using AutoMapper;
using SocialGraphPlatform.Application.DTOs.SavedPost;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class SavedPostProfile : Profile
{
    public SavedPostProfile()
    {
        CreateMap<SavedPost, SavedPostResponseDto>()
            .ForMember(dest => dest.PostContent, opt => opt.MapFrom(src => src.Post.Content))
            .ForMember(dest => dest.PostMediaUrl, opt => opt.MapFrom(src => src.Post.MediaItems.FirstOrDefault().MediaUrl))
            .ForMember(dest => dest.PostCreatedAt, opt => opt.MapFrom(src => src.Post.CreatedAt))
            .ForMember(dest => dest.PostAuthorUserName, opt => opt.MapFrom(src => src.Post.User.UserName))
            .ForMember(dest => dest.PostAuthorFullName, opt => opt.MapFrom(src => src.Post.User.FullName))
            .ForMember(dest => dest.PostAuthorAvatarUrl, opt => opt.MapFrom(src => src.Post.User.AvatarUrl));
    }
}