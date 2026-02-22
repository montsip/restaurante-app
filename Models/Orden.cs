namespace RestauranteAPI.Models;

public class Orden
{
    public int Id { get; set; }
    public string Mesa { get; set; } = string.Empty;
    public string Mesero { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.Now;
    public bool CuentaSolicitada { get; set; } = false;
    public string Estado { get; set; } = "activa"; // activa, pagada
    public string MetodoPago { get; set; } = string.Empty;
    public decimal Propina { get; set; } = 0;
    public int? Personas { get; set; }  // null = sin división de cuenta
    public List<OrdenDetalle> Detalles { get; set; } = new();
}
