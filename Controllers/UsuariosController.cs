using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestauranteAPI.Data;
using RestauranteAPI.Models;

namespace RestauranteAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly RestauranteContext _context;

    public UsuariosController(RestauranteContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Usuario>>> GetUsuarios()
    {
        return await _context.Usuarios.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Usuario>> GetUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();
        return usuario;
    }

    [HttpPost]
    public async Task<ActionResult<Usuario>> CreateUsuario(Usuario usuario)
    {
        // Hashear la contraseña antes de guardar
        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(usuario.PasswordHash);
        
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUsuario(int id, Usuario usuario)
    {
        if (id != usuario.Id) return BadRequest();

        var usuarioExistente = await _context.Usuarios.FindAsync(id);
        if (usuarioExistente == null) return NotFound();

        usuarioExistente.NombreCompleto = usuario.NombreCompleto;
        usuarioExistente.Username = usuario.Username;
        usuarioExistente.Rol = usuario.Rol;
        usuarioExistente.Activo = usuario.Activo;

        // Solo actualizar contraseña si viene una nueva
        if (!string.IsNullOrEmpty(usuario.PasswordHash))
        {
            usuarioExistente.PasswordHash = BCrypt.Net.BCrypt.HashPassword(usuario.PasswordHash);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound();

        usuario.Activo = false; // Soft delete
        await _context.SaveChangesAsync();
        
        return NoContent();
    }
}
