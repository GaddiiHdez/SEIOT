import React from 'react';
import { FileText } from 'lucide-react';

const ManualSupervisor = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <FileText className="text-red-800" size={20} /> Guía Paso a Paso de Supervisión (Módulos 1-6)
                </h2>
                <p className="text-xs text-slate-500 mt-1">Guía del flujo de inspección de campo y carga de actas físicas en formato PDF.</p>
            </div>

            <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">El Flujo del Inspector de Campo</h3>
                    
                    <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex gap-2">
                            <span className="font-bold text-red-850">Etapa 1 (Oficio de Notificación):</span>
                            <span>Se genera para informar al ganadero sobre la inspección. Requiere capturar los datos generales y descargar el PDF.</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-red-850">Etapa 2 (Orden de Supervisión):</span>
                            <span>Instrucción oficial de visita que detalla el marco legal. Se deben registrar firmas y fechas.</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-red-850">Etapa 3 (Lista de Verificación):</span>
                            <span>Cuestionario en campo sobre aretes, marcas, infraestructura y salud del ganado. Es un checklist interactivo.</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-red-850">Etapa 4, 5 o 6 (Cierre de Actas):</span>
                            <span>Dependiendo de la visita, se elabora un Acta de Hechos (M4), Acta de Supervisión (M5) o Acta Circunstanciada (M6). Al terminar cualquiera, se da por concluida la visita.</span>
                        </div>
                    </div>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Carga y Firma de Documentos PDF</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Cada módulo posee una sección de **"Firma Digital y Archivo Físico"** en la parte inferior. Tras descargar el PDF generado y firmarlo de forma física en campo, el supervisor debe escanear el documento **únicamente utilizando un escáner o equipo multifuncional** (está estrictamente prohibido subir fotos tomadas con el celular, ya que los archivos resultan demasiado pesados y aumentan los costos de almacenamiento) y cargarlo en formato PDF en la zona de subida del módulo correspondiente para que el registro quede respaldado y validado en producción.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManualSupervisor;
