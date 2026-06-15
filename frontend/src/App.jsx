import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;