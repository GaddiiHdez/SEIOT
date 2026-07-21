import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api.js';
import { 
    ShieldAlert, Trash2, AlertTriangle, KeyRound, Loader2, Download, 
    Upload, RefreshCw, Save, Calendar, User, Eye, Search, Filter, 
    ChevronLeft, ChevronRight, BookOpen, Clock, X 
} from 'lucide-react';
import Navbar from '../../components/Navbar';

const SuperAdminPanel = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    
    // Pestañas
    const [tabActiva, setTabActiva] = useState('mantenimiento'); // 'mantenimiento' o 'auditoria'
    
    // Estados para Reset de Base de Datos
    const [claveReset, setClaveReset] = useState('');
    const [loadingReset, setLoadingReset] = useState(false);
    
    // Estados para Backup y Restore
    const [claveBackup, setClaveBackup] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loadingBackup, setLoadingBackup] = useState(false);
    const [loadingRestore, setLoadingRestore] = useState(false);
    
    // Estado de retroalimentación
    const [resultado, setResultado] = useState(null);

    // Estados para Configuración de Folios
    const [nomenclatura, setNomenclatura] = useState('SDR/{PSG}/{ANIO}/{CONSECUTIVO}');
    const [consecutivo, setConsecutivo] = useState(1);
    const [longitudConsecutivo, setLongitudConsecutivo] = useState(3);
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Estados para Bitácora de Auditoría
    const [logs, setLogs] = useState([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [filtroUsuario, setFiltroUsuario] = useState('');
    const [filtroAccion, setFiltroAccion] = useState('');
    const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
    const [filtroFechaFin, setFiltroFechaFin] = useState('');
    const [usuariosList, setUsuariosList] = useState([]);
    const [logSeleccionado, setLogSeleccionado] = useState(null); // Detalle JSON
    const [pagina, setPagina] = useState(1);
    const logsPorPagina = 25;

    useEffect(() => {
        // Bloquear acceso si no es SuperAdmin
        if (!usuario?.superadmin) {
            navigate('/dashboard');
        }
    }, [usuario, navigate]);

    useEffect(() => {
        const cargarConfigFolios = async () => {
            try {
                const res = await apiFetch('/api/superadmin/config-folios');
                if (res.ok) {
                    const data = await res.json();
                    setNomenclatura(data.nomenclatura);
                    setConsecutivo(data.consecutivo_actual);
                    setLongitudConsecutivo(data.longitud_consecutivo);
                }
            } catch (err) {
                console.error('Error cargando config de folios:', err);
            }
        };
        if (usuario?.superadmin) {
            cargarConfigFolios();
        }
    }, [usuario]);

    // Cargar lista de usuarios para filtro de auditoría
    const cargarUsuariosList = async () => {
        try {
            const res = await apiFetch('/api/auth/usuarios');
            if (res.ok) {
                const data = await res.json();
                setUsuariosList(data);
            }
        } catch (err) {
            console.error('Error al cargar lista de usuarios:', err);
        }
    };

    // Cargar bitácora de auditoría
    const cargarLogsAuditoria = async () => {
        setLoadingLogs(true);
        try {
            const offset = (pagina - 1) * logsPorPagina;
            let url = `/api/superadmin/auditoria?limit=${logsPorPagina}&offset=${offset}`;
            if (filtroUsuario) url += `&usuario_id=${filtroUsuario}`;
            if (filtroAccion) url += `&accion=${filtroAccion}`;
            if (filtroFechaInicio) url += `&fecha_inicio=${filtroFechaInicio}`;
            if (filtroFechaFin) url += `&fecha_fin=${filtroFechaFin}`;

            const res = await apiFetch(url);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalLogs(data.total);
            }
        } catch (err) {
            console.error('Error al cargar logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (usuario?.superadmin) {
            cargarUsuariosList();
        }
    }, [usuario]);

    useEffect(() => {
        if (usuario?.superadmin && tabActiva === 'auditoria') {
            cargarLogsAuditoria();
        }
    }, [tabActiva, pagina, filtroUsuario, filtroAccion, filtroFechaInicio, filtroFechaFin]);

    const handleSaveConfigFolios = async (e) => {
        e.preventDefault();
        setLoadingConfig(true);
        setResultado(null);
        try {
            const res = await apiFetch('/api/superadmin/config-folios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nomenclatura,
                    consecutivo_actual: parseInt(consecutivo) || 1,
                    longitud_consecutivo: parseInt(longitudConsecutivo) || 3
                })
            });
            const data = await res.json();
            if (res.ok) {
                setResultado({ tipo: 'success', mensaje: data.mensaje || 'Configuración de folios guardada correctamente.' });
            } else {
                setResultado({ tipo: 'error', mensaje: data.error });
            }
        } catch {
            setResultado({ tipo: 'error', mensaje: 'Error al conectar con el servidor.' });
        } finally {
            setLoadingConfig(false);
        }
    };

    const generarPreviewFolio = () => {
        const anio = new Date().getFullYear();
        const consecutivoStr = String(consecutivo || 1).padStart(parseInt(longitudConsecutivo) || 3, '0');
        return nomenclatura
            .replace(/{PSG}/g, '18-017-0002-P02')
            .replace(/{ANIO}/g, anio)
            .replace(/{CONSECUTIVO}/g, consecutivoStr);
    };

    // Descargar Respaldo (.ZIP completo)
    const handleDownloadBackup = async () => {
        if (!claveBackup.trim()) {
            alert('⚠️ La clave para respaldos es requerida.');
            return;
        }
        setLoadingBackup(true);
        setResultado(null);
        try {
            const token = localStorage.getItem('seiot_token');
            const res = await fetch('/api/superadmin/backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ confirmacion: claveBackup.trim() })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const fecha = new Date().toISOString().split('T')[0];
                a.href = url;
                a.download = `respaldo_seiot_${fecha}.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                setResultado({ tipo: 'success', mensaje: '¡Respaldo integral (.ZIP) generado y descargado con éxito! Incluye la base de datos y todos los PDFs firmados.' });
                setClaveBackup('');
            } else {
                const errorData = await res.json();
                setResultado({ tipo: 'error', mensaje: errorData.error || 'Error al generar respaldo.' });
            }
        } catch {
            setResultado({ tipo: 'error', mensaje: 'Error al conectar con el servidor.' });
        } finally {
            setLoadingBackup(false);
        }
    };

    // Restaurar Respaldo (.ZIP o .JSON)
    const handleRestoreDatabase = async () => {
        if (!claveBackup.trim()) {
            alert('⚠️ La clave para respaldos es requerida.');
            return;
        }
        if (!selectedFile) {
            alert('⚠️ Selecciona un archivo de respaldo (.ZIP o .JSON) para continuar.');
            return;
        }
        if (!confirm('🚨 ATENCIÓN CRÍTICA:\n\nAl restaurar este respaldo, se eliminarán todos los registros actuales de la base de datos de manera definitiva y se sobrescribirán con el contenido del archivo de respaldo (incluyendo la recuperación de archivos PDF si el respaldo es .ZIP).\n\n¿Estás seguro de que deseas proceder?')) {
            return;
        }

        setLoadingRestore(true);
        setResultado(null);

        try {
            const formData = new FormData();
            formData.append('confirmacion', claveBackup.trim());
            formData.append('archivo', selectedFile);

            const token = localStorage.getItem('seiot_token');
            const res = await fetch('/api/superadmin/restore', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.removeItem('visitaActiva');
                localStorage.removeItem('seiot_visitas_recientes');
                setResultado({ tipo: 'success', mensaje: 'Sistema restaurado con éxito. ' + data.mensaje });
                setClaveBackup('');
                setSelectedFile(null);
                const fileInput = document.getElementById('backup-file-input');
                if (fileInput) fileInput.value = '';
            } else {
                setResultado({ tipo: 'error', mensaje: data.error || 'Error al restaurar el respaldo.' });
            }
        } catch (err) {
            console.error('Error al restaurar:', err);
            setResultado({ tipo: 'error', mensaje: 'Error de conexión al intentar restaurar el respaldo.' });
        } finally {
            setLoadingRestore(false);
        }
    };

    // Reiniciar base de datos a ceros
    const handleResetDatabase = async () => {
        if (!claveReset.trim()) {
            alert('⚠️ La clave para reiniciar el sistema es requerida.');
            return;
        }
        if (!confirm('🚨 ADVERTENCIA CRÍTICA:\n\nEsta acción es irreversible y borrará permanentemente todas las visitas, formularios de los módulos y archivos PDF firmados del servidor.\n\n¿Estás seguro de que deseas continuar?')) return;

        setLoadingReset(true);
        setResultado(null);
        try {
            const res = await apiFetch('/api/superadmin/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmacion: claveReset.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.removeItem('visitaActiva');
                localStorage.removeItem('seiot_visitas_recientes');
                setResultado({ tipo: 'success', mensaje: data.mensaje });
                setClaveReset('');
            } else {
                setResultado({ tipo: 'error', mensaje: data.error });
            }
        } catch {
            setResultado({ tipo: 'error', mensaje: 'Error de red al conectar con el servidor.' });
        } finally {
            setLoadingReset(false);
        }
    };

    // Helpers Bitácora
    const obtenerBadgeAccion = (accion) => {
        switch (accion) {
            case 'INICIO_SESION':
                return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
            case 'CREAR_USUARIO':
            case 'CREAR_VISITA':
                return 'bg-sky-500/10 border border-sky-500/30 text-sky-400';
            case 'GUARDAR_MODULO':
            case 'CONFIGURAR_FOLIOS':
                return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
            case 'MODIFICAR_USUARIO':
            case 'CAMBIO_CONTRASEÑA':
            case 'ACTIVAR_USUARIO':
                return 'bg-purple-500/10 border border-purple-500/30 text-purple-400';
            case 'DESACTIVAR_USUARIO':
            case 'ELIMINAR_PDF_FIRMADO':
                return 'bg-rose-500/10 border border-rose-500/30 text-rose-400';
            case 'REINICIAR_SISTEMA':
            case 'RESTAURAR_SISTEMA':
                return 'bg-red-500/20 border border-red-500/50 text-red-300 font-extrabold';
            default:
                return 'bg-slate-500/10 border border-slate-500/30 text-slate-400';
        }
    };

    const formatearAccion = (accion) => {
        return accion.replace(/_/g, ' ');
    };

    const obtenerDescripcionAmigable = (log) => {
        const uNombre = log.real_usuario_nombre || log.usuario_nombre || log.real_usuario_username || log.usuario_username || 'Sistema';
        const d = log.detalles || {};
        
        switch (log.accion) {
            case 'INICIO_SESION':
                return `Inicio de sesión exitoso. IP: ${d.ip || 'N/A'}`;
            case 'CREAR_USUARIO':
                return `Creó al usuario "${d.nombre_creado}" (${d.usuario_creado}) con el rol de "${d.rol}"`;
            case 'MODIFICAR_USUARIO':
                return `Actualizó los permisos/datos de "${d.nombre_editado}"`;
            case 'CAMBIO_CONTRASEÑA':
                return d.cambiado_por_admin 
                    ? `Restableció la contraseña de otro usuario` 
                    : `Actualizó su propia contraseña de acceso`;
            case 'DESACTIVAR_USUARIO':
                return `Desactivó al usuario "${d.nombre_desactivado || ''}"`;
            case 'ACTIVAR_USUARIO':
                return `Activó al usuario "${d.nombre_afectado || ''}"`;
            case 'CREAR_VISITA':
                return `Inició visita con folio ${d.folio} (PSG: ${d.psg})`;
            case 'FINALIZAR_VISITA':
                return `Finalizó la visita con folio ${d.folio} (PSG: ${d.psg})`;
            case 'GUARDAR_MODULO':
                return `Guardó cambios del Módulo ${d.modulo} (Folio: ${d.folio})`;
            case 'SUBIR_PDF_FIRMADO':
                return `Subió PDF firmado del Módulo ${d.modulo} (Folio: ${d.folio})`;
            case 'ELIMINAR_PDF_FIRMADO':
                return `Eliminó PDF firmado del Módulo ${d.modulo} (Folio: ${d.folio})`;
            case 'REINICIAR_SISTEMA':
                return `Ejecutó un reinicio de fábrica de la base de datos`;
            case 'GENERAR_RESPALDO':
                return `Descargó un respaldo de seguridad completo (JSON)`;
            case 'RESTAURAR_SISTEMA':
                return `Restauró el estado del sistema desde un archivo de respaldo`;
            case 'CONFIGURAR_FOLIOS':
                return `Actualizó nomenclatura de folios a: "${d.nomenclatura}"`;
            default:
                return 'Realizó una actividad general en el sistema';
        }
    };

    if (!usuario?.superadmin) return null;

    const totalPaginas = Math.ceil(totalLogs / logsPorPagina) || 1;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
            <Navbar />

            <div className="max-w-5xl mx-auto p-6 md:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-red-500 shadow-lg shadow-red-950/20">
                            <ShieldAlert size={36} />
                        </div>
                        <div>
                            <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                                Seguridad Crítica
                            </span>
                            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Panel de SuperAdmin</h1>
                        </div>
                    </div>

                    {/* Selector de Pestañas */}
                    <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex shadow-inner">
                        <button
                            onClick={() => { setTabActiva('mantenimiento'); setResultado(null); }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                tabActiva === 'mantenimiento' 
                                    ? 'bg-blue-600 text-white shadow' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <RefreshCw size={12} className="inline mr-1.5" /> Mantenimiento
                        </button>
                        <button
                            onClick={() => { setTabActiva('auditoria'); setResultado(null); }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                tabActiva === 'auditoria' 
                                    ? 'bg-blue-600 text-white shadow' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <BookOpen size={12} className="inline mr-1.5" /> Bitácora (Auditoría)
                        </button>
                    </div>
                </div>

                {/* Mensaje de resultado de acciones */}
                {resultado && (
                    <div className={`p-4 rounded-xl border mb-8 text-sm font-bold flex items-center gap-3 animate-fade-in ${
                        resultado.tipo === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                        <span>{resultado.tipo === 'success' ? '✅' : '⚠️'}</span>
                        <p>{resultado.mensaje}</p>
                    </div>
                )}

                {/* PESTAÑA 1: MANTENIMIENTO */}
                {tabActiva === 'mantenimiento' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* COLUMNA 1: RESPALDOS Y RESTAURACIÓN */}
                            <div className="bg-slate-850 border border-slate-700/50 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                                        <RefreshCw className="text-blue-400" size={24} />
                                        <div>
                                            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Respaldos y Restauración</h2>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Administra la base de datos de SEIOT.</p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-slate-350 text-xs leading-relaxed mb-6">
                                        Descarga copias de seguridad integrales en formato <strong>.ZIP</strong> (incluyen la base de datos completa y todos los archivos PDF firmados). Al cargar un paquete <strong>.ZIP</strong>, el sistema recupera automáticamente tanto los registros como los documentos físicos.
                                    </p>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">Clave de Seguridad (Respaldo)</label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                <input
                                                    type="password"
                                                    value={claveBackup}
                                                    onChange={(e) => setClaveBackup(e.target.value)}
                                                    placeholder="Clave para respaldos..."
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono outline-none focus:border-blue-500 text-blue-300 uppercase transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-700/30">
                                            <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">Archivo de Restauración (.ZIP o .JSON)</label>
                                            <input
                                                id="backup-file-input"
                                                type="file"
                                                accept=".zip,.json"
                                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:bg-slate-700/80 file:text-white hover:file:bg-slate-700 file:cursor-pointer bg-slate-950 border border-slate-700/60 p-2 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    <button
                                        onClick={handleDownloadBackup}
                                        disabled={!claveBackup.trim() || loadingBackup}
                                        className={`font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 ${
                                            claveBackup.trim() 
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-950/40' 
                                                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                                        }`}
                                    >
                                        {loadingBackup ? (
                                            <>
                                                <Loader2 className="animate-spin" size={14} /> GENERANDO...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={14} /> DESCARGAR RESPALDO
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleRestoreDatabase}
                                        disabled={!claveBackup.trim() || !selectedFile || loadingRestore}
                                        className={`font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 ${
                                            (claveBackup.trim() && selectedFile) 
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/40' 
                                                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                                        }`}
                                    >
                                        {loadingRestore ? (
                                            <>
                                                <Loader2 className="animate-spin" size={14} /> RESTAURANDO...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={14} /> RESTAURAR SISTEMA
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {/* COLUMNA 2: RESETEO GENERAL (ACCIÓN DESTRUCTIVA) */}
                            <div className="bg-slate-850 border border-slate-700/50 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                                        <Trash2 className="text-red-500" size={24} />
                                        <div>
                                            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Reinicio de Fábrica</h2>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Acción administrativa irreversible.</p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-slate-350 text-xs leading-relaxed mb-6">
                                        Borra permanentemente todas las visitas registradas, formularios de módulos de supervisión e historial de navegación. Conserva intactos el catálogo de productores (PSG) y supervisores activos.
                                    </p>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">Clave de Seguridad (Reinicio)</label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                <input
                                                    type="password"
                                                    value={claveReset}
                                                    onChange={(e) => setClaveReset(e.target.value)}
                                                    placeholder="Clave para reinicio..."
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono outline-none focus:border-red-500 text-red-300 uppercase transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleResetDatabase}
                                    disabled={!claveReset.trim() || loadingReset}
                                    className={`w-full font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 mt-8 ${
                                        claveReset.trim() 
                                            ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md shadow-red-950/40' 
                                            : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                                    }`}
                                >
                                    {loadingReset ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} /> PROCESANDO LIMPIEZA...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={14} /> REINICIAR SISTEMA A CEROS
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>

                        {/* SECCIÓN: NOMENCLATURA Y GESTIÓN DE FOLIOS */}
                        <div className="bg-slate-850 border border-slate-700/50 p-8 rounded-3xl shadow-xl">
                            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-700/50">
                                <KeyRound className="text-yellow-500" size={24} />
                                <div>
                                    <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Nomenclatura y Asignación de Folios</h2>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Controla la estructura y el consecutivo de los expedientes.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveConfigFolios} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    
                                    {/* NOMENCLATURA */}
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                                            Nomenclatura del Folio
                                        </label>
                                        <input
                                            type="text"
                                            value={nomenclatura}
                                            onChange={(e) => setNomenclatura(e.target.value)}
                                            placeholder="Ej: SDR/{PSG}/{ANIO}/{CONSECUTIVO}"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:border-yellow-500 transition-all font-mono text-slate-200"
                                            required
                                        />
                                        <div className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                                            <span className="font-bold text-slate-400">Etiquetas dinámicas:</span>
                                            <code className="text-yellow-500/80 bg-slate-950 px-1 py-0.5 rounded ml-1 font-mono">{`{PSG}`}</code> (Clave PSG), 
                                            <code className="text-yellow-500/80 bg-slate-950 px-1 py-0.5 rounded ml-1 font-mono">{`{ANIO}`}</code> (Año actual), 
                                            <code className="text-yellow-500/80 bg-slate-950 px-1 py-0.5 rounded ml-1 font-mono">{`{CONSECUTIVO}`}</code> (Secuencia).
                                        </div>
                                    </div>

                                    {/* NÚMERO CONSECUTIVO */}
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                                            Consecutivo Siguiente
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={consecutivo}
                                            onChange={(e) => setConsecutivo(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:border-yellow-500 transition-all font-mono text-slate-200"
                                            required
                                        />
                                        <p className="mt-2 text-[9px] text-slate-500 leading-relaxed font-semibold">
                                            Define el número a partir del cual continuará.
                                        </p>
                                    </div>

                                    {/* LONGITUD CONSECUTIVO */}
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                                            Longitud del Consecutivo
                                        </label>
                                        <select
                                            value={longitudConsecutivo}
                                            onChange={(e) => setLongitudConsecutivo(parseInt(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs outline-none focus:border-yellow-500 transition-all font-sans text-slate-300 font-bold"
                                        >
                                            <option value={1}>1 dígito (Ej: 1)</option>
                                            <option value={2}>2 dígitos (Ej: 01)</option>
                                            <option value={3}>3 dígitos (Ej: 001)</option>
                                            <option value={4}>4 dígitos (Ej: 0001)</option>
                                            <option value={5}>5 dígitos (Ej: 00001)</option>
                                        </select>
                                    </div>

                                    {/* PREVISUALIZACIÓN */}
                                    <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Vista previa de folio generado:</span>
                                        <div className="text-sm font-mono text-yellow-450 font-bold tracking-tight mt-1 overflow-x-auto whitespace-nowrap">
                                            {generarPreviewFolio()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={loadingConfig}
                                        className="bg-yellow-600 hover:bg-yellow-700 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-xs tracking-wider transition-all active:scale-95"
                                    >
                                        {loadingConfig ? (
                                            <>
                                                <Loader2 className="animate-spin" size={14} /> GUARDANDO...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={14} /> GUARDAR NOMENCLATURA
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* PESTAÑA 2: BITÁCORA DE AUDITORÍA */}
                {tabActiva === 'auditoria' && (
                    <div className="space-y-6">
                        
                        {/* SECCIÓN DE FILTROS */}
                        <div className="bg-slate-850 border border-slate-750 p-6 rounded-3xl shadow-xl">
                            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-800">
                                <Filter size={18} className="text-blue-400" />
                                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Filtros de Búsqueda</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Filtro por Usuario */}
                                <div>
                                    <label className="block text-[9px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Usuario Responsable</label>
                                    <select
                                        value={filtroUsuario}
                                        onChange={(e) => { setFiltroUsuario(e.target.value); setPagina(1); }}
                                        className="w-full bg-slate-950 border border-slate-750 p-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">-- Todos --</option>
                                        {usuariosList.map(u => (
                                            <option key={u.id} value={u.id}>{u.nombre} ({u.usuario})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por Acción */}
                                <div>
                                    <label className="block text-[9px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Tipo de Acción</label>
                                    <select
                                        value={filtroAccion}
                                        onChange={(e) => { setFiltroAccion(e.target.value); setPagina(1); }}
                                        className="w-full bg-slate-950 border border-slate-750 p-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">-- Todas --</option>
                                        <option value="INICIO_SESION">Inicios de Sesión</option>
                                        <option value="CREAR_USUARIO">Creación de Usuarios</option>
                                        <option value="MODIFICAR_USUARIO">Modificación de Usuarios</option>
                                        <option value="ACTIVAR_USUARIO">Activación de Usuarios</option>
                                        <option value="DESACTIVAR_USUARIO">Desactivación de Usuarios</option>
                                        <option value="CAMBIO_CONTRASEÑA">Cambios de Contraseña</option>
                                        <option value="CREAR_VISITA">Creación de Visita</option>
                                        <option value="GUARDAR_MODULO">Avance / Guardar Módulo</option>
                                        <option value="FINALIZAR_VISITA">Finalización de Visita</option>
                                        <option value="SUBIR_PDF_FIRMADO">Subir PDF Firmado</option>
                                        <option value="ELIMINAR_PDF_FIRMADO">Eliminar PDF Firmado</option>
                                        <option value="CONFIGURAR_FOLIOS">Configuración de Folio</option>
                                        <option value="GENERAR_RESPALDO">Backup JSON</option>
                                        <option value="RESTAURAR_SISTEMA">Restore JSON</option>
                                        <option value="REINICIAR_SISTEMA">Reinicio General</option>
                                    </select>
                                </div>

                                {/* Filtro Fecha Inicio */}
                                <div>
                                    <label className="block text-[9px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Fecha Desde</label>
                                    <input
                                        type="date"
                                        value={filtroFechaInicio}
                                        onChange={(e) => { setFiltroFechaInicio(e.target.value); setPagina(1); }}
                                        className="w-full bg-slate-950 border border-slate-750 p-2 rounded-xl text-xs font-bold text-slate-350 outline-none focus:border-blue-500 transition-colors font-mono"
                                    />
                                </div>

                                {/* Filtro Fecha Fin */}
                                <div>
                                    <label className="block text-[9px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">Fecha Hasta</label>
                                    <input
                                        type="date"
                                        value={filtroFechaFin}
                                        onChange={(e) => { setFiltroFechaFin(e.target.value); setPagina(1); }}
                                        className="w-full bg-slate-950 border border-slate-750 p-2 rounded-xl text-xs font-bold text-slate-350 outline-none focus:border-blue-500 transition-colors font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LISTADO DE EVENTOS */}
                        <div className="bg-slate-850 border border-slate-750 rounded-3xl shadow-xl overflow-hidden">
                            {loadingLogs ? (
                                <div className="p-20 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                    <span className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">Obteniendo bitácora...</span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                                    <Search size={32} className="text-slate-650" />
                                    <span className="text-xs font-bold uppercase tracking-wider">No se encontraron registros de auditoría</span>
                                    <p className="text-[10px] text-slate-600 mt-1 max-w-sm">Intenta cambiando los criterios de búsqueda o remueve los filtros activos.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-slate-300 font-sans text-xs">
                                        <thead className="bg-slate-950/80 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-850 tracking-wider">
                                            <tr>
                                                <th className="p-4 pl-6">Fecha / Hora</th>
                                                <th className="p-4">Usuario</th>
                                                <th className="p-4">Acción</th>
                                                <th className="p-4">Descripción</th>
                                                <th className="p-4 text-center pr-6">Detalles</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 bg-transparent">
                                            {logs.map((log) => {
                                                const uNombre = log.real_usuario_nombre || log.usuario_nombre || 'Sistema';
                                                const uUser = log.real_usuario_username || log.usuario_username || 'sys';
                                                
                                                return (
                                                    <tr key={log.id} className="hover:bg-slate-800/25 transition-colors">
                                                        <td className="p-4 pl-6 whitespace-nowrap font-mono text-[10px] text-slate-400">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={12} className="text-slate-500" />
                                                                {new Date(log.creado_en).toLocaleString('es-MX', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    second: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap font-semibold">
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-200">{uNombre}</span>
                                                                <span className="text-[10px] text-slate-500 font-mono">@{uUser}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${obtenerBadgeAccion(log.accion)}`}>
                                                                {formatearAccion(log.accion)}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 leading-relaxed max-w-sm truncate text-slate-350">
                                                            {obtenerDescripcionAmigable(log)}
                                                        </td>
                                                        <td className="p-4 text-center pr-6 whitespace-nowrap">
                                                            <button
                                                                onClick={() => setLogSeleccionado(log)}
                                                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-450 border border-slate-750 transition-all active:scale-95"
                                                                title="Ver metadatos JSON completos"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Paginación */}
                            {logs.length > 0 && (
                                <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
                                    <span>
                                        Mostrando registros del {(pagina - 1) * logsPorPagina + 1} al {Math.min(pagina * logsPorPagina, totalLogs)} de {totalLogs}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPagina(p => Math.max(1, p - 1))}
                                            disabled={pagina === 1 || loadingLogs}
                                            className="p-2 rounded-xl bg-slate-850 border border-slate-750 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="font-mono px-3">
                                            Página {pagina} de {totalPaginas}
                                        </span>
                                        <button
                                            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                                            disabled={pagina === totalPaginas || loadingLogs}
                                            className="p-2 rounded-xl bg-slate-850 border border-slate-750 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* MODAL DETALLES LOG JSON */}
                {logSeleccionado && (
                    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-750 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in relative flex flex-col max-h-[85vh]">
                            
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-200">
                                    <Clock size={16} className="text-blue-450" />
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider">Detalles Técnicos del Evento</h3>
                                </div>
                                <button
                                    onClick={() => setLogSeleccionado(null)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                                    <div>
                                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">ID Registro Log</span>
                                        <span className="font-mono font-bold text-slate-300">#{logSeleccionado.id}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Acción</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${obtenerBadgeAccion(logSeleccionado.accion)} inline-block mt-0.5`}>
                                            {logSeleccionado.accion}
                                        </span>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-slate-800/40">
                                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Responsable</span>
                                        <span className="font-bold text-slate-300">
                                            {logSeleccionado.real_usuario_nombre || logSeleccionado.usuario_nombre || 'Sistema'}{' '}
                                            <span className="text-slate-500 font-mono font-normal">(@{logSeleccionado.real_usuario_username || logSeleccionado.usuario_username || 'sys'})</span>
                                        </span>
                                    </div>
                                    {logSeleccionado.tabla_afectada && (
                                        <div className="pt-2 border-t border-slate-800/40">
                                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Tabla Afectada</span>
                                            <span className="font-mono text-slate-300">{logSeleccionado.tabla_afectada}</span>
                                        </div>
                                    )}
                                    {logSeleccionado.registro_id && (
                                        <div className="pt-2 border-t border-slate-800/40">
                                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">ID Registro Relacionado</span>
                                            <span className="font-mono text-slate-300">{logSeleccionado.registro_id}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block pl-1">Metadatos del Evento (JSON)</span>
                                    <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono text-[10px] text-blue-400 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                                        {JSON.stringify(logSeleccionado.detalles || {}, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex justify-end">
                                <button
                                    onClick={() => setLogSeleccionado(null)}
                                    className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95"
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

export default SuperAdminPanel;
