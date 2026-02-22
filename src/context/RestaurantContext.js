import React, { createContext, useContext, useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { getQueue, enqueue, dequeue } from '../utils/offlineQueue';

const RestaurantContext = createContext();
export const useRestaurant = () => useContext(RestaurantContext);

const API = 'http://localhost:5049';

export const menu = [
  { id: 1, name: 'Enchiladas Suizas', price: 85, category: 'Platillos', destination: 'cocina', options: [{ name: 'Salsa', choices: ['Rojas', 'Verdes'] }] },
  { id: 2, name: 'Tacos al Pastor', price: 65, category: 'Platillos', destination: 'cocina', options: [{ name: 'Cantidad', choices: ['3 piezas', '5 piezas'] }] },
  { id: 3, name: 'Pozole', price: 95, category: 'Platillos', destination: 'cocina', options: [{ name: 'Tipo', choices: ['Rojo', 'Blanco', 'Verde'] }] },
  { id: 4, name: 'Quesadillas', price: 55, category: 'Platillos', destination: 'cocina', options: [{ name: 'Relleno', choices: ['Queso', 'Tinga'] }] },
  { id: 5, name: 'Agua de Horchata', price: 25, category: 'Bebidas', destination: 'barra', options: [] },
  { id: 6, name: 'Refresco', price: 30, category: 'Bebidas', destination: 'barra', options: [{ name: 'Sabor', choices: ['Coca-Cola', 'Sprite', 'Fanta'] }] },
  { id: 7, name: 'Agua Natural', price: 20, category: 'Bebidas', destination: 'barra', options: [] },
  { id: 8, name: 'Cerveza', price: 45, category: 'Bebidas', destination: 'barra', options: [{ name: 'Marca', choices: ['Corona', 'Modelo', 'Pacifico'] }] },
];

// Mapeo API → forma que usan los componentes
const mapOrden = (o) => ({
  id: o.id,
  table: o.mesa,
  waiter: o.mesero,
  time: new Date(o.fechaHora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  billRequested: o.cuentaSolicitada,
  items: (o.detalles || []).map(d => ({
    cartId: d.id,
    name: d.nombrePlatillo,
    selectedOptions: d.opciones ? JSON.parse(d.opciones) : {},
    destination: d.destino,
    quantity: d.cantidad,
    price: Number(d.precio),
    status: d.status,
  }))
});

const mapPaidBill = (o) => {
  const detalles = o.detalles || [];
  return {
    id: o.id,
    table: o.mesa,
    waiter: o.mesero,
    total: detalles.reduce((sum, d) => sum + Number(d.precio) * d.cantidad, 0),
    propina: Number(o.propina) || 0,
    personas: o.personas || null,
    method: o.metodoPago,
    paidAt: new Date(o.fechaHora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    items: detalles.map(d => ({
      cartId: d.id,
      name: d.nombrePlatillo,
      price: Number(d.precio),
      quantity: d.cantidad,
      selectedOptions: d.opciones ? JSON.parse(d.opciones) : {},
    }))
  };
};

export const RestaurantProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [paidBills, setPaidBills] = useState([]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.token}`,
  });

  const fetchOrders = async (token) => {
    const t = token || user?.token;
    if (!t) return;
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` };
    const [active, paid] = await Promise.all([
      fetch(`${API}/api/Ordenes`, { headers: h }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/Ordenes/pagadas`, { headers: h }).then(r => r.json()).catch(() => null),
    ]);
    if (active) setOrders(active.map(mapOrden));
    if (paid) setPaidBills(paid.map(mapPaidBill));
  };

  const flushQueue = async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    const sorted = [...queue].sort((a, b) => a.timestamp - b.timestamp);
    const idMap = {}; // tempId (negativo) → realId del servidor

    for (const action of sorted) {
      try {
        let resolvedUrl = action.url;

        // Si la acción depende de un orderId temporal, resolver con el mapa
        if (action.parentTempId != null) {
          const realId = idMap[action.parentTempId];
          if (realId == null) {
            console.warn('[flushQueue] No se pudo resolver tempId', action.parentTempId);
            continue;
          }
          resolvedUrl = action.url.replace(String(action.parentTempId), String(realId));
        }

        const response = await fetch(resolvedUrl, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${action.token}`,
          },
          body: action.body != null ? JSON.stringify(action.body) : undefined,
        });

        if (!response.ok) {
          console.error('[flushQueue] Servidor rechazó la acción', action.type, response.status);
          dequeue(action.id);
          continue;
        }

        // Para addOrder: guardar el ID real asignado por el servidor
        if (action.type === 'addOrder' && action.tempId != null) {
          const data = await response.json();
          idMap[action.tempId] = data.id;
          // Reemplazar la orden temporal con la real en el estado local
          setOrders(prev => prev.map(o =>
            o.id === action.tempId ? { ...mapOrden(data), _isTemp: false } : o
          ));
        }

        dequeue(action.id);
      } catch (err) {
        // Error de red durante el flush — dejar en cola para el próximo evento online
        console.warn('[flushQueue] Error de red al procesar acción', action.type, err);
      }
    }

    // Refetch autoritativo al terminar
    await fetchOrders();
  };

  useEffect(() => {
    if (!user?.token) return;

    fetchOrders(user.token);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API}/hub`)
      .withAutomaticReconnect()
      .build();

    // Nueva orden o items agregados → actualizar o insertar en orders
    connection.on('NuevoPedido', (orden) => {
      const mapped = mapOrden(orden);
      setOrders(prev => {
        const exists = prev.some(o => o.id === mapped.id);
        return exists
          ? prev.map(o => o.id === mapped.id ? mapped : o)
          : [...prev, mapped];
      });
    });

    // Item marcado listo/entregado por cocina o barra
    connection.on('PlatilloListo', (detalle) => {
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items.map(item =>
          item.cartId === detalle.id ? { ...item, status: detalle.status } : item
        )
      })));
    });

    // Mesero solicita cuenta
    connection.on('CuentaSolicitada', (orden) => {
      setOrders(prev => prev.map(o =>
        o.id === orden.id ? { ...o, billRequested: true } : o
      ));
    });

    connection.start().catch(() => {});

    // Al reconectarse: vaciar la cola de acciones pendientes
    window.addEventListener('online', flushQueue);

    return () => {
      connection.stop();
      window.removeEventListener('online', flushQueue);
    };
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const addOrder = async (table, waiter, items) => {
    const body = {
      mesa: table,
      mesero: waiter,
      detalles: items.map(item => ({
        nombrePlatillo: item.name,
        opciones: JSON.stringify(item.selectedOptions || {}),
        destino: item.destination,
        cantidad: item.quantity,
        precio: item.price,
      }))
    };

    if (!navigator.onLine) {
      const tempId = -Date.now();
      const optimisticOrder = {
        id: tempId,
        table,
        waiter,
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        billRequested: false,
        _isTemp: true,
        items: items.map((item, idx) => ({
          cartId: -(Date.now() + idx + 1),
          name: item.name,
          selectedOptions: item.selectedOptions || {},
          destination: item.destination,
          quantity: item.quantity,
          price: item.price,
          status: 'pending',
        })),
      };
      setOrders(prev => [...prev, optimisticOrder]);
      enqueue({ type: 'addOrder', method: 'POST', url: `${API}/api/Ordenes`, body, token: user?.token, tempId });
      return;
    }

    await fetch(`${API}/api/Ordenes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    // El estado se actualiza via SignalR NuevoPedido
  };

  const addItemsToOrder = async (orderId, newItems) => {
    const body = newItems.map(item => ({
      nombrePlatillo: item.name,
      opciones: JSON.stringify(item.selectedOptions || {}),
      destino: item.destination,
      cantidad: item.quantity,
      precio: item.price,
    }));

    if (!navigator.onLine) {
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const optimisticItems = newItems.map((item, idx) => ({
          cartId: -(Date.now() + idx + 100),
          name: item.name,
          selectedOptions: item.selectedOptions || {},
          destination: item.destination,
          quantity: item.quantity,
          price: item.price,
          status: 'pending',
        }));
        return { ...o, items: [...o.items, ...optimisticItems] };
      }));
      const isTemp = orderId < 0;
      enqueue({
        type: 'addItemsToOrder',
        method: 'POST',
        url: `${API}/api/Ordenes/${orderId}/detalles`,
        body,
        token: user?.token,
        parentTempId: isTemp ? orderId : undefined,
      });
      return;
    }

    await fetch(`${API}/api/Ordenes/${orderId}/detalles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    // El estado se actualiza via SignalR NuevoPedido
  };

  const markItemReady = async (orderId, itemCartId) => {
    if (!navigator.onLine) {
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items.map(item =>
          item.cartId === itemCartId ? { ...item, status: 'ready' } : item
        )
      })));
      enqueue({
        type: 'markItemReady',
        method: 'PUT',
        url: `${API}/api/Ordenes/${orderId}/detalle/${itemCartId}/status`,
        body: 'ready',
        token: user?.token,
      });
      return;
    }

    await fetch(`${API}/api/Ordenes/${orderId}/detalle/${itemCartId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify('ready')
    });
    // El estado se actualiza via SignalR PlatilloListo
  };

  const markItemDelivered = async (orderId, itemCartId) => {
    if (!navigator.onLine) {
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items.map(item =>
          item.cartId === itemCartId ? { ...item, status: 'delivered' } : item
        )
      })));
      enqueue({
        type: 'markItemDelivered',
        method: 'PUT',
        url: `${API}/api/Ordenes/${orderId}/detalle/${itemCartId}/status`,
        body: 'delivered',
        token: user?.token,
      });
      return;
    }

    await fetch(`${API}/api/Ordenes/${orderId}/detalle/${itemCartId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify('delivered')
    });
    // El estado se actualiza via SignalR PlatilloListo
  };

  const requestBill = async (orderId) => {
    if (!navigator.onLine) {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, billRequested: true } : o
      ));
      enqueue({
        type: 'requestBill',
        method: 'PUT',
        url: `${API}/api/Ordenes/${orderId}/cuenta`,
        body: null,
        token: user?.token,
      });
      return;
    }

    await fetch(`${API}/api/Ordenes/${orderId}/cuenta`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    // El estado se actualiza via SignalR CuentaSolicitada
  };

  const payOrder = async (orderId, method, propina = 0, personas = null) => {
    if (!navigator.onLine) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        setPaidBills(prev => [...prev, {
          ...order,
          total,
          propina,
          method,
          paidAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        }]);
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
      enqueue({
        type: 'payOrder',
        method: 'PUT',
        url: `${API}/api/Ordenes/${orderId}/pagar`,
        body: { metodoPago: method, propina, personas },
        token: user?.token,
      });
      return;
    }

    await fetch(`${API}/api/Ordenes/${orderId}/pagar`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ metodoPago: method, propina, personas })
    });
    // Actualización local: mover de orders a paidBills
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setPaidBills(prev => [...prev, {
        ...order,
        total,
        propina,
        method,
        paidAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      }]);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  return (
    <RestaurantContext.Provider value={{
      orders, paidBills,
      addOrder, addItemsToOrder,
      markItemReady, markItemDelivered,
      requestBill, payOrder,
      flushQueue,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};
