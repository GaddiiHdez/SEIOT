import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api.js';
import { ShieldAlert, Trash2, AlertTriangle, KeyRound, Loader2, Download, Upload, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';

const SuperAdminPanel = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    
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

    const CLAVE_RESET = 'RESET-DATOS-SEIOT';
    const CLAVE_BACKUP = 'RESPALDO-DATOS-SEIOT';

    useEffect(() => {
        // Bloquear acceso si no es SuperAdmin
        if (!usuario?.superadmin) {
            navigate('/dashboard');
        }
    }, [usuario, navigate]);

    // Función: Descargar Respaldo JSON
    const handleDownloadBackup = async () => {
        if (claveBackup.trim() !== CLAVE_BACKUP) {
            alert('⚠️ La clave para respaldos es incorrecta.');
            return;
        }

        setLoadingBackup(true);
        setResultado(null);
        try {
            const res = await apiFetch('/api/auth/superadmin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmacion: claveBackup.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                
                // Generar la descarga del archivo en el navegador
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
                const downloadAnchor = document.createElement('a');
                const fecha = new Date().toISOString().split('T')[0];
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `respaldo_seiot_${fecha}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();

                setResultado({ tipo: 'success', mensaje: 'Respaldo generado y descargado correctamente.' });
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

    // Función: Cargar y Restaurar Respaldo
    const handleRestoreDatabase = () => {
        if (claveBackup.trim() !== CLAVE_BACKUP) {
            alert('⚠️ La clave para respaldos es incorrecta.');
            return;
        }

        if (!selectedFile) {
            alert('⚠️ Selecciona un archivo JSON de respaldo para continuar.');
            return;
        }

        if (!confirm('🚨 ATENCIÓN CRÍTICA:\n\nAl restaurar este respaldo, se eliminarán todos los registros actuales de la base de datos de manera definitiva y se sobrescribirán con el contenido del archivo.\n\n¿Estás seguro de que deseas proceder con la restauración?')) {
            return;
        }

        setLoadingRestore(true);
        setResultado(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                const res = await apiFetch('/api/auth/superadmin/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        confirmacion: claveBackup.trim(),
                        backupData
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    // Limpiar local storage y forzar logout o recarga
                    localStorage.removeItem('visitaActiva');
                    localStorage.removeItem('seiot_visitas_recientes');
                    setResultado({ tipo: 'success', mensaje: 'Sistema restaurado con éxito. ' + data.mensaje });
                    setClaveBackup('');
                    setSelectedFile(null);
                    
                    // Resetear input file visualmente
                    const fileInput = document.getElementById('backup-file-input');
                    if (fileInput) fileInput.value = '';
                } else {
                    setResultado({ tipo: 'error', mensaje: data.error });
                }
            } catch (err) {
                setResultado({ tipo: 'error', mensaje: 'El archivo seleccionado no es un formato JSON válido.' });
            } finally {
                setLoadingRestore(false);
            }
        };
        reader.readAsText(selectedFile);
    };

    // Función: Reiniciar a ceros
    const handleResetDatabase = async () => {
        if (claveReset.trim() !== CLAVE_RESET) {
            alert('⚠️ La clave para reiniciar el sistema es incorrecta.');
            return;
        }

        if (!confirm('🚨 ADVERTENCIA CRÍTICA:\n\nEsta acción es irreversible y borrará permanentemente todas las visitas, formularios de los módulos y archivos PDF firmados del servidor.\n\n¿Estás seguro de que deseas continuar?')) return;

        setLoadingReset(true);
        setResultado(null);
        try {
            const res = await apiFetch('/api/auth/superadmin/reset', {
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

    if (!usuario?.superadmin) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
            <Navbar />

            <div className="max-w-5xl mx-auto p-6 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-red-500">
                        <ShieldAlert size={36} />
                    </div>
                    <div>
                        <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                            Seguridad Crítica
                        </span>
                        <h1 className="text-2xl font-extrabold tracking-tight mt-1">Panel de Mantenimiento</h1>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* COLUMNA 1: RESPALDOS Y RESTAURACIÓN */}
                    <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                                <RefreshCw className="text-blue-400" size={24} />
                                <div>
                                    <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">Respaldos y Restauración</h2>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Administra la base de datos de SEIOT.</p>
                                </div>
                            </div>
                            
                            <p className="text-slate-350 text-xs leading-relaxed mb-6">
                                Descarga copias de seguridad de todas las visitas, formularios, documentos firmados y cuentas de usuario. También puedes cargar un archivo de respaldo previo para restaurar el estado del sistema.
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
                                    <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">Archivo de Restauración (.JSON)</label>
                                    <input
                                        id="backup-file-input"
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:bg-slate-700/80 file:text-white hover:file:bg-slate-700 file:cursor-pointer bg-slate-950 border border-slate-700/60 p-2 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            <button
                                onClick={handleDownloadBackup}
                                disabled={claveBackup.trim() !== CLAVE_BACKUP || loadingBackup}
                                className={`font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 ${
                                    claveBackup.trim() === CLAVE_BACKUP 
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
                                disabled={claveBackup.trim() !== CLAVE_BACKUP || !selectedFile || loadingRestore}
                                className={`font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 ${
                                    (claveBackup.trim() === CLAVE_BACKUP && selectedFile) 
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
                    <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
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
                            disabled={claveReset.trim() !== CLAVE_RESET || loadingReset}
                            className={`w-full font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 mt-8 ${
                                claveReset.trim() === CLAVE_RESET 
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
            </div>
        </div>
    );
};

export default SuperAdminPanel;
