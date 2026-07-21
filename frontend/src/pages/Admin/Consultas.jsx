import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api.js';
import { 
    Search, Download, X, ArrowLeft, CheckCircle, Clock, 
    Eye, User, MapPin, Calendar, ChevronLeft, ChevronRight, 
    FileText, Check, ShieldAlert, Award, FileSignature, ArrowRight, Loader2
} from 'lucide-react';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import * as XLSX from 'xlsx';
import Navbar from '../../components/Navbar';

// Generadores de PDF
import { generarPdfModulo1 } from '../../utils/generarPdfModulo1';
import { generarPdfModulo2 } from '../../utils/generarPdfModulo2';
import { generarPdfModulo3 } from '../../utils/generarPdfModulo3';
import { generarPdfModulo4 } from '../../utils/generarPdfModulo4';
import { generarPdfModulo5 } from '../../utils/generarPdfModulo5';
import { generarPdfModulo6 } from '../../utils/generarPdfModulo6';

const MUNICIPIOS = [
    'Acaponeta','Ahuacatlán','Amatlán de Cañas','Bahía de Banderas',
    'Compostela','Del Nayar','Huajicori','Ixtlán del Río','Jala',
    'La Yesca','Loreto','Rosamorada','Ruíz','San Blas','San Pedro Lagunillas',
    'Santa María del Oro','Santiago Ixcuintla','Tecuala','Tepic','Tuxpan','Xalisco'
].sort();

const MODULOS_OPTS = [
    { key: 'modulo1', label: 'Módulo 1' },
    { key: 'modulo2', label: 'Módulo 2' },
    { key: 'modulo3', label: 'Módulo 3' },
    { key: 'modulo4', label: 'Módulo 4' },
    { key: 'modulo5', label: 'Módulo 5' },
    { key: 'modulo6', label: 'Módulo 6' },
];

const Chip = ({ label, activo, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 shadow-sm ${
            activo
                ? 'bg-red-700 text-white border-red-700 hover:bg-red-800'
                : 'bg-white text-slate-650 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
        }`}
    >
        {label}
    </button>
);

const Consultas = () => {
    const navigate = useNavigate();
    const { usuario, permisosListos } = useAuth();

    // ─── FILTROS ──────────────────────────────────────────────────────────────
    const [psgInput, setPsgInput] = useState('');
    const [municipiosSeleccionados, setMunicipiosSeleccionados] = useState([]);
    const [estatusSeleccionados, setEstatusSeleccionados] = useState([]);
    const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroSupervisor, setFiltroSupervisor] = useState('');
    const [filtroCapturista, setFiltroCapturista] = useState('');

    // Catálogos
    const [supervisores, setSupervisores] = useState([]);
    const [capturistas, setCapturistas] = useState([]);

    // ─── RESULTADOS ───────────────────────────────────────────────────────────
    const [resultados, setResultados] = useState([]);
    const [totalResultados, setTotalResultados] = useState(0);
    const [paginaActual, setPaginaActual] = useState(1);
    const [limitePorPagina] = useState(10);
    const [buscando, setBuscando] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [buscado, setBuscado] = useState(false);

    // ─── DETALLE VISTA RÁPIDA ──────────────────────────────────────────────────
    const [visitaDetalle, setVisitaDetalle] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [statusFirmas, setStatusFirmas] = useState({}); // { 1: bool, 2: bool, ... }
    const [descargandoPdfId, setDescargandoPdfId] = useState(null);

    useEffect(() => {
        if (!permisosListos) return;
        const puedeConsultas = usuario?.es_admin || usuario?.permisos?.consultas;
        if (!puedeConsultas) {
            alert('No tienes permiso para acceder a consultas.');
            navigate('/dashboard');
        }
    }, [usuario, permisosListos, navigate]);

    // Cargar catálogos
    useEffect(() => {
        const cargarCatálogos = async () => {
            try {
                // Cargar supervisores
                const resSup = await apiFetch('/api/psg/supervisores');
                if (resSup.ok) {
                    const dataSup = await resSup.json();
                    setSupervisores(dataSup);
                }
                
                // Cargar capturistas (solo si es admin)
                if (usuario?.es_admin) {
                    const resCap = await apiFetch('/api/auth/usuarios');
                    if (resCap.ok) {
                        const dataCap = await resCap.json();
                        setCapturistas(dataCap);
                    }
                }
            } catch (err) {
                console.error('Error cargando catálogos:', err);
            }
        };
        if (usuario) {
            cargarCatálogos();
        }
    }, [usuario]);

    const toggleItem = (lista, setLista, valor) => {
        setLista(prev =>
            prev.includes(valor) ? prev.filter(v => v !== valor) : [...prev, valor]
        );
    };

    // ─── CONSTRUIR PARAMS ─────────────────────────────────────────────────────
    const construirParams = (soloFiltrados = false, paginar = false) => {
        const params = new URLSearchParams();
        if (psgInput.trim()) {
            if (psgInput.includes('/')) {
                params.set('folio', psgInput.trim());
            } else {
                params.set('psg', psgInput.trim());
            }
        }
        if (municipiosSeleccionados.length > 0) params.set('municipios', municipiosSeleccionados.join(','));
        if (estatusSeleccionados.length === 1) params.set('estatus', estatusSeleccionados[0]);
        if (modulosSeleccionados.length > 0) params.set('modulos_completados', modulosSeleccionados.join(','));
        if (fechaDesde) params.set('fecha_desde', fechaDesde);
        if (fechaHasta) params.set('fecha_hasta', fechaHasta);
        if (filtroSupervisor) params.set('supervisor', filtroSupervisor);
        if (filtroCapturista) params.set('capturista_id', filtroCapturista);
        if (soloFiltrados) params.set('solo_filtrados', 'true');
        if (paginar) {
            params.set('page', paginaActual);
            params.set('limit', limitePorPagina);
        }
        return params;
    };

    // ─── BUSCAR ───────────────────────────────────────────────────────────────
    const handleBuscar = async (pageToFetch = paginaActual) => {
        setBuscando(true);
        setBuscado(true);
        try {
            const params = construirParams(false, true);
            params.set('page', pageToFetch);
            const response = await apiFetch(`/api/psg/consultas?${params}`);
            if (response.ok) {
                const data = await response.json();
                if (data && typeof data === 'object' && 'rows' in data) {
                    setResultados(data.rows);
                    setTotalResultados(data.total);
                } else {
                    setResultados(data);
                    setTotalResultados(data.length);
                }
            } else {
                alert('Error al buscar.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        } finally {
            setBuscando(false);
        }
    };

    const iniciarBusqueda = () => {
        setPaginaActual(1);
        handleBuscar(1);
    };

    const cambiarPagina = (nuevaPagina) => {
        setPaginaActual(nuevaPagina);
        handleBuscar(nuevaPagina);
    };

    // ─── LIMPIAR FILTROS ──────────────────────────────────────────────────────
    const limpiarFiltros = () => {
        setPsgInput('');
        setMunicipiosSeleccionados([]);
        setEstatusSeleccionados([]);
        setModulosSeleccionados([]);
        setFechaDesde('');
        setFechaHasta('');
        setFiltroSupervisor('');
        setFiltroCapturista('');
        setResultados([]);
        setTotalResultados(0);
        setPaginaActual(1);
        setBuscado(false);
    };

    // ─── EXPORTAR A EXCEL ─────────────────────────────────────────────────────
    const handleExportar = async (soloFiltrados) => {
        setExportando(true);
        try {
            const params = construirParams(soloFiltrados);
            const response = await apiFetch(`/api/psg/consultas/exportar?${params}`);
            if (!response.ok) { alert('Error al exportar.'); return; }
            const datos = await response.json();

            const ws = XLSX.utils.json_to_sheet(datos);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Visitas');
            const nombre = soloFiltrados ? 'consulta_filtrada.xlsx' : 'consulta_completa.xlsx';
            XLSX.writeFile(wb, nombre);
        } catch (error) {
            console.error(error);
            alert('Error al exportar.');
        } finally {
            setExportando(false);
        }
    };

    const esFinalizado = (row) =>
        row.estado_visita === 'finalizado' ||
        (row.modulo1_completado && row.modulo2_completado && row.modulo3_completado &&
         row.modulo4_completado && row.modulo5_completado && row.modulo6_completado);

    // ─── ABRIR VISITA EN EL DASHBOARD ─────────────────────────────────────────
    const abrirVisita = async (row) => {
        try {
            const response = await apiFetch(`/api/psg/visitas/buscar?folio=${encodeURIComponent(row.folio)}`);
            if (!response.ok) { alert('No se pudo cargar la visita.'); return; }
            const data = await response.json();
            localStorage.setItem('visitaActiva', JSON.stringify(data));
            localStorage.setItem('desdeConsultas', 'true');
            window.location.replace('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Error al abrir la visita.');
        }
    };

    // ─── DETALLE VISTA RÁPIDA ──────────────────────────────────────────────────
    const abrirDetalleModal = async (row) => {
        setCargandoDetalle(true);
        setVisitaDetalle(null);
        setStatusFirmas({});
        try {
            const res = await apiFetch(`/api/psg/visitas/buscar?folio=${encodeURIComponent(row.folio)}`);
            if (res.ok) {
                const data = await res.json();
                setVisitaDetalle(data);
                
                // Cargar estatus de firmas de los módulos en paralelo
                const promesas = [1,2,3,4,5,6].map(async (num) => {
                    if (data.avance[`modulo${num}`]) {
                        try {
                            const resF = await apiFetch(`/api/modulos/firmado/${data.visita_id}/${num}`);
                            if (resF.ok) {
                                const fData = await resF.json();
                                return { num, existe: fData.existe };
                            }
                        } catch {}
                    }
                    return { num, existe: false };
                });
                const resultadosFirmas = await Promise.all(promesas);
                const objFirmas = {};
                resultadosFirmas.forEach(item => {
                    objFirmas[item.num] = item.existe;
                });
                setStatusFirmas(objFirmas);
            } else {
                alert('No se pudo obtener la información detallada de la visita.');
            }
        } catch (err) {
            console.error('Error cargando detalle:', err);
            alert('Error al conectar con el servidor.');
        } finally {
            setCargandoDetalle(false);
        }
    };

    const descargarPdfEspecifico = async (moduloId) => {
        if (!visitaDetalle) return;
        setDescargandoPdfId(moduloId);
        try {
            let datosGuardados = null;
            const res = await apiFetch(`/api/modulos/modulo${moduloId}/${visitaDetalle.visita_id}`);
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

            const ctx = visitaDetalle;
            const psgData = ctx.datosPsg;
            const supData = ctx.datosSupervisor;

            let payload = {};
            if (moduloId === 1) {
                payload = {
                    oficio_no: datosGuardados?.oficio_no || `SDR/OF/${ctx.folio.split('/').pop() || ''}`,
                    fecha_emision: datosGuardados?.fecha_emision || new Date(),
                    nombre_psg: psgData?.nombre_titular || '',
                    domicilio: psgData?.domicilio || '',
                    nombre_servidor: supData?.nombre || '',
                    cargo_servidor: supData?.cargo || '',
                };
                await generarPdfModulo1(payload);
            } else if (moduloId === 2) {
                payload = {
                    oficio_no: datosGuardados?.oficio_no || `SDR/ORD/${ctx.folio.split('/').pop() || ''}`,
                    fecha: datosGuardados?.fecha || ctx.fecha || '',
                    nombre_psg: psgData?.nombre_titular || '',
                    domicilio: psgData?.domicilio || '',
                    calidad_sujeto: datosGuardados?.calidad_sujeto || psgData?.tipo_psg || '',
                    nombre_pc: datosGuardados?.nombre_pc || supData?.nombre || '',
                    cargo_pc: datosGuardados?.cargo_pc || supData?.cargo || '',
                    adscripcion: datosGuardados?.adscripcion || supData?.adscripcion || '',
                    nombre_ordena: datosGuardados?.nombre_ordena || '',
                };
                await generarPdfModulo2(payload);
            } else if (moduloId === 3) {
                payload = {
                    fecha: datosGuardados?.fecha || ctx.fecha || '',
                    nombre_psg: datosGuardados?.nombre_psg || psgData?.nombre_titular || '',
                    tipo_psg: datosGuardados?.tipo_psg || psgData?.tipo_psg || '',
                    nombre_titular: datosGuardados?.nombre_titular || psgData?.nombre_titular || '',
                    telefono: datosGuardados?.telefono || psgData?.telefono || '',
                    municipio: datosGuardados?.municipio || psgData?.municipio || '',
                    localidad: datosGuardados?.localidad || psgData?.localidad || '',
                    latitud: datosGuardados?.latitud || psgData?.latitud || '',
                    longitud: datosGuardados?.longitud || psgData?.longitud || '',
                    capacidad_instalada: datosGuardados?.capacidad_instalada || psgData?.capacidad_maxima_bovinos || '',
                    nombre_supervisor: datosGuardados?.nombre_supervisor || supData?.nombre || '',
                    hora_inicio: datosGuardados?.hora_inicio || '',
                    hora_termino: datosGuardados?.hora_termino || '',
                    observaciones: datosGuardados?.observaciones || '',
                    cumple: datosGuardados?.cumple || false,
                    presenta_observaciones: datosGuardados?.presenta_observaciones || false,
                    requiere_seguimiento: datosGuardados?.requiere_seguimiento || false,
                    responsable_psg: datosGuardados?.responsable_psg || psgData?.representante || '',
                    responsable_supervisor: datosGuardados?.responsable_supervisor || supData?.nombre || '',
                    nombre_testigo: datosGuardados?.nombre_testigo || '',
                    domicilio_testigo: datosGuardados?.domicilio_testigo || '',
                    tipo_id_testigo: datosGuardados?.tipo_id_testigo || '',
                    numero_id_testigo: datosGuardados?.numero_id_testigo || '',
                    respuestas: datosGuardados?.respuestas || {},
                    recomendaciones: datosGuardados?.recomendaciones || {},
                };
                await generarPdfModulo3(payload);
            } else if (moduloId === 4) {
                payload = {
                    acta_no: datosGuardados?.acta_no || '',
                    fecha: datosGuardados?.fecha || ctx.fecha || '',
                    hora: datosGuardados?.hora || '',
                    hora_inicio: datosGuardados?.hora_inicio || '',
                    hora_termino: datosGuardados?.hora_termino || '',
                    hechos_observados: datosGuardados?.hechos_observados || '',
                    no_realizo_manifestaciones: datosGuardados?.no_realizo_manifestaciones || false,
                    manifestaciones: datosGuardados?.manifestaciones || '',
                    localidad: datosGuardados?.localidad || psgData?.localidad || '',
                    municipio: datosGuardados?.municipio || psgData?.municipio || '',
                    nombre_psg: datosGuardados?.nombre_psg || psgData?.nombre_titular || '',
                    tipo_psg: datosGuardados?.tipo_psg || psgData?.tipo_psg || '',
                    nombre_titular: datosGuardados?.nombre_titular || psgData?.nombre_titular || '',
                    domicilio: datosGuardados?.domicilio || psgData?.domicilio || '',
                    telefono: datosGuardados?.telefono || psgData?.telefono || '',
                    nombre_supervisor: datosGuardados?.nombre_supervisor || supData?.nombre || '',
                    nombre_testigo: datosGuardados?.nombre_testigo || '',
                    domicilio_testigo: datosGuardados?.domicilio_testigo || '',
                    tipo_id_testigo: datosGuardados?.tipo_id_testigo || '',
                    numero_id_testigo: datosGuardados?.numero_id_testigo || '',
                    nombre_testigo_cierre: datosGuardados?.nombre_testigo_cierre || '',
                };
                await generarPdfModulo4(payload);
            } else if (moduloId === 5) {
                payload = {
                    acta_no: datosGuardados?.acta_no || '',
                    fecha: datosGuardados?.fecha || ctx.fecha || '',
                    hora: datosGuardados?.hora || '',
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
                    localidad: datosGuardados?.localidad || psgData?.localidad || '',
                    municipio: datosGuardados?.municipio || psgData?.municipio || '',
                    nombre_psg: datosGuardados?.nombre_psg || psgData?.nombre_titular || '',
                    tipo_psg: datosGuardados?.tipo_psg || psgData?.tipo_psg || '',
                    nombre_titular: datosGuardados?.nombre_titular || psgData?.nombre_titular || '',
                    domicilio: datosGuardados?.domicilio || psgData?.domicilio || '',
                    telefono: datosGuardados?.telefono || psgData?.telefono || '',
                    nombre_supervisor: datosGuardados?.nombre_supervisor || supData?.nombre || '',
                    nombre_testigo: datosGuardados?.nombre_testigo || '',
                    domicilio_testigo: datosGuardados?.domicilio_testigo || '',
                    tipo_id_testigo: datosGuardados?.tipo_id_testigo || '',
                    numero_id_testigo: datosGuardados?.numero_id_testigo || '',
                };
                await generarPdfModulo5(payload);
            } else if (moduloId === 6) {
                payload = {
                    acta_no: datosGuardados?.acta_no || '',
                    fecha: datosGuardados?.fecha || ctx.fecha || '',
                    hora: datosGuardados?.hora || '',
                    establecimiento: datosGuardados?.establecimiento || psgData?.nombre_titular || '',
                    clave_psg: datosGuardados?.clave_psg || psgData?.psg || '',
                    ubicacion: datosGuardados?.ubicacion || psgData?.domicilio || '',
                    localidad: datosGuardados?.localidad || psgData?.localidad || '',
                    municipio: datosGuardados?.municipio || psgData?.municipio || '',
                    estado: datosGuardados?.estado || 'NAYARIT',
                    nombre_oficial: datosGuardados?.nombre_oficial || supData?.nombre || '',
                    tipo_id_responsable: datosGuardados?.tipo_id_responsable || '',
                    numero_id_responsable: datosGuardados?.numero_id_responsable || '',
                    id_expedida_por: datosGuardados?.id_expedida_por || '',
                    fecha_expedicion_id: datosGuardados?.fecha_expedicion_id || '',
                    ubicacion_compareciente: datosGuardados?.ubicacion_compareciente || '',
                    credencial_oficial_no: datosGuardados?.credencial_oficial_no || '',
                    nombre_testigo1: datosGuardados?.nombre_testigo1 || '',
                    domicilio_testigo1: datosGuardados?.domicilio_testigo1 || '',
                    tipo_id_testigo1: datosGuardados?.tipo_id_testigo1 || '',
                    numero_id_testigo1: datosGuardados?.numero_id_testigo1 || '',
                    nombre_testigo2: datosGuardados?.nombre_testigo2 || '',
                    domicilio_testigo2: datosGuardados?.domicilio_testigo2 || '',
                    tipo_id_testigo2: datosGuardados?.tipo_id_testigo2 || '',
                    numero_id_testigo2: datosGuardados?.numero_id_testigo2 || '',
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
                    nombre_testigo_cierre1: datosGuardados?.nombre_testigo_cierre1 || '',
                    tipo_id_cierre1: datosGuardados?.tipo_id_cierre1 || '',
                    numero_id_cierre1: datosGuardados?.numero_id_cierre1 || '',
                    nombre_testigo_cierre2: datosGuardados?.nombre_testigo_cierre2 || '',
                    tipo_id_cierre2: datosGuardados?.tipo_id_cierre2 || '',
                    numero_id_cierre2: datosGuardados?.numero_id_cierre2 || '',
                };
                await generarPdfModulo6(payload);
            }
        } catch (err) {
            console.error('Error al generar PDF:', err);
            alert('Error generando el archivo PDF.');
        } finally {
            setDescargandoPdfId(null);
        }
    };

    const verPdfFirmadoEspecifico = async (moduloId) => {
        if (!visitaDetalle) return;
        try {
            const res = await apiFetch(`/api/modulos/firmado/${visitaDetalle.visita_id}/${moduloId}`);
            if (res.ok) {
                const data = await res.json();
                const token = localStorage.getItem('seiot_token');
                const url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/uploads/documentos_firmados/${data.nombre_archivo}?token=${token}`;
                window.open(url, '_blank');
            } else {
                alert('No se pudo cargar el PDF firmado.');
            }
        } catch (err) {
            console.error('Error abriendo PDF firmado:', err);
            alert('Error de conexión con el servidor.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            <Navbar />

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* ENCABEZADO */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-red-700">
                            <Search size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-tight">Panel de Consultas</h1>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Filtra, visualiza y exporta expedientes de supervisión.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 self-start sm:self-auto">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-250 font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                            <ArrowLeft size={14} /> Dashboard
                        </button>
                    </div>
                </div>

                {/* TARJETA DE FILTROS */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-6">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Configuración de búsqueda</span>
                        <button onClick={limpiarFiltros} className="text-xs text-slate-400 hover:text-red-750 font-bold flex items-center gap-1 transition-colors">
                            <X size={13} /> Limpiar todo
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            
                            {/* TEXTO: PSG / FOLIO / NOMBRE */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Clave PSG, Razón Social o Folio de Visita</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
                                    <input
                                        value={psgInput}
                                        onChange={e => setPsgInput(e.target.value.toUpperCase())}
                                        placeholder="Ej: 18-017-0002 o SDR/18... o Sukarne"
                                        className="w-full border-2 border-slate-100 focus:border-red-700 bg-slate-50/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none transition-colors text-slate-800"
                                    />
                                </div>
                            </div>

                            {/* RANGO DE FECHAS */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Rango de Fecha de Inicio</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="date" 
                                        value={fechaDesde} 
                                        onChange={e => setFechaDesde(e.target.value)}
                                        className="flex-1 border-2 border-slate-100 focus:border-red-700 bg-slate-50/50 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-colors text-slate-800 font-mono" 
                                    />
                                    <span className="text-slate-400 text-xs font-bold px-1">al</span>
                                    <input 
                                        type="date" 
                                        value={fechaHasta} 
                                        onChange={e => setFechaHasta(e.target.value)}
                                        className="flex-1 border-2 border-slate-100 focus:border-red-700 bg-slate-50/50 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-colors text-slate-800 font-mono" 
                                    />
                                </div>
                            </div>

                            {/* SELECT: SUPERVISOR */}
                            <div>
                                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Supervisor Asignado</label>
                                <select
                                    value={filtroSupervisor}
                                    onChange={(e) => setFiltroSupervisor(e.target.value)}
                                    className="w-full border-2 border-slate-100 focus:border-red-700 bg-slate-50/50 rounded-xl px-3 py-2.5 text-xs font-bold outline-none transition-colors text-slate-750"
                                >
                                    <option value="">-- Todos --</option>
                                    {supervisores.map(s => (
                                        <option key={s.id} value={s.nombre}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* SELECT: CAPTURISTA (Solo Admin) */}
                            {usuario?.es_admin ? (
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Capturado Por</label>
                                    <select
                                        value={filtroCapturista}
                                        onChange={(e) => setFiltroCapturista(e.target.value)}
                                        className="w-full border-2 border-slate-100 focus:border-red-700 bg-slate-50/50 rounded-xl px-3 py-2.5 text-xs font-bold outline-none transition-colors text-slate-750"
                                    >
                                        <option value="">-- Todos --</option>
                                        {capturistas.map(u => (
                                            <option key={u.id} value={u.id}>{u.nombre} (@{u.usuario})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="hidden lg:block"></div>
                            )}

                            {/* ESTATUS */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Estatus de la Visita</label>
                                <div className="flex gap-2 flex-wrap pt-0.5">
                                    {ESTATUS_OPTS.filter(e => e.value).map(e => (
                                        <Chip key={e.value} label={e.label}
                                            activo={estatusSeleccionados.includes(e.value)}
                                            onClick={() => toggleItem(estatusSeleccionados, setEstatusSeleccionados, e.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* FILTRO MUNICIPIOS */}
                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Municipios {municipiosSeleccionados.length > 0 && <span className="text-red-750 font-black">({municipiosSeleccionados.length} seleccionados)</span>}
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                                {MUNICIPIOS.map(m => (
                                    <Chip key={m} label={m}
                                        activo={municipiosSeleccionados.includes(m)}
                                        onClick={() => toggleItem(municipiosSeleccionados, setMunicipiosSeleccionados, m)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* MÓDULOS COMPLETADOS */}
                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Módulos Completados {modulosSeleccionados.length > 0 && <span className="text-red-750 font-black">({modulosSeleccionados.length} seleccionados)</span>}
                            </label>
                            <div className="flex gap-2 flex-wrap pt-0.5">
                                {MODULOS_OPTS.map(m => (
                                    <Chip key={m.key} label={m.label}
                                        activo={modulosSeleccionados.includes(m.key)}
                                        onClick={() => toggleItem(modulosSeleccionados, setModulosSeleccionados, m.key)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* BOTÓN BUSCAR */}
                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={iniciarBusqueda} 
                            disabled={buscando}
                            className="bg-red-800 hover:bg-red-900 text-white px-8 py-3.5 rounded-xl shadow-md flex items-center gap-2 font-bold text-xs tracking-wider transition-all active:scale-95 disabled:opacity-50"
                        >
                            {buscando ? (
                                <>
                                    <Loader2 className="animate-spin" size={14} /> BUSCANDO...
                                </>
                            ) : (
                                <>
                                    <Search size={14} /> BUSCAR EXPEDIENTES
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* SECCIÓN DE RESULTADOS */}
                {buscado && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4">
                            <p className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                                {buscando ? 'Buscando registros...' : `${totalResultados} visita(s) encontrada(s)`}
                            </p>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleExportar(true)} 
                                    disabled={exportando || resultados.length === 0}
                                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 flex items-center gap-2 transition-all disabled:opacity-40"
                                >
                                    <Download size={14} /> EXPORTAR FILTRADO
                                </button>
                                <button 
                                    onClick={() => handleExportar(false)} 
                                    disabled={exportando}
                                    className="bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-2 transition-all disabled:opacity-40"
                                >
                                    <Download size={14} /> EXPORTAR TODO
                                </button>
                            </div>
                        </div>

                        {resultados.length === 0 && !buscando ? (
                            <div className="p-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wide">
                                No se encontraron visitas con los filtros indicados.
                            </div>
                        ) : (
                            <div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-slate-700 font-sans text-xs text-left">
                                        <thead className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                                            <tr>
                                                <th className="p-4 pl-6">Folio de Visita</th>
                                                <th className="p-4">PSG / Razón Social</th>
                                                <th className="p-4">Municipio</th>
                                                <th className="p-4">Responsables</th>
                                                <th className="p-4">Fecha Inicio</th>
                                                <th className="p-4 text-center">Avance</th>
                                                <th className="p-4 text-center">Estatus</th>
                                                <th className="p-4 text-center pr-6">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-150 bg-white">
                                            {resultados.map(row => (
                                                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="p-4 pl-6 whitespace-nowrap font-mono font-bold text-red-800">
                                                        <button 
                                                            onClick={() => abrirVisita(row)} 
                                                            className="hover:underline text-left text-xs font-black transition-colors"
                                                            title="Abrir en Dashboard para edición"
                                                        >
                                                            {row.folio}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-[10px] font-bold text-slate-500">{row.psg}</span>
                                                            <span className="font-bold text-slate-800 line-clamp-1 max-w-[200px]">{row.razon_social || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap font-semibold text-slate-600">
                                                        {row.municipio || '—'}
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-750">Sup: {row.supervisor || '—'}</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">Cap: {row.capturista_nombre || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap font-mono text-[10px] text-slate-500">
                                                        {row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            {[1,2,3,4,5,6].map(n => (
                                                                <span 
                                                                    key={n} 
                                                                    className={`w-5 h-5 rounded-full text-[9px] font-extrabold flex items-center justify-center border transition-all ${
                                                                        row[`modulo${n}_completado`] 
                                                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                                                                            : 'bg-slate-100 text-slate-400 border-slate-200'
                                                                    }`}
                                                                    title={`Módulo ${n}: ${row[`modulo${n}_completado`] ? 'Completado' : 'Pendiente'}`}
                                                                >
                                                                    {n}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center whitespace-nowrap">
                                                        {esFinalizado(row) ? (
                                                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                                                <CheckCircle size={10} /> Finalizado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                                                <Clock size={10} /> En proceso
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center pr-6 whitespace-nowrap">
                                                        <button
                                                            onClick={() => abrirDetalleModal(row)}
                                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-800 border border-slate-200 transition-all active:scale-95"
                                                            title="Ver vista rápida de la visita"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* CONTROL DE PAGINACIÓN */}
                                {totalResultados > 0 && (
                                    <div className="p-4 border-t border-slate-150 flex items-center justify-between flex-wrap gap-3 bg-slate-50/70">
                                        <span className="text-xs text-slate-500 font-bold">
                                            Mostrando registros del {(paginaActual - 1) * limitePorPagina + 1} al {Math.min(paginaActual * limitePorPagina, totalResultados)} de {totalResultados} visitas
                                        </span>
                                        
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={paginaActual === 1 || buscando}
                                                onClick={() => cambiarPagina(paginaActual - 1)}
                                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="px-3 text-xs font-bold text-slate-700 font-mono">
                                                Página {paginaActual} de {Math.ceil(totalResultados / limitePorPagina) || 1}
                                            </span>
                                            <button
                                                disabled={paginaActual >= Math.ceil(totalResultados / limitePorPagina) || buscando}
                                                onClick={() => cambiarPagina(paginaActual + 1)}
                                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL: VISTA RÁPIDA DE VISITA */}
                {visitaDetalle && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in relative flex flex-col max-h-[90vh]">
                            
                            <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-red-700" />
                                    <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wider">Detalles de Visita — Vista Rápida</h3>
                                </div>
                                <button
                                    onClick={() => setVisitaDetalle(null)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-500 hover:text-slate-700 transition-all"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
                                
                                {/* CABECERA DE DATOS GENERALES */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-150">
                                    <div>
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Folio</span>
                                        <span className="font-mono font-bold text-xs text-slate-800">{visitaDetalle.folio}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Estatus General</span>
                                        <span className={`inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                            visitaDetalle.estado_visita === 'finalizado' 
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                                : 'bg-amber-50 border-amber-200 text-amber-700'
                                        }`}>
                                            {visitaDetalle.estado_visita === 'finalizado' ? 'Finalizado' : 'En proceso'}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2 pt-2 border-t border-slate-200/50">
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">PSG</span>
                                        <span className="font-bold text-slate-800 text-[11px] block">{visitaDetalle.datosPsg?.nombre_titular}</span>
                                        <span className="font-mono text-[10px] text-slate-500">Clave: {visitaDetalle.psg} | Municipio: {visitaDetalle.datosPsg?.municipio}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/50">
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Supervisor Asignado</span>
                                        <span className="font-bold text-slate-800">{visitaDetalle.datosSupervisor?.nombre}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/50">
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Fecha de Registro</span>
                                        <span className="font-mono text-slate-850 font-bold">{visitaDetalle.fecha}</span>
                                    </div>
                                </div>

                                {/* GRID DE MÓDULOS */}
                                <div>
                                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block mb-3 pl-1">Expediente por Módulos</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {[1,2,3,4,5,6].map((num) => {
                                            const completado = visitaDetalle.avance[`modulo${num}`];
                                            const firmado = statusFirmas[num];

                                            return (
                                                <div key={num} className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors shadow-sm">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border ${
                                                                completado 
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                                            }`}>
                                                                {num}
                                                            </span>
                                                            <span className="font-extrabold text-slate-800 text-[11px]">Módulo {num}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] pl-6">
                                                            {completado ? (
                                                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100 flex items-center gap-0.5">
                                                                    <Check size={8} /> Capturado
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-bold border border-slate-150">
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                            {firmado && (
                                                                <span className="text-blue-750 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-100 flex items-center gap-0.5">
                                                                    <FileSignature size={8} /> Firmado
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ACCIONES DE ARCHIVOS */}
                                                    <div className="flex gap-1">
                                                        {completado && (
                                                            <button
                                                                onClick={() => descargarPdfEspecifico(num)}
                                                                disabled={descargandoPdfId !== null}
                                                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-colors flex items-center justify-center active:scale-95 disabled:opacity-40"
                                                                title="Descargar PDF generado"
                                                            >
                                                                {descargandoPdfId === num ? (
                                                                    <Loader2 className="animate-spin text-slate-500" size={12} />
                                                                ) : (
                                                                    <Download size={12} />
                                                                )}
                                                            </button>
                                                        )}
                                                        {firmado && (
                                                            <button
                                                                onClick={() => verPdfFirmadoEspecifico(num)}
                                                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors flex items-center justify-center active:scale-95"
                                                                title="Visualizar PDF firmado"
                                                            >
                                                                <FileSignature size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* PIE DE DIÁLOGO */}
                            <div className="p-4 border-t border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row gap-2 justify-between items-center">
                                <button
                                    onClick={() => abrirVisita(visitaDetalle)}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs shadow-sm"
                                >
                                    Abrir en Dashboard <ArrowRight size={14} />
                                </button>
                                <button
                                    onClick={() => setVisitaDetalle(null)}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-250 border border-slate-300 text-slate-700 rounded-xl font-bold transition-all active:scale-95 text-xs"
                                >
                                    Cerrar Ventana
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Consultas;