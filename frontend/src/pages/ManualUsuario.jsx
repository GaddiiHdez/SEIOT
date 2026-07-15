import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ShieldAlert, Users, FileText, BarChart2, CheckCircle, Wifi, Database, Info, HelpCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const ManualUsuario = () => {
    const { usuario } = useAuth();
    const [seccionActiva, setSeccionActiva] = useState('general');

    // Roles del usuario logueado
    const esSuperAdmin = usuario?.superadmin;
    const esAdmin = usuario?.es_admin || usuario?.permisos?.panel_admin;
    const esSupervisor = usuario?.rol === 'supervisor';
    const esCapturista = usuario?.rol === 'capturista';
    const esVista = usuario?.rol === 'vista' || usuario?.permisos?.consultas;

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans pb-16">
            <Navbar />

            <div className="max-w-6xl mx-auto p-6 md:p-8">
                {/* Cabecera del Manual */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-3 rounded-2xl shadow-md">
                        <BookOpen size={30} />
                    </div>
                    <div>
                        <span className="text-[10px] bg-red-800/10 border border-red-800/20 text-red-900 font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                            Guía y Soporte
                        </span>
                        <h1 className="text-2xl font-extrabold text-slate-800 mt-1">Manual de Usuario de SEIOT</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Explora el funcionamiento de los módulos, permisos y flujos del sistema.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* MENU LATERAL DE NAVEGACIÓN */}
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setSeccionActiva('general')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                                seccionActiva === 'general'
                                    ? 'bg-red-800 text-white shadow-md'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Info size={16} />
                            Generalidades de SEIOT
                        </button>

                        {esSuperAdmin && (
                            <button
                                onClick={() => setSeccionActiva('superadmin')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                                    seccionActiva === 'superadmin'
                                        ? 'bg-red-800 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <ShieldAlert size={16} />
                                Guía de SuperAdmin
                            </button>
                        )}

                        {esAdmin && (
                            <button
                                onClick={() => setSeccionActiva('admin')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                                    seccionActiva === 'admin'
                                        ? 'bg-red-800 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Users size={16} />
                                Gestión de Personal (Admin)
                            </button>
                        )}

                        {(esSupervisor || esSuperAdmin || esAdmin) && (
                            <button
                                onClick={() => setSeccionActiva('supervisor')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                                    seccionActiva === 'supervisor'
                                        ? 'bg-red-800 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <FileText size={16} />
                                Guía de Inspectores (Módulos)
                            </button>
                        )}

                        {(esCapturista || esSuperAdmin || esAdmin) && (
                            <button
                                onClick={() => setSeccionActiva('capturista')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                                    seccionActiva === 'capturista'
                                        ? 'bg-red-800 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Database size={16} />
                                Guía de Captura y Offline
                            </button>
                        )}

                        {(esVista || esSuperAdmin || esAdmin) && (
                            <button
                                onClick={() => setSeccionActiva('consultas')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                                    seccionActiva === 'consultas'
                                        ? 'bg-red-800 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <BarChart2 size={16} />
                                Consultas y Reportes
                            </button>
                        )}
                    </div>

                    {/* CONTENIDO DILUIDO POR SECCIÓN */}
                    <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
                        
                        {/* SECCIÓN 1: GENERALIDADES */}
                        {seccionActiva === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-800">Conceptos Clave de SEIOT</h2>
                                    <p className="text-xs text-slate-500 mt-1">Antes de operar, comprende las bases y nomenclatura del sistema.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                                        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Clave de Productor (PSG)</h3>
                                        <p className="text-slate-600 text-xs leading-relaxed">
                                            Es la clave nacional de identificación del **Padrón Ganadero Único** (ej: 18-017-0002-P02). El sistema valida esta clave en tiempo real contra el padrón del estado antes de permitir el inicio de cualquier visita de inspección.
                                        </p>
                                    </div>
                                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                                        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-2">Folio de Visita</h3>
                                        <p className="text-slate-600 text-xs leading-relaxed">
                                            Identificador único de control de supervisión generado secuencialmente por el backend. Garantiza el registro ordenado y la trazabilidad de los documentos firmados y expedidos.
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-3">La Barra de Avance y Conclusión Modular</h3>
                                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                                        Cada visita activa posee un gráfico de avance del 0% al 100%. Las etapas se iluminan en color verde a medida que se completan los respectivos formularios modulares:
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                                            <span className="bg-red-800 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                                            <span className="font-bold text-slate-700">Módulos 1, 2 y 3:</span>
                                            <span className="text-slate-500">Corresponden a la fase de Notificación, Orden de Supervisión y Lista de Verificación obligatorias.</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                                            <span className="bg-red-800 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                            <span className="font-bold text-slate-700">Módulos 4 y 5 (Cierre Alternativo):</span>
                                            <span className="text-slate-500">Si por algún motivo la visita concluye con un **Acta de Hechos** (M4) o **Acta de Supervisión** (M5), marcará el **100% de avance** y la visita quedará resuelta de manera anticipada.</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                                            <span className="bg-red-800 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                                            <span className="font-bold text-slate-700">Módulo 6 (Flujo Estándar):</span>
                                            <span className="text-slate-500">Es la conclusión regular de la visita. El avance marcará el **100%** únicamente al finalizar el Acta Circunstanciada.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN 2: SUPERADMIN */}
                        {seccionActiva === 'superadmin' && esSuperAdmin && (
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
                                    <div className="border-l-4 border-blue-505 pl-4 py-1.5 space-y-2">
                                        <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">1. Descargar Respaldo (Backup)</h3>
                                        <p className="text-slate-600 text-xs leading-relaxed">
                                            Ingresa la clave secreta **`RESPALDO-DATOS-SEIOT`** y presiona **"Descargar Respaldo"**. El navegador descargará un archivo estructurado en formato `.json` que contiene todas las tablas históricas (usuarios, visitas, respuestas de formularios modulares).
                                        </p>
                                    </div>

                                    <div className="border-l-4 border-emerald-505 pl-4 py-1.5 space-y-2">
                                        <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">2. Restaurar Copia de Seguridad</h3>
                                        <p className="text-slate-600 text-xs leading-relaxed">
                                            Selecciona el archivo `.json` de respaldo en el selector de archivos, ingresa la clave **`RESPALDO-DATOS-SEIOT`** y presiona **"Restaurar Sistema"**. El servidor limpiará las tablas e insertará los registros respaldados respetando las relaciones y llaves primarias.
                                        </p>
                                    </div>

                                    <div className="border-l-4 border-red-505 pl-4 py-1.5 space-y-2">
                                        <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">3. Reiniciar Sistema a Ceros</h3>
                                        <p className="text-slate-600 text-xs leading-relaxed">
                                            Para vaciar la base de datos antes de una etapa de producción real: ingresa la clave secreta **`RESET-DATOS-SEIOT`** y presiona el botón rojo. Esto truncará todas las visitas, formularios y eliminará físicamente los PDFs del servidor. **Nota: Conservará intacto el catálogo de productores (PSG), supervisores y cuentas de usuario.**
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN 3: ADMINISTRADOR */}
                        {seccionActiva === 'admin' && esAdmin && (
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
                        )}

                        {/* SECCIÓN 4: SUPERVISORES */}
                        {seccionActiva === 'supervisor' && (esSupervisor || esSuperAdmin || esAdmin) && (
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
                                                <span>Se genera para informar al ganadero sobre la inspección. Requiere capturar los datos generales y descargar el archivo PDF.</span>
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
                                            Cada módulo posee una sección de **"Firma Digital y Archivo Físico"** en la parte inferior. Tras descargar el PDF generado y firmarlo de forma física en campo, el supervisor debe escanearlo o tomarle fotografía en PDF y cargarlo en la zona de subida del módulo correspondiente para que el registro quede respaldado y validado en producción.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN 5: CAPTURISTA */}
                        {seccionActiva === 'capturista' && (esCapturista || esSuperAdmin || esAdmin) && (
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
                        )}

                        {/* SECCIÓN 6: CONSULTAS */}
                        {seccionActiva === 'consultas' && (esVista || esSuperAdmin || esAdmin) && (
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
                        )}

                    </div>
                </div>

                {/* Zona inferior de Soporte */}
                <div className="mt-8 bg-slate-100/50 border border-slate-200/80 rounded-3xl p-6 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
                    <HelpCircle className="text-slate-400" size={32} />
                    <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">¿Aún tienes dudas técnicas?</h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Si presentas problemas con tu cuenta de acceso, la validación de claves PSG o el guardado de formularios, contacta al Administrador de Tecnologías de tu adscripción.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ManualUsuario;
