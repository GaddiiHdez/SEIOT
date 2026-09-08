import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    ShieldAlert, FileText, CheckCircle2, Download, Building, Send, Clock, 
    User, Phone, MapPin, AlertTriangle, ArrowRight, Eye, X, FileCheck, 
    Calendar, ArrowLeft, Award, Scale, HelpCircle, Check, AlertCircle
} from 'lucide-react';
import logoGobierno from '../assets/logo-gobierno.jpg';
import { useAuth } from '../context/AuthContext';

const INSTANCIAS_MAP = {
    seder_juridico: 'Dirección Jurídica de la SEDER',
    cefppenay: 'CEFPPENAY',
    senasica: 'SENASICA',
    test_henry: 'Supervisión Técnica (Pruebas - Henry Hernández)'
};

const DICTAMENES_OPCIONES = [
    { valor: 'SOLVENTADO', label: 'Solventado (Observaciones subsanadas satisfactoriamente)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { valor: 'REQUERIMIENTO', label: 'Requerimiento (Se emitió oficio de subsanación o documentación)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { valor: 'PROCEDIMIENTO', label: 'Procedimiento Sancionador (Se inició proceso administrativo legal)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    { valor: 'EN_TRAMITE', label: 'En Trámite (Diligencias e investigación en curso)', color: 'bg-blue-100 text-blue-800 border-blue-300' }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const SeguimientoExpediente = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const { usuario } = useAuth();

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [expediente, setExpediente] = useState(null);

    // Formulario de dictamen y atención
    const [instancia, setInstancia] = useState('seder_juridico');
    const [dictamen, setDictamen] = useState('SOLVENTADO');
    const [nombreResponsable, setNombreResponsable] = useState('');
    const [cargoResponsable, setCargoResponsable] = useState('');
    const [oficioReferencia, setOficioReferencia] = useState('');
    const [accionesTomadas, setAccionesTomadas] = useState('');
    const [guardandoAtencion, setGuardandoAtencion] = useState(false);
    const [mensajeExito, setMensajeExito] = useState(null);

    // Modal para ver módulo en detalle
    const [moduloModal, setModuloModal] = useState(null);

    useEffect(() => {
        if (usuario) {
            if (usuario.instancia) {
                setInstancia(usuario.instancia);
            }
            if (usuario.nombre) {
                setNombreResponsable(usuario.nombre);
            }
        }
    }, [usuario]);

    useEffect(() => {
        if (!token) {
            setError('No se proporcionó un token de acceso al expediente.');
            setCargando(false);
            return;
        }

        const cargarExpediente = async () => {
            try {
                const res = await fetch(`${API_URL}/api/modulos/seguimiento/${token}`);
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'No fue posible cargar el expediente.');
                }
                const data = await res.json();
                setExpediente(data.expediente);
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };

        cargarExpediente();
    }, [token]);

    const handleRegistrarAtencion = async (e) => {
        e.preventDefault();
        if (!accionesTomadas.trim()) {
            alert('Por favor describa las acciones tomadas o fundamentación del dictamen.');
            return;
        }

        setGuardandoAtencion(true);
        try {
            const res = await fetch(`${API_URL}/api/modulos/seguimiento/${token}/atender`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instancia: INSTANCIAS_MAP[instancia] || instancia,
                    nombre_responsable: nombreResponsable,
                    cargo_responsable: cargoResponsable,
                    oficio_referencia: oficioReferencia,
                    acciones_tomadas: accionesTomadas,
                    dictamen: dictamen
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al registrar el dictamen.');
            }

            const data = await res.json();
            setMensajeExito('¡Dictamen oficial registrado exitosamente en la bitácora del SEIOT!');
            
            // Actualizar atenciones y estatus en la vista
            if (data.atencion) {
                setExpediente(prev => ({
                    ...prev,
                    seguimiento_atendido: true,
                    dictamen_seguimiento: dictamen,
                    fecha_atencion_seguimiento: new Date().toISOString(),
                    atenciones: [data.atencion, ...(prev.atenciones || [])]
                }));
            }
            // Limpiar campos
            setOficioReferencia('');
            setAccionesTomadas('');
        } catch (err) {
            alert(err.message);
        } finally {
            setGuardandoAtencion(false);
        }
    };

    if (cargando) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700 font-bold">Cargando expediente oficial de supervisión...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border border-gray-200">
                    <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Expediente No Disponible</h2>
                    <p className="text-sm text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold text-sm shadow transition-colors"
                    >
                        Ir al Portal de Inicio
                    </button>
                </div>
            </div>
        );
    }

    const { 
        folio, 
        psg, 
        estado_visita, 
        seguimiento_atendido, 
        dictamen_seguimiento, 
        psg_datos = {}, 
        modulos = {}, 
        atenciones = [], 
        documentos_firmados = [] 
    } = expediente;

    // Helper para obtener documento firmado de un módulo
    const getDocFirmado = (numModulo) => {
        return documentos_firmados.find(d => String(d.modulo) === String(numModulo));
    };

    // Configuración de los 6 módulos
    const modulosConfig = [
        {
            id: 1,
            titulo: 'Módulo 1: Notificación Oficial',
            subtitulo: 'Oficio de Notificación de Visita de Supervisión',
            data: modulos.modulo1,
            descripcion: modulos.modulo1 
                ? `Emitido el ${modulos.modulo1.fecha_emision || 'N/D'} por ${modulos.modulo1.nombre_servidor || 'Servidor Oficial'}. Recibe: ${modulos.modulo1.recibe_notificacion || modulos.modulo1.nombre_psg || 'Titular / Encargado'}.`
                : 'Pendiente de emisión o sin datos registrados.',
            detalles: modulos.modulo1 ? [
                { label: 'Fecha de Emisión', valor: modulos.modulo1.fecha_emision },
                { label: 'Hora de Notificación', valor: modulos.modulo1.hora_emision || modulos.modulo1.hora_notificacion },
                { label: 'Servidor Público Comisionado', valor: modulos.modulo1.nombre_servidor },
                { label: 'Cargo del Servidor', valor: modulos.modulo1.cargo_servidor },
                { label: 'Identificación Oficial', valor: modulos.modulo1.identificacion_servidor },
                { label: 'Persona Notificada / PSG', valor: modulos.modulo1.nombre_psg || modulos.modulo1.recibe_notificacion },
                { label: 'Domicilio Notificado', valor: modulos.modulo1.domicilio }
            ] : []
        },
        {
            id: 2,
            titulo: 'Módulo 2: Orden de Supervisión',
            subtitulo: 'Orden Oficial de Inspección y Vigilancia',
            data: modulos.modulo2,
            descripcion: modulos.modulo2
                ? `Ordenada por ${modulos.modulo2.nombre_ordena || 'Autoridad Emisora'}. Inspector comisionado: ${modulos.modulo2.nombre_pc || modulos.modulo2.nombre_comisionado || 'Oficial de Supervisión'}.`
                : 'Pendiente de emisión o sin datos registrados.',
            detalles: modulos.modulo2 ? [
                { label: 'Fecha de la Orden', valor: modulos.modulo2.fecha },
                { label: 'Hora', valor: modulos.modulo2.hora },
                { label: 'Autoridad que Ordena', valor: modulos.modulo2.nombre_ordena },
                { label: 'Cargo de la Autoridad', valor: modulos.modulo2.cargo_ordena },
                { label: 'Personal Comisionado', valor: modulos.modulo2.nombre_pc || modulos.modulo2.nombre_comisionado },
                { label: 'Cargo Comisionado', valor: modulos.modulo2.cargo_pc || modulos.modulo2.cargo_comisionado },
                { label: 'Objeto de la Supervisión', valor: modulos.modulo2.objeto || 'Supervisión y verificación técnica pecuaria' }
            ] : []
        },
        {
            id: 3,
            titulo: 'Módulo 3: Verificación Técnica',
            subtitulo: 'Lista de Verificación de Cumplimiento Pecuario',
            data: modulos.modulo3,
            descripcion: modulos.modulo3
                ? `Supervisión realizada el ${modulos.modulo3.fecha || 'N/D'} por ${modulos.modulo3.nombre_supervisor || 'Supervisor Oficial'}. Estatus: ${modulos.modulo3.cumple ? 'Cumple' : 'Presenta Observaciones'}.`
                : 'Pendiente de emisión o sin datos registrados.',
            detalles: modulos.modulo3 ? [
                { label: 'Fecha de Verificación', valor: modulos.modulo3.fecha },
                { label: 'Horario de Inspección', valor: `${modulos.modulo3.hora_inicio || '--:--'} a ${modulos.modulo3.hora_termino || '--:--'}` },
                { label: 'Supervisor Oficial', valor: modulos.modulo3.nombre_supervisor },
                { label: 'Cumplimiento General', valor: modulos.modulo3.cumple ? 'CUMPLE SATISFACTORIAMENTE' : 'PRESENTA OBSERVACIONES / INCUMPLIMIENTO' },
                { label: 'Requiere Seguimiento', valor: modulos.modulo3.requiere_seguimiento ? 'SÍ (Canalizado a dependencias)' : 'NO' },
                { label: 'Instancias Notificadas', valor: (modulos.modulo3.instancias_notificadas || []).map(id => INSTANCIAS_MAP[id] || id).join(', ') || 'Ninguna' },
                { label: 'Observaciones y Hallazgos', valor: modulos.modulo3.observaciones || 'Sin observaciones registradas.' }
            ] : []
        },
        {
            id: 4,
            titulo: 'Módulo 4: Acta de Hechos',
            subtitulo: 'Acta de Hechos u Omisiones Detectadas',
            data: modulos.modulo4,
            descripcion: modulos.modulo4
                ? `Acta levantada el ${modulos.modulo4.fecha || 'N/D'}. Inspector: ${modulos.modulo4.nombre_supervisor || modulos.modulo4.supervisor || 'N/D'}.`
                : 'No requerida o no levantada en esta supervisión.',
            detalles: modulos.modulo4 ? [
                { label: 'Fecha del Acta', valor: modulos.modulo4.fecha },
                { label: 'Horario', valor: `${modulos.modulo4.hora_inicio || modulos.modulo4.hora || '--:--'} a ${modulos.modulo4.hora_termino || modulos.modulo4.hora_cierre || '--:--'}` },
                { label: 'Supervisor Actuante', valor: modulos.modulo4.nombre_supervisor || modulos.modulo4.supervisor },
                { label: 'Razón Social / Unidad', valor: modulos.modulo4.nombre_psg || modulos.modulo4.razon_social },
                { label: 'Testigo Asistente', valor: modulos.modulo4.nombre_testigo || modulos.modulo4.testigo1_nombre },
                { label: 'Testigo de Cierre', valor: modulos.modulo4.nombre_testigo_cierre || modulos.modulo4.testigo2_nombre },
                { label: 'Narrativa de Hechos u Omisiones', valor: modulos.modulo4.hechos_observados || modulos.modulo4.hechos_narrativa || modulos.modulo4.hechos || 'Sin narrativa capturada.' }
            ] : []
        },
        {
            id: 5,
            titulo: 'Módulo 5: Acta de Supervisión',
            subtitulo: 'Acta de Inspección en Sitio y Medidas Preventivas',
            data: modulos.modulo5,
            descripcion: modulos.modulo5
                ? `Acta No. ${modulos.modulo5.acta_no || 'S/N'}. Fecha: ${modulos.modulo5.fecha || 'N/D'}. Medidas preventivas asentadas.`
                : 'Pendiente de emisión o sin datos registrados.',
            detalles: modulos.modulo5 ? [
                { label: 'Acta Número', valor: modulos.modulo5.acta_no },
                { label: 'Fecha de Inspección', valor: modulos.modulo5.fecha },
                { label: 'Horario', valor: `${modulos.modulo5.hora_inicio || '--:--'} a ${modulos.modulo5.hora_termino || modulos.modulo5.hora_fin || '--:--'}` },
                { label: 'Supervisor Oficial', valor: modulos.modulo5.nombre_supervisor || modulos.modulo5.supervisor },
                { label: 'Observaciones Detectadas', valor: modulos.modulo5.observaciones_detectadas || 'Ninguna observación asentada.' },
                { label: 'Medidas Preventivas Dictadas', valor: modulos.modulo5.medidas_preventivas || 'Sin medidas preventivas dictadas.' },
                { label: 'Manifestaciones del Interesado', valor: modulos.modulo5.manifestaciones || 'Sin manifestaciones adicionales.' }
            ] : []
        },
        {
            id: 6,
            titulo: 'Módulo 6: Cierre y Circunstanciada',
            subtitulo: 'Acta Circunstanciada y Conclusión de Visita',
            data: modulos.modulo6,
            descripcion: modulos.modulo6
                ? `Concluida el ${modulos.modulo6.fecha || 'N/D'} por ${modulos.modulo6.nombre_oficial || modulos.modulo6.supervisor || 'Inspector'}. Visita protocolizada.`
                : 'Pendiente de formalización o sin datos registrados.',
            detalles: modulos.modulo6 ? [
                { label: 'Fecha de Cierre', valor: modulos.modulo6.fecha },
                { label: 'Horario', valor: `${modulos.modulo6.hora || '--:--'} (Cierre: ${modulos.modulo6.fecha_cierre || 'N/D'})` },
                { label: 'Supervisor Responsable', valor: modulos.modulo6.nombre_oficial || modulos.modulo6.supervisor },
                { label: 'Hechos Relevantes', valor: modulos.modulo6.hechos_observaciones || modulos.modulo6.hechos_relevantes || 'Sin hechos adicionales registrados.' },
                { label: 'Manifestaciones Finales', valor: modulos.modulo6.manifestaciones || 'Sin manifestaciones finales.' }
            ] : []
        }
    ];

    const dictamenColorMap = {
        SOLVENTADO: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        REQUERIMIENTO: 'bg-amber-50 text-amber-800 border-amber-300',
        PROCEDIMIENTO: 'bg-rose-50 text-rose-800 border-rose-300',
        EN_TRAMITE: 'bg-blue-50 text-blue-800 border-blue-300'
    };

    return (
        <div className="min-h-screen bg-slate-50 text-gray-800 pb-20">
            {/* Encabezado Institucional */}
            <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white shadow-lg border-b-4 border-[#BC955B]">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-1.5 rounded-lg shadow-xs">
                            <img src={logoGobierno} alt="Gobierno de Nayarit" className="h-10 w-auto object-contain" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-wide uppercase">Secretaría de Desarrollo Rural</h1>
                            </div>
                            <p className="text-xs text-[#BC955B] font-semibold tracking-wider uppercase">
                                SEIOT — Expediente Digital de Supervisión Pecuaria
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {usuario?.rol === 'seguimiento' && (
                            <button
                                onClick={() => navigate('/seguimiento/bandeja')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                                <ArrowLeft size={14} /> Regresar a Mi Bandeja
                            </button>
                        )}
                        <div className="text-center sm:text-right">
                            <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                ⚠️ Seguimiento Requerido
                            </span>
                            <p className="text-xs text-gray-300 mt-1">Folio: <strong className="text-white">{folio}</strong></p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
                {/* Banner de Dictamen Oficial si ya fue atendido */}
                {seguimiento_atendido && dictamen_seguimiento && (
                    <div className={`p-4 rounded-xl border-2 flex items-start gap-4 shadow-sm ${dictamenColorMap[dictamen_seguimiento] || 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
                        <Award size={26} className="shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-sm font-bold uppercase tracking-wide">
                                    Expediente con Dictamen Institucional Emitido: {dictamen_seguimiento}
                                </h2>
                                <span className="text-[11px] font-semibold opacity-80">
                                    Registrado en SEIOT
                                </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed opacity-95">
                                Este expediente ya cuenta con resolución formal por parte de la dependencia asignada. Los detalles y bitácora de resoluciones pueden consultarse en la parte inferior.
                            </p>
                        </div>
                    </div>
                )}

                {/* Banner Oficial General */}
                {!seguimiento_atendido && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs flex items-start gap-3">
                        <ShieldAlert size={24} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h2 className="text-sm font-bold text-amber-900">
                                Expediente Canalizado para Atención y Dictamen Técnico/Jurídico
                            </h2>
                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                Este expediente fue derivado por el inspector en campo para revisión de las dependencias competentes (SENASICA, CEFPPENAY, Dirección Jurídica). Revise los módulos y documentos de la visita antes de emitir su veredicto.
                            </p>
                        </div>
                    </div>
                )}

                {/* Ficha PSG y Supervisión */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ficha PSG */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <Building size={16} className="text-red-800" /> Prestador de Servicios Ganaderos (PSG)
                            </h3>
                            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                                {psg}
                            </span>
                        </div>
                        <div className="p-5 text-xs space-y-2.5">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Titular / Razón Social:</span>
                                <span className="font-bold text-gray-900 text-right">{psg_datos.titular || 'N/D'}</span>
                            </div>
                            {psg_datos.representante && (
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500 font-semibold">Representante:</span>
                                    <span className="font-medium text-gray-900 text-right">{psg_datos.representante}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Municipio:</span>
                                <span className="font-medium text-gray-900">{psg_datos.municipio || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Localidad:</span>
                                <span className="font-medium text-gray-900">{psg_datos.localidad || 'N/D'}</span>
                            </div>
                            {psg_datos.domicilio && (
                                <div className="flex justify-between border-b border-gray-100 pb-2">
                                    <span className="text-gray-500 font-semibold">Domicilio:</span>
                                    <span className="font-medium text-gray-900 text-right">{psg_datos.domicilio}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Teléfono:</span>
                                <span className="font-medium text-gray-900">{psg_datos.telefono || 'N/D'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Ficha Supervisión General */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <Clock size={16} className="text-red-800" /> Resumen de la Supervisión
                            </h3>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700 uppercase">
                                {estado_visita || 'En Proceso'}
                            </span>
                        </div>
                        <div className="p-5 text-xs space-y-2.5">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Fecha de Visita:</span>
                                <span className="font-bold text-gray-900">{modulos.modulo3?.fecha || modulos.modulo1?.fecha_emision || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Inspector Oficial:</span>
                                <span className="font-bold text-gray-900 text-right">{modulos.modulo3?.nombre_supervisor || 'Personal SEIOT'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-semibold">Instancias Canalizadas:</span>
                                <span className="font-bold text-red-900 text-right">
                                    {(modulos.modulo3?.instancias_notificadas || []).map(id => INSTANCIAS_MAP[id] || id).join(', ') || 'N/D'}
                                </span>
                            </div>

                            <div className="pt-2">
                                <span className="text-gray-600 font-bold block mb-1 uppercase text-[11px]">Motivo u Observaciones de la Canalización:</span>
                                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                                    {modulos.modulo3?.observaciones?.trim() || 'Sin observaciones adicionales registradas por el supervisor.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── SECCIÓN: MÓDULOS DE LA VISITA ─── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <FileText size={20} className="text-red-800" /> Módulos y Documentación Oficial de la Visita
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Consulte el contenido de cada acta y descargue los documentos firmados correspondientes.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {modulosConfig.map((mod) => {
                            const doc = getDocFirmado(mod.id);
                            const tieneDatos = !!mod.data;

                            return (
                                <div 
                                    key={mod.id} 
                                    className={`bg-white rounded-xl shadow-xs border flex flex-col justify-between transition-all hover:shadow-md ${
                                        tieneDatos ? 'border-gray-200 hover:border-red-300' : 'border-gray-100 opacity-75'
                                    }`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                                                Módulo {mod.id}
                                            </span>
                                            {tieneDatos ? (
                                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                                    <Check size={12} /> Registrado
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    Pendiente
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{mod.titulo}</h3>
                                        <p className="text-[11px] text-[#BC955B] font-semibold mb-2">{mod.subtitulo}</p>
                                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                                            {mod.descripcion}
                                        </p>
                                    </div>

                                    {/* Botones de acción del módulo */}
                                    <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-2">
                                        <button
                                            onClick={() => setModuloModal(mod)}
                                            disabled={!tieneDatos}
                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Eye size={14} className="text-gray-600" /> Visualizar Contenido
                                        </button>

                                        {doc ? (
                                            <a
                                                href={`${API_URL}/api/modulos/seguimiento/${token}/archivo/${mod.id}`}
                                                download
                                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                                            >
                                                <Download size={14} /> Descargar PDF Firmado
                                            </a>
                                        ) : (
                                            <div className="w-full text-center py-1.5 text-[11px] text-gray-400 italic">
                                                Sin PDF firmado digitalizado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── SECCIÓN: REGISTRO DE ATENCIÓN Y DICTAMEN OFICIAL ─── */}
                <div className="bg-white rounded-xl shadow-md border-2 border-red-900/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-900 via-red-900 to-red-800 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <Scale size={20} className="text-[#BC955B]" />
                            <div>
                                <h3 className="font-bold text-sm tracking-wide">
                                    Emisión de Dictamen Institucional y Registro de Atención
                                </h3>
                                <p className="text-[11px] text-red-200">
                                    Veredicto oficial de SENASICA, CEFPPENAY o Dirección Jurídica SEDER
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] text-[#BC955B] font-bold uppercase bg-black/20 px-3 py-1 rounded border border-[#BC955B]/40">
                            Protocolo SEIOT
                        </span>
                    </div>

                    <form onSubmit={handleRegistrarAtencion} className="p-6 space-y-5">
                        {mensajeExito && (
                            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> {mensajeExito}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Dependencia / Instancia que Dictamina:</label>
                                <select
                                    value={instancia}
                                    onChange={(e) => setInstancia(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-medium outline-none focus:border-red-800"
                                >
                                    <option value="seder_juridico">Dirección Jurídica de la SEDER</option>
                                    <option value="cefppenay">CEFPPENAY</option>
                                    <option value="senasica">SENASICA</option>
                                    <option value="test_henry">Supervisión Técnica (Pruebas - Henry Hernández)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">
                                    Veredicto / Dictamen Oficial:
                                </label>
                                <select
                                    value={dictamen}
                                    onChange={(e) => setDictamen(e.target.value)}
                                    className="w-full border-2 border-red-800/40 rounded-lg p-2.5 bg-white font-bold text-red-950 outline-none focus:border-red-800"
                                >
                                    {DICTAMENES_OPCIONES.map(opc => (
                                        <option key={opc.valor} value={opc.valor}>
                                            {opc.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nombre del Responsable:</label>
                                <input
                                    type="text"
                                    value={nombreResponsable}
                                    onChange={(e) => setNombreResponsable(e.target.value)}
                                    placeholder="Ej. Lic. Carlos Henson"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-medium outline-none focus:border-red-800"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Cargo Institucional:</label>
                                <input
                                    type="text"
                                    value={cargoResponsable}
                                    onChange={(e) => setCargoResponsable(e.target.value)}
                                    placeholder="Ej. Director Jurídico / Coordinador"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-medium outline-none focus:border-red-800"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Número de Oficio o Referencia:</label>
                                <input
                                    type="text"
                                    value={oficioReferencia}
                                    onChange={(e) => setOficioReferencia(e.target.value)}
                                    placeholder="Ej. DJ-2026/089"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white font-medium outline-none focus:border-red-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 mb-1 text-xs">
                                Fundamentación, Medidas Dictadas y Conclusiones del Dictamen:
                            </label>
                            <textarea
                                value={accionesTomadas}
                                onChange={(e) => setAccionesTomadas(e.target.value)}
                                rows={4}
                                required
                                placeholder="Especifique el análisis realizado, consideraciones técnicas o legales, requerimientos de subsanación o resolución dictaminada para este expediente..."
                                className="w-full border border-gray-300 rounded-lg p-3 text-xs bg-white outline-none focus:border-red-800 leading-relaxed"
                            ></textarea>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <p className="text-[11px] text-gray-500">
                                Al guardar, este dictamen quedará permanentemente visible para el capturista y los administradores del SEIOT.
                            </p>
                            <button
                                type="submit"
                                disabled={guardandoAtencion}
                                className="w-full sm:w-auto px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send size={15} /> {guardandoAtencion ? 'Guardando Dictamen...' : 'Emitir y Registrar Dictamen'}
                            </button>
                        </div>
                    </form>

                    {/* Historial de Dictámenes y Atenciones Registradas */}
                    {atenciones.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50/70 p-6">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Award size={16} className="text-red-800" /> Bitácora de Dictámenes y Atenciones ({atenciones.length})
                            </h4>
                            <div className="space-y-3">
                                {atenciones.map(at => {
                                    const dictamenVal = at.dictamen || 'SOLVENTADO';
                                    const badgeClass = dictamenColorMap[dictamenVal] || 'bg-gray-100 text-gray-800 border-gray-300';

                                    return (
                                        <div key={at.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-xs space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-red-950 text-sm">{at.instancia}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${badgeClass}`}>
                                                        Dictamen: {dictamenVal}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-gray-500">
                                                    {new Date(at.creado_en).toLocaleString('es-MX')}
                                                </span>
                                            </div>

                                            {(at.nombre_responsable || at.oficio_referencia || at.cargo_responsable) && (
                                                <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 flex flex-wrap gap-x-4 gap-y-1">
                                                    {at.nombre_responsable && <span>Responsable: <strong>{at.nombre_responsable}</strong></span>}
                                                    {at.cargo_responsable && <span>Cargo: <strong>{at.cargo_responsable}</strong></span>}
                                                    {at.oficio_referencia && <span>Oficio: <strong>{at.oficio_referencia}</strong></span>}
                                                </div>
                                            )}

                                            <p className="text-gray-800 pt-1 leading-relaxed whitespace-pre-wrap">
                                                {at.acciones_tomadas}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ─── MODAL VISUALIZADOR DE MÓDULO ─── */}
            {moduloModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Cabecera del Modal */}
                        <div className="bg-gradient-to-r from-red-950 to-red-900 text-white p-5 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-[#BC955B] uppercase tracking-wider">
                                    SEIOT — Visualizador de Documento
                                </span>
                                <h3 className="text-base font-bold">{moduloModal.titulo}</h3>
                                <p className="text-xs text-gray-300">{moduloModal.subtitulo}</p>
                            </div>
                            <button
                                onClick={() => setModuloModal(null)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            {moduloModal.detalles && moduloModal.detalles.length > 0 ? (
                                <div className="space-y-3">
                                    {moduloModal.detalles.map((det, idx) => (
                                        <div key={idx} className="border-b border-gray-100 pb-2.5">
                                            <span className="text-gray-500 font-bold block mb-0.5 text-[11px] uppercase tracking-wider">
                                                {det.label}:
                                            </span>
                                            <p className="text-gray-900 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                                                {det.valor ? String(det.valor) : <span className="text-gray-400 italic">No especificado</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-center py-6">
                                    No hay detalles capturados para este módulo.
                                </p>
                            )}
                        </div>

                        {/* Footer del Modal con botón de descarga */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
                            {getDocFirmado(moduloModal.id) ? (
                                <a
                                    href={`${API_URL}/api/modulos/seguimiento/${token}/archivo/${moduloModal.id}`}
                                    download
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                                >
                                    <Download size={14} /> Descargar PDF Firmado
                                </a>
                            ) : (
                                <span className="text-xs text-gray-400 italic">
                                    Sin documento firmado adjunto
                                </span>
                            )}
                            <button
                                onClick={() => setModuloModal(null)}
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

export default SeguimientoExpediente;
