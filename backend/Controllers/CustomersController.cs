using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MahalaxmiApi.Data;
using MahalaxmiApi.DTOs;
using MahalaxmiApi.Models;
using MahalaxmiApi.Services;

namespace MahalaxmiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuthService _auth;

    public CustomersController(AppDbContext db, AuthService auth)
    {
        _db = db;
        _auth = auth;
    }

    // GET /api/customers  (Admin only)
    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c =>
                c.FirstName.ToLower().Contains(s) ||
                c.LastName.ToLower().Contains(s) ||
                c.Email.ToLower().Contains(s) ||
                c.Phone.Contains(s) ||
                c.CustomerCode.ToLower().Contains(s));
        }

        var total = await query.CountAsync();
        var customers = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => ToDto(c))
            .ToListAsync();

        return Ok(new { success = true, customers, total });
    }

    // GET /api/customers/{id}
    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c is null) return NotFound();
        return Ok(new { success = true, customer = ToDto(c) });
    }

    // POST /api/customers/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _db.Customers.AnyAsync(c => c.Email == req.Email))
            return Conflict(new { success = false, message = "Email already registered." });

        if (await _db.Customers.AnyAsync(c => c.Phone == req.Phone))
            return Conflict(new { success = false, message = "Phone already registered." });

        var (hash, salt) = _auth.HashPassword(req.Password);
        var code = "MFH" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        var customer = new Customer
        {
            CustomerCode     = code,
            FirstName        = req.FirstName.Trim(),
            LastName         = req.LastName.Trim(),
            Email            = req.Email.ToLower().Trim(),
            Phone            = req.Phone.Trim(),
            Gender           = req.Gender ?? "",
            DateOfBirth      = req.DateOfBirth is not null ? DateOnly.Parse(req.DateOfBirth) : null,
            MarketingConsent = req.MarketingConsent,
            PasswordHash     = hash,
            PasswordSalt     = salt,
            SubmittedAt      = DateTimeOffset.UtcNow.ToString("o"),
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        var token = _auth.GenerateJwt(customer.Id.ToString(), customer.Email, "customer");
        return Ok(new { success = true, token, customer = ToDto(customer) });
    }

    // POST /api/customers/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Email == req.Email.ToLower().Trim());

        if (customer is null || !_auth.VerifyPassword(req.Password, customer.PasswordHash, customer.PasswordSalt))
            return Unauthorized(new { success = false, message = "Invalid email or password." });

        if (customer.AccountStatus != "active")
            return Unauthorized(new { success = false, message = "Account is deactivated." });

        var token = _auth.GenerateJwt(customer.Id.ToString(), customer.Email, "customer");
        return Ok(new { success = true, token, customer = ToDto(customer) });
    }

    // POST /api/customers/send-otp
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
    {
        var phone = req.Phone.Trim();
        // Generate 6-digit OTP
        var otp = Random.Shared.Next(100000, 999999).ToString();
        var (hash, _) = _auth.HashPassword(otp);

        // Remove old OTPs for this phone
        var old = _db.OtpTokens.Where(t => t.Phone == phone && !t.Used);
        _db.OtpTokens.RemoveRange(old);

        _db.OtpTokens.Add(new OtpToken
        {
            Phone     = phone,
            OtpHash   = hash,
            Purpose   = req.Purpose ?? "login",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
        });
        await _db.SaveChangesAsync();

        // TODO: Send OTP via WhatsApp API (plug in your provider here)
        // For now, return OTP in response (DEVELOPMENT ONLY — remove in production)
        return Ok(new { success = true, message = "OTP sent.", devOtp = otp });
    }

    // POST /api/customers/verify-otp
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] OtpLoginRequest req)
    {
        var phone = req.Phone.Trim();
        var otpRecord = await _db.OtpTokens
            .Where(t => t.Phone == phone && !t.Used && t.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (otpRecord is null)
            return BadRequest(new { success = false, message = "OTP expired or not found." });

        if (otpRecord.Attempts >= 5)
            return BadRequest(new { success = false, message = "Too many attempts." });

        if (!_auth.VerifyPassword(req.Otp, otpRecord.OtpHash, ""))
        {
            otpRecord.Attempts++;
            await _db.SaveChangesAsync();
            return BadRequest(new { success = false, message = "Invalid OTP." });
        }

        otpRecord.Used = true;
        await _db.SaveChangesAsync();

        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Phone == phone);
        if (customer is null)
            return Ok(new { success = true, newUser = true, phone });

        var token = _auth.GenerateJwt(customer.Id.ToString(), customer.Email, "customer");
        return Ok(new { success = true, token, customer = ToDto(customer) });
    }

    // PUT /api/customers/{id}  (Self or Admin)
    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateProfileRequest req)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c is null) return NotFound();

        c.FirstName  = req.FirstName.Trim();
        c.LastName   = req.LastName.Trim();
        c.Gender     = req.Gender ?? "";
        c.DateOfBirth = req.DateOfBirth is not null ? DateOnly.Parse(req.DateOfBirth) : null;
        c.AddrLine1  = req.AddrLine1 ?? "";
        c.AddrLine2  = req.AddrLine2 ?? "";
        c.Pincode    = req.Pincode ?? "";
        c.PostOffice = req.PostOffice ?? "";
        c.State      = req.State ?? "";
        c.District   = req.District ?? "";
        c.UpdatedAt  = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true, customer = ToDto(c) });
    }

    private static CustomerDto ToDto(Customer c) => new(
        c.Id, c.CustomerCode, c.FirstName, c.LastName, c.Gender,
        c.Email, c.Phone,
        c.DateOfBirth?.ToString("yyyy-MM-dd"),
        c.AddrLine1, c.AddrLine2, c.Pincode, c.PostOffice, c.State, c.District,
        c.AccountStatus, c.ProfileStatus,
        c.EmailVerified, c.PhoneVerified,
        c.CreatedAt
    );
}
