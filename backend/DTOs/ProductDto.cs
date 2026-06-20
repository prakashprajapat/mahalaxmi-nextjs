namespace MahalaxmiApi.DTOs;

public record ProductDto(
    int     DbId,
    string? Sku,
    string  Name,
    string  Category,
    string  Subcategory,
    decimal Price,
    decimal? DiscountPrice,
    decimal? MaxPrice,
    string  Stock,
    string? Description,
    int     Newest,
    string? Image,
    bool    BestSeller
);

public record ProductCreateRequest(
    string? Sku,
    string  Name,
    string  Category,
    string  Subcategory,
    decimal Price,
    decimal? DiscountPrice,
    decimal? MaxPrice,
    string  Stock,
    string? Description,
    int     Newest,
    string? Image,
    bool    BestSeller
);

public record BulkSaveRequest(List<ProductCreateRequest> Products);
