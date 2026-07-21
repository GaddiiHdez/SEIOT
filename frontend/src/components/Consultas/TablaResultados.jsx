import React from 'react';
import { Download, CheckCircle, Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const TablaResultados = ({
    resultados,
    totalResultados,
    paginaActual,
    limitePorPagina,
    buscando,
    exportando,
    handleExportar,
    abrirVisita,
    abrirDetalleModal,
    cambiarPagina,
    esFinalizado
}) => {
    return (
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
    );
};

export default TablaResultados;
