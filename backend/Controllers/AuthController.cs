using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using MahalaxmiApi.Data;
using MahalaxmiApi.DTOs;
using MahalaxmiApi.Models;
using MahalaxmiApi.Services;

namespace MahalaxmiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuthService _auth;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, AuthService auth, IConfiguration config)
    {
        _db = db;
        _auth = auth;
        _config = config;
    }

    // POST /api/auth/admin-login
    [HttpPost("admin-login")]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginRequest req)
    {
        var adminEmail = _config["Admin:Email"] ?? "";
        var adminPassHash = _config["Admin:PasswordHash"] ?? "";

        if (!string.Equals(req.Email, adminEmail, StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { success = false, message = "Invalid credentials." });

        // Compare with bcrypt hash stored in config
        if (!BCrypt.Net.BCrypt.Verify(req.Password, adminPassHash))
            return Unauthorized(new { success = false, message = "Invalid credentials." });

        // Generate a secure token and store hash in DB
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var tokenHash = Convert.ToHexString(SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(rawToken)));

        _db.AdminTokens.Add(new AdminToken
        {
            Email     = req.Email,
            TokenHash = tokenHash,
            Role      = "admin",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
        });
        await _db.SaveChangesAsync();

        var jwt = _auth.GenerateJwt("0", req.Email, "admin");

        return Ok(new { success = true, token = jwt, rawToken });
    }

    // POST /api/auth/admin-logout
    [HttpPost("admin-logout")]
    public async Task<IActionResult> AdminLogout([FromBody] LogoutRequest req)
    {
        if (!string.IsNullOrEmpty(req.RawToken))
        {
            var hash = Convert.ToHexString(SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(req.RawToken)));
            var token = await _db.AdminTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
            if (token is not null)
            {
                _db.AdminTokens.Remove(token);
                await _db.SaveChangesAsync();
            }
        }
        return Ok(new { success = true });
    }

    // GET /api/auth/me
    [HttpGet("me")]
    public IActionResult Me()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized(new { success = false });

        return Ok(new
        {
            success = true,
            id    = User.FindFirst("sub")?.Value,
            email = User.FindFirst("email")?.Value,
            role  = User.FindFirst("role")?.Value,
        });
    }
}

public record LogoutRequest(string? RawToken);
