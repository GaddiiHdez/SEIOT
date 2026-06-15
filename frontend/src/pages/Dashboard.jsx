import { apiFetch } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardList, CheckSquare, AlertTriangle, FileSignature, LogOut, Search, PlusCircle, User, MapPin, CheckCircle, Lock, Settings, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoGobierno from '../assets/logo-gobierno.jpg'; 

const Dashboard = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const puedeVerOtros = usuario?.es_admin || usuario?.permisos?.ver_visitas_otros;
  const puedeCrearVisita = usuario?.es_admin || usuario?.rol !== 'vista';

  // Verificar sesión activa al montar y bloquear historial
  useEffect(() => {
    const token = localStorage.getItem('seiot_token');
    if (!token || !usuario) {
      window.location.replace('/login');
      return;
    }
    // Bloquear navegación hacia atrás
    window.history.pushState(null, '', window.location.href);
    const bloquear = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', bloquear);
    return () => window.removeEventListener('popstate', bloquear);
  }, [usuario, navigate]);
  
  const visitaGuardada = JSON.parse(localStorage.getItem('visitaActiva') || 'null');

  const [psgInput, setPsgInput] = useState(visitaGuardada ? visitaGuardada.psg : '');
  const [datosPsg, setDatosPsg] = useState(visitaGuardada ? visitaGuardada.datosPsg : null);
  const [folioActivo, setFolioActivo] = useState(visitaGuardada ? visitaGuardada.folio : '');
  const [avance, setAvance] = useState(visitaGuardada?.avance || { modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false });
  const [busquedaFolio, setBusquedaFolio] = useState('');
  const [supervisores, setSupervisores] = useState([]);
  const [supervisorSeleccionado, setSupervisorSeleccionado] = useState(visitaGuardada ? visitaGuardada.datosSupervisor : null);

  useEffect(() => {
    apiFetch('/api/psg/supervisores')
      .then(res => res.json())
      .then(data => setSupervisores(data))
      .catch(err => console.error('Error cargando supervisores:', err));
  }, []);

  const handlePsgChange = async (e) => {
    const valor = e.target.value.toUpperCase();
    setPsgInput(valor);
    if (valor.length < 10) { setDatosPsg(null); return; }
    try {
      const response = await apiFetch(`/api/psg/buscar/${valor.trim()}`);
      if (response.ok) {
        const datos = await response.json();
        setDatosPsg({ psg: datos.psg, nombre_titular: datos.razon_social, representante: datos.representante, localidad: datos.localidad, municipio: datos.municipio, domicilio: datos.domicilio, estado: datos.estado || 'NAYARIT', tipo_psg: datos.tipo_psg, telefono: datos.telefono, latitud: datos.latitud, longitud: datos.longitud, capacidad_maxima_bovinos: datos.capacidad_maxima_bovinos, tipo_identificacion: datos.tipo_identificacion || '', numero_identificacion: datos.numero_identificacion || '', expedida_por: datos.expedida_por || '' });
      } else { setDatosPsg(null); }
    } catch (error) { setDatosPsg(null); }
  };

  const handleSupervisorChange = (e) => {
    const id = parseInt(e.target.value);
    const encontrado = supervisores.find(s => s.id === id);
    setSupervisorSeleccionado(encontrado || null);
  };

  const guardarContextoGlobal = (folio, psgData, visitaId, datosSup) => {
    const contexto = {
      folio, psg: psgData.psg, datosPsg: psgData,
      fecha: new Date().toLocaleDateString('es-MX'),
      supervisor: datosSup.nombre, datosSupervisor: datosSup,
      visita_id: visitaId,
      avance: { modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false },
      respuestas: {}
    };
    localStorage.setItem('visitaActiva', JSON.stringify(contexto));
    setAvance(contexto.avance);
  };

  // ⚙ MODO PRUEBA - Eliminar en producción
  const simularAvanceCompleto = () => {
    const visitaActiva = JSON.parse(localStorage.getItem('visitaActiva') || 'null');
    if (!visitaActiva) { alert("Primero inicia una visita."); return; }
    const avanceCompleto = { modulo1: true, modulo2: true, modulo3: true, modulo4: true, modulo5: true, modulo6: true };
    const contextoActualizado = { ...visitaActiva, avance: avanceCompleto };
    localStorage.setItem('visitaActiva', JSON.stringify(contextoActualizado));
    setAvance(avanceCompleto);
  };

  const handleNuevaVisita = async () => {
    if (!supervisorSeleccionado) { alert("Por favor selecciona un supervisor."); return; }
    const random = Math.floor(Math.random() * 900) + 100;
    const nuevoFolio = `SDR/${psgInput}/2026/${random}`;
    try {
      const response = await apiFetch('/api/psg/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio: nuevoFolio, psg: psgInput, supervisor: supervisorSeleccionado.nombre })
      });
      const visita = await response.json();
      setFolioActivo(nuevoFolio);
      setBusquedaFolio('');
      guardarContextoGlobal(nuevoFolio, datosPsg, visita.id, supervisorSeleccionado);
      alert(`VISITA INICIADA.\nFolio: ${nuevoFolio}`);
    } catch (error) { console.error('Error creando visita:', error); }
  };

  const handleBuscarVisita = async () => {
    try {
      const response = await apiFetch(`/api/psg/visitas/buscar?folio=${encodeURIComponent(busquedaFolio.trim().toUpperCase())}`);
      if (response.ok) {
        const visitaEncontrada = await response.json();
        setFolioActivo(visitaEncontrada.folio);
        setDatosPsg(visitaEncontrada.datosPsg);
        setPsgInput(visitaEncontrada.psg);
        setSupervisorSeleccionado(visitaEncontrada.datosSupervisor);
        const avanceRecuperado = visitaEncontrada.avance || { modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false };
        localStorage.setItem('visitaActiva', JSON.stringify(visitaEncontrada));
        setAvance(avanceRecuperado);
        alert(`Expediente recuperado:\n${visitaEncontrada.folio}`);
      } else if (response.status === 403) {
        alert('No tienes permiso para ver visitas de otros usuarios.');
      } else { alert("No se encontró ese folio."); }
    } catch (error) { alert("No se encontró ese folio."); }
  };

  const tienePermiso = (mod) => usuario?.es_admin || usuario?.permisos?.[mod];
  const esVista = usuario?.rol === 'vista';

  const modulos = [
    { id: 1, nombre: "Oficio de Notificación", ruta: "/modulo1", icono: <FileText size={32} />, color: avance.modulo1 ? "bg-green-600" : "bg-blue-600", bloqueado: esVista ? !avance.modulo1 : !tienePermiso('modulo1'), completado: avance.modulo1 },
    { id: 2, nombre: "Orden de Supervisión", ruta: "/modulo2", icono: <ClipboardList size={32} />, color: avance.modulo2 ? "bg-green-600" : "bg-blue-600", bloqueado: esVista ? !avance.modulo2 : (!tienePermiso('modulo2') || !avance.modulo1), completado: avance.modulo2 },
    { id: 3, nombre: "Lista de Verificación", ruta: "/modulo3", icono: <CheckSquare size={32} />, color: avance.modulo3 ? "bg-green-600" : "bg-blue-600", bloqueado: esVista ? !avance.modulo3 : (!tienePermiso('modulo3') || !avance.modulo2), completado: avance.modulo3 },
    { id: 4, nombre: "Acta de Hechos", ruta: "/modulo4", icono: <AlertTriangle size={32} />, color: avance.modulo4 ? "bg-green-600" : "bg-blue-600", bloqueado: esVista ? !avance.modulo4 : (!tienePermiso('modulo4') || !avance.modulo3), completado: avance.modulo4 },
    { id: 5, nombre: "Acta de Supervisión", ruta: "/modulo5", icono: <FileSignature size={32} />, color: avance.modulo5 ? "bg-green-600" : "bg-blue-600", bloqueado: esVista ? !avance.modulo5 : (!tienePermiso('modulo5') || !avance.modulo4), completado: avance.modulo5 },
    { id: 6, nombre: "Acta Circunstanciada", ruta: "/modulo6", icono: <FileText size={32} />, color: avance.modulo6 ? "bg-green-600" : "bg-blue-600", bloqueado: esVista ? !avance.modulo6 : (!tienePermiso('modulo6') || !avance.modulo5), completado: avance.modulo6 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-red-900 text-white px-6 py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-lg shadow-sm">
            <img src={logoGobierno} alt="Logo" className="h-10 object-contain" />
          </div>
          <div><h1 className="font-bold text-xl leading-tight">SEIOT</h1><p className="text-xs text-red-200 tracking-wider">MÓDULO DE SUPERVISIÓN</p></div>
        </div>
        {(usuario?.es_admin || usuario?.permisos?.panel_admin) && (
          <button onClick={() => navigate('/admin/usuarios')} className="flex items-center gap-2 text-sm bg-yellow-500 text-yellow-900 px-4 py-2 rounded hover:bg-yellow-400 font-bold transition-colors">
            <Users size={16} /> Usuarios
          </button>
        )}
        <span className="text-white/80 text-sm hidden md:block">
          Hola, <span className="font-bold text-white">{usuario?.nombre}</span>
        </span>
        <button onClick={() => { logout(); window.location.replace('/login'); }} className="flex items-center gap-2 text-sm bg-red-800 px-4 py-2 rounded hover:bg-red-700 transition-colors"><LogOut size={16} /> Salir</button>
      </nav>

      <div className="max-w-7xl mx-auto p-6">

        {/* --- ZONA 1: IDENTIFICACIÓN DEL PSG --- */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-t-4 border-blue-600">
          <h2 className="text-gray-700 font-bold mb-4">1. IDENTIFICACIÓN DEL PSG</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ingrese Clave PSG:</label>
              <div className="flex items-center gap-2 bg-white p-2 rounded border-2 border-blue-100 focus-within:border-blue-500 transition-colors">
                <MapPin size={20} className="text-blue-600" />
                <input type="text" value={psgInput} onChange={handlePsgChange} placeholder="Ej: 18-017-0002-P02" disabled={!!folioActivo} className={`bg-transparent font-bold text-gray-800 w-full outline-none text-lg uppercase ${folioActivo ? 'cursor-not-allowed opacity-70' : ''}`} />
                {folioActivo && <Lock size={16} className="text-gray-400" />}
              </div>
              {datosPsg && (
                <div className="mt-2 flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  <CheckCircle size={16} />
                  <span className="text-xs font-bold">TITULAR: {datosPsg.nombre_titular}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Supervisor:</label>
              {folioActivo ? (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border border-gray-200">
                  <User size={20} className="text-gray-500" />
                  <span className="font-bold text-gray-700 text-sm">{supervisorSeleccionado?.nombre || '...'}</span>
                </div>
              ) : (
                <select onChange={handleSupervisorChange} defaultValue="" className="w-full p-2 border-2 border-blue-100 rounded text-sm font-bold text-gray-700 outline-none focus:border-blue-500">
                  <option value="" disabled>-- Selecciona un supervisor --</option>
                  {supervisores.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              )}
              {supervisorSeleccionado && !folioActivo && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                  <span className="font-bold">Cargo:</span> {supervisorSeleccionado.cargo} | <span className="font-bold">Adscripción:</span> {supervisorSeleccionado.adscripcion}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- ZONA 2: GESTIÓN DE VISITA --- */}
        {datosPsg && !folioActivo && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-t-4 border-green-600">
            <h2 className="text-gray-700 font-bold mb-4">2. GESTIÓN DE LA VISITA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                {puedeCrearVisita ? (
                  <button onClick={handleNuevaVisita} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded shadow hover:bg-green-700 flex items-center justify-center gap-2"><PlusCircle size={20} /> GENERAR NUEVO FOLIO</button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-400 font-bold py-3 px-4 rounded border border-gray-200 flex items-center justify-center gap-2 text-sm">
                    <PlusCircle size={20} /> Sin permiso para crear visitas
                  </div>
                )}
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex gap-2">
                <input type="text" value={busquedaFolio} onChange={(e) => setBusquedaFolio(e.target.value)} placeholder="Ej: SDR/180170002P02/2026/999" className="flex-1 border border-gray-300 rounded px-3 text-sm outline-none font-mono" />
                <button onClick={handleBuscarVisita} className="bg-blue-800 text-white px-4 rounded hover:bg-blue-900"><Search size={18} /></button>
              </div>
            </div>
          </div>
        )}

        {/* --- ZONA 3: MÓDULOS --- */}
        {folioActivo && (
          <div className="animate-fade-in">
            <div className="bg-yellow-50 rounded-xl shadow-sm p-4 mb-6 border border-yellow-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-full text-yellow-700"><FileText size={20} /></div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Folio Activo:</p>
                  <p className="text-xl font-mono text-red-700 font-bold">{folioActivo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* ⚙ MODO PRUEBA - Eliminar en producción */}
                <button
                  onClick={simularAvanceCompleto}
                  title="Modo Prueba: marca todos los módulos como completados"
                  className="flex items-center gap-1 text-xs bg-yellow-400 text-yellow-900 font-bold px-3 py-1 rounded hover:bg-yellow-500 transition-colors"
                >
                  <Settings size={13} /> SIMULAR AVANCE
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Deseas cerrar esta visita y buscar otra?")) {
                      setFolioActivo(''); setPsgInput(''); setDatosPsg(null); setSupervisorSeleccionado(null);
                      setAvance({ modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false });
                      localStorage.removeItem('visitaActiva');
                    }
                  }}
                  className="text-xs text-gray-500 underline hover:text-red-700 font-bold"
                >
                  Cerrar Visita
                </button>
              </div>
            </div>

            <div className="transition-opacity duration-500">
              <h2 className="text-gray-700 font-bold text-lg mb-4 flex items-center gap-2"><ClipboardList className="text-red-900" />3. DOCUMENTACIÓN REQUERIDA</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulos.map((modulo, index) => (
                  <div key={index} onClick={() => !modulo.bloqueado && modulo.ruta !== '#' && navigate(modulo.ruta)}
                    className={`relative p-6 rounded-xl shadow-md text-white transition-all ${modulo.bloqueado ? 'bg-gray-300 cursor-not-allowed opacity-80' : `${modulo.color} cursor-pointer hover:shadow-xl hover:-translate-y-1`}`}
                  >
                    <div className="absolute top-4 right-4 bg-white/20 px-2 py-1 rounded text-[10px] font-bold">ETAPA 0{index + 1}</div>
                    <div className="mb-4 bg-white/10 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm">
                      {modulo.bloqueado ? <Lock size={24} className="text-gray-500" /> : modulo.icono}
                    </div>
                    <h3 className={`text-lg font-bold leading-tight ${modulo.bloqueado ? 'text-gray-500' : 'text-white'}`}>{modulo.nombre}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      {modulo.completado ? (
                        <span className="flex items-center gap-1 text-green-100 bg-green-700/30 px-2 py-1 rounded border border-green-400"><CheckCircle size={12} /> Completado</span>
                      ) : modulo.bloqueado ? (
                        <span className="text-gray-500 flex items-center gap-1"><Lock size={10} /> Bloqueado</span>
                      ) : (
                        <span className="opacity-80">Disponible</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;