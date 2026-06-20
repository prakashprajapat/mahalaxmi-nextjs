using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using MahalaxmiApi.Data;
using MahalaxmiApi.DTOs;
using MahalaxmiApi.Models;

namespace MahalaxmiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    private static readonly JsonSerializerOptions _json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static readonly string[] AllowedStatuses =
    [
        "Order Received", "Pending", "Order Packed", "Ready for Shipping",
        "Shipped", "Transit", "Delivered", "Return Requested", "Return Transit",
        "Return", "Cancel Requested", "Cancelled"
    ];

    public OrdersController(AppDbContext db) => _db = db;

    // GET /api/orders  (Admin = all; Customer = filtered by phone/email)
    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? customerId,
        [FromQuery] string? email,
        [FromQuery] string? phone)
    {
        bool isAdmin = User.HasClaim("role", "admin");

        var orders = await _db.SiteOrders
            .OrderByDescending(o => o.PlacedAt ?? o.CreatedAt)
            .Select(o => MapOrder(o))
            .ToListAsync();

        if (isAdmin) return Ok(new { success = true, orders });

        // Customer access — require phone
        var cleanPhone = new string(phone?.Where(char.IsDigit).ToArray() ?? []);
        if (cleanPhone.Length < 10)
            return Unauthorized(new { success = false, message = "Phone number required to view orders." });

        var filtered = orders.Where(o =>
        {
            var oPhone = new string(o.CustomerPhone?.Where(char.IsDigit).ToArray() ?? []);
            if (oPhone.Length > 10) oPhone = oPhone[^10..];
            var reqPhone = cleanPhone.Length > 10 ? cleanPhone[^10..] : cleanPhone;

            return oPhone == reqPhone
                || (!string.IsNullOrEmpty(email) && string.Equals(o.CustomerEmail, email, StringComparison.OrdinalIgnoreCase))
                || (!string.IsNullOrEmpty(customerId) && o.CustomerId == customerId);
        }).ToList();

        return Ok(new { success = true, orders = filtered });
    }

    // GET /api/orders/{orderId}
    [HttpGet("{orderId}")]
    public async Task<IActionResult> GetById(string orderId)
    {
        var order = await _db.SiteOrders.FirstOrDefaultAsync(o => o.OrderId == orderId);
        if (order is null) return NotFound(new { success = false, message = "Order not found." });
        return Ok(new { success = true, order = MapOrder(order) });
    }

    // POST /api/orders  (Place order — public)
    [HttpPost]
    public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest req)
    {
        var orderId = CleanOrderId(req.Id);
        var method = req.Method.ToLower().Trim();
        var status = !string.IsNullOrWhiteSpace(req.Status)
            ? req.Status
            : method == "cod" ? "Pending confirmation" : "Paid";

        var cart = JsonSerializer.Serialize(req.Cart, _json);
        var customerJson = JsonSerializer.Serialize(new
        {
            id = req.CustomerId ?? "",
            name = req.CustomerName ?? "",
            email = req.CustomerEmail ?? "",
            phone = req.CustomerPhone ?? ""
        }, _json);
        var shippingJson = JsonSerializer.Serialize(new
        {
            name = req.ShippingName ?? "",
            address = req.ShippingAddress ?? "",
            city = req.ShippingCity ?? "",
            pincode = req.ShippingPincode ?? "",
            state = req.ShippingState ?? ""
        }, _json);

        var existing = await _db.SiteOrders.FirstOrDefaultAsync(o => o.OrderId == orderId);
        if (existing is not null)
        {
            existing.Method = method;
            existing.Status = status;
            existing.PaymentId = req.PaymentId;
            existing.Subtotal = req.Subtotal;
            existing.ShippingCost = req.ShippingCost;
            existing.CodFee = req.CodFee;
            existing.Total = req.Total;
            existing.CartJson = cart;
            existing.CustomerJson = customerJson;
            existing.ShippingJson = shippingJson;
            existing.PlacedAt = req.PlacedAt ?? DateTimeOffset.UtcNow;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            _db.SiteOrders.Add(new SiteOrder
            {
                OrderId = orderId,
                Method = method,
                Status = status,
                PaymentId = req.PaymentId,
                Subtotal = req.Subtotal,
                ShippingCost = req.ShippingCost,
                CodFee = req.CodFee,
                Total = req.Total,
                CartJson = cart,
                CustomerJson = customerJson,
                ShippingJson = shippingJson,
                PlacedAt = req.PlacedAt ?? DateTimeOffset.UtcNow,
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true, orderId });
    }

    // PATCH /api/orders/status  (Admin only)
    [HttpPatch("status")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateStatus([FromBody] AdminUpdateOrderRequest req)
    {
        if (!AllowedStatuses.Contains(req.Status))
            return BadRequest(new { success = false, message = "Invalid status." });

        var order = await _db.SiteOrders.FirstOrDefaultAsync(o => o.OrderId == req.OrderId);
        if (order is null)
            return NotFound(new { success = false, message = "Order not found." });

        order.Status = req.Status;
        if (req.Awb is not null)
            order.Awb = new string(req.Awb.Where(char.IsLetterOrDigit).ToArray());
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true, order = MapOrder(order) });
    }

    private static string CleanOrderId(string? raw)
    {
        var id = new string((raw ?? "").Where(c => char.IsLetterOrDigit(c) || c == '_' || c == '-').ToArray());
        return string.IsNullOrEmpty(id) ? $"MFH{DateTime.UtcNow:yyMMddHHmmssfff}" : id;
    }

    private static OrderDto MapOrder(SiteOrder o)
    {
        var customerJson = string.IsNullOrEmpty(o.CustomerJson)
            ? new JsonElement()
            : JsonSerializer.Deserialize<JsonElement>(o.CustomerJson);
        var shippingJson = string.IsNullOrEmpty(o.ShippingJson)
            ? new JsonElement()
            : JsonSerializer.Deserialize<JsonElement>(o.ShippingJson);
        var cartLines = string.IsNullOrEmpty(o.CartJson)
            ? new List<CartLineDto>()
            : JsonSerializer.Deserialize<List<CartLineDto>>(o.CartJson, _json) ?? [];

        string? GetStr(JsonElement el, string key) =>
            el.ValueKind == JsonValueKind.Object && el.TryGetProperty(key, out var v)
                ? v.GetString() : null;

        return new OrderDto(
            o.OrderId,
            o.PaymentId,
            o.Method,
            o.Status,
            cartLines,
            o.Subtotal,
            o.ShippingCost,
            o.CodFee,
            o.Total,
            o.Awb,
            GetStr(customerJson, "id"),
            GetStr(customerJson, "name"),
            GetStr(customerJson, "email"),
            GetStr(customerJson, "phone"),
            GetStr(shippingJson, "name"),
            GetStr(shippingJson, "address"),
            GetStr(shippingJson, "city"),
            GetStr(shippingJson, "pincode"),
            GetStr(shippingJson, "state"),
            o.PlacedAt,
            o.CreatedAt,
            o.UpdatedAt
        );
    }
}
