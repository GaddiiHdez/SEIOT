import React from 'react';
import { Lock, CheckCircle, FileCheck, MoreVertical, Download } from 'lucide-react';

const ModuloCard = ({
  modulo,
  index,
  navigate,
  menuAbierto,
  setMenuAbierto,
  descargarPdf,
  verPdfFirmado,
  pdfs
}) => {
  return (
    <div
      onClick={() => !modulo.bloqueado && modulo.ruta !== '#' && navigate(modulo.ruta)}
      className={`relative p-6 rounded-xl shadow-md text-white transition-all ${
        modulo.bloqueado
          ? 'bg-gray-300 cursor-not-allowed opacity-80'
          : `${modulo.color} cursor-pointer hover:shadow-xl hover:-translate-y-1`
      }`}
    >
      {/* Botón de Tres Puntos (Menú Contextual) */}
      {!modulo.bloqueado && (
        <div className="absolute top-3 right-2.5 z-30" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuAbierto(menuAbierto === modulo.id ? null : modulo.id)}
            className="hover:bg-white/20 p-1.5 rounded-full transition-colors outline-none flex items-center justify-center active:scale-95"
            title="Opciones de PDF"
          >
            <MoreVertical size={16} className="text-white" />
          </button>
          {menuAbierto === modulo.id && (
            <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-48 text-slate-800 text-xs font-bold z-50 animate-scale-up">
              <button
                onClick={() => {
                  setMenuAbierto(null);
                  descargarPdf(modulo.id);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <Download size={14} className="text-slate-500" />
                Descargar Prellenado
              </button>
              {pdfs[modulo.id] && (
                <button
                  onClick={() => {
                    setMenuAbierto(null);
                    verPdfFirmado(modulo.id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 transition-colors"
                >
                  <FileCheck size={14} className="text-blue-500" />
                  Ver PDF Firmado
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`absolute top-4 ${modulo.bloqueado ? 'right-4' : 'right-10'} bg-white/20 px-2 py-1 rounded text-[10px] font-bold`}>
        ETAPA 0{index + 1}
      </div>
      <div className="mb-4 bg-white/10 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm">
        {modulo.bloqueado ? <Lock size={24} className="text-gray-500" /> : modulo.icono}
      </div>
      <h3 className={`text-lg font-bold leading-tight ${modulo.bloqueado ? 'text-gray-500' : 'text-white'}`}>
        {modulo.nombre}
      </h3>
      <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        {modulo.completado ? (
          <span className="flex items-center gap-1 text-green-100 bg-green-700/30 px-2 py-1 rounded border border-green-400">
            <CheckCircle size={12} /> Completado
          </span>
        ) : modulo.bloqueado ? (
          <span className="text-gray-500 flex items-center gap-1">
            <Lock size={10} /> Bloqueado
          </span>
        ) : (
          <span className="opacity-80">Disponible</span>
        )}
        {pdfs[modulo.id] && (
          <span
            className="flex items-center gap-1 text-blue-100 bg-blue-700/30 px-2 py-1 rounded border border-blue-300 ml-1"
            title="Tiene PDF firmado"
          >
            <FileCheck size={12} /> PDF
          </span>
        )}
      </div>
    </div>
  );
};

export default ModuloCard;
