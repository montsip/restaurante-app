namespace RestauranteAPI.Models;

public class Insumo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty; // kg, L, pzas, cajas, botella...
    public decimal StockActual { get; set; } = 0;
    public decimal StockMinimo { get; set; } = 0;
    public bool Activo { get; set; } = true;
    public List<MovimientoInventario> Movimientos { get; set; } = new();
}
