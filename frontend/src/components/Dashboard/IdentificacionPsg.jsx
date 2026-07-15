import React from 'react';
import { MapPin, CheckCircle, Lock, User } from 'lucide-react';

const IdentificacionPsg = ({
  psgInput,
  handlePsgChange,
  folioActivo,
  datosPsg,
  esVista,
  supervisorSeleccionado,
  handleSupervisorChange,
  supervisores
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-t-4 border-blue-600 animate-fade-in">
      <h2 className="text-gray-700 font-bold mb-4">1. IDENTIFICACIÓN DEL PSG</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <label htmlFor="psg-input" className="block text-xs font-bold text-gray-500 mb-1 uppercase">
            Ingrese Clave PSG:
          </label>
          <div className="flex items-center gap-2 bg-white p-2 rounded border-2 border-blue-100 focus-within:border-blue-500 transition-colors">
            <MapPin size={20} className="text-blue-600" />
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
            {folioActivo && <Lock size={16} className="text-gray-400" />}
          </div>
          {datosPsg && (
            <div className="mt-2 flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded border border-green-200">
              <CheckCircle size={16} />
              <span className="text-xs font-bold">TITULAR: {datosPsg.nombre_titular}</span>
            </div>
          )}
        </div>

        {(!esVista || folioActivo) && (
          <div>
            <label htmlFor="supervisor-select" className="block text-xs font-bold text-gray-500 mb-1 uppercase">
              Supervisor:
            </label>
            {folioActivo ? (
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border border-gray-200">
                <User size={20} className="text-gray-500" />
                <span className="font-bold text-gray-700 text-sm">
                  {supervisorSeleccionado?.nombre || '...'}
                </span>
              </div>
            ) : (
              <select
                id="supervisor-select"
                onChange={handleSupervisorChange}
                defaultValue=""
                className="w-full p-2 border-2 border-blue-100 rounded text-sm font-bold text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="" disabled>-- Selecciona un supervisor --</option>
                {supervisores.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            )}
            {supervisorSeleccionado && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                <span className="font-bold">Cargo:</span> {supervisorSeleccionado.cargo} |{' '}
                <span className="font-bold">Adscripción:</span> {supervisorSeleccionado.adscripcion}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentificacionPsg;
