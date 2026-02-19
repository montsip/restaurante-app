import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import Header from '../../components/Header';

export default function Barra() {
  const { orders, markItemReady } = useRestaurant();

  const pendingOrders = orders.map(order => ({
    ...order,
    items: order.items.filter(i => i.status === 'pending' && i.destination === 'barra')
  })).filter(order => order.items.length > 0);

  const totalPending = pendingOrders.reduce((sum, o) => sum + o.items.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#eff6ff' }}>
      <Header title="Barra - Bebidas Pendientes" />
      <div style={{ background: '#1d4ed8', color: 'white', padding: '8px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 24px', borderRadius: 8, textAlign: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 'bold' }}>{totalPending}</span>
          <span style={{ fontSize: 13, marginLeft: 8, opacity: 0.9 }}>Pendientes</span>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {pendingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#1d4ed8' }}>Todo listo!</p>
            <p style={{ color: '#6b7280' }}>No hay bebidas pendientes</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {pendingOrders.map(order => (
              <div key={order.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '3px solid #3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ background: '#3b82f6', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 'bold' }}>{order.table}</h3>
                    <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>{order.time}</p>
                  </div>
                  <div style={{ background: 'white', color: '#1d4ed8', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
                    {order.items.length}
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  {order.items.map(item => (
                    <div key={item.cartId}
                      onClick={() => markItemReady(order.id, item.cartId)}
                      style={{ background: '#eff6ff', border: '2px solid #93c5fd', borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: 16 }}>{item.quantity}x {item.name}</p>
                          {item.selectedOptions && Object.entries(item.selectedOptions).map(([k, v]) => (
                            <p key={k} style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>→ {v}</p>
                          ))}
                        </div>
                        <span style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>NUEVO</span>
                      </div>
                      <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: 8, textAlign: 'center', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
                        Toca cuando este lista
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 16, right: 16, background: 'white', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '2px solid #3b82f6', fontSize: 13 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>Como usar:</p>
        <p style={{ margin: 0, color: '#6b7280' }}>Toca una bebida cuando este lista</p>
        <p style={{ margin: 0, color: '#6b7280' }}>Desaparecera automaticamente</p>
      </div>
    </div>
  );
}
