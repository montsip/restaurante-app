import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

const API = 'http://localhost:5049';
const ROLES = ['Admin', 'Mesero', 'Cocina', 'Barra', 'Cajero'];

const emptyForm = { nombreCompleto: '', username: '', password: '', rol: 'Mesero', activo: true };

const PERIODO_OPTS = [
  { label: 'Hoy', dias: 1 },
  { label: '7 días', dias: 7 },
  { label: '30 días', dias: 30 },
];

function Reportes({ token }) {
  const [reporte, setReporte] = useState(null);
  const [loadingR, setLoadingR] = useState(true);
  const [error, setError] = useState(false);
  const [dias, setDias] = useState(1);

  useEffect(() => {
    setLoadingR(true);
    setError(false);
    const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    fetch(`${API}/api/Ordenes/reportes?dias=${dias}`, { headers: h })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setReporte(data); setLoadingR(false); })
      .catch(() => { setError(true); setLoadingR(false); });
  }, [dias, token]);

  if (loadingR) return <p style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>Cargando reportes...</p>;
  if (error || !reporte) return <p style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>Error al cargar reportes. ¿El backend está corriendo?</p>;

  const statCards = [
    { label: 'Total ventas', value: `$${Number(reporte.totalVentas).toFixed(2)}`, color: '#7c3aed' },
    { label: 'Efectivo', value: `$${Number(reporte.totalEfectivo).toFixed(2)}`, color: '#2563eb' },
    { label: 'Tarjeta', value: `$${Number(reporte.totalTarjeta).toFixed(2)}`, color: '#0891b2' },
    { label: 'Mesas atendidas', value: reporte.mesasAtendidas, color: '#16a34a' },
  ];

  return (
    <div>
      {/* Selector de periodo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {PERIODO_OPTS.map(opt => (
          <button key={opt.dias} onClick={() => setDias(opt.dias)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer',
              background: dias === opt.dias ? '#7c3aed' : '#f1f5f9',
              color: dias === opt.dias ? 'white' : '#475569' }}>
            {opt.label}
          </button>
        ))}
        <span style={{ alignSelf: 'center', fontSize: 13, color: '#9ca3af', marginLeft: 8 }}>
          {reporte.desde} → {reporte.hasta}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flexWrap: 'wrap' }}>
        {/* Platillos más vendidos */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Platillos más vendidos</h3>
          {(reporte.platillosMasVendidos || []).length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(reporte.platillosMasVendidos || []).map((p, idx) => (
                <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: 13, flexShrink: 0,
                    background: idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#f97316' : '#d1d5db' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{p.cantidad} vendidos</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: 14 }}>${Number(p.total).toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ventas por mesero */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Desempeño por mesero</h3>
          {(reporte.ventasPorMesero || []).length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(reporte.ventasPorMesero || []).map(m => (
                <div key={m.mesero} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.mesero}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{m.mesas} {m.mesas === 1 ? 'mesa' : 'mesas'}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: 16 }}>${Number(m.total).toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'crear' | usuario (para editar)
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` };

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/Usuarios`, { headers: authHeaders });
      if (!res.ok) throw new Error('Error al cargar usuarios');
      setUsuarios(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.token]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const openCrear = () => {
    setForm(emptyForm);
    setModal('crear');
  };

  const openEditar = (u) => {
    setForm({ nombreCompleto: u.nombreCompleto, username: u.username, password: '', rol: u.rol, activo: u.activo });
    setModal(u);
  };

  const closeModal = () => { setModal(null); setError(''); };

  const handleSave = async () => {
    if (!form.nombreCompleto.trim() || !form.username.trim() || !form.rol) {
      setError('Nombre, usuario y rol son obligatorios.');
      return;
    }
    if (modal === 'crear' && !form.password.trim()) {
      setError('La contraseña es obligatoria al crear un usuario.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (modal === 'crear') {
        const res = await fetch(`${API}/api/Usuarios`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ nombreCompleto: form.nombreCompleto, username: form.username, passwordHash: form.password, rol: form.rol, activo: true })
        });
        if (!res.ok) throw new Error('Error al crear usuario');
      } else {
        const body = { id: modal.id, nombreCompleto: form.nombreCompleto, username: form.username, passwordHash: form.password, rol: form.rol, activo: form.activo };
        const res = await fetch(`${API}/api/Usuarios/${modal.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Error al actualizar usuario');
      }
      closeModal();
      fetchUsuarios();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u) => {
    try {
      if (u.activo) {
        await fetch(`${API}/api/Usuarios/${u.id}`, { method: 'DELETE', headers: authHeaders });
      } else {
        await fetch(`${API}/api/Usuarios/${u.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ id: u.id, nombreCompleto: u.nombreCompleto, username: u.username, passwordHash: '', rol: u.rol, activo: true })
        });
      }
      fetchUsuarios();
    } catch {
      setError('Error al cambiar estado del usuario');
    }
  };

  const rolColor = { Admin: '#7c3aed', Mesero: '#2563eb', Cocina: '#16a34a', Barra: '#0891b2', Cajero: '#d97706' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header title="Administración" />

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        {[{ id: 'usuarios', label: 'Usuarios' }, { id: 'reportes', label: 'Reportes' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, maxWidth: 200, padding: '14px 24px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: activeTab === t.id ? '#7c3aed' : 'white',
              color: activeTab === t.id ? 'white' : '#6b7280' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>

        {activeTab === 'reportes' && <Reportes token={user.token} />}

        {activeTab === 'usuarios' && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Gestión de Usuarios</h2>
          <button onClick={openCrear}
            style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            + Nuevo Usuario
          </button>
        </div>

        {error && !modal && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '60px 0' }}>Cargando usuarios...</p>
        ) : (
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Nombre', 'Usuario', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9', opacity: u.activo ? 1 : 0.5 }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{u.nombreCompleto}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontFamily: 'monospace' }}>{u.username}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: rolColor[u.rol] || '#6b7280', color: 'white', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: u.activo ? '#dcfce7' : '#f1f5f9', color: u.activo ? '#16a34a' : '#9ca3af', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEditar(u)}
                          style={{ background: '#e0e7ff', color: '#3730a3', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          Editar
                        </button>
                        <button onClick={() => toggleActivo(u)}
                          style={{ background: u.activo ? '#fee2e2' : '#dcfce7', color: u.activo ? '#dc2626' : '#16a34a', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>)}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {modal === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nombre completo</label>
                <input value={form.nombreCompleto} onChange={e => setForm(f => ({ ...f, nombreCompleto: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Usuario</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Ej: juan.perez"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Contraseña {modal !== 'crear' && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(dejar vacío para no cambiar)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={modal === 'crear' ? 'Contraseña' : '••••••••'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rol</label>
                <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', background: 'white' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {modal !== 'crear' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                    style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  Usuario activo
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={closeModal}
                style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1.5px solid #d1d5db', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: saving ? '#93c5fd' : '#2563eb', color: 'white', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
