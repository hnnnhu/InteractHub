using AutoMapper;
using SocialGraphPlatform.Application.DTOs.Notification;
using SocialGraphPlatform.Domain.Entities;

namespace SocialGraphPlatform.Application.Mappings.Profiles;

public class NotificationProfile : Profile
{
    public NotificationProfile()
    {
        CreateMap<Notification, NotificationResponseDto>()
            .ForMember(dest => dest.TriggeredByUserName, opt => opt.MapFrom(src => src.TriggeredBy != null ? src.TriggeredBy.UserName : null))
            .ForMember(dest => dest.TriggeredByFullName, opt => opt.MapFrom(src => src.TriggeredBy != null ? src.TriggeredBy.FullName : null))
            .ForMember(dest => dest.TriggeredByAvatarUrl, opt => opt.MapFrom(src => src.TriggeredBy != null ? src.TriggeredBy.AvatarUrl : null))
            .ForMember(dest => dest.TypeLabel, opt => opt.Ignore())
            .ForMember(dest => dest.TypeIcon, opt => opt.Ignore())
            .ForMember(dest => dest.TimeAgo, opt => opt.Ignore());
    }
}