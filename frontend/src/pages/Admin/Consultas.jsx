import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api.js';
import { Search, Download, X, ArrowLeft, BarChart2, CheckCircle, Clock, LogOut } from 'lucide-react';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import * as XLSX from 'xlsx';
import Navbar from '../../components/Navbar';

// ─── MUNICIPIOS DE NAYARIT ────────────────────────────────────────────────────
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

// ─── CHIP SELECCIONABLE ───────────────────────────────────────────────────────
const Chip = ({ label, activo, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            activo
                ? 'bg-red-800 text-white border-red-800'
                : 'bg-white text-gray-600 border-gray-300 hover:border-red-700 hover:text-red-700'
        }`}
    >
        {label}
    </button>
);

const Consultas = () => {
    const navigate = useNavigate();
    const { usuario, logout, permisosListos } = useAuth();

    // ─── FILTROS ──────────────────────────────────────────────────────────────
    const [psgInput, setPsgInput] = useState('');
    const [municipiosSeleccionados, setMunicipiosSeleccionados] = useState([]);
    const [estatusSeleccionados, setEstatusSeleccionados] = useState([]);
    const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // ─── RESULTADOS ───────────────────────────────────────────────────────────
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [buscado, setBuscado] = useState(false);

    useEffect(() => {
        if (!permisosListos) return;
        const puedeConsultas = usuario?.es_admin || usuario?.permisos?.consultas;
        if (!puedeConsultas) {
            alert('No tienes permiso para acceder a consultas.');
            navigate('/dashboard');
        }
    }, [usuario, permisosListos, navigate]);

    // ─── TOGGLE HELPERS ───────────────────────────────────────────────────────
    const toggleItem = (lista, setLista, valor) => {
        setLista(prev =>
            prev.includes(valor) ? prev.filter(v => v !== valor) : [...prev, valor]
        );
    };

    // ─── CONSTRUIR PARAMS ─────────────────────────────────────────────────────
    const construirParams = (soloFiltrados = false) => {
        const params = new URLSearchParams();
        if (psgInput.trim()) {
            // Si contiene '/' probablemente es un folio, si no es PSG
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
        if (soloFiltrados) params.set('solo_filtrados', 'true');
        return params;
    };

    // ─── BUSCAR ───────────────────────────────────────────────────────────────
    const handleBuscar = async () => {
        setBuscando(true);
        setBuscado(true);
        try {
            const params = construirParams();
            const response = await apiFetch(`/api/psg/consultas?${params}`);
            if (response.ok) {
                const data = await response.json();
                setResultados(data);
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

    // ─── LIMPIAR FILTROS ──────────────────────────────────────────────────────
    const limpiarFiltros = () => {
        setPsgInput('');
        setMunicipiosSeleccionados([]);
        setEstatusSeleccionados([]);
        setModulosSeleccionados([]);
        setFechaDesde('');
        setFechaHasta('');
        setResultados([]);
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

    const modulosCompletados = (row) =>
        [row.modulo1_completado, row.modulo2_completado, row.modulo3_completado,
         row.modulo4_completado, row.modulo5_completado, row.modulo6_completado]
        .filter(Boolean).length;

    const esFinalizado = (row) =>
        row.estado_visita === 'finalizado' ||
        (row.modulo1_completado && row.modulo2_completado && row.modulo3_completado &&
         row.modulo4_completado && row.modulo5_completado && row.modulo6_completado);

    // ─── ABRIR VISITA EN NUEVA PESTAÑA ───────────────────────────────────────
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


    return (
        <div className="min-h-screen bg-gray-100 font-sans">

            <Navbar />

            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* FILTROS */}
                <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 text-sm uppercase">Filtros de búsqueda</h2>
                        <button onClick={limpiarFiltros} className="text-xs text-gray-400 hover:text-red-700 font-bold flex items-center gap-1">
                            <X size={12} /> Limpiar todo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* PSG */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Clave PSG o Folio de Visita</label>
                            <input
                                value={psgInput}
                                onChange={e => setPsgInput(e.target.value.toUpperCase())}
                                placeholder="Ej: 18-017-0002 o SDR/18-017-0002-P02/2026/001"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-red-700 font-mono"
                            />
                        </div>

                        {/* FECHA */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Rango de fecha</label>
                            <div className="flex gap-2 items-center">
                                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-red-700" />
                                <span className="text-gray-400 text-xs font-bold">al</span>
                                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-red-700" />
                            </div>
                        </div>

                        {/* MUNICIPIOS */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                                Municipio {municipiosSeleccionados.length > 0 && <span className="text-red-700">({municipiosSeleccionados.length} seleccionados)</span>}
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-gray-50 rounded border border-gray-200">
                                {MUNICIPIOS.map(m => (
                                    <Chip key={m} label={m}
                                        activo={municipiosSeleccionados.includes(m)}
                                        onClick={() => toggleItem(municipiosSeleccionados, setMunicipiosSeleccionados, m)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ESTATUS */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                                Estatus {estatusSeleccionados.length > 0 && <span className="text-red-700">({estatusSeleccionados.length} seleccionados)</span>}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {ESTATUS_OPTS.filter(e => e.value).map(e => (
                                    <Chip key={e.value} label={e.label}
                                        activo={estatusSeleccionados.includes(e.value)}
                                        onClick={() => toggleItem(estatusSeleccionados, setEstatusSeleccionados, e.value)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* MÓDULOS COMPLETADOS */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                                Módulos completados {modulosSeleccionados.length > 0 && <span className="text-red-700">({modulosSeleccionados.length} seleccionados)</span>}
                            </label>
                            <div className="flex gap-2 flex-wrap">
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
                    <div className="mt-6 flex justify-end">
                        <button onClick={handleBuscar} disabled={buscando}
                            className="bg-red-800 text-white px-8 py-2 rounded shadow hover:bg-red-900 flex items-center gap-2 font-bold text-sm disabled:opacity-60">
                            <Search size={16} /> {buscando ? 'Buscando...' : 'BUSCAR'}
                        </button>
                    </div>
                </div>

                {/* RESULTADOS */}
                {buscado && (
                    <div className="bg-white rounded-xl shadow border border-gray-200">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
                            <p className="font-bold text-gray-700 text-sm">
                                {buscando ? 'Buscando...' : `${resultados.length} resultado(s) encontrado(s)`}
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => handleExportar(true)} disabled={exportando || resultados.length === 0}
                                    className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                                    <Download size={14} /> EXPORTAR RESULTADOS
                                </button>
                                <button onClick={() => handleExportar(false)} disabled={exportando}
                                    className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
                                    <Download size={14} /> EXPORTAR TODO
                                </button>
                            </div>
                        </div>

                        {resultados.length === 0 && !buscando ? (
                            <div className="p-10 text-center text-gray-400 font-bold">No se encontraron visitas con esos filtros.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-3 border-b">Folio</th>
                                            <th className="p-3 border-b">PSG</th>
                                            <th className="p-3 border-b">Razón Social</th>
                                            <th className="p-3 border-b">Municipio</th>
                                            <th className="p-3 border-b">Supervisor</th>
                                            <th className="p-3 border-b">Capturista</th>
                                            <th className="p-3 border-b">Fecha</th>
                                            <th className="p-3 border-b text-center">Módulos</th>
                                            <th className="p-3 border-b text-center">Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resultados.map(row => (
                                            <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="p-3 font-mono text-xs">
                                                    <button onClick={() => abrirVisita(row)} className="text-red-700 font-bold hover:underline hover:text-red-900 transition-colors text-left">{row.folio}</button>
                                                </td>
                                                <td className="p-3 font-mono text-xs">{row.psg}</td>
                                                <td className="p-3 text-xs">{row.razon_social || '—'}</td>
                                                <td className="p-3 text-xs">{row.municipio || '—'}</td>
                                                <td className="p-3 text-xs">{row.supervisor}</td>
                                                <td className="p-3 text-xs">{row.capturista_nombre || '—'}</td>
                                                <td className="p-3 text-xs">{row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString('es-MX') : '—'}</td>
                                                <td className="p-3 text-center">
                                                    <div className="flex gap-1 justify-center">
                                                        {[1,2,3,4,5,6].map(n => (
                                                            <span key={n} className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${row[`modulo${n}_completado`] ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                                {n}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {esFinalizado(row) ? (
                                                        <span className="flex items-center justify-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-200">
                                                            <CheckCircle size={12} /> Finalizado
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center justify-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs font-bold border border-yellow-200">
                                                            <Clock size={12} /> En proceso
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Consultas;