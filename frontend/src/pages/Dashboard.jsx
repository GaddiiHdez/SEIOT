import { apiFetch } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, ClipboardList, CheckSquare, AlertTriangle, FileSignature, LogOut, Search, PlusCircle, User, MapPin, CheckCircle, Lock, Settings, Users, BarChart2, FileCheck, ArrowLeft, X, MoreVertical, Download, Clock, Scale, Award, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoGobierno from '../assets/logo-gobierno.jpg'; 

import { generarPdfModulo1 } from '../utils/generarPdfModulo1';
import { generarPdfModulo2 } from '../utils/generarPdfModulo2';
import { generarPdfModulo3 } from '../utils/generarPdfModulo3';
import { generarPdfModulo4 } from '../utils/generarPdfModulo4';
import { generarPdfModulo5 } from '../utils/generarPdfModulo5';
import { generarPdfModulo6 } from '../utils/generarPdfModulo6'; 
import Navbar from '../components/Navbar';
import IdentificacionPsg from '../components/Dashboard/IdentificacionPsg';
import GestionVisita from '../components/Dashboard/GestionVisita';
import ProgresoVisita from '../components/Dashboard/ProgresoVisita';
import ModuloCard from '../components/Dashboard/ModuloCard';

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
  const [visitasRecientes, setVisitasRecientes] = useState([]);
  const [sugerenciasPsg, setSugerenciasPsg] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    try {
      const guardadas = JSON.parse(localStorage.getItem('seiot_visitas_recientes') || '[]');
      setVisitasRecientes(guardadas);
      
      const activa = JSON.parse(localStorage.getItem('visitaActiva') || 'null');
      if (activa) {
        let recientes = [...guardadas];
        recientes = recientes.filter(v => v.folio !== activa.folio);
        recientes.unshift({
          folio: activa.folio,
          datosPsg: activa.datosPsg,
          psg: activa.psg,
          datosSupervisor: activa.datosSupervisor,
          avance: activa.avance,
          estado_visita: activa.estado_visita,
          visita_id: activa.visita_id
        });
        recientes = recientes.slice(0, 4);
        localStorage.setItem('seiot_visitas_recientes', JSON.stringify(recientes));
        setVisitasRecientes(recientes);
      }
    } catch {
      setVisitasRecientes([]);
    }
  }, []);

  const agregarVisitaReciente = (nuevaVisita) => {
    let recientes = [];
    try {
      recientes = JSON.parse(localStorage.getItem('seiot_visitas_recientes') || '[]');
    } catch {
      recientes = [];
    }

    // Filtrar para mover al inicio si ya existe
    recientes = recientes.filter(v => v.folio !== nuevaVisita.folio);

    recientes.unshift({
      folio: nuevaVisita.folio,
      datosPsg: nuevaVisita.datosPsg,
      psg: nuevaVisita.psg,
      datosSupervisor: nuevaVisita.datosSupervisor,
      avance: nuevaVisita.avance,
      estado_visita: nuevaVisita.estado_visita,
      visita_id: nuevaVisita.visita_id
    });

    recientes = recientes.slice(0, 4);
    localStorage.setItem('seiot_visitas_recientes', JSON.stringify(recientes));
    setVisitasRecientes(recientes);
  };

  // Mantener sincronizado el historial de visitas con el avance y estado actuales de la sesión activa
  useEffect(() => {
    if (!folioActivo) return;
    const activa = JSON.parse(localStorage.getItem('visitaActiva') || 'null');
    if (activa && activa.folio === folioActivo) {
      agregarVisitaReciente(activa);
    }
  }, [avance, folioActivo]);

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

  // ─── CONSULTAR SEGUIMIENTO Y DICTAMEN DE LA VISITA ────────────────────────
  const [infoSeguimiento, setInfoSeguimiento] = useState(null);
  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState(false);
  const [atencionesSeguimiento, setAtencionesSeguimiento] = useState([]);
  const [cargandoAtenciones, setCargandoAtenciones] = useState(false);

  useEffect(() => {
    if (!visitaId) {
      setInfoSeguimiento(null);
      return;
    }

    const consultarSeguimiento = async () => {
      try {
        const res = await apiFetch(`/api/modulos/modulo3/${visitaId}`);
        if (res && res.ok) {
          const data = await res.json();
          if (data.existe && data.datos?.requiere_seguimiento) {
            setInfoSeguimiento(data.datos);
          } else {
            setInfoSeguimiento(null);
          }
        }
      } catch {
        setInfoSeguimiento(null);
      }
    };

    consultarSeguimiento();
  }, [visitaId]);

  const abrirModalSeguimiento = async () => {
    if (!visitaId) return;
    setModalSeguimientoAbierto(true);
    setCargandoAtenciones(true);
    try {
      const res = await apiFetch(`/api/modulos/seguimiento/visita/${visitaId}`);
      if (res && res.ok) {
        const data = await res.json();
        setAtencionesSeguimiento(data.atenciones || []);
      }
    } catch (err) {
      console.error('Error cargando atenciones:', err);
    } finally {
      setCargandoAtenciones(false);
    }
  };

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

    // Sugerencias: buscar si hay algo escrito pero todavía no es la clave completa
    if (formatted.length > 0 && formatted.length < 15) {
      try {
        const response = await apiFetch(`/api/psg/sugerencias?q=${encodeURIComponent(formatted)}`);
        if (response && response.ok) {
          const data = await response.json();
          setSugerenciasPsg(data);
          setMostrarSugerencias(data.length > 0);
        } else {
          setSugerenciasPsg([]);
          setMostrarSugerencias(false);
        }
      } catch {
        setSugerenciasPsg([]);
        setMostrarSugerencias(false);
      }
      return; // No buscar el PSG completo todavía
    }

    // Limpiar sugerencias cuando se borra o cuando la clave ya está completa
    setSugerenciasPsg([]);
    setMostrarSugerencias(false);

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

  const seleccionarPsgCompleto = (datos) => {
    if (!datos) return;
    setPsgInput(datos.psg);
    setDatosPsg({
      psg: datos.psg,
      nombre_titular: datos.razon_social,
      representante: datos.representante,
      localidad: datos.localidad,
      municipio: datos.municipio,
      domicilio: datos.domicilio,
      estado: datos.estado || 'NAYARIT',
      tipo_psg: datos.tipo_psg,
      telefono: datos.telefono,
      latitud: datos.latitud,
      longitud: datos.longitud,
      capacidad_maxima_bovinos: datos.capacidad_maxima_bovinos,
      tipo_identificacion: datos.tipo_identificacion || '',
      numero_identificacion: datos.numero_identificacion || '',
      expedida_por: datos.expedida_por || ''
    });
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
    if (!supervisorSeleccionado) { alert("Por favor selecciona un oficial."); return; }
    try {
      const response = await apiFetch('/api/psg/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psg: psgInput, supervisor: supervisorSeleccionado.nombre })
      });
      
      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Error al generar la visita.");
        return;
      }
      
      const visita = await response.json();
      const nuevoFolio = visita.folio;
      setFolioActivo(nuevoFolio);
      setBusquedaFolio('');
      guardarContextoGlobal(nuevoFolio, datosPsg, visita.id, supervisorSeleccionado);
      
      // Registrar visita en el historial
      agregarVisitaReciente({
        folio: nuevoFolio,
        datosPsg: datosPsg,
        psg: psgInput,
        datosSupervisor: supervisorSeleccionado,
        avance: { modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false },
        visita_id: visita.id
      });
      alert(`VISITA INICIADA.\nFolio: ${nuevoFolio}`);
    } catch (error) { 
      console.error('Error creando visita:', error); 
      alert("Error de conexión al intentar iniciar la visita.");
    }
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
        
        // Registrar visita en el historial
        agregarVisitaReciente(visitaEncontrada);
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
      if (!res) return;
      if (!res.ok) {
        if (res.status === 404) {
          alert('⚠️ El archivo físico no se encuentra disponible en el servidor. Por favor, vuelve a subir el PDF firmado correspondiente.');
        } else {
          alert('No tienes permiso para ver este documento o tu sesión ha expirado.');
        }
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
  const esFinalizada = JSON.parse(localStorage.getItem('visitaActiva') || 'null')?.estado_visita === 'finalizado';
  const modulosCompletados = esFinalizada ? 6 : Object.values(avance).filter(Boolean).length;
  const porcentajeAvance = esFinalizada ? 100 : Math.round((modulosCompletados / 6) * 100);

  const getTextoAvance = (av, esFin, complCount, pct) => {
    if (esFin) {
      const keys = ['modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5', 'modulo6'];
      let last = 0;
      keys.forEach((key, idx) => {
        if (av[key]) last = idx + 1;
      });
      return `Concluido en etapa ${last} (100%)`;
    }
    return `${complCount} de 6 etapas (${pct}%)`;
  };

  const getTextoAvanceCompacto = (vis) => {
    const isFin = vis.estado_visita === 'finalizado';
    const av = vis.avance || {};
    if (isFin) {
      const keys = ['modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5', 'modulo6'];
      let last = 0;
      keys.forEach((key, idx) => {
        if (av[key]) last = idx + 1;
      });
      return `Etapa ${last} (Concluido)`;
    }
    const count = Object.values(av).filter(Boolean).length;
    return `${count} / 6 etapas`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar 
        folioActivo={folioActivo} 
        setFolioActivo={setFolioActivo} 
        setPsgInput={setPsgInput} 
        setDatosPsg={setDatosPsg} 
        setSupervisorSeleccionado={setSupervisorSeleccionado} 
        setAvance={setAvance} 
        visitasRecientes={visitasRecientes}
        agregarVisitaReciente={agregarVisitaReciente}
      />

      <div className="max-w-7xl mx-auto p-6">

        {/* --- ZONA 1: IDENTIFICACIÓN DEL PSG --- */}
        <IdentificacionPsg
          psgInput={psgInput}
          handlePsgChange={handlePsgChange}
          folioActivo={folioActivo}
          datosPsg={datosPsg}
          esVista={esVista}
          supervisorSeleccionado={supervisorSeleccionado}
          handleSupervisorChange={handleSupervisorChange}
          supervisores={supervisores}
          seleccionarPsgCompleto={seleccionarPsgCompleto}
          sugerenciasPsg={sugerenciasPsg}
          mostrarSugerencias={mostrarSugerencias}
          setMostrarSugerencias={setMostrarSugerencias}
        />

        {/* --- ZONA 2: GESTIÓN DE VISITA --- */}
        <GestionVisita
          datosPsg={datosPsg}
          folioActivo={folioActivo}
          esVista={esVista}
          puedeCrearVisita={puedeCrearVisita}
          handleNuevaVisita={handleNuevaVisita}
          busquedaFolio={busquedaFolio}
          setBusquedaFolio={setBusquedaFolio}
          handleBuscarVisita={handleBuscarVisita}
        />

        {/* --- ZONA 3: MÓDULOS --- */}
        {folioActivo && (
          <div className="animate-fade-in space-y-6">
            {/* Banner de Seguimiento / Dictamen Institucional */}
            {infoSeguimiento && (
              <div className="bg-white rounded-2xl border-2 overflow-hidden shadow-xs transition-all border-amber-300">
                <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  visitaGuardada?.seguimiento_atendido || atencionesSeguimiento.length > 0
                    ? 'bg-emerald-50/70 border-b border-emerald-200' 
                    : 'bg-amber-50/70 border-b border-amber-200'
                }`}>
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      visitaGuardada?.seguimiento_atendido || atencionesSeguimiento.length > 0
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      <Scale size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-gray-800">
                          Seguimiento Institucional (Módulo 3)
                        </span>
                        {visitaGuardada?.seguimiento_atendido ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Dictamen: {visitaGuardada.dictamen_seguimiento || 'Solventado / Atendido'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            Pendiente de Dictamen
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Canalizado a: <strong className="text-red-950">{(infoSeguimiento.instancias_notificadas || []).join(', ') || 'Dependencias Oficiales'}</strong>
                        {visitaGuardada?.fecha_atencion_seguimiento && (
                          <span className="ml-2 text-gray-500 font-medium">· Dictaminado el {new Date(visitaGuardada.fecha_atencion_seguimiento).toLocaleDateString('es-MX')}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={abrirModalSeguimiento}
                    className="self-start sm:self-auto px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Eye size={14} /> Ver Resolución y Bitácora
                  </button>
                </div>
              </div>
            )}

            <ProgresoVisita
              folioActivo={folioActivo}
              descargandoTodos={descargandoTodos}
              descargarTodosPdfs={descargarTodosPdfs}
              avance={avance}
              esFinalizada={esFinalizada}
              modulosCompletados={modulosCompletados}
              porcentajeAvance={porcentajeAvance}
              getTextoAvance={getTextoAvance}
            />

            <div className="transition-opacity duration-500">
              <h2 className="text-gray-700 font-bold text-lg mb-4 flex items-center gap-2">
                <ClipboardList className="text-red-900" />
                3. DOCUMENTACIÓN REQUERIDA
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulos.map((modulo, index) => (
                  <ModuloCard
                    key={index}
                    modulo={modulo}
                    index={index}
                    navigate={navigate}
                    menuAbierto={menuAbierto}
                    setMenuAbierto={setMenuAbierto}
                    descargarPdf={descargarPdf}
                    verPdfFirmado={verPdfFirmado}
                    pdfs={pdfs}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Historial de Dictámenes y Resoluciones */}
      {modalSeguimientoAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-200 overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-red-950 to-red-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Scale size={20} className="text-[#BC955B]" />
                <div>
                  <h3 className="font-bold text-sm">Resolución y Bitácora de Seguimiento</h3>
                  <p className="text-xs text-red-200">Folio: {folioActivo}</p>
                </div>
              </div>
              <button
                onClick={() => setModalSeguimientoAbierto(false)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {cargandoAtenciones ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="w-8 h-8 border-3 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="font-semibold">Consultando bitácora de resoluciones...</p>
                </div>
              ) : atencionesSeguimiento.length === 0 ? (
                <div className="py-10 text-center text-gray-500 space-y-2">
                  <Clock size={32} className="mx-auto text-amber-500" />
                  <p className="font-bold text-gray-800 text-sm">Pendiente de Dictamen Oficial</p>
                  <p className="text-xs max-w-md mx-auto text-gray-500 leading-relaxed">
                    La visita fue remitida formalmente a las dependencias correspondientes ({(infoSeguimiento?.instancias_notificadas || []).join(', ')}). Aún no se ha capturado un dictamen formal o acuerdo de resolución en la bitácora.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {atencionesSeguimiento.map((at) => (
                    <div key={at.id} className="p-4 rounded-xl border border-gray-200 bg-slate-50 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-sm text-red-950">{at.instancia}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-emerald-100 text-emerald-800 border-emerald-300">
                          Dictamen: {at.dictamen || 'ATENDIDO'}
                        </span>
                      </div>
                      {(at.nombre_responsable || at.cargo_responsable || at.oficio_referencia) && (
                        <div className="text-[11px] text-gray-600 bg-white p-2.5 rounded-lg border border-gray-150 flex flex-wrap gap-x-4 gap-y-1">
                          {at.nombre_responsable && <span>Responsable: <strong>{at.nombre_responsable}</strong></span>}
                          {at.cargo_responsable && <span>Cargo: <strong>{at.cargo_responsable}</strong></span>}
                          {at.oficio_referencia && <span>Oficio / Exp: <strong>{at.oficio_referencia}</strong></span>}
                        </div>
                      )}
                      <div className="pt-1">
                        <span className="text-gray-500 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Acciones Realizadas / Fundamentación:</span>
                        <p className="text-gray-800 font-sans leading-relaxed whitespace-pre-wrap">{at.acciones_tomadas}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 text-right">
                        Registrado el {new Date(at.creado_en).toLocaleString('es-MX')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setModalSeguimientoAbierto(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;