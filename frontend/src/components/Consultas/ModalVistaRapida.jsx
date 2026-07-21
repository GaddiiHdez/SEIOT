import React from 'react';
import { FileText, X, Check, FileSignature, Download, Loader2, ArrowRight } from 'lucide-react';

const ModalVistaRapida = ({
    visitaDetalle,
    setVisitaDetalle,
    statusFirmas,
    descargandoPdfId,
    descargarPdfEspecifico,
    verPdfFirmadoEspecifico,
    abrirVisita
}) => {
    if (!visitaDetalle) return null;

    return (
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
    );
};

export default ModalVistaRapida;
