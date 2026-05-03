using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Story;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class StoryProfile : Profile
{
    public StoryProfile()
    {
        CreateMap<Story, StoryResponseDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.User.FullName))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.User.AvatarUrl))
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.IsExpired, opt => opt.Ignore())
            .ForMember(dest => dest.SecondsRemaining, opt => opt.Ignore())
            .ForMember(dest => dest.ViewCount, opt => opt.Ignore());

        CreateMap<CreateStoryDto, Story>();
    }
}