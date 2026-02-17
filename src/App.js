import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';
import Mesero from './pages/Mesero';
import Cocina from './pages/Cocina';
import Barra from './pages/Barra';
import Cajero from './pages/Cajero';

const navItems = [
  { path: '/', label: '👨‍💼 Mesero' },
  { path: '/cocina', label: '👨‍🍳 Cocina' },
  { path: '/barra', label: '🍹 Barra' },
  { path: '/cajero', label: '💵 Cajero' },
];

function NavBar() {
  const location = useLocation();
  return (
    <nav style={{ background: '#1e293b', display: 'flex', gap: 4, padding: '8px 16px' }}>
      {navItems.map(item => (
        <Link key={item.path} to={item.path}
          style={{
            color: location.pathname === item.path ? '#1e293b' : 'white',
            textDecoration: 'none',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: 8,
            background: location.pathname === item.path ? 'white' : 'transparent',
            fontSize: 14,
            transition: 'all 0.2s'
          }}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function App() {
  return (
    <RestaurantProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Mesero />} />
          <Route path="/cocina" element={<Cocina />} />
          <Route path="/barra" element={<Barra />} />
          <Route path="/cajero" element={<Cajero />} />
        </Routes>
      </BrowserRouter>
    </RestaurantProvider>
  );
}

export default App;
