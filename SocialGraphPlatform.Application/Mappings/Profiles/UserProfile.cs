using AutoMapper;
using SocialGraphPlatform.Application.DTOs.User;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<User, UserProfileDto>()
            .ForMember(dest => dest.FriendCount, opt => opt.Ignore())   // Tính sau trong Service
            .ForMember(dest => dest.PostCount, opt => opt.Ignore())
            .ForMember(dest => dest.StoryCount, opt => opt.Ignore())
            .ForMember(dest => dest.IsFriend, opt => opt.Ignore())
            .ForMember(dest => dest.IsBlocked, opt => opt.Ignore())
            .ForMember(dest => dest.FriendshipStatus, opt => opt.Ignore());

        CreateMap<User, UserSummaryDto>()
            .ForMember(dest => dest.IsFriend, opt => opt.Ignore())
            .ForMember(dest => dest.FriendshipStatus, opt => opt.Ignore());

        CreateMap<UpdateProfileDto, User>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.Bio, opt => opt.MapFrom(src => src.Bio))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.AvatarUrl))
            .ForMember(dest => dest.CoverPhotoUrl, opt => opt.MapFrom(src => src.CoverPhotoUrl))
            .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.DateOfBirth));
    }
}