import React, { useEffect, useRef } from 'react';
import { MapPin, CheckCircle, Lock, User, Search, Building2, ChevronRight } from 'lucide-react';

const IdentificacionPsg = ({
  psgInput,
  handlePsgChange,
  folioActivo,
  datosPsg,
  esVista,
  supervisorSeleccionado,
  handleSupervisorChange,
  supervisores,
  seleccionarPsgCompleto,
  sugerenciasPsg = [],
  mostrarSugerencias = false,
  setMostrarSugerencias
}) => {
  const containerRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (setMostrarSugerencias) setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setMostrarSugerencias]);

  const handleSelectSugerencia = (s) => {
    if (seleccionarPsgCompleto) {
      seleccionarPsgCompleto(s);
    }
    if (setMostrarSugerencias) setMostrarSugerencias(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-t-4 border-blue-600 animate-fade-in">
      <h2 className="text-gray-700 font-bold mb-4">1. IDENTIFICACIÓN DEL PSG</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="relative" ref={containerRef}>
          <label htmlFor="psg-input" className="block text-xs font-bold text-gray-500 mb-1 uppercase">
            Ingrese Clave PSG:
          </label>
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border-2 border-blue-100 focus-within:border-blue-500 transition-colors shadow-sm">
            <MapPin size={20} className="text-blue-600 shrink-0" />
            <input
              id="psg-input"
              type="text"
              value={psgInput}
              onChange={handlePsgChange}
              placeholder="Ej: 18-017-0002-P02"
              disabled={!!folioActivo}
              className={`bg-transparent font-bold text-gray-800 w-full outline-none text-lg uppercase ${
                folioActivo ? 'cursor-not-allowed opacity-70' : ''
              }`}
            />
            {folioActivo && <Lock size={16} className="text-gray-400 shrink-0" />}
          </div>

          {/* Menú Desplegable de Sugerencias */}
          {mostrarSugerencias && !folioActivo && sugerenciasPsg.length > 0 && (
            <div
              style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999 }}
              className="mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100"
            >
              <div className="bg-slate-50 px-3.5 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                <span>Sugerencias ({sugerenciasPsg.length})</span>
                <Search size={12} />
              </div>
              {sugerenciasPsg.map((s) => (
                <div
                  key={s.id || s.psg}
                  onMouseDown={(e) => { e.preventDefault(); handleSelectSugerencia(s); }}
                  className="p-3.5 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs tracking-wide group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {s.psg}
                      </span>
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {s.razon_social}
                      </span>
                    </div>
                    {(s.municipio || s.localidad) && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 pl-0.5">
                        <Building2 size={12} className="text-slate-400 shrink-0" />
                        {s.municipio || ''} {s.localidad ? `(${s.localidad})` : ''}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}

          {datosPsg && (
            <div className="mt-3 flex items-center gap-2.5 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 shadow-sm">
              <CheckCircle size={18} className="shrink-0 text-green-600" />
              <div>
                <p className="text-xs font-extrabold uppercase leading-tight text-green-900">
                  TITULAR: {datosPsg.nombre_titular}
                </p>
                {datosPsg.municipio && (
                  <p className="text-[10px] font-semibold text-green-700 mt-0.5">
                    Ubicación: {datosPsg.municipio}{datosPsg.localidad ? ` — ${datosPsg.localidad}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {(!esVista || folioActivo) && (
          <div>
            <label htmlFor="supervisor-select" className="block text-xs font-bold text-gray-500 mb-1 uppercase">
              Oficial:
            </label>
            {folioActivo ? (
              <div className="flex items-center gap-2 p-2.5 bg-gray-100 rounded-lg border border-gray-200">
                <User size={20} className="text-gray-500 shrink-0" />
                <span className="font-bold text-gray-700 text-sm">
                  {supervisorSeleccionado?.nombre || '...'}
                </span>
              </div>
            ) : (
              <select
                id="supervisor-select"
                onChange={handleSupervisorChange}
                defaultValue=""
                className="w-full p-2.5 border-2 border-blue-100 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="" disabled>-- Seleccione Oficial --</option>
                {supervisores.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            )}
            {supervisorSeleccionado && (
              <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200 leading-relaxed shadow-sm">
                <span className="font-bold text-gray-800">Cargo:</span> {supervisorSeleccionado.cargo} <br/>
                <span className="font-bold text-gray-800">Adscripción:</span> {supervisorSeleccionado.adscripcion}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentificacionPsg;
