import React from 'react';
import { Users } from 'lucide-react';

const ManualAdmin = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Users className="text-blue-500" size={20} /> Gestión de Personal y Permisos
                </h2>
                <p className="text-xs text-slate-500 mt-1">Administra las cuentas de usuario y los roles del personal desde el botón **"Usuarios"**.</p>
            </div>

            <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs text-slate-600 leading-relaxed space-y-2">
                    <p className="font-extrabold text-slate-700">Flujo de Creación y Edición:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>Presiona **"Nuevo Usuario"** para abrir el modal emergente.</li>
                        <li>Completa el nombre completo, el nombre de usuario de inicio y la contraseña inicial.</li>
                        <li>Selecciona un **Rol base** (Administrador, Supervisor, Capturista, Vista). Esto precargará la plantilla de permisos recomendada.</li>
                        <li>Modifica cualquier interruptor individual de permisos si deseas un acceso personalizado.</li>
                        <li>Guarda los cambios.</li>
                    </ol>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Activación y Suspensión de Cuentas</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Para suspender temporalmente a un empleado sin borrar su historial de visitas, presiona el botón **"Desactivar"** de su tarjeta de usuario. Para habilitarlo de nuevo, presiona **"Activar"**. Este cambio se procesa al instante mediante peticiones tipo PATCH de seguridad y bloquea accesos de inmediato.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManualAdmin;
