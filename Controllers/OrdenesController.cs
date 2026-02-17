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

        // Notificar a cocina y barra via SignalR
        await _hub.Clients.All.SendAsync("NuevoPedido", orden);

        return CreatedAtAction(nameof(GetOrden), new { id = orden.Id }, orden);
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
    public async Task<IActionResult> PagarOrden(int id, [FromBody] string metodoPago)
    {
        var orden = await _context.Ordenes.FindAsync(id);
        if (orden == null) return NotFound();

        orden.Estado = "pagada";
        orden.MetodoPago = metodoPago;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
