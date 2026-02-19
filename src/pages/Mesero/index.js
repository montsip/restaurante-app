import React, { useState } from 'react';
import { useRestaurant, menu } from '../../context/RestaurantContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

const TOTAL_MESAS = 12;
const mesas = Array.from({ length: TOTAL_MESAS }, (_, i) => `Mesa ${i + 1}`);

const STATUS_STYLE = {
  libre:  { bg: '#f0fdf4', border: '#22c55e', text: '#16a34a', label: 'Libre' },
  ocupada: { bg: '#fff7ed', border: '#f97316', text: '#ea580c', label: 'Ocupada' },
  cuenta: { bg: '#f5f3ff', border: '#8b5cf6', text: '#7c3aed', label: 'Cuenta' },
};

export default function Mesero() {
  const { orders, addOrder, addItemsToOrder, markItemDelivered, requestBill } = useRestaurant();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('mesas');
  const [selectedTable, setSelectedTable] = useState('');
  const [cart, setCart] = useState([]);
  const [showOptions, setShowOptions] = useState(null);
  const [notification, setNotification] = useState('');
  const [addingToOrder, setAddingToOrder] = useState(null);
  const [selections, setSelections] = useState({});

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const categories = [...new Set(menu.map(i => i.category))];

  // Pedidos visibles según rol
  const myOrders = user.rol === 'Admin'
    ? orders
    : orders.filter(o => o.waiter === user.nombreCompleto);

  const getTableStatus = (mesa) => {
    const order = orders.find(o => o.table === mesa);
    if (!order) return 'libre';
    if (order.billRequested) return 'cuenta';
    return 'ocupada';
  };

  const getTableOrder = (mesa) => orders.find(o => o.table === mesa);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSelectTable = (mesa) => {
    const status = getTableStatus(mesa);
    if (status !== 'libre') return;
    setSelectedTable(mesa);
    setAddingToOrder(null);
    setActiveTab('pedido');
  };

  const handleAutoAssign = () => {
    const libre = mesas.find(m => getTableStatus(m) === 'libre');
    if (!libre) { showNotif('No hay mesas disponibles'); return; }
    setSelectedTable(libre);
    setAddingToOrder(null);
    setActiveTab('pedido');
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
      addOrder(selectedTable, user.nombreCompleto, cart);
      showNotif('Pedido enviado - ' + selectedTable);
    }
    setCart([]);
    setSelectedTable('');
    setActiveTab('mesas');
  };

  const openAddItems = (order) => {
    setAddingToOrder(order.id);
    setSelectedTable(order.table);
    setActiveTab('pedido');
  };

  const cancelOrder = () => {
    setCart([]);
    setSelectedTable('');
    setAddingToOrder(null);
    setActiveTab('mesas');
  };

  // Conteos para tabs
  const libres = mesas.filter(m => getTableStatus(m) === 'libre').length;
  const ocupadas = mesas.filter(m => getTableStatus(m) !== 'libre').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {notification && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#16a34a', color: 'white', padding: '12px 20px', borderRadius: 8, zIndex: 100, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {notification}
        </div>
      )}

      <Header title="Sistema de Pedidos" />

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('mesas')}
          style={{ flex: 1, padding: 14, border: 'none', cursor: 'pointer', fontWeight: 600,
            background: activeTab === 'mesas' ? '#3b82f6' : 'white',
            color: activeTab === 'mesas' ? 'white' : '#6b7280' }}>
          Mesas ({libres} libres)
        </button>
        <button onClick={() => setActiveTab('pedido')}
          style={{ flex: 1, padding: 14, border: 'none', cursor: 'pointer', fontWeight: 600,
            background: activeTab === 'pedido' ? '#3b82f6' : 'white',
            color: activeTab === 'pedido' ? 'white' : '#6b7280' }}>
          {addingToOrder ? `+ ${selectedTable}` : selectedTable ? `Pedido - ${selectedTable}` : 'Nuevo Pedido'}
        </button>
        <button onClick={() => setActiveTab('activos')}
          style={{ flex: 1, padding: 14, border: 'none', cursor: 'pointer', fontWeight: 600,
            background: activeTab === 'activos' ? '#3b82f6' : 'white',
            color: activeTab === 'activos' ? 'white' : '#6b7280' }}>
          Mis Pedidos ({myOrders.length})
        </button>
      </div>

      {/* TAB: MAPA DE MESAS */}
      {activeTab === 'mesas' && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {Object.entries(STATUS_STYLE).map(([key, s]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: s.bg, border: `2px solid ${s.border}` }} />
                  <span style={{ color: '#6b7280' }}>{s.label}</span>
                </div>
              ))}
            </div>
            <button onClick={handleAutoAssign}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Asignar automaticamente
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {mesas.map(mesa => {
              const status = getTableStatus(mesa);
              const s = STATUS_STYLE[status];
              const order = getTableOrder(mesa);
              const isMyTable = order?.waiter === user.nombreCompleto;

              return (
                <div key={mesa}
                  onClick={() => status === 'libre' ? handleSelectTable(mesa) : null}
                  style={{
                    background: s.bg, border: `2px solid ${s.border}`, borderRadius: 12,
                    padding: 16, textAlign: 'center',
                    cursor: status === 'libre' ? 'pointer' : 'default',
                    transition: 'transform 0.1s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}
                  onMouseEnter={e => { if (status === 'libre') e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>
                    {status === 'libre' ? '🪑' : status === 'cuenta' ? '🧾' : '🍽️'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>{mesa}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.text, padding: '2px 8px', background: 'white', borderRadius: 12, display: 'inline-block' }}>
                    {s.label}
                  </div>
                  {order && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>
                      {isMyTable ? '👤 Tú' : order.waiter}
                    </div>
                  )}
                  {order && (
                    <div style={{ marginTop: 2, fontSize: 11, color: '#6b7280' }}>{order.time}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: 10, padding: '10px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>{libres}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Libres</div>
            </div>
            <div style={{ background: 'white', borderRadius: 10, padding: '10px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f97316' }}>{ocupadas}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Ocupadas</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: NUEVO PEDIDO / AGREGAR ITEMS */}
      {activeTab === 'pedido' && (
        <div style={{ padding: 16 }}>
          {!selectedTable ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <p style={{ fontSize: 18 }}>Selecciona una mesa desde el mapa</p>
              <button onClick={() => setActiveTab('mesas')}
                style={{ marginTop: 12, background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Ver Mapa de Mesas
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ background: '#eff6ff', padding: '8px 16px', borderRadius: 8, fontWeight: 700, color: '#1d4ed8', fontSize: 16 }}>
                  {addingToOrder ? `Agregando a ${selectedTable}` : `Nueva orden - ${selectedTable}`}
                </div>
                <button onClick={cancelOrder}
                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>

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
                      <button onClick={sendToKitchen} disabled={cart.length === 0}
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: cart.length === 0 ? '#d1d5db' : '#22c55e', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
                        Enviar Pedido
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: MIS PEDIDOS ACTIVOS */}
      {activeTab === 'activos' && (
        <div style={{ padding: 16 }}>
          <h2 style={{ marginBottom: 16 }}>
            {user.rol === 'Admin' ? 'Todos los Pedidos' : 'Mis Pedidos'}
            {myOrders.length === 0 ? '' : ` (${myOrders.length})`}
          </h2>
          {myOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '80px 0' }}>No hay pedidos activos</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {myOrders.map(order => {
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
                          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>{order.waiter} · {order.time}</p>
                        </div>
                        {order.billRequested && (
                          <span style={{ background: '#8b5cf6', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>🧾 Cuenta</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>🍽️ Cocina</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                            {cocinaPending} pend. · {cocinaReady} listos
                          </p>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>🍹 Barra</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                            {barraPending} pend. · {barraReady} listos
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
                              {item.status === 'pending' ? 'EN PREP.' : item.status === 'ready' ? 'LISTO' : 'ENTREGADO'}
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

      {/* Modal opciones */}
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
