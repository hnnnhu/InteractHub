using System;
using System.Collections.Generic;
using System.Text;

namespace SocialGraphPlatform.Application.DTOs.Users
{
    public class TwoFactorSetupDto
    {
        public string SharedKey { get; set; } = string.Empty;
        public string AuthenticatorUri { get; set; } = string.Empty;
    }
}
