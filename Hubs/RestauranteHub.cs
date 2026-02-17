using Microsoft.AspNetCore.SignalR;

namespace RestauranteAPI.Hubs;

public class RestauranteHub : Hub
{
    // Notificar nuevo pedido a cocina y barra
    public async Task NuevoPedido(object orden)
    {
        await Clients.All.SendAsync("NuevoPedido", orden);
    }

    // Notificar platillo listo al mesero
    public async Task PlatilloListo(object detalle)
    {
        await Clients.All.SendAsync("PlatilloListo", detalle);
    }

    // Notificar cuenta solicitada al cajero
    public async Task CuentaSolicitada(object orden)
    {
        await Clients.All.SendAsync("CuentaSolicitada", orden);
    }
}
