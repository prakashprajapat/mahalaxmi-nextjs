namespace MahalaxmiApi.DTOs;

public record CustomerDto(
    int     Id,
    string  CustomerCode,
    string  FirstName,
    string  LastName,
    string  Gender,
    string  Email,
    string  Phone,
    string? DateOfBirth,
    string  AddrLine1,
    string  AddrLine2,
    string  Pincode,
    string  PostOffice,
    string  State,
    string  District,
    string  AccountStatus,
    string  ProfileStatus,
    bool    EmailVerified,
    bool    PhoneVerified,
    DateTimeOffset CreatedAt
);

public record RegisterRequest(
    string  FirstName,
    string  LastName,
    string  Email,
    string  Phone,
    string  Password,
    string  Gender,
    string? DateOfBirth,
    bool    MarketingConsent
);

public record LoginRequest(
    string  Email,
    string  Password
);

public record OtpLoginRequest(
    string Phone,
    string Otp
);

public record SendOtpRequest(
    string Phone,
    string Purpose
);

public record AdminLoginRequest(
    string Email,
    string Password
);

public record UpdateProfileRequest(
    string  FirstName,
    string  LastName,
    string  Gender,
    string? DateOfBirth,
    string  AddrLine1,
    string  AddrLine2,
    string  Pincode,
    string  PostOffice,
    string  State,
    string  District
);
