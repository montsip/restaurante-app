using Microsoft.EntityFrameworkCore;
using RestauranteAPI.Models;

namespace RestauranteAPI.Data;

public class RestauranteContext : DbContext
{
    public RestauranteContext(DbContextOptions<RestauranteContext> options) : base(options) { }

    public DbSet<Platillo> Platillos { get; set; }
    public DbSet<Orden> Ordenes { get; set; }
    public DbSet<OrdenDetalle> OrdenDetalles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Datos iniciales del menú
        modelBuilder.Entity<Platillo>().HasData(
            new Platillo { Id = 1, Nombre = "Enchiladas Suizas", Precio = 85, Categoria = "Platillos", Destino = "cocina" },
            new Platillo { Id = 2, Nombre = "Tacos al Pastor", Precio = 65, Categoria = "Platillos", Destino = "cocina" },
            new Platillo { Id = 3, Nombre = "Pozole", Precio = 95, Categoria = "Platillos", Destino = "cocina" },
            new Platillo { Id = 4, Nombre = "Quesadillas", Precio = 55, Categoria = "Platillos", Destino = "cocina" },
            new Platillo { Id = 5, Nombre = "Agua de Horchata", Precio = 25, Categoria = "Bebidas", Destino = "barra" },
            new Platillo { Id = 6, Nombre = "Refresco", Precio = 30, Categoria = "Bebidas", Destino = "barra" },
            new Platillo { Id = 7, Nombre = "Agua Natural", Precio = 20, Categoria = "Bebidas", Destino = "barra" },
            new Platillo { Id = 8, Nombre = "Cerveza", Precio = 45, Categoria = "Bebidas", Destino = "barra" }
        );
    }
}
