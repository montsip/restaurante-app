using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestauranteAPI.Data;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventarioController : ControllerBase
{
    private readonly RestauranteContext _context;

    public InventarioController(RestauranteContext context)
    {
        _context = context;
    }

    // GET: api/inventario
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Insumo>>> GetInsumos()
    {
        return await _context.Insumos
            .Where(i => i.Activo)
            .OrderBy(i => i.Nombre)
            .ToListAsync();
    }

    // POST: api/inventario
    [HttpPost]
    public async Task<ActionResult<Insumo>> PostInsumo(Insumo insumo)
    {
        _context.Insumos.Add(insumo);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetInsumo), new { id = insumo.Id }, insumo);
    }

    // GET: api/inventario/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Insumo>> GetInsumo(int id)
    {
        var insumo = await _context.Insumos.FindAsync(id);
        if (insumo == null) return NotFound();
        return insumo;
    }

    // PUT: api/inventario/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutInsumo(int id, Insumo insumo)
    {
        if (id != insumo.Id) return BadRequest();
        var existing = await _context.Insumos.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Nombre = insumo.Nombre;
        existing.Unidad = insumo.Unidad;
        existing.StockMinimo = insumo.StockMinimo;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/inventario/5 (soft delete)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInsumo(int id)
    {
        var insumo = await _context.Insumos.FindAsync(id);
        if (insumo == null) return NotFound();
        insumo.Activo = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST: api/inventario/5/movimiento
    [HttpPost("{id}/movimiento")]
    public async Task<IActionResult> RegistrarMovimiento(int id, MovimientoInventario mov)
    {
        var insumo = await _context.Insumos.FindAsync(id);
        if (insumo == null) return NotFound();

        mov.InsumoId = id;
        mov.FechaHora = DateTime.Now;

        if (mov.Tipo == "entrada")
            insumo.StockActual += mov.Cantidad;
        else if (mov.Tipo == "salida")
            insumo.StockActual = Math.Max(0, insumo.StockActual - mov.Cantidad);

        _context.MovimientosInventario.Add(mov);
        await _context.SaveChangesAsync();

        return Ok(insumo);
    }

    // GET: api/inventario/movimientos?limite=30
    [HttpGet("movimientos")]
    public async Task<ActionResult> GetMovimientos([FromQuery] int limite = 30)
    {
        var movs = await _context.MovimientosInventario
            .Include(m => m.Insumo)
            .OrderByDescending(m => m.FechaHora)
            .Take(limite)
            .Select(m => new {
                m.Id,
                m.Tipo,
                m.Cantidad,
                m.Motivo,
                m.FechaHora,
                m.Usuario,
                insumoNombre = m.Insumo != null ? m.Insumo.Nombre : "",
                insumoUnidad = m.Insumo != null ? m.Insumo.Unidad : "",
            })
            .ToListAsync();

        return Ok(movs);
    }
}
