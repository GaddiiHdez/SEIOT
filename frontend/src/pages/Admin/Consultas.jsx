import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api.js';
import { Search, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import Navbar from '../../components/Navbar';

// Sub-componentes modularizados
import FiltrosConsultas from '../../components/Consultas/FiltrosConsultas';
import TablaResultados from '../../components/Consultas/TablaResultados';
import ModalVistaRapida from '../../components/Consultas/ModalVistaRapida';

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

const ESTATUS_OPTS = [
    { value: '', label: 'Todos' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'en_proceso', label: 'En proceso' },
];

const Consultas = () => {
    const navigate = useNavigate();
    const { usuario, permisosListos } = useAuth();

    // ─── FILTROS DE ESTADO ──────────────────────────────────────────────────
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
    const [statusFirmas, setStatusFirmas] = useState({});
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
                const resSup = await apiFetch('/api/psg/supervisores');
                if (resSup.ok) {
                    const dataSup = await resSup.json();
                    setSupervisores(dataSup);
                }
                
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

    // ─── PARÁMETROS DE BÚSQUEDA ───────────────────────────────────────────────
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

    // ─── ACCIONES ─────────────────────────────────────────────────────────────
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

    const abrirDetalleModal = async (row) => {
        setVisitaDetalle(null);
        setStatusFirmas({});
        try {
            const res = await apiFetch(`/api/psg/visitas/buscar?folio=${encodeURIComponent(row.folio)}`);
            if (res.ok) {
                const data = await res.json();
                setVisitaDetalle(data);
                
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
                
                {/* FORMULARIO DE FILTROS (SUBCOMPONENT) */}
                <FiltrosConsultas
                    psgInput={psgInput}
                    setPsgInput={setPsgInput}
                    fechaDesde={fechaDesde}
                    setFechaDesde={setFechaDesde}
                    fechaHasta={fechaHasta}
                    setFechaHasta={setFechaHasta}
                    filtroSupervisor={filtroSupervisor}
                    setFiltroSupervisor={setFiltroSupervisor}
                    filtroCapturista={filtroCapturista}
                    setFiltroCapturista={setFiltroCapturista}
                    supervisores={supervisores}
                    capturistas={capturistas}
                    usuario={usuario}
                    municipiosSeleccionados={municipiosSeleccionados}
                    setMunicipiosSeleccionados={setMunicipiosSeleccionados}
                    estatusSeleccionados={estatusSeleccionados}
                    setEstatusSeleccionados={setEstatusSeleccionados}
                    modulosSeleccionados={modulosSeleccionados}
                    setModulosSeleccionados={setModulosSeleccionados}
                    buscando={buscando}
                    iniciarBusqueda={iniciarBusqueda}
                    limpiarFiltros={limpiarFiltros}
                    toggleItem={toggleItem}
                    MUNICIPIOS={MUNICIPIOS}
                    ESTATUS_OPTS={ESTATUS_OPTS}
                    MODULOS_OPTS={MODULOS_OPTS}
                />

                {/* TABLA DE RESULTADOS (SUBCOMPONENT) */}
                {buscado && (
                    <TablaResultados
                        resultados={resultados}
                        totalResultados={totalResultados}
                        paginaActual={paginaActual}
                        limitePorPagina={limitePorPagina}
                        buscando={buscando}
                        exportando={exportando}
                        handleExportar={handleExportar}
                        abrirVisita={abrirVisita}
                        abrirDetalleModal={abrirDetalleModal}
                        cambiarPagina={cambiarPagina}
                        esFinalizado={esFinalizado}
                    />
                )}

                {/* MODAL VISTA RÁPIDA (SUBCOMPONENT) */}
                <ModalVistaRapida
                    visitaDetalle={visitaDetalle}
                    setVisitaDetalle={setVisitaDetalle}
                    statusFirmas={statusFirmas}
                    descargandoPdfId={descargandoPdfId}
                    descargarPdfEspecifico={descargarPdfEspecifico}
                    verPdfFirmadoEspecifico={verPdfFirmadoEspecifico}
                    abrirVisita={abrirVisita}
                />

            </div>
        </div>
    );
};

export default Consultas;