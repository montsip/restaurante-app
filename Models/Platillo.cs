namespace RestauranteAPI.Models;

public class Platillo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty; // "cocina" o "barra"
    public bool Activo { get; set; } = true;
}
