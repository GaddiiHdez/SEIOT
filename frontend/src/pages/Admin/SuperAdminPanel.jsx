import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api.js';
import { ShieldAlert, Trash2, AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';

const SuperAdminPanel = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const [confirmInput, setConfirmInput] = useState('');
    const [loadingReset, setLoadingReset] = useState(false);
    const [resultado, setResultado] = useState(null);

    const CLAVE_MAESTRA = 'RESET-DATOS-SEIOT';
    const esClaveValida = confirmInput.trim() === CLAVE_MAESTRA;

    useEffect(() => {
        // Bloquear acceso si no es SuperAdmin
        if (!usuario?.superadmin) {
            navigate('/dashboard');
        }
    }, [usuario, navigate]);

    const handleResetDatabase = async () => {
        if (!esClaveValida) return;
        if (!confirm('🚨 ADVERTENCIA CRÍTICA:\n\nEsta acción es irreversible y borrará permanentemente todas las visitas, formularios de los módulos y archivos PDF firmados del servidor.\n\n¿Estás seguro de que deseas continuar?')) return;

        setLoadingReset(true);
        setResultado(null);
        try {
            const res = await apiFetch('/api/auth/superadmin/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmacion: confirmInput.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                // Limpiar contexto local del navegador
                localStorage.removeItem('visitaActiva');
                localStorage.removeItem('seiot_visitas_recientes');
                setResultado({ tipo: 'success', mensaje: data.mensaje });
                setConfirmInput('');
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
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            <Navbar />

            <div className="max-w-3xl mx-auto p-6 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-red-500">
                        <ShieldAlert size={36} />
                    </div>
                    <div>
                        <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                            Seguridad Crítica
                        </span>
                        <h1 className="text-2xl font-extrabold tracking-tight mt-1">Mantenimiento del SuperAdmin</h1>
                    </div>
                </div>

                {/* Mensaje de resultado de acciones */}
                {resultado && (
                    <div className={`p-4 rounded-xl border mb-6 text-sm font-bold flex items-center gap-3 animate-fade-in ${
                        resultado.tipo === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                        <span>{resultado.tipo === 'success' ? '✅' : '⚠️'}</span>
                        <p>{resultado.mensaje}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {/* Caja de confirmación de seguridad */}
                    <div className="bg-slate-800/40 backdrop-blur border border-slate-700/50 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <KeyRound className="text-amber-500 shrink-0 mt-0.5" size={24} />
                            <div>
                                <h3 className="font-bold text-sm text-slate-200">Autorización Requerida</h3>
                                <p className="text-slate-400 text-xs mt-1">Escribe la frase clave de confirmación de seguridad para desbloquear la acción destructiva del panel.</p>
                            </div>
                        </div>
                        <input
                            type="password"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            placeholder="Frase de confirmación..."
                            className="w-full md:w-80 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-amber-500 text-amber-300 uppercase transition-all"
                        />
                    </div>

                    {/* Ficha única de acción destructiva */}
                    <div className="bg-slate-800/25 border border-slate-700/40 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                        <div>
                            <div className="flex items-center gap-2.5 text-red-500 mb-4">
                                <Trash2 size={20} />
                                <h2 className="font-extrabold text-sm uppercase tracking-wider">Vaciar Datos de Supervisión</h2>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed mb-6">
                                Esta acción truncará todas las visitas, formularios, actas e historial en la base de datos de Neon y borrará todos los PDFs firmados del servidor.
                                <span className="block font-bold text-amber-500/90 mt-2">Nota: Conservará intacto el catálogo de productores (PSG) y supervisores.</span>
                            </p>
                        </div>
                        <button
                            onClick={handleResetDatabase}
                            disabled={!esClaveValida || loadingReset}
                            className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 ${
                                esClaveValida 
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
