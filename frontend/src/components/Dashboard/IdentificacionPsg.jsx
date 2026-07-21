import React, { useEffect, useRef } from 'react';
import { MapPin, CheckCircle, Lock, User, Search, Building2, ChevronRight, ShieldCheck, UserCheck } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6 transition-all animate-fade-in relative overflow-hidden">
      
      {/* BARRA SUPERIOR DE ACENTO */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-700 via-red-800 to-red-900" />

      {/* ENCABEZADO DE SECCIÓN */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-red-50 text-red-800 font-black flex items-center justify-center text-base border border-red-100 shadow-sm shrink-0">
            1
          </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">
              Identificación del PSG
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Escriba la clave PSG y seleccione el Oficial a cargo de la visita.
            </p>
          </div>
        </div>

        {folioActivo && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-extrabold font-mono">
            <Lock size={13} className="text-slate-500" /> Folio Activo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* INPUT: CLAVE PSG */}
        <div className="relative" ref={containerRef}>
          <label htmlFor="psg-input" className="block text-xs font-extrabold text-slate-600 mb-2 uppercase tracking-wider">
            Ingrese Clave PSG:
          </label>
          
          <div className={`flex items-center gap-3 bg-slate-50/70 p-3.5 rounded-xl border-2 transition-all duration-200 ${
            folioActivo 
              ? 'border-slate-200 opacity-80 cursor-not-allowed' 
              : 'border-slate-200 hover:border-slate-300 focus-within:border-red-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-700/10'
          }`}>
            <MapPin size={20} className="text-red-700 shrink-0" />
            <input
              id="psg-input"
              type="text"
              value={psgInput}
              onChange={handlePsgChange}
              placeholder="Ej: 18-017-0002-P02"
              disabled={!!folioActivo}
              className={`bg-transparent font-black text-slate-800 w-full outline-none text-base uppercase tracking-wide placeholder:text-slate-400 placeholder:font-bold ${
                folioActivo ? 'cursor-not-allowed' : ''
              }`}
            />
            {folioActivo && <Lock size={16} className="text-slate-400 shrink-0" />}
          </div>

          {/* Menú Desplegable de Sugerencias */}
          {mostrarSugerencias && !folioActivo && sugerenciasPsg.length > 0 && (
            <div
              style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999 }}
              className="mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100"
            >
              <div className="bg-slate-50 px-4 py-2.5 text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                <span>Sugerencias Encontradas ({sugerenciasPsg.length})</span>
                <Search size={13} />
              </div>
              {sugerenciasPsg.map((s) => (
                <div
                  key={s.id || s.psg}
                  onMouseDown={(e) => { e.preventDefault(); handleSelectSugerencia(s); }}
                  className="p-3.5 hover:bg-red-50/50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-red-800 bg-red-100/70 px-2.5 py-0.5 rounded text-xs tracking-wide group-hover:bg-red-800 group-hover:text-white transition-colors">
                        {s.psg}
                      </span>
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {s.razon_social}
                      </span>
                    </div>
                    {(s.municipio || s.localidad) && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 pl-0.5 font-medium">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        {s.municipio || ''} {s.localidad ? `(${s.localidad})` : ''}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-red-700 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* DETALLES DEL PSG SELECCIONADO */}
          {datosPsg && (
            <div className="mt-3.5 flex items-start gap-3 text-emerald-800 bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 shadow-sm animate-fade-in">
              <CheckCircle size={20} className="shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold uppercase tracking-tight text-emerald-950">
                  TITULAR: {datosPsg.nombre_titular}
                </p>
                {datosPsg.municipio && (
                  <p className="text-xs font-semibold text-emerald-750">
                    Ubicación: <span className="font-bold">{datosPsg.municipio}</span>{datosPsg.localidad ? ` — ${datosPsg.localidad}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SELECT: OFICIAL */}
        {(!esVista || folioActivo) && (
          <div>
            <label htmlFor="supervisor-select" className="block text-xs font-extrabold text-slate-600 mb-2 uppercase tracking-wider">
              Oficial:
            </label>
            {folioActivo ? (
              <div className="flex items-center gap-3 p-3.5 bg-slate-100/80 rounded-xl border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Oficial Responsable</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {supervisorSeleccionado?.nombre || '...'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50/70 p-3.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 focus-within:border-red-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-700/10 transition-all duration-200">
                <User size={20} className="text-red-700 shrink-0" />
                <select
                  id="supervisor-select"
                  onChange={handleSupervisorChange}
                  defaultValue=""
                  className="bg-transparent w-full font-bold text-slate-800 text-sm outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Seleccione Oficial --</option>
                  {supervisores.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* FICHA DETALLADA DEL OFICIAL */}
            {supervisorSeleccionado && (
              <div className="mt-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
                  <ShieldCheck size={16} className="text-red-700 shrink-0" />
                  <span>{supervisorSeleccionado.nombre}</span>
                </div>
                {supervisorSeleccionado.cargo && (
                  <p className="text-xs text-slate-600 pl-6">
                    <span className="font-bold text-slate-700">Cargo:</span> {supervisorSeleccionado.cargo}
                  </p>
                )}
                {supervisorSeleccionado.adscripcion && (
                  <p className="text-xs text-slate-600 pl-6">
                    <span className="font-bold text-slate-700">Adscripción:</span> {supervisorSeleccionado.adscripcion}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default IdentificacionPsg;
