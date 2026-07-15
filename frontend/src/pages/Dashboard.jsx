import { apiFetch } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, ClipboardList, CheckSquare, AlertTriangle, FileSignature, LogOut, Search, PlusCircle, User, MapPin, CheckCircle, Lock, Settings, Users, BarChart2, FileCheck, ArrowLeft, X, MoreVertical, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoGobierno from '../assets/logo-gobierno.jpg'; 

import { generarPdfModulo1 } from '../utils/generarPdfModulo1';
import { generarPdfModulo2 } from '../utils/generarPdfModulo2';
import { generarPdfModulo3 } from '../utils/generarPdfModulo3';
import { generarPdfModulo4 } from '../utils/generarPdfModulo4';
import { generarPdfModulo5 } from '../utils/generarPdfModulo5';
import { generarPdfModulo6 } from '../utils/generarPdfModulo6'; 
import Navbar from '../components/Navbar'; 

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout, permisosListos } = useAuth();
  const puedeVerOtros = usuario?.es_admin || usuario?.permisos?.ver_visitas_otros;
  const puedeCrearVisita = usuario?.es_admin || usuario?.rol !== 'vista';
  const puedeConsultas = usuario?.es_admin || usuario?.permisos?.consultas;

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
  const [pdfs, setPdfs] = useState({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [descargandoTodos, setDescargandoTodos] = useState(false);
  const [busquedaFolio, setBusquedaFolio] = useState('');
  const [supervisores, setSupervisores] = useState([]);
  const [supervisorSeleccionado, setSupervisorSeleccionado] = useState(visitaGuardada ? visitaGuardada.datosSupervisor : null);

  useEffect(() => {
    apiFetch('/api/psg/supervisores')
      .then(res => res.json())
      .then(data => setSupervisores(data))
      .catch(err => console.error('Error cargando supervisores:', err));
  }, []);

  // ─── CONSULTAR PDFs AL CARGAR VISITA ─────────────────────────────────────
  const visitaId = JSON.parse(localStorage.getItem('visitaActiva') || 'null')?.visita_id;
  useEffect(() => {
    if (!visitaId) return;

    const consultarPdfs = async () => {
      const resultados = {};
      await Promise.all([1, 2, 3, 4, 5, 6].map(async (modulo) => {
        try {
          const response = await apiFetch(`/api/modulos/firmado/${visitaId}/${modulo}`);
          if (response.ok) {
            const data = await response.json();
            resultados[modulo] = data.existe ? data.documento : null;
          } else {
            resultados[modulo] = null;
          }
        } catch {
          resultados[modulo] = null;
        }
      }));
      setPdfs(resultados);
    };

    consultarPdfs();
  }, [visitaId]);

  // Cerrar menú al hacer clic en cualquier parte de la pantalla
  useEffect(() => {
    const cerrar = () => setMenuAbierto(null);
    window.addEventListener('click', cerrar);
    return () => window.removeEventListener('click', cerrar);
  }, []);


  const formatPsg = (rawVal) => {
    const cleaned = rawVal.replace(/[^A-Za-z0-9]/g, '').slice(0, 12).toUpperCase();
    let formatted = '';
    if (cleaned.length > 0) {
      formatted += cleaned.slice(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += '-' + cleaned.slice(2, 5);
    }
    if (cleaned.length > 5) {
      formatted += '-' + cleaned.slice(5, 9);
    }
    if (cleaned.length > 9) {
      formatted += '-' + cleaned.slice(9, 12);
    }
    return formatted;
  };

  const handlePsgChange = async (e) => {
    const formatted = formatPsg(e.target.value);
    setPsgInput(formatted);
    if (formatted.length < 15) { setDatosPsg(null); return; }
    try {
      const response = await apiFetch(`/api/psg/buscar/${formatted.trim()}`);
      if (response.ok) {
        const datos = await response.json();
        setDatosPsg({ psg: datos.psg, nombre_titular: datos.razon_social, representante: datos.representante, localidad: datos.localidad, municipio: datos.municipio, domicilio: datos.domicilio, estado: datos.estado || 'NAYARIT', tipo_psg: datos.tipo_psg, telefono: datos.telefono, latitud: datos.latitud, longitud: datos.longitud, capacidad_maxima_bovinos: datos.capacidad_maxima_bovinos, tipo_identificacion: datos.tipo_identificacion || '', numero_identificacion: datos.numero_identificacion || '', expedida_por: datos.expedida_por || '' });
      } else { 
        setDatosPsg(null); 
        alert("⚠️ La clave PSG ingresada no existe o no se encuentra registrada en la base de datos.");
      }
    } catch (error) { 
      setDatosPsg(null); 
      alert("⚠️ La clave PSG ingresada no existe o no se encuentra registrada en la base de datos.");
    }
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

  const descargarPdf = async (moduloId) => {
    try {
      let datosGuardados = null;
      try {
        const res = await apiFetch(`/api/modulos/modulo${moduloId}/${visitaId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.existe) {
            datosGuardados = data.datos;
            if (moduloId === 3 && data.checklist) {
              const respuestas = {};
              const recomendaciones = {};
              data.checklist.forEach(item => {
                respuestas[`p${item.pregunta_id}`] = item.respuesta;
                if (item.observacion) recomendaciones[`p${item.pregunta_id}`] = item.observacion;
              });
              datosGuardados.respuestas = respuestas;
              datosGuardados.recomendaciones = recomendaciones;
            }
          }
        }
      } catch (err) {
        console.error(`Error al intentar cargar datos para PDF del modulo ${moduloId}:`, err);
      }

      const contexto = JSON.parse(localStorage.getItem('visitaActiva'));
      if (!contexto) return;

      let payload = {};
      if (moduloId === 1) {
        payload = {
          oficio_no: datosGuardados?.oficio_no || `SDR/OF/${contexto.folio.split('/').pop() || ''}`,
          fecha_emision: datosGuardados?.fecha_emision || new Date(),
          nombre_psg: contexto.datosPsg?.nombre_titular || '',
          domicilio: contexto.datosPsg?.domicilio || '',
          nombre_servidor: contexto.datosSupervisor?.nombre || '',
          cargo_servidor: contexto.datosSupervisor?.cargo || '',
        };
        await generarPdfModulo1(payload);
      } else if (moduloId === 2) {
        payload = {
          oficio_no: datosGuardados?.oficio_no || `SDR/ORD/${contexto.folio.split('/').pop() || ''}`,
          fecha: datosGuardados?.fecha || contexto.fecha || '',
          nombre_psg: contexto.datosPsg?.nombre_titular || '',
          domicilio: contexto.datosPsg?.domicilio || '',
          calidad_sujeto: datosGuardados?.calidad_sujeto || contexto.datosPsg?.tipo_psg || '',
          nombre_pc: datosGuardados?.nombre_pc || contexto.datosSupervisor?.nombre || '',
          cargo_pc: datosGuardados?.cargo_pc || contexto.datosSupervisor?.cargo || '',
          adscripcion: datosGuardados?.adscripcion || contexto.datosSupervisor?.adscripcion || '',
          nombre_ordena: datosGuardados?.nombre_ordena || '',
        };
        await generarPdfModulo2(payload);
      } else if (moduloId === 3) {
        payload = {
          fecha: datosGuardados?.fecha || contexto.fecha || '',
          nombre_psg: datosGuardados?.nombre_psg || contexto.datosPsg?.nombre_titular || '',
          tipo_psg: datosGuardados?.tipo_psg || contexto.datosPsg?.tipo_psg || '',
          nombre_titular: datosGuardados?.nombre_titular || contexto.datosPsg?.representante || '',
          telefono: datosGuardados?.telefono || contexto.datosPsg?.telefono || '',
          municipio: datosGuardados?.municipio || contexto.datosPsg?.municipio || '',
          localidad: datosGuardados?.localidad || contexto.datosPsg?.localidad || '',
          latitud: datosGuardados?.latitud !== undefined && datosGuardados.latitud !== null ? datosGuardados.latitud : (contexto.datosPsg?.latitud || ''),
          longitud: datosGuardados?.longitud !== undefined && datosGuardados.longitud !== null ? datosGuardados.longitud : (contexto.datosPsg?.longitud || ''),
          cabezas: datosGuardados?.capacidad_instalada !== undefined && datosGuardados.capacidad_instalada !== null ? datosGuardados.capacidad_instalada : (contexto.datosPsg?.capacidad_maxima_bovinos || ''),
          nombre_supervisor: datosGuardados?.nombre_supervisor || contexto.datosSupervisor?.nombre || '',
          hora_inicio: datosGuardados?.hora_inicio || '',
          hora_termino: datosGuardados?.hora_termino || '',
          respuestas: datosGuardados?.respuestas || {},
          recomendaciones: datosGuardados?.recomendaciones || {},
          observaciones: datosGuardados?.observaciones || '',
          cumple: datosGuardados?.cumple || false,
          presenta_observaciones: datosGuardados?.presenta_observaciones || false,
          requiere_seguimiento: datosGuardados?.requiere_seguimiento || false,
          responsable_psg: datosGuardados?.responsable_psg || contexto.datosPsg?.nombre_titular || '',
          responsable_supervisor: datosGuardados?.responsable_supervisor || contexto.datosSupervisor?.nombre || '',
          nombre_testigo: datosGuardados?.nombre_testigo || '',
        };
        await generarPdfModulo3(payload);
      } else if (moduloId === 4) {
        payload = {
          acta_no: datosGuardados?.acta_no || '',
          folio: contexto.folio,
          localidad: datosGuardados?.localidad || contexto.datosPsg?.localidad || '',
          municipio: datosGuardados?.municipio || contexto.datosPsg?.municipio || '',
          fecha: datosGuardados?.fecha || contexto.fecha || '',
          hora: datosGuardados?.hora || '',
          nombre_supervisor: datosGuardados?.nombre_supervisor || contexto.datosSupervisor?.nombre || '',
          nombre_psg: datosGuardados?.nombre_psg || contexto.datosPsg?.nombre_titular || '',
          tipo_psg: datosGuardados?.tipo_psg || contexto.datosPsg?.tipo_psg || '',
          nombre_titular: datosGuardados?.nombre_titular || contexto.datosPsg?.representante || '',
          domicilio: datosGuardados?.domicilio || contexto.datosPsg?.domicilio || '',
          telefono: datosGuardados?.telefono || contexto.datosPsg?.telefono || '',
          hora_inicio: datosGuardados?.hora_inicio || '',
          hora_termino: datosGuardados?.hora_termino || '',
          hechos_observados: datosGuardados?.hechos_observados || '',
          no_realizo_manifestaciones: datosGuardados?.no_realizo_manifestaciones || false,
          manifestaciones: datosGuardados?.manifestaciones || '',
          nombre_testigo: datosGuardados?.nombre_testigo || '',
          domicilio_testigo: datosGuardados?.domicilio_testigo || '',
          nombre_testigo_cierre: datosGuardados?.nombre_testigo_cierre || '',
        };
        await generarPdfModulo4(payload);
      } else if (moduloId === 5) {
        payload = {
          acta_no: datosGuardados?.acta_no || '',
          folio: contexto.folio,
          localidad: datosGuardados?.localidad || contexto.datosPsg?.localidad || '',
          municipio: datosGuardados?.municipio || contexto.datosPsg?.municipio || '',
          fecha: datosGuardados?.fecha || contexto.fecha || '',
          hora: datosGuardados?.hora || '',
          nombre_supervisor: datosGuardados?.nombre_supervisor || contexto.datosSupervisor?.nombre || '',
          nombre_psg: datosGuardados?.nombre_psg || contexto.datosPsg?.nombre_titular || '',
          tipo_psg: datosGuardados?.tipo_psg || contexto.datosPsg?.tipo_psg || '',
          nombre_titular: datosGuardados?.nombre_titular || contexto.datosPsg?.representante || '',
          domicilio: datosGuardados?.domicilio || contexto.datosPsg?.domicilio || '',
          telefono: datosGuardados?.telefono || contexto.datosPsg?.telefono || '',
          hora_inicio: datosGuardados?.hora_inicio || '',
          hora_termino: datosGuardados?.hora_termino || '',
          acta_hechos: datosGuardados?.acta_hechos || false,
          otros_documentos: datosGuardados?.otros_documentos || '',
          cumple: datosGuardados?.cumple || false,
          presenta_observaciones: datosGuardados?.presenta_observaciones || false,
          requiere_seguimiento: datosGuardados?.requiere_seguimiento || false,
          observaciones_detectadas: datosGuardados?.observaciones_detectadas || '',
          medidas_preventivas: datosGuardados?.medidas_preventivas || '',
          no_realizo_manifestaciones: datosGuardados?.no_realizo_manifestaciones || false,
          manifestaciones: datosGuardados?.manifestaciones || '',
          nombre_testigo: datosGuardados?.nombre_testigo || '',
        };
        await generarPdfModulo5(payload);
      } else if (moduloId === 6) {
        payload = {
          acta_no: datosGuardados?.acta_no || '',
          folio: contexto.folio,
          establecimiento: datosGuardados?.establecimiento || contexto.datosPsg?.nombre_titular || '',
          clave_psg: datosGuardados?.clave_psg || contexto.datosPsg?.psg || '',
          ubicacion: datosGuardados?.ubicacion || contexto.datosPsg?.domicilio || '',
          localidad: datosGuardados?.localidad || contexto.datosPsg?.localidad || '',
          municipio: datosGuardados?.municipio || contexto.datosPsg?.municipio || '',
          estado: datosGuardados?.estado || contexto.datosPsg?.estado || 'NAYARIT',
          nombre_oficial: datosGuardados?.nombre_oficial || contexto.datosSupervisor?.nombre || '',
          tipo_id_responsable: datosGuardados?.tipo_id_responsable || contexto.datosPsg?.tipo_identificacion || '',
          numero_id_responsable: datosGuardados?.numero_id_responsable || contexto.datosPsg?.numero_identificacion || '',
          id_expedida_por: datosGuardados?.id_expedida_por || contexto.datosPsg?.expedida_por || '',
          fecha_expedicion_id: datosGuardados?.fecha_expedicion_id || '',
          ubicacion_compareciente: datosGuardados?.ubicacion_compareciente || contexto.datosPsg?.domicilio || '',
          credencial_oficial_no: datosGuardados?.credencial_oficial_no || contexto.datosSupervisor?.credencial_oficial || '',
          nombre_testigo1: datosGuardados?.nombre_testigo1 || '',
          domicilio_testigo1: datosGuardados?.domicilio_testigo1 || '',
          nombre_testigo2: datosGuardados?.nombre_testigo2 || '',
          domicilio_testigo2: datosGuardados?.domicilio_testigo2 || '',
          oficio_comision: datosGuardados?.oficio_comision || '',
          fecha_comision: datosGuardados?.fecha_comision || '',
          emite_comision: datosGuardados?.emite_comision || '',
          hechos_observaciones: datosGuardados?.hechos_observaciones || '',
          articulo1: datosGuardados?.articulo1 || '',
          de1: datosGuardados?.de1 || '',
          articulo2: datosGuardados?.articulo2 || '',
          de2: datosGuardados?.de2 || '',
          articulo3: datosGuardados?.articulo3 || '',
          de3: datosGuardados?.de3 || '',
          articulo4: datosGuardados?.articulo4 || '',
          de4: datosGuardados?.de4 || '',
          manifestaciones: datosGuardados?.manifestaciones || '',
          fecha_cierre: datosGuardados?.fecha_cierre || '',
          hora_cierre: datosGuardados?.hora_cierre || '',
        };
        await generarPdfModulo6(payload);
      }
    } catch (err) {
      console.error(`Error al descargar el modulo ${moduloId}:`, err);
      alert(`No se pudo generar el PDF del Módulo ${moduloId}.`);
    }
  };

  const descargarTodosPdfs = async () => {
    setDescargandoTodos(true);
    for (let i = 1; i <= 6; i++) {
      await descargarPdf(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setDescargandoTodos(false);
    alert("¡Los 6 formatos prellenados han sido descargados!");
  };

  const verPdfFirmado = async (moduloId) => {
    const docInfo = pdfs[moduloId];
    if (!docInfo || !docInfo.nombre_archivo) return;
    try {
      const res = await apiFetch(`/uploads/documentos_firmados/${docInfo.nombre_archivo}`);
      if (!res || !res.ok) {
        alert('No tienes permiso para ver este documento.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      alert('Error al obtener el documento.');
    }
  };

  const tienePermiso = (mod) => usuario?.es_admin || usuario?.permisos?.[mod];
  const esVista = usuario?.rol === 'vista';
  const desdeConsultas = localStorage.getItem('desdeConsultas') === 'true';

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
      <Navbar 
        folioActivo={folioActivo} 
        setFolioActivo={setFolioActivo} 
        setPsgInput={setPsgInput} 
        setDatosPsg={setDatosPsg} 
        setSupervisorSeleccionado={setSupervisorSeleccionado} 
        setAvance={setAvance} 
      />

      <div className="max-w-7xl mx-auto p-6">

        {/* --- ZONA 1: IDENTIFICACIÓN DEL PSG --- */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-t-4 border-blue-600">
          <h2 className="text-gray-700 font-bold mb-4">1. IDENTIFICACIÓN DEL PSG</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label htmlFor="psg-input" className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ingrese Clave PSG:</label>
              <div className="flex items-center gap-2 bg-white p-2 rounded border-2 border-blue-100 focus-within:border-blue-500 transition-colors">
                <MapPin size={20} className="text-blue-600" />
                <input id="psg-input" type="text" value={psgInput} onChange={handlePsgChange} placeholder="Ej: 18-017-0002-P02" disabled={!!folioActivo} className={`bg-transparent font-bold text-gray-800 w-full outline-none text-lg uppercase ${folioActivo ? 'cursor-not-allowed opacity-70' : ''}`} />
                {folioActivo && <Lock size={16} className="text-gray-400" />}
              </div>
              {datosPsg && (
                <div className="mt-2 flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  <CheckCircle size={16} />
                  <span className="text-xs font-bold">TITULAR: {datosPsg.nombre_titular}</span>
                </div>
              )}
            </div>

            {(!esVista || folioActivo) && <div>
              <label htmlFor="supervisor-select" className="block text-xs font-bold text-gray-500 mb-1 uppercase">Supervisor:</label>
              {folioActivo ? (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border border-gray-200">
                  <User size={20} className="text-gray-500" />
                  <span className="font-bold text-gray-700 text-sm">{supervisorSeleccionado?.nombre || '...'}</span>
                </div>
              ) : (
                <select id="supervisor-select" onChange={handleSupervisorChange} defaultValue="" className="w-full p-2 border-2 border-blue-100 rounded text-sm font-bold text-gray-700 outline-none focus:border-blue-500">
                  <option value="" disabled>-- Selecciona un supervisor --</option>
                  {supervisores.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              )}
              {supervisorSeleccionado && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                  <span className="font-bold">Cargo:</span> {supervisorSeleccionado.cargo} | <span className="font-bold">Adscripción:</span> {supervisorSeleccionado.adscripcion}
                </div>
              )}
            </div>}
          </div>
        </div>

        {/* --- ZONA 2: GESTIÓN DE VISITA --- */}
        {datosPsg && !folioActivo && !esVista && (
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
              <button 
                onClick={descargarTodosPdfs} 
                disabled={descargandoTodos}
                className="w-full md:w-auto bg-gradient-to-r from-red-700 to-red-900 text-white font-bold px-5 py-2.5 rounded-xl shadow hover:from-red-800 hover:to-red-950 flex items-center justify-center gap-2 text-xs tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} className={descargandoTodos ? "animate-spin" : ""} />
                {descargandoTodos ? "DESCARGANDO..." : "DESCARGAR LOS 6 FORMATOS PRELLENADOS"}
              </button>
            </div>

            <div className="transition-opacity duration-500">
              <h2 className="text-gray-700 font-bold text-lg mb-4 flex items-center gap-2"><ClipboardList className="text-red-900" />3. DOCUMENTACIÓN REQUERIDA</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulos.map((modulo, index) => (
                  <div key={index} onClick={() => !modulo.bloqueado && modulo.ruta !== '#' && navigate(modulo.ruta)}
                    className={`relative p-6 rounded-xl shadow-md text-white transition-all ${modulo.bloqueado ? 'bg-gray-300 cursor-not-allowed opacity-80' : `${modulo.color} cursor-pointer hover:shadow-xl hover:-translate-y-1`}`}
                  >
                    {/* Botón de Tres Puntos (Menú Contextual) */}
                    {!modulo.bloqueado && (
                      <div className="absolute top-3 right-2.5 z-30" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setMenuAbierto(menuAbierto === modulo.id ? null : modulo.id)} 
                          className="hover:bg-white/20 p-1.5 rounded-full transition-colors outline-none flex items-center justify-center active:scale-95"
                          title="Opciones de PDF"
                        >
                          <MoreVertical size={16} className="text-white" />
                        </button>
                        {menuAbierto === modulo.id && (
                          <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-48 text-slate-800 text-xs font-bold z-50 animate-scale-up">
                            <button 
                              onClick={() => { setMenuAbierto(null); descargarPdf(modulo.id); }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                              <Download size={14} className="text-slate-500" />
                              Descargar Prellenado
                            </button>
                            {pdfs[modulo.id] && (
                              <button 
                                onClick={() => { setMenuAbierto(null); verPdfFirmado(modulo.id); }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 transition-colors"
                              >
                                <FileCheck size={14} className="text-blue-500" />
                                Ver PDF Firmado
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`absolute top-4 ${modulo.bloqueado ? 'right-4' : 'right-10'} bg-white/20 px-2 py-1 rounded text-[10px] font-bold`}>ETAPA 0{index + 1}</div>
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
                      {pdfs[modulo.id] && (
                        <span className="flex items-center gap-1 text-blue-100 bg-blue-700/30 px-2 py-1 rounded border border-blue-300 ml-1" title="Tiene PDF firmado">
                          <FileCheck size={12} /> PDF
                        </span>
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