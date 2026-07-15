import React from 'react';
import { FileText, Download } from 'lucide-react';

const ProgresoVisita = ({
  folioActivo,
  descargandoTodos,
  descargarTodosPdfs,
  avance,
  esFinalizada,
  modulosCompletados,
  porcentajeAvance,
  getTextoAvance
}) => {
  if (!folioActivo) return null;

  return (
    <div className="bg-yellow-50 rounded-xl shadow-sm p-6 mb-6 border border-yellow-200 flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-full text-yellow-700">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Folio Activo:</p>
            <p className="text-xl font-mono text-red-700 font-bold">{folioActivo}</p>
          </div>
        </div>
        <button
          onClick={descargarTodosPdfs}
          disabled={descargandoTodos}
          className="w-full md:w-auto bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs tracking-wider active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} className={descargandoTodos ? "animate-spin" : ""} />
          {descargandoTodos ? "DESCARGANDO..." : "DESCARGAR LOS 6 FORMATOS PRELLENADOS"}
        </button>
      </div>

      <div className="border-t border-yellow-200/60 pt-4">
        <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-1.5">
          <span className="uppercase text-[10px] tracking-wide">Avance general de la supervisión:</span>
          <span className="text-red-700 font-mono">
            {getTextoAvance(avance, esFinalizada, modulosCompletados, porcentajeAvance)}
          </span>
        </div>
        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${porcentajeAvance}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgresoVisita;
