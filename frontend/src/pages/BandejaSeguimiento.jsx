import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building, ShieldAlert, FileText, CheckCircle2, Clock, Search, 
    ExternalLink, LogOut, RefreshCw, AlertCircle, Award, Scale 
} from 'lucide-react';
import logoGobierno from '../assets/logo-gobierno.jpg';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const INSTANCIAS_MAP = {
    seder_juridico: 'Dirección Jurídica de la SEDER',
    cefppenay: 'CEFPPENAY',
    senasica: 'SENASICA',
    test_henry: 'Supervisión Técnica (Pruebas - Henry Hernández)'
};

const BandejaSeguimiento = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const [expedientes, setExpedientes] = useState([]);
    const [instancia, setInstancia] = useState('');
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [error, setError] = useState(null);

    const cargarExpedientes = async () => {
        setCargando(true);
        setError(null);
        try {
            const res = await apiFetch('/api/modulos/seguimiento/mis-expedientes');
            if (!res) return;
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'No fue posible consultar los expedientes asignados.');
            }
            const data = await res.json();
            setExpedientes(data.expedientes || []);
            setInstancia(data.instancia || usuario?.instancia || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarExpedientes();
    }, []);

    // Filtros de búsqueda y estatus
    const expedientesFiltrados = expedientes.filter(exp => {
        const matchBusqueda = 
            (exp.folio || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (exp.psg || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (exp.razon_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (exp.municipio || '').toLowerCase().includes(busqueda.toLowerCase());

        if (!matchBusqueda) return false;

        if (filtroEstatus === 'pendientes') {
            return !exp.seguimiento_atendido;
        }
        if (filtroEstatus === 'atendidos') {
            return exp.seguimiento_atendido;
        }
        return true;
    });

    const totalAtendidos = expedientes.filter(e => e.seguimiento_atendido).length;
    const totalPendientes = expedientes.length - totalAtendidos;

    const dictamenColorMap = {
        SOLVENTADO: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        REQUERIMIENTO: 'bg-amber-100 text-amber-800 border-amber-300',
        PROCEDIMIENTO: 'bg-rose-100 text-rose-800 border-rose-300',
        EN_TRAMITE: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    return (
        <div className="min-h-screen bg-slate-50 text-gray-800 pb-16">
            {/* Encabezado Institucional */}
            <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white shadow-lg border-b-4 border-[#BC955B]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-1.5 rounded-lg shadow-xs">
                            <img src={logoGobierno} alt="Gobierno de Nayarit" className="h-10 w-auto object-contain" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-wide uppercase">Secretaría de Desarrollo Rural</h1>
                            <p className="text-xs text-[#BC955B] font-semibold tracking-wider uppercase">
                                SEIOT — Portal Institucional de Seguimiento y Dictamen
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-white font-bold">{usuario?.nombre || usuario?.usuario}</p>
                            <p className="text-[11px] text-[#BC955B] font-medium">
                                {INSTANCIAS_MAP[instancia] || INSTANCIAS_MAP[usuario?.instancia] || 'Dependencia Oficial'}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar Sesión"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                            <LogOut size={14} /> Salir
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-8 space-y-6">
                {/* Banner de bienvenida e instancia */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 text-xs font-bold uppercase tracking-wider">
                                Dependencia Asignada
                            </span>
                            <h2 className="text-lg font-bold text-gray-900">
                                {INSTANCIAS_MAP[instancia] || INSTANCIAS_MAP[usuario?.instancia] || 'Bandeja de Entrada'}
                            </h2>
                        </div>
                        <p className="text-xs text-gray-600">
                            Expedientes de supervisión pecuaria canalizados exclusivamente a su dependencia para análisis y resolución legal/técnica.
                        </p>
                    </div>

                    {/* Métricas rápidas */}
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50 border border-gray-200 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
                            <span className="text-xs text-gray-500 font-semibold block">Total</span>
                            <span className="text-lg font-bold text-gray-900">{expedientes.length}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
                            <span className="text-xs text-amber-700 font-semibold block">Pendientes</span>
                            <span className="text-lg font-bold text-amber-900">{totalPendientes}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
                            <span className="text-xs text-emerald-700 font-semibold block">Atendidos</span>
                            <span className="text-lg font-bold text-emerald-900">{totalAtendidos}</span>
                        </div>
                    </div>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-96">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por folio, PSG, titular o municipio..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs outline-none focus:border-red-800 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <select
                            value={filtroEstatus}
                            onChange={(e) => setFiltroEstatus(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-gray-300 rounded-lg text-xs font-medium outline-none focus:border-red-800"
                        >
                            <option value="todos">Todos los expedientes ({expedientes.length})</option>
                            <option value="pendientes">Pendientes de dictamen ({totalPendientes})</option>
                            <option value="atendidos">Con dictamen emitido ({totalAtendidos})</option>
                        </select>

                        <button
                            onClick={cargarExpedientes}
                            disabled={cargando}
                            title="Recargar"
                            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-600 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Tabla de Expedientes */}
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                    {cargando ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs text-gray-600 font-semibold">Consultando expedientes canalizados...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-xs text-rose-600 space-y-2">
                            <AlertCircle size={24} className="mx-auto" />
                            <p className="font-bold">{error}</p>
                            <button
                                onClick={cargarExpedientes}
                                className="px-3 py-1.5 bg-red-800 text-white rounded font-bold hover:bg-red-900"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : expedientesFiltrados.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-xs">
                            <FileText size={36} className="mx-auto text-gray-300 mb-2" />
                            <p className="font-bold text-gray-700">No se encontraron expedientes asignados.</p>
                            <p className="text-gray-400 mt-0.5">
                                {busqueda ? 'Ningún expediente coincide con el criterio de búsqueda.' : 'No hay visitas de supervisión pendientes de revisión para esta dependencia.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[11px]">
                                        <th className="py-3 px-4">Folio de Visita</th>
                                        <th className="py-3 px-4">Fecha Supervisión</th>
                                        <th className="py-3 px-4">PSG / Razón Social</th>
                                        <th className="py-3 px-4">Municipio / Localidad</th>
                                        <th className="py-3 px-4">Estatus Dictamen</th>
                                        <th className="py-3 px-4 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expedientesFiltrados.map((exp) => {
                                        const atendido = exp.seguimiento_atendido;
                                        const dictamen = exp.dictamen_seguimiento;
                                        const fechaVisita = exp.fecha_supervision ? new Date(exp.fecha_supervision).toLocaleDateString('es-MX') : (exp.m3_fecha || 'N/D');

                                        return (
                                            <tr key={exp.visita_id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 px-4 font-mono font-bold text-red-950">
                                                    {exp.folio}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {fechaVisita}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-gray-900 block">{exp.razon_social || 'Titular no registrado'}</span>
                                                    <span className="text-[11px] font-mono text-gray-500">PSG: {exp.psg}</span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    <span>{exp.municipio || 'N/D'}</span>
                                                    {exp.localidad && <span className="text-gray-400 block text-[11px]">{exp.localidad}</span>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {atendido ? (
                                                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border inline-flex items-center gap-1 ${dictamenColorMap[dictamen] || 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                                                            <CheckCircle2 size={11} /> {dictamen || 'ATENDIDO'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                                            <Clock size={11} /> PENDIENTE DE DICTAMEN
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            const queryParams = new URLSearchParams();
                                                            if (exp.token_seguimiento) queryParams.set('token', exp.token_seguimiento);
                                                            if (exp.visita_id) queryParams.set('visita_id', exp.visita_id);
                                                            navigate(`/seguimiento/expediente?${queryParams.toString()}`);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
                                                    >
                                                        <Scale size={13} /> Revisar y Dictaminar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BandejaSeguimiento;
