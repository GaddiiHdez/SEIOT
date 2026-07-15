import React from 'react';
import { BarChart2 } from 'lucide-react';

const ManualConsultas = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="text-blue-600" size={20} /> Consultas de Visitas y Expediente Digital
                </h2>
                <p className="text-xs text-slate-500 mt-1">Cómo buscar folios, ver el avance general e imprimir los expedientes oficiales.</p>
            </div>

            <div className="space-y-4">
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Búsqueda y Filtros</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Desde la pestaña **"Consultas"** en el Navbar, puedes ver la bitácora de todas las visitas en Nayarit. Puedes buscar directamente por número de Folio, clave PSG, nombre del productor o filtrar por rango de fechas de la inspección.
                    </p>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Consultar Visita desde el Historial</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Al hacer clic en el botón de ojo de cualquier registro en la tabla de consultas, el sistema cargará en modo de visualización el avance y los PDFs cargados. De este modo, cualquier auditor o directivo con acceso de consulta puede validar los documentos cargados en campo sin riesgo de modificar o alterar la información original.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManualConsultas;
