import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RestaurantProvider } from './context/RestaurantContext';
import Login from './pages/Login';
import Mesero from './pages/Mesero';
import Cocina from './pages/Cocina';
import Barra from './pages/Barra';
import Cajero from './pages/Cajero';
import Admin from './pages/Admin';
import './App.css';

// Componente para proteger rutas
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to={user.rol === 'Admin' ? '/admin' : `/${user.rol.toLowerCase()}`} replace />}
      />
      
      <Route
        path="/mesero"
        element={
          <ProtectedRoute allowedRoles={['Mesero', 'Admin']}>
            <Mesero />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cocina"
        element={
          <ProtectedRoute allowedRoles={['Cocina', 'Admin']}>
            <Cocina />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/barra"
        element={
          <ProtectedRoute allowedRoles={['Barra', 'Admin']}>
            <Barra />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/cajero"
        element={
          <ProtectedRoute allowedRoles={['Cajero', 'Admin']}>
            <Cajero />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={user ? <Navigate to={user.rol === 'Admin' ? '/admin' : `/${user.rol.toLowerCase()}`} replace /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to={user ? (user.rol === 'Admin' ? '/admin' : `/${user.rol.toLowerCase()}`) : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <Router>
          <AppRoutes />
        </Router>
      </RestaurantProvider>
    </AuthProvider>
  );
}

export default App;
