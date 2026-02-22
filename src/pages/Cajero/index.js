import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import Header from '../../components/Header';
import { playBillRequested } from '../../utils/sounds';

export default function Cajero() {
  const { orders, paidBills, payOrder } = useRestaurant();
  const [showPayModal, setShowPayModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [clientPays, setClientPays] = useState('');
  const [changeGiven, setChangeGiven] = useState(false);
  const [tipOption, setTipOption] = useState('0');
  const [customTip, setCustomTip] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [dividirCuenta, setDividirCuenta] = useState(false);
  const [numPersonas, setNumPersonas] = useState(2);
  const [justPaid, setJustPaid] = useState(null);

  const billRequestedCount = orders.filter(o => o.billRequested).length;
  const prevBillCount = useRef(null);
  useEffect(() => {
    if (prevBillCount.current !== null && billRequestedCount > prevBillCount.current) {
      playBillRequested();
    }
    prevBillCount.current = billRequestedCount;
  }, [billRequestedCount]);

  const printTicket = (bill) => {
    const w = window.open('', '_blank', 'width=380,height=620');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>Ticket ${bill.table}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 12px; }
        .c { text-align: center; }
        .d { border-top: 1px dashed #000; margin: 6px 0; }
        .r { display: flex; justify-content: space-between; }
        .b { font-weight: bold; }
        @media print { @page { margin: 0; } }
      </style>
    </head><body>
      <div class="c b" style="font-size:15px">RESTAURANTE</div>
      <div class="c">================================</div>
      <div class="r"><span>Mesa:</span><span>${bill.table}</span></div>
      <div class="r"><span>Mesero:</span><span>${bill.waiter}</span></div>
      <div class="r"><span>Fecha:</span><span>${bill.paidAt}</span></div>
      <div class="d"></div>
      <div class="r b"><span>CANT</span><span style="flex:1;text-align:center">DESCRIPCION</span><span>TOTAL</span></div>
      <div class="d"></div>
      ${bill.items.map(i => `<div class="r"><span>${i.quantity}x</span><span style="flex:1;padding:0 6px">${i.name}</span><span>$${i.price * i.quantity}</span></div>`).join('')}
      <div class="d"></div>
      <div class="r"><span>Subtotal:</span><span>$${bill.subtotal}</span></div>
      ${bill.tipAmount > 0 ? `<div class="r"><span>Propina:</span><span>+$${bill.tipAmount}</span></div>` : ''}
      <div class="r b" style="font-size:14px"><span>TOTAL:</span><span>$${bill.total}</span></div>
      <div class="d"></div>
      <div class="r"><span>Metodo:</span><span>${bill.method === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</span></div>
      ${bill.personas ? `<div class="r"><span>Division:</span><span>${bill.personas} personas &bull; $${bill.totalPorPersona}/c.u.</span></div>` : ''}
      <div class="d"></div>
      <div class="c" style="margin-top:8px">Gracias por su visita!</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  const pendingBills = orders.filter(o => o.billRequested);
  const getTotal = (order) => order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const getDayTotal = () => paidBills.reduce((sum, b) => sum + b.total, 0);
  const getTipTotal = () => paidBills.reduce((sum, b) => sum + (b.propina || 0), 0);
  const getCashTotal = () => paidBills.filter(b => b.method === 'efectivo').reduce((sum, b) => sum + b.total, 0);
  const getCardTotal = () => paidBills.filter(b => b.method === 'tarjeta').reduce((sum, b) => sum + b.total, 0);
  const getChange = (subtotal, tipAmt) => Math.max(0, (parseFloat(clientPays) || 0) - (subtotal + tipAmt));

  const getTopDishes = () => {
    const counts = {};
    paidBills.forEach(bill => {
      bill.items.forEach(item => {
        if (!counts[item.name]) counts[item.name] = { count: 0, total: 0 };
        counts[item.name].count += item.quantity;
        counts[item.name].total += item.price * item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const openPayModal = (order) => {
    setShowPayModal(order);
    setPaymentMethod('efectivo');
    setClientPays('');
    setChangeGiven(false);
    setTipOption('0');
    setCustomTip('');
    setDividirCuenta(false);
    setNumPersonas(2);
  };

  const handleConfirmChange = () => {
    setChangeGiven(true);
  };

  const handlePay = () => {
    const billData = {
      table: showPayModal.table,
      waiter: showPayModal.waiter,
      items: showPayModal.items,
      subtotal,
      tipAmount,
      total,
      method: paymentMethod,
      personas: dividirCuenta ? numPersonas : null,
      totalPorPersona: totalPorPersona || null,
      paidAt: new Date().toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
    };
    payOrder(showPayModal.id, paymentMethod, tipAmount, dividirCuenta ? numPersonas : null);
    setJustPaid(billData);
    setShowPayModal(null);
    setClientPays('');
    setChangeGiven(false);
    setPaymentMethod('efectivo');
    setTipOption('0');
    setCustomTip('');
    setDividirCuenta(false);
    setNumPersonas(2);
  };

  const subtotal = showPayModal ? getTotal(showPayModal) : 0;
  const tipAmount = tipOption === 'otro'
    ? (parseFloat(customTip) || 0)
    : Math.round(subtotal * parseFloat(tipOption || 0)) / 100;
  const total = subtotal + tipAmount;
  const change = getChange(subtotal, tipAmount);
  const clientPaysNum = parseFloat(clientPays) || 0;
  const canPay = paymentMethod === 'tarjeta' || (paymentMethod === 'efectivo' && changeGiven);
  const totalPorPersona = dividirCuenta && numPersonas > 1
    ? Math.ceil(total / numPersonas)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff' }}>
      <Header title="Caja - Sistema de Cobro" />
      <div style={{ background: '#7c3aed', color: 'white', padding: '8px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 24px', borderRadius: 8, textAlign: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 'bold' }}>${getDayTotal()}</span>
          <span style={{ fontSize: 13, marginLeft: 8, opacity: 0.9 }}>Total del dia</span>
        </div>
      </div>

      <div style={{ background: 'white', padding: 12, display: 'flex', gap: 20, justifyContent: 'center', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#ef4444' }}>{pendingBills.length}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Pendientes</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#16a34a' }}>{paidBills.length}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Cobradas</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#2563eb' }}>${getCashTotal()}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>💵 Efectivo</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#7c3aed' }}>${getCardTotal()}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>💳 Tarjeta</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#16a34a' }}>${getTipTotal()}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>🤝 Propinas</div>
        </div>
      </div>

      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { id: 'pending', label: 'Pendientes', badge: pendingBills.length, badgeColor: '#ef4444' },
          { id: 'paid', label: 'Pagadas Hoy', badge: paidBills.length, badgeColor: '#16a34a' },
          { id: 'summary', label: 'Resumen', badge: null }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: 14, border: 'none', cursor: 'pointer', fontWeight: 600,
              background: activeTab === tab.id ? '#7c3aed' : 'white',
              color: activeTab === tab.id ? 'white' : '#6b7280' }}>
            {tab.label}
            {tab.badge !== null && tab.badge > 0 && (
              <span style={{ marginLeft: 6, background: tab.badgeColor, color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: 12 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {activeTab === 'pending' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>Cuentas por Cobrar</h2>
            {pendingBills.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#16a34a', padding: '80px 0', fontSize: 20, fontWeight: 'bold' }}>Todo cobrado!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {pendingBills.map(order => (
                  <div key={order.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '2px solid #c4b5fd', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ background: '#7c3aed', color: 'white', padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 22 }}>{order.table}</h3>
                          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>Mesero: {order.waiter}</p>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>{order.time}</p>
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      {order.items.map(item => (
                        <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                          <span>{item.quantity}x {item.name}
                            {item.selectedOptions && Object.values(item.selectedOptions).length > 0 &&
                              <span style={{ color: '#6b7280' }}> ({Object.values(item.selectedOptions).join(', ')})</span>}
                          </span>
                          <span style={{ fontWeight: 600 }}>${item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', fontSize: 18 }}>TOTAL:</span>
                        <span style={{ fontWeight: 'bold', fontSize: 22, color: '#7c3aed' }}>${getTotal(order)}</span>
                      </div>
                      <button onClick={() => openPayModal(order)}
                        style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
                        Cobrar Mesa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'paid' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>Mesas Pagadas Hoy</h2>
            {paidBills.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '80px 0' }}>No hay pagos registrados</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {paidBills.map(bill => (
                  <div key={bill.id} style={{ background: 'white', borderRadius: 10, padding: 16, border: '2px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>{bill.table}</h3>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Mesero: {bill.waiter}</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{bill.paidAt}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#16a34a' }}>${bill.total + (bill.propina || 0)}</div>
                        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 12, color: 'white', background: bill.method === 'efectivo' ? '#2563eb' : '#7c3aed' }}>
                          {bill.method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => printTicket({
                        table: bill.table,
                        waiter: bill.waiter,
                        items: bill.items,
                        subtotal: bill.total,
                        tipAmount: bill.propina || 0,
                        total: bill.total + (bill.propina || 0),
                        method: bill.method,
                        personas: bill.personas || null,
                        totalPorPersona: bill.personas ? Math.ceil((bill.total + (bill.propina || 0)) / bill.personas) : null,
                        paidAt: bill.paidAt,
                      })}
                      style={{ marginTop: 10, width: '100%', padding: '7px 0', borderRadius: 6, border: 'none', background: '#1d4ed8', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      🖨️ Imprimir ticket
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>Resumen del Dia</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total del dia', value: '$' + getDayTotal(), color: '#7c3aed' },
                { label: 'Propinas', value: '$' + getTipTotal(), color: '#16a34a' },
                { label: 'Total efectivo', value: '$' + getCashTotal(), color: '#2563eb' },
                { label: 'Total tarjeta', value: '$' + getCardTotal(), color: '#7c3aed' },
                { label: 'Mesas atendidas', value: paidBills.length, color: '#16a34a' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'white', borderRadius: 10, padding: 16, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: '4px solid ' + stat.color }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Platillos más vendidos */}
            <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏆 Platillos Mas Vendidos
              </h3>
              {getTopDishes().length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Sin datos aun</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {getTopDishes().map((dish, idx) => (
                    <div key={dish.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: 14, flexShrink: 0,
                        background: idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#f97316' : '#d1d5db' }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{dish.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{dish.count} vendidos</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#16a34a' }}>${dish.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla detalle */}
            <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginBottom: 12 }}>Detalle de Mesas Pagadas</h3>
              {paidBills.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Sin pagos aun</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Mesa', 'Mesero', 'Hora', 'Metodo', 'Total'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Total' ? 'right' : 'left', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paidBills.map(bill => (
                      <tr key={bill.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{bill.table}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{bill.waiter}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{bill.paidAt}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 12, color: 'white', background: bill.method === 'efectivo' ? '#2563eb' : '#7c3aed' }}>
                            {bill.method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>${bill.total}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f5f3ff' }}>
                      <td colSpan="4" style={{ padding: '12px', fontWeight: 'bold', color: '#7c3aed' }}>TOTAL DEL DIA</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: 18, color: '#7c3aed' }}>${getDayTotal()}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Cobrar {showPayModal.table}</h2>
              <button onClick={() => setShowPayModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                <span>Subtotal:</span><span>${subtotal}</span>
              </div>
              {tipAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16a34a', marginBottom: 4 }}>
                  <span>Propina:</span><span>+${tipAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 22, color: '#7c3aed', borderTop: '1px solid #ddd6fe', paddingTop: 8, marginTop: 4 }}>
                <span>Total:</span><span>${total}</span>
              </div>
            </div>

            <p style={{ fontWeight: 600, marginBottom: 8 }}>Propina:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
              {[{ label: 'Sin', val: '0' }, { label: '10%', val: '10' }, { label: '15%', val: '15' }, { label: '20%', val: '20' }, { label: 'Otro', val: 'otro' }].map(opt => (
                <button key={opt.val} onClick={() => { setTipOption(opt.val); setCustomTip(''); }}
                  style={{ padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    background: tipOption === opt.val ? '#16a34a' : '#f3f4f6',
                    color: tipOption === opt.val ? 'white' : '#374151' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {tipOption === 'otro' && (
              <input type="number" value={customTip} onChange={e => setCustomTip(e.target.value)}
                placeholder="Monto de propina $" min="0"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '2px solid #bbf7d0', fontSize: 15, boxSizing: 'border-box', marginBottom: 10 }} />
            )}

            <div style={{ marginBottom: 14 }}>
              <button
                onClick={() => { setDividirCuenta(!dividirCuenta); setNumPersonas(2); }}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  background: dividirCuenta ? '#0ea5e9' : '#f3f4f6',
                  color: dividirCuenta ? 'white' : '#374151'
                }}>
                {dividirCuenta ? '👥 Dividiendo cuenta' : '👥 Dividir cuenta'}
              </button>
              {dividirCuenta && (
                <div style={{ marginTop: 10, background: '#f0f9ff', borderRadius: 8, padding: 12, border: '1px solid #bae6fd' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#0369a1' }}>
                    ¿Entre cuántas personas?
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => setNumPersonas(Math.max(2, numPersonas - 1))}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#0ea5e9', color: 'white', fontSize: 20, cursor: 'pointer', fontWeight: 'bold' }}>
                      −
                    </button>
                    <span style={{ fontSize: 28, fontWeight: 'bold', minWidth: 32, textAlign: 'center' }}>
                      {numPersonas}
                    </span>
                    <button onClick={() => setNumPersonas(numPersonas + 1)}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#0ea5e9', color: 'white', fontSize: 20, cursor: 'pointer', fontWeight: 'bold' }}>
                      +
                    </button>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#0369a1' }}>Por persona</div>
                      <div style={{ fontSize: 22, fontWeight: 'bold', color: '#0369a1' }}>
                        ${totalPorPersona}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p style={{ fontWeight: 600, marginBottom: 8 }}>Metodo de pago:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {['efectivo', 'tarjeta'].map(m => (
                <button key={m} onClick={() => { setPaymentMethod(m); setClientPays(''); setChangeGiven(false); }}
                  style={{ padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
                    background: paymentMethod === m ? '#7c3aed' : '#f3f4f6',
                    color: paymentMethod === m ? 'white' : '#374151' }}>
                  {m === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                </button>
              ))}
            </div>

            {paymentMethod === 'efectivo' && !changeGiven && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Cliente paga con:</p>
                <input type="number" value={clientPays} onChange={e => setClientPays(e.target.value)}
                  placeholder="$0" min="0"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '2px solid #c4b5fd', fontSize: 16, boxSizing: 'border-box', marginBottom: 10 }} />

                {clientPaysNum > 0 && clientPaysNum < total && (
                  <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>El monto es menor al total</p>
                )}

                {clientPaysNum >= total && (
                  <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>Cambio a dar:</span>
                      <span style={{ fontWeight: 'bold', fontSize: 28, color: '#16a34a' }}>${change}</span>
                    </div>
                  </div>
                )}

                <button onClick={handleConfirmChange} disabled={clientPaysNum < total}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 15, cursor: clientPaysNum < total ? 'not-allowed' : 'pointer',
                    background: clientPaysNum < total ? '#d1d5db' : '#f59e0b', color: 'white' }}>
                  ✓ Confirmar Cambio Entregado
                </button>
              </div>
            )}

            {paymentMethod === 'efectivo' && changeGiven && (
              <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#16a34a', fontWeight: 600 }}>✓ Cambio de ${change} entregado</p>
              </div>
            )}

            <button onClick={handlePay} disabled={!canPay}
              style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 16, cursor: canPay ? 'pointer' : 'not-allowed',
                background: canPay ? '#22c55e' : '#d1d5db', color: 'white' }}>
              ✓ Confirmar Pago - ${total} registrado
            </button>
          </div>
        </div>
      )}

      {justPaid && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 320, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2 style={{ margin: '12px 0 4px' }}>¡Pago registrado!</h2>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>
              {justPaid.table} — ${justPaid.total}
            </p>
            <button onClick={() => printTicket(justPaid)}
              style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: 'none', background: '#1d4ed8', color: 'white', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>
              🖨️ Imprimir ticket
            </button>
            <button onClick={() => setJustPaid(null)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: 'white', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
