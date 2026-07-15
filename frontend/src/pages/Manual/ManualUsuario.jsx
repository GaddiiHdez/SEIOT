import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ShieldAlert, Users, FileText, BarChart2, Database, Info, HelpCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';

// Importaciones de los sub-manuales
import ManualGeneral from './ManualGeneral';
import ManualSuperAdmin from './ManualSuperAdmin';
import ManualAdmin from './ManualAdmin';
import ManualSupervisor from './ManualSupervisor';
import ManualCapturista from './ManualCapturista';
import ManualConsultas from './ManualConsultas';

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

                    {/* VISOR DE CONTENIDO MODULARIZADO */}
                    <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
                        {seccionActiva === 'general' && <ManualGeneral />}
                        {seccionActiva === 'superadmin' && esSuperAdmin && <ManualSuperAdmin />}
                        {seccionActiva === 'admin' && esAdmin && <ManualAdmin />}
                        {seccionActiva === 'supervisor' && (esSupervisor || esSuperAdmin || esAdmin) && <ManualSupervisor />}
                        {seccionActiva === 'capturista' && (esCapturista || esSuperAdmin || esAdmin) && <ManualCapturista />}
                        {seccionActiva === 'consultas' && (esVista || esSuperAdmin || esAdmin) && <ManualConsultas />}
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
