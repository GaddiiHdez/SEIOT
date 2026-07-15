import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const ManualSuperAdmin = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" size={20} /> Guía de Mantenimiento y Respaldos
                </h2>
                <p className="text-xs text-slate-500 mt-1">Exclusivo para el rol SuperAdmin. Accede desde el icono de llave (🔧) en el Navbar.</p>
            </div>

            <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 text-red-900 text-xs leading-relaxed space-y-2">
                <p className="font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Advertencia Crítica de Seguridad
                </p>
                <p>
                    Las acciones de este panel modifican de manera directa, masiva y definitiva la base de datos de producción. Solo deben ejecutarse por personal autorizado.
                </p>
            </div>

            <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-1.5 space-y-2">
                    <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">1. Descargar Respaldo (Backup)</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Ingresa la clave secreta de respaldos autorizada y presiona **"Descargar Respaldo"**. El navegador descargará un archivo estructurado en formato `.json` que contiene todas las tablas históricas (usuarios, visitas, respuestas de formularios modulares).
                    </p>
                </div>

                <div className="border-l-4 border-emerald-500 pl-4 py-1.5 space-y-2">
                    <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">2. Restaurar Copia de Seguridad</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Selecciona el archivo `.json` de respaldo en el selector de archivos, ingresa la clave secreta de respaldos autorizada y presiona **"Restaurar Sistema"**. El servidor limpiará las tablas e insertará los registros respaldados respetando las relaciones y llaves primarias.
                    </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4 py-1.5 space-y-2">
                    <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">3. Reiniciar Sistema a Ceros</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Para vaciar la base de datos antes de una etapa de producción real: ingresa la clave secreta de reinicio autorizada y presiona el botón rojo. Esto truncará todas las visitas, formularios y eliminará físicamente los PDFs del servidor. **Nota: Conservará intacto el catálogo de productores (PSG), supervisores y cuentas de usuario.**
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManualSuperAdmin;
