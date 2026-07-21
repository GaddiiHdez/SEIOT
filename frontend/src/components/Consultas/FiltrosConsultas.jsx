import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

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

const FiltrosConsultas = ({
    psgInput, setPsgInput,
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    filtroSupervisor, setFiltroSupervisor,
    filtroCapturista, setFiltroCapturista,
    supervisores, capturistas, usuario,
    municipiosSeleccionados, setMunicipiosSeleccionados,
    estatusSeleccionados, setEstatusSeleccionados,
    modulosSeleccionados, setModulosSeleccionados,
    buscando, iniciarBusqueda, limpiarFiltros, toggleItem,
    MUNICIPIOS, ESTATUS_OPTS, MODULOS_OPTS
}) => {
    return (
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
    );
};

export default FiltrosConsultas;
