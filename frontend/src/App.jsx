import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { apiFetch } from './utils/api.js';
import RutaProtegida from './components/RutaProtegida';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OficioNotificacion from './pages/Modulo1/OficioNotificacion';
import OrdenSupervision from './pages/Modulo2/OrdenSupervision';
import ListaVerificacion from './pages/Modulo3/ListaVerificacion';
import ActaHechos from './pages/Modulo4/ActaHechos';
import ActaSupervision from './pages/Modulo5/ActaSupervision';
import ActaCircunstanciada from './pages/Modulo6/ActaCircunstanciada';
import AdminUsuarios from './pages/Admin/AdminUsuarios';
import Consultas from './pages/Admin/Consultas';
import SuperAdminPanel from './pages/Admin/SuperAdminPanel';
import ManualUsuario from './pages/ManualUsuario';

const SyncManager = () => {
  useEffect(() => {
    const realizarSincronizacion = async () => {
      const queueRaw = localStorage.getItem('seiot_sync_queue');
      if (!queueRaw) return;
      let queue = [];
      try {
        queue = JSON.parse(queueRaw);
      } catch {
        return;
      }
      if (queue.length === 0) return;

      let exitos = 0;
      const nuevaCola = [];

      for (const item of queue) {
        try {
          const res = await apiFetch(item.endpoint, {
            ...item.options,
            isSyncing: true,
            headers: {
              ...item.options?.headers,
              'Authorization': `Bearer ${localStorage.getItem('seiot_token')}`
            }
          });
          if (res && res.ok) {
            exitos++;
          } else {
            nuevaCola.push(item);
          }
        } catch {
          nuevaCola.push(item);
        }
      }

      localStorage.setItem('seiot_sync_queue', JSON.stringify(nuevaCola));

      if (exitos > 0) {
        window.alert(`✅ ¡Conexión a Internet recuperada!\nSe sincronizaron con éxito ${exitos} formulario(s) pendiente(s) en el servidor.`);
      }
    };

    const handleOnline = () => {
      setTimeout(realizarSincronizacion, 1000);
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      realizarSincronizacion();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <SyncManager />
        <BrowserRouter>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas protegidas */}
          <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
          <Route path="/modulo1" element={<RutaProtegida><OficioNotificacion /></RutaProtegida>} />
          <Route path="/modulo2" element={<RutaProtegida><OrdenSupervision /></RutaProtegida>} />
          <Route path="/modulo3" element={<RutaProtegida><ListaVerificacion /></RutaProtegida>} />
          <Route path="/modulo4" element={<RutaProtegida><ActaHechos /></RutaProtegida>} />
          <Route path="/modulo5" element={<RutaProtegida><ActaSupervision /></RutaProtegida>} />
          <Route path="/modulo6" element={<RutaProtegida><ActaCircunstanciada /></RutaProtegida>} />
          <Route path="/admin/usuarios" element={<RutaProtegida><AdminUsuarios /></RutaProtegida>} />
          <Route path="/admin/consultas" element={<RutaProtegida><Consultas /></RutaProtegida>} />
          <Route path="/admin/super" element={<RutaProtegida><SuperAdminPanel /></RutaProtegida>} />
          <Route path="/manual" element={<RutaProtegida><ManualUsuario /></RutaProtegida>} />
        </Routes>
      </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;