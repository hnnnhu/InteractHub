using System;
using System.Collections.Generic;
using System.Text;

namespace SocialGraphPlatform.Application.DTOs.Users
{

    public class VerifyTwoFactorDto
    {
        // Dùng chung cho cả Enable và Disable (cần mã để xác thực người dùng đang cầm thiết bị)
        public string Code { get; set; } = string.Empty;
    }
}
