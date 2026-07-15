import React from 'react';

const ManualGeneral = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-slate-800">Conceptos Clave de SEIOT</h2>
                <p className="text-xs text-slate-500 mt-1">Antes de operar, comprende las bases y nomenclatura del sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Clave de Productor (PSG)</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Es la clave nacional de identificación del **Padrón Ganadero Único** (ej: 18-017-0002-P02). El sistema valida esta clave en tiempo real contra el padrón del estado antes de permitir el inicio de cualquier visita de inspección.
                    </p>
                </div>
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Folio de Visita</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Identificador único de control de supervisión generado secuencialmente por el backend. Garantiza el registro ordenado y la trazabilidad de los documentos firmados y expedidos.
                    </p>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
                <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-3">La Barra de Avance y Conclusión Modular</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    Cada visita activa posee un gráfico de avance del 0% al 100%. Las etapas se iluminan en color verde a medida que se completan los respectivos formularios modulares:
                </p>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        <span className="bg-red-850 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                        <span className="font-bold text-slate-700">Módulos 1, 2 y 3:</span>
                        <span className="text-slate-500">Corresponden a la fase de Notificación, Orden de Supervisión y Lista de Verificación obligatorias.</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        <span className="bg-red-850 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                        <span className="font-bold text-slate-700">Módulos 4 y 5 (Cierre Alternativo):</span>
                        <span className="text-slate-500">Si por algún motivo la visita concluye con un **Acta de Hechos** (M4) o **Acta de Supervisión** (M5), marcará el **100% de avance** y la visita quedará resuelta de manera anticipada.</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        <span className="bg-red-850 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                        <span className="font-bold text-slate-700">Módulo 6 (Flujo Estándar):</span>
                        <span className="text-slate-500">Es la conclusión regular de la visita. El avance marcará el **100%** únicamente al finalizar el Acta Circunstanciada.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualGeneral;
