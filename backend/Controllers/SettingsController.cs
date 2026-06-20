using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MahalaxmiApi.Data;
using MahalaxmiApi.Models;

namespace MahalaxmiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SettingsController(AppDbContext db) => _db = db;

    // GET /api/settings  (Public read)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var settings = await _db.SiteSettings.ToListAsync();
        var dict = settings.ToDictionary(s => s.Key, s => s.Value);
        // Remove sensitive keys from public response
        dict.Remove("razorpay_key_secret");
        dict.Remove("delhivery_token");
        dict.Remove("whatsapp_api_key");
        return Ok(new { success = true, settings = dict });
    }

    // GET /api/settings/{key}
    [HttpGet("{key}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Get(string key)
    {
        var s = await _db.SiteSettings.FirstOrDefaultAsync(x => x.Key == key);
        if (s is null) return NotFound();
        return Ok(new { success = true, key = s.Key, value = s.Value });
    }

    // PUT /api/settings/{key}  (Admin only)
    [HttpPut("{key}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Upsert(string key, [FromBody] SettingUpsertRequest req)
    {
        var s = await _db.SiteSettings.FirstOrDefaultAsync(x => x.Key == key);
        if (s is null)
        {
            _db.SiteSettings.Add(new SiteSetting { Key = key, Value = req.Value });
        }
        else
        {
            s.Value = req.Value;
            s.UpdatedAt = DateTimeOffset.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // POST /api/settings/bulk  (Admin only)
    [HttpPost("bulk")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> BulkUpsert([FromBody] Dictionary<string, string> settings)
    {
        foreach (var (key, value) in settings)
        {
            var s = await _db.SiteSettings.FirstOrDefaultAsync(x => x.Key == key);
            if (s is null)
                _db.SiteSettings.Add(new SiteSetting { Key = key, Value = value });
            else
            {
                s.Value = value;
                s.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

public record SettingUpsertRequest(string Value);
