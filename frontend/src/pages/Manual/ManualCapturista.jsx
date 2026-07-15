import React from 'react';
import { Database, Wifi } from 'lucide-react';

const ManualCapturista = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Database className="text-emerald-600" size={20} /> Guía de Captura y Trabajo Sin Conexión (Offline)
                </h2>
                <p className="text-xs text-slate-500 mt-1">Cómo registrar folios y trabajar de forma segura en zonas rurales sin señal de internet.</p>
            </div>

            <div className="space-y-4">
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl space-y-2">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Wifi size={14} className="text-emerald-500" /> Sincronización en Zonas Offline
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        SEIOT cuenta con un sistema inteligente de guardado en caché local en el dispositivo. Si estás capturando un módulo en campo y te quedas sin conexión a internet:
                    </p>
                    <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 mt-1">
                        <li>El sistema detectará el estado y encolará los cambios de forma local de forma segura.</li>
                        <li>Mostrará un aviso en pantalla indicando que los datos se guardaron en la memoria del dispositivo.</li>
                        <li>El indicador del Navbar cambiará automáticamente a **"Sin red"** (círculo rojo).</li>
                        <li>**¡No cierres sesión!** En cuanto el dispositivo recupere la señal (círculo verde), los datos en cola se sincronizarán solos con la base de datos de Neon de manera automática.</li>
                    </ul>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Registro de Inicio de Visita</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Al iniciar la captura, digita la clave del PSG en la sección 1 del Dashboard. El sistema autocompletará la información del productor ganadero si está en el padrón. Selecciona del dropdown al Supervisor asignado para que sus datos y firmas predefinidas queden enlazados al PDF que se generará.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManualCapturista;
