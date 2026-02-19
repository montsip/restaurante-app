import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ background: '#2563eb', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 'bold', margin: 0 }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
          👤 {user?.nombreCompleto} ({user?.rol})
        </p>
      </div>
      <button 
        onClick={handleLogout}
        style={{ 
          background: 'rgba(255,255,255,0.2)', 
          color: 'white', 
          border: 'none', 
          padding: '10px 20px', 
          borderRadius: 8, 
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
      >
        🚪 Cerrar Sesión
      </button>
    </div>
  );
}
