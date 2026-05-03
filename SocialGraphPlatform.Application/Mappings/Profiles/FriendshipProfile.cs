using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Friendship;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class FriendshipProfile : Profile
{
    public FriendshipProfile()
    {
        CreateMap<Friendship, FriendshipResponseDto>()
            .ForMember(dest => dest.RequesterUserName, opt => opt.MapFrom(src => src.Requester.UserName))
            .ForMember(dest => dest.RequesterFullName, opt => opt.MapFrom(src => src.Requester.FullName))
            .ForMember(dest => dest.RequesterAvatarUrl, opt => opt.MapFrom(src => src.Requester.AvatarUrl))
            .ForMember(dest => dest.AddresseeUserName, opt => opt.MapFrom(src => src.Addressee.UserName))
            .ForMember(dest => dest.AddresseeFullName, opt => opt.MapFrom(src => src.Addressee.FullName))
            .ForMember(dest => dest.AddresseeAvatarUrl, opt => opt.MapFrom(src => src.Addressee.AvatarUrl))
            .ForMember(dest => dest.StatusLabel, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<Friendship, FriendRequestResponseDto>()
            .ForMember(dest => dest.RequesterUserName, opt => opt.MapFrom(src => src.Requester.UserName))
            .ForMember(dest => dest.RequesterFullName, opt => opt.MapFrom(src => src.Requester.FullName))
            .ForMember(dest => dest.RequesterAvatarUrl, opt => opt.MapFrom(src => src.Requester.AvatarUrl))
            .ForMember(dest => dest.RequesterBio, opt => opt.MapFrom(src => src.Requester.Bio));
    }
}