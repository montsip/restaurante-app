namespace RestauranteAPI.Models;

public class OrdenDetalle
{
    public int Id { get; set; }
    public int OrdenId { get; set; }
    public Orden? Orden { get; set; }
    public string NombrePlatillo { get; set; } = string.Empty;
    public string Opciones { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }
    public string Status { get; set; } = "pending"; // pending, ready, delivered
}
