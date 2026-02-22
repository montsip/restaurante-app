using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RestauranteAPI.Data;
using RestauranteAPI.Hubs;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdenesController : ControllerBase
{
    private readonly RestauranteContext _context;
    private readonly IHubContext<RestauranteHub> _hub;

    public OrdenesController(RestauranteContext context, IHubContext<RestauranteHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    // GET: api/ordenes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Orden>>> GetOrdenes()
    {
        return await _context.Ordenes
            .Include(o => o.Detalles)
            .Where(o => o.Estado == "activa")
            .ToListAsync();
    }

    // GET: api/ordenes/pagadas
    [HttpGet("pagadas")]
    public async Task<ActionResult<IEnumerable<Orden>>> GetOrdenesPagadas()
    {
        var hoy = DateTime.Today;
        return await _context.Ordenes
            .Include(o => o.Detalles)
            .Where(o => o.Estado == "pagada" && o.FechaHora >= hoy)
            .ToListAsync();
    }

    // POST: api/ordenes
    [HttpPost]
    public async Task<ActionResult<Orden>> PostOrden(Orden orden)
    {
        orden.FechaHora = DateTime.Now;
        orden.Estado = "activa";
        _context.Ordenes.Add(orden);
        await _context.SaveChangesAsync();

        // Recargar con detalles para SignalR
        var ordenCompleta = await _context.Ordenes
            .Include(o => o.Detalles)
            .FirstOrDefaultAsync(o => o.Id == orden.Id);

        await _hub.Clients.All.SendAsync("NuevoPedido", ordenCompleta);

        return CreatedAtAction(nameof(GetOrden), new { id = orden.Id }, ordenCompleta);
    }

    // GET: api/ordenes/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Orden>> GetOrden(int id)
    {
        var orden = await _context.Ordenes
            .Include(o => o.Detalles)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (orden == null) return NotFound();
        return orden;
    }

    // PUT: api/ordenes/5/detalle/1/status
    [HttpPut("{ordenId}/detalle/{detalleId}/status")]
    public async Task<IActionResult> UpdateDetalleStatus(int ordenId, int detalleId, [FromBody] string status)
    {
        var detalle = await _context.OrdenDetalles
            .FirstOrDefaultAsync(d => d.Id == detalleId && d.OrdenId == ordenId);
        if (detalle == null) return NotFound();

        detalle.Status = status;
        await _context.SaveChangesAsync();

        // Notificar al mesero via SignalR
        await _hub.Clients.All.SendAsync("PlatilloListo", detalle);

        return NoContent();
    }

    // PUT: api/ordenes/5/cuenta
    [HttpPut("{id}/cuenta")]
    public async Task<IActionResult> SolicitarCuenta(int id)
    {
        var orden = await _context.Ordenes.FindAsync(id);
        if (orden == null) return NotFound();

        orden.CuentaSolicitada = true;
        await _context.SaveChangesAsync();

        // Notificar al cajero via SignalR
        await _hub.Clients.All.SendAsync("CuentaSolicitada", orden);

        return NoContent();
    }

    // PUT: api/ordenes/5/pagar
    [HttpPut("{id}/pagar")]
    public async Task<IActionResult> PagarOrden(int id, [FromBody] PagarRequest req)
    {
        var orden = await _context.Ordenes.FindAsync(id);
        if (orden == null) return NotFound();

        orden.Estado = "pagada";
        orden.MetodoPago = req.MetodoPago;
        orden.Propina = req.Propina;
        orden.Personas = req.Personas;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/ordenes/5/detalles (agregar items a orden existente)
    [HttpPost("{id}/detalles")]
    public async Task<IActionResult> AddDetalles(int id, List<OrdenDetalle> detalles)
    {
        var orden = await _context.Ordenes.FindAsync(id);
        if (orden == null) return NotFound();

        foreach (var detalle in detalles)
        {
            detalle.OrdenId = id;
            _context.OrdenDetalles.Add(detalle);
        }
        await _context.SaveChangesAsync();

        var ordenCompleta = await _context.Ordenes
            .Include(o => o.Detalles)
            .FirstOrDefaultAsync(o => o.Id == id);

        await _hub.Clients.All.SendAsync("NuevoPedido", ordenCompleta);

        return NoContent();
    }

    // GET: api/ordenes/reportes?dias=1
    [HttpGet("reportes")]
    public async Task<ActionResult> GetReportes([FromQuery] int dias = 1)
    {
        var desde = DateTime.Today.AddDays(-(dias - 1));
        var hasta = DateTime.Today.AddDays(1);

        var pagadas = await _context.Ordenes
            .Include(o => o.Detalles)
            .Where(o => o.Estado == "pagada" && o.FechaHora >= desde && o.FechaHora < hasta)
            .ToListAsync();

        var totalVentas = pagadas.Sum(o => o.Detalles.Sum(d => d.Precio * d.Cantidad));
        var totalPropinas = pagadas.Sum(o => o.Propina);
        var totalEfectivo = pagadas.Where(o => o.MetodoPago == "efectivo")
            .Sum(o => o.Detalles.Sum(d => d.Precio * d.Cantidad));
        var totalTarjeta = pagadas.Where(o => o.MetodoPago == "tarjeta")
            .Sum(o => o.Detalles.Sum(d => d.Precio * d.Cantidad));

        var platillos = pagadas
            .SelectMany(o => o.Detalles)
            .GroupBy(d => d.NombrePlatillo)
            .Select(g => new {
                nombre = g.Key,
                cantidad = g.Sum(d => d.Cantidad),
                total = g.Sum(d => d.Precio * d.Cantidad)
            })
            .OrderByDescending(p => p.cantidad)
            .Take(10)
            .ToList();

        var porMesero = pagadas
            .GroupBy(o => o.Mesero)
            .Select(g => new {
                mesero = g.Key,
                mesas = g.Count(),
                total = g.Sum(o => o.Detalles.Sum(d => d.Precio * d.Cantidad))
            })
            .OrderByDescending(m => m.total)
            .ToList();

        return Ok(new {
            desde = desde.ToString("yyyy-MM-dd"),
            hasta = DateTime.Today.ToString("yyyy-MM-dd"),
            dias,
            totalVentas,
            totalPropinas,
            totalEfectivo,
            totalTarjeta,
            mesasAtendidas = pagadas.Count,
            platillosMasVendidos = platillos,
            ventasPorMesero = porMesero
        });
    }
}

public record PagarRequest(string MetodoPago, decimal Propina, int? Personas);
