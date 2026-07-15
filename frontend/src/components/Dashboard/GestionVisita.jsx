import React from 'react';
import { PlusCircle, Search } from 'lucide-react';

const GestionVisita = ({
  datosPsg,
  folioActivo,
  esVista,
  puedeCrearVisita,
  handleNuevaVisita,
  busquedaFolio,
  setBusquedaFolio,
  handleBuscarVisita
}) => {
  if (!datosPsg || folioActivo || esVista) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-t-4 border-green-600 animate-fade-in">
      <h2 className="text-gray-700 font-bold mb-4">2. GESTIÓN DE LA VISITA</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex items-center">
          {puedeCrearVisita ? (
            <button
              onClick={handleNuevaVisita}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded shadow transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <PlusCircle size={20} /> GENERAR NUEVO FOLIO
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-400 font-bold py-3 px-4 rounded border border-gray-200 flex items-center justify-center gap-2 text-sm cursor-not-allowed">
              <PlusCircle size={20} /> Sin permiso para crear visitas
            </div>
          )}
        </div>
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 flex gap-2">
          <input
            type="text"
            value={busquedaFolio}
            onChange={(e) => setBusquedaFolio(e.target.value)}
            placeholder="Ej: SDR/180170002P02/2026/999"
            className="flex-1 border border-gray-300 rounded px-3 text-sm outline-none font-mono focus:border-blue-500"
          />
          <button
            onClick={handleBuscarVisita}
            className="bg-blue-800 hover:bg-blue-900 text-white px-4 rounded transition-colors active:scale-95"
          >
            <Search size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionVisita;
