import React, { useState } from 'react';
import { useRestaurant, menu } from '../../context/RestaurantContext';

export default function Mesero() {
  const { orders, addOrder, addItemsToOrder, markItemDelivered, requestBill } = useRestaurant();
  const [activeTab, setActiveTab] = useState('new');
  const [selectedTable, setSelectedTable] = useState('');
  const [cart, setCart] = useState([]);
  const [showOptions, setShowOptions] = useState(null);
  const [notification, setNotification] = useState('');
  const [addingToOrder, setAddingToOrder] = useState(null);
  const [selections, setSelections] = useState({});

  const mesas = Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`);
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const categories = [...new Set(menu.map(i => i.category))];

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const addToCart = (item, opts) => {
    setCart(prev => [...prev, { ...item, cartId: Date.now(), selectedOptions: opts || {}, quantity: 1 }]);
    setShowOptions(null);
    setSelections({});
  };

  const handleAddWithOptions = () => {
    if (showOptions.options.every(opt => selections[opt.name])) {
      addToCart(showOptions, selections);
    } else {
      alert('Selecciona todas las opciones');
    }
  };

  const removeFromCart = (cartId) => setCart(prev => prev.filter(i => i.cartId !== cartId));

  const updateQty = (cartId, delta) => setCart(prev =>
    prev.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
  );

  const sendToKitchen = () => {
    if (!selectedTable || cart.length === 0) { alert('Selecciona mesa y agrega platillos'); return; }
    if (addingToOrder) {
      addItemsToOrder(addingToOrder, cart);
      showNotif('Platillos agregados a ' + selectedTable);
      setAddingToOrder(null);
    } else {
      addOrder(selectedTable, 'Mesero 1', cart);
      showNotif('Pedido enviado - ' + selectedTable);
    }
    setCart([]);
    setSelectedTable('');
    setActiveTab('active');
  };

  const openAddItems = (order) => {
    setAddingToOrder(order.id);
    setSelectedTable(order.table);
    setActiveTab('new');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {notification && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#16a34a', color: 'white', padding: '12px 20px', borderRadius: 8, zIndex: 100, fontWeight: 'bold' }}>
          {notification}
        </div>
      )}

      <div style={{ background: '#2563eb', color: 'white', padding: '16px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 'bold', margin: 0 }}>Sistema de Pedidos - Mesero</h1>
      </div>

      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('new')}
          style={{ flex: 1, padding: 14, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'new' ? '#3b82f6' : 'white', color: activeTab === 'new' ? 'white' : '#6b7280' }}>
          Nuevo Pedido
        </button>
        <button onClick={() => setActiveTab('active')}
          style={{ flex: 1, padding: 14, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'active' ? '#3b82f6' : 'white', color: activeTab === 'active' ? 'white' : '#6b7280' }}>
          Pedidos Activos ({orders.length})
        </button>
      </div>

      {activeTab === 'new' && (
        <div style={{ padding: 16 }}>
          {addingToOrder && (
            <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center' }}>
              <strong>Agregando a {selectedTable}</strong>
              <button onClick={() => { setAddingToOrder(null); setSelectedTable(''); setCart([]); }}
                style={{ marginLeft: 12, background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          )}

          <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 16, marginBottom: 16 }}>
            <option value="">-- Selecciona una mesa --</option>
              {mesas.map(m => { const ocupada = orders.some(o => o.table === m) && !addingToOrder; return <option key={m} value={m} disabled={ocupada}>{m}{ocupada ? ' (Ocupada)' : ''}
            </option>; })}
          </select>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              {categories.map(cat => (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cat === 'Bebidas' ? '🍹' : '🍽️'} {cat}
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, color: 'white', fontWeight: 600, background: cat === 'Bebidas' ? '#3b82f6' : '#16a34a' }}>
                      {cat === 'Bebidas' ? 'Barra' : 'Cocina'}
                    </span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                    {menu.filter(i => i.category === cat).map(item => (
                      <div key={item.id} style={{ background: 'white', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '3px solid', borderTopColor: cat === 'Bebidas' ? '#3b82f6' : '#16a34a' }}>
                        <p style={{ fontWeight: 600, margin: '0 0 4px', fontSize: 14 }}>{item.name}</p>
                        <p style={{ color: '#16a34a', fontWeight: 'bold', margin: '0 0 8px' }}>${item.price}</p>
                        <button onClick={() => item.options.length > 0 ? setShowOptions(item) : addToCart(item)}
                          style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: cat === 'Bebidas' ? '#3b82f6' : '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ width: 300 }}>
              <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 16 }}>
                <h2 style={{ margin: '0 0 12px' }}>Pedido Actual</h2>
                {selectedTable && (
                  <div style={{ background: '#eff6ff', padding: 8, borderRadius: 6, textAlign: 'center', marginBottom: 12, fontWeight: 600, color: '#1d4ed8' }}>
                    {selectedTable}
                  </div>
                )}
                {cart.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>No hay productos</p>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
                    {cart.map(item => (
                      <div key={item.cartId} style={{ background: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: '3px solid', borderLeftColor: item.destination === 'barra' ? '#3b82f6' : '#16a34a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div>
                            <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{item.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: item.destination === 'barra' ? '#3b82f6' : '#16a34a', fontWeight: 600 }}>
                              {item.destination === 'barra' ? '🍹 Barra' : '🍽️ Cocina'}
                            </p>
                            {Object.entries(item.selectedOptions).map(([k, v]) => (
                              <p key={k} style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{k}: {v}</p>
                            ))}
                          </div>
                          <button onClick={() => removeFromCart(item.cartId)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>x</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => updateQty(item.cartId, -1)}
                              style={{ background: '#e5e7eb', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>-</button>
                            <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                            <button onClick={() => updateQty(item.cartId, 1)}
                              style={{ background: '#e5e7eb', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>+</button>
                          </div>
                          <span style={{ fontWeight: 'bold', color: '#16a34a' }}>${item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 18 }}>Total:</span>
                    <span style={{ fontWeight: 'bold', fontSize: 22, color: '#16a34a' }}>${total}</span>
                  </div>
                  <button onClick={sendToKitchen} disabled={cart.length === 0 || !selectedTable}
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: cart.length === 0 || !selectedTable ? '#d1d5db' : '#22c55e', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: cart.length === 0 || !selectedTable ? 'not-allowed' : 'pointer' }}>
                    Enviar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'active' && (
        <div style={{ padding: 16 }}>
          <h2 style={{ marginBottom: 16 }}>Pedidos Activos</h2>
          {orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '80px 0' }}>No hay pedidos activos</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {orders.map(order => {
                const cocinaPending = order.items.filter(i => i.status === 'pending' && i.destination === 'cocina').length;
                const cocinaReady = order.items.filter(i => i.status === 'ready' && i.destination === 'cocina').length;
                const barraPending = order.items.filter(i => i.status === 'pending' && i.destination === 'barra').length;
                const barraReady = order.items.filter(i => i.status === 'ready' && i.destination === 'barra').length;

                return (
                  <div key={order.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #bfdbfe' }}>
                    <div style={{ background: '#2563eb', color: 'white', padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 20 }}>{order.table}</h3>
                          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>{order.time}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>🍽️ Cocina</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                            🟢 {cocinaPending} pendientes &nbsp; 🔴 {cocinaReady} listos
                          </p>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>🍹 Barra</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                            🟢 {barraPending} pendientes &nbsp; 🔴 {barraReady} listos
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 12 }}>
                      {order.items.map(item => (
                        <div key={item.cartId} style={{ padding: 10, borderRadius: 8, marginBottom: 8, border: '2px solid',
                          borderColor: item.status === 'pending' ? '#4ade80' : item.status === 'ready' ? '#f87171' : '#d1d5db',
                          background: item.status === 'pending' ? '#f0fdf4' : item.status === 'ready' ? '#fef2f2' : '#f9fafb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{item.quantity}x {item.name}</p>
                              <p style={{ margin: 0, fontSize: 11, color: item.destination === 'barra' ? '#3b82f6' : '#16a34a', fontWeight: 600 }}>
                                {item.destination === 'barra' ? '🍹 Barra' : '🍽️ Cocina'}
                              </p>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 'bold', padding: '3px 8px', borderRadius: 12, color: 'white',
                              background: item.status === 'pending' ? '#22c55e' : item.status === 'ready' ? '#ef4444' : '#6b7280' }}>
                              {item.status === 'pending' ? 'COCINA' : item.status === 'ready' ? 'LISTO' : 'ENTREGADO'}
                            </span>
                          </div>
                          {item.status === 'ready' && (
                            <button onClick={() => markItemDelivered(order.id, item.cartId)}
                              style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 6, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                              Marcar Entregado
                            </button>
                          )}
                        </div>
                      ))}

                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => openAddItems(order)}
                          style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                          + Agregar mas
                        </button>
                        {!order.billRequested ? (
                          <button onClick={() => { requestBill(order.id); showNotif('Cuenta solicitada - ' + order.table); }}
                            style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#8b5cf6', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                            Pedir Cuenta
                          </button>
                        ) : (
                          <div style={{ flex: 1, padding: 10, borderRadius: 8, background: '#fef3c7', color: '#92400e', fontWeight: 600, textAlign: 'center', fontSize: 13 }}>
                            Cuenta enviada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showOptions && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <h2 style={{ marginBottom: 16 }}>{showOptions.name}</h2>
            {showOptions.options.map(opt => (
              <div key={opt.name} style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>{opt.name}</p>
                {opt.choices.map(choice => (
                  <label key={choice} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                    <input type="radio" name={opt.name} onChange={() => setSelections(prev => ({ ...prev, [opt.name]: choice }))} />
                    {choice}
                  </label>
                ))}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setShowOptions(null); setSelections({}); }}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#e5e7eb', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleAddWithOptions}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
