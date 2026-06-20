using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MahalaxmiApi.Data;
using MahalaxmiApi.DTOs;
using MahalaxmiApi.Models;

namespace MahalaxmiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db) => _db = db;

    // GET /api/products
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] string? subcategory,
        [FromQuery] bool? bestSeller,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category.ToLower() == category.ToLower());

        if (!string.IsNullOrWhiteSpace(subcategory))
            query = query.Where(p => p.Subcategory.ToLower() == subcategory.ToLower());

        if (bestSeller.HasValue)
            query = query.Where(p => p.BestSeller == bestSeller.Value);

        var total = await query.CountAsync();
        var products = await query
            .OrderByDescending(p => p.Newest)
            .ThenByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => ToDto(p))
            .ToListAsync();

        return Ok(new { success = true, products, total, page, pageSize });
    }

    // GET /api/products/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound(new { success = false, message = "Product not found." });
        return Ok(new { success = true, product = ToDto(p) });
    }

    // POST /api/products  (Admin only — bulk replace)
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> BulkSave([FromBody] BulkSaveRequest req)
    {
        if (req.Products is null || req.Products.Count == 0)
            return BadRequest(new { success = false, message = "products array required." });

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            _db.Products.RemoveRange(_db.Products);
            await _db.SaveChangesAsync();

            int i = 1;
            foreach (var dto in req.Products)
            {
                if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Category))
                    continue;

                _db.Products.Add(new Product
                {
                    Sku          = dto.Sku?.Trim(),
                    Name         = dto.Name.Trim(),
                    Category     = dto.Category.Trim(),
                    Subcategory  = dto.Subcategory?.Trim() ?? "",
                    Price        = dto.Price,
                    DiscountPrice = dto.DiscountPrice,
                    MaxPrice     = dto.MaxPrice,
                    StockStatus  = dto.Stock?.Trim() ?? "In Stock",
                    Description  = dto.Description?.Trim(),
                    Newest       = dto.Newest > 0 ? dto.Newest : i++,
                    Image        = dto.Image?.Trim(),
                    BestSeller   = dto.BestSeller,
                });
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();
            return Ok(new { success = true, saved = _db.Products.Local.Count });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    // PUT /api/products/{id}  (Admin only)
    [HttpPut("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductCreateRequest req)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound(new { success = false, message = "Not found." });

        p.Sku          = req.Sku?.Trim();
        p.Name         = req.Name.Trim();
        p.Category     = req.Category.Trim();
        p.Subcategory  = req.Subcategory?.Trim() ?? "";
        p.Price        = req.Price;
        p.DiscountPrice = req.DiscountPrice;
        p.MaxPrice     = req.MaxPrice;
        p.StockStatus  = req.Stock?.Trim() ?? "In Stock";
        p.Description  = req.Description?.Trim();
        p.Newest       = req.Newest;
        p.Image        = req.Image?.Trim();
        p.BestSeller   = req.BestSeller;
        p.UpdatedAt    = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true, product = ToDto(p) });
    }

    // DELETE /api/products/{id}  (Admin only)
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound();
        _db.Products.Remove(p);
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private static ProductDto ToDto(Product p) => new(
        p.Id, p.Sku, p.Name, p.Category, p.Subcategory,
        p.Price, p.DiscountPrice, p.MaxPrice,
        p.StockStatus, p.Description, p.Newest, p.Image, p.BestSeller
    );
}
