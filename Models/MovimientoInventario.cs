namespace RestauranteAPI.Models;

public class MovimientoInventario
{
    public int Id { get; set; }
    public int InsumoId { get; set; }
    public Insumo? Insumo { get; set; }
    public string Tipo { get; set; } = string.Empty; // "entrada" | "salida"
    public decimal Cantidad { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.Now;
    public string Usuario { get; set; } = string.Empty;
}
