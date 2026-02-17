import React, { createContext, useContext, useState } from 'react';

const RestaurantContext = createContext();
export const useRestaurant = () => useContext(RestaurantContext);

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

export const RestaurantProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [paidBills, setPaidBills] = useState([]);

  const addOrder = (table, waiter, items) => {
    const newOrder = {
      id: Date.now(),
      table,
      waiter,
      items: items.map(item => ({
        ...item,
        status: 'pending',
        cartId: item.cartId || Date.now() + Math.random()
      })),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      billRequested: false,
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const addItemsToOrder = (orderId, newItems) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: [
            ...order.items,
            ...newItems.map(item => ({
              ...item,
              status: 'pending',
              cartId: item.cartId || Date.now() + Math.random()
            }))
          ]
        };
      }
      return order;
    }));
  };

  const markItemReady = (orderId, itemCartId) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item =>
            item.cartId === itemCartId ? { ...item, status: 'ready' } : item
          )
        };
      }
      return order;
    }));
  };

  const markItemDelivered = (orderId, itemCartId) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item =>
            item.cartId === itemCartId ? { ...item, status: 'delivered' } : item
          )
        };
      }
      return order;
    }));
  };

  const requestBill = (orderId) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, billRequested: true } : order
    ));
  };

  const payOrder = (orderId, method) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    setPaidBills(prev => [...prev, {
      ...order,
      total,
      method,
      paidAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    }]);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <RestaurantContext.Provider value={{
      orders, paidBills,
      addOrder, addItemsToOrder,
      markItemReady, markItemDelivered,
      requestBill, payOrder,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};
