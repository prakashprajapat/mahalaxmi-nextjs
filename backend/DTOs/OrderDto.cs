using System.Text.Json.Serialization;

namespace MahalaxmiApi.DTOs;

public record CartLineDto(
    string Id,
    string Name,
    string Sku,
    string Size,
    string Image,
    int    Quantity,
    decimal Price,
    decimal LineTotal,
    string Category,
    string Subcategory,
    decimal GstRate,
    string Hsn
);

public record OrderDto(
    string  Id,
    string? PaymentId,
    string  Method,
    string  Status,
    List<CartLineDto> Cart,
    decimal Subtotal,
    decimal ShippingCost,
    decimal CodFee,
    decimal Total,
    string? Awb,
    string? CustomerId,
    string? CustomerName,
    string? CustomerEmail,
    string? CustomerPhone,
    string? ShippingName,
    string? ShippingAddress,
    string? ShippingCity,
    string? ShippingPincode,
    string? ShippingState,
    DateTimeOffset? PlacedAt,
    DateTimeOffset  CreatedAt,
    DateTimeOffset  UpdatedAt
);

public record PlaceOrderRequest(
    string  Id,
    string  Method,
    string? Status,
    string? PaymentId,
    List<CartLineDto> Cart,
    decimal Subtotal,
    decimal ShippingCost,
    decimal CodFee,
    decimal Total,
    string? CustomerId,
    string? CustomerName,
    string? CustomerEmail,
    string? CustomerPhone,
    string? ShippingName,
    string? ShippingAddress,
    string? ShippingCity,
    string? ShippingPincode,
    string? ShippingState,
    DateTimeOffset? PlacedAt
);

public record AdminUpdateOrderRequest(
    string OrderId,
    string Status,
    string? Awb
);
