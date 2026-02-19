using RestauranteAPI.Data;
using RestauranteAPI.Models;

namespace RestauranteAPI;

public static class SeedData
{
    public static void Initialize(RestauranteContext context)
    {
        // Crear usuario admin si no existe
        if (!context.Usuarios.Any())
        {
            var admin = new Usuario
            {
                NombreCompleto = "Administrador",
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Rol = "Admin",
                Activo = true
            };
            
            context.Usuarios.Add(admin);
            context.SaveChanges();
        }
    }
}
