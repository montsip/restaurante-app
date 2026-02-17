using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestauranteAPI.Data;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlatillosController : ControllerBase
{
    private readonly RestauranteContext _context;

    public PlatillosController(RestauranteContext context)
    {
        _context = context;
    }

    // GET: api/platillos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Platillo>>> GetPlatillos()
    {
        return await _context.Platillos.Where(p => p.Activo).ToListAsync();
    }

    // GET: api/platillos/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Platillo>> GetPlatillo(int id)
    {
        var platillo = await _context.Platillos.FindAsync(id);
        if (platillo == null) return NotFound();
        return platillo;
    }

    // POST: api/platillos
    [HttpPost]
    public async Task<ActionResult<Platillo>> PostPlatillo(Platillo platillo)
    {
        _context.Platillos.Add(platillo);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPlatillo), new { id = platillo.Id }, platillo);
    }

    // PUT: api/platillos/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutPlatillo(int id, Platillo platillo)
    {
        if (id != platillo.Id) return BadRequest();
        _context.Entry(platillo).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/platillos/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlatillo(int id)
    {
        var platillo = await _context.Platillos.FindAsync(id);
        if (platillo == null) return NotFound();
        platillo.Activo = false; // Soft delete
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
