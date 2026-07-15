import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, ArrowLeft, Save, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Search, Filter, UserCheck, UserX, X } from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import logoGobierno from '../../assets/logo-gobierno.jpg';
import Navbar from '../../components/Navbar';

const PERMISOS_CONFIG = [
    { key: 'modulo1', label: 'Módulo 1 - Oficio de Notificación' },
    { key: 'modulo2', label: 'Módulo 2 - Orden de Supervisión' },
    { key: 'modulo3', label: 'Módulo 3 - Lista de Verificación' },
    { key: 'modulo4', label: 'Módulo 4 - Acta de Hechos' },
    { key: 'modulo5', label: 'Módulo 5 - Acta de Supervisión' },
    { key: 'modulo6', label: 'Módulo 6 - Acta Circunstanciada' },
    { key: 'modulo6_pagina4', label: 'Módulo 6 - Página 4 (Hechos y Artículos)' },
    { key: 'ver_visitas_otros', label: 'Ver visitas de otros usuarios' },
    { key: 'editar_campos', label: 'Editar campos bloqueados' },
    { key: 'eliminar_documentos', label: 'Eliminar documentos firmados' },
    { key: 'descargar_pdfs', label: 'Descargar PDFs' },
    { key: 'panel_admin', label: 'Acceso al panel de administración' },
    { key: 'consultas', label: 'Acceso al panel de consultas' },
];

const ROLES_PLANTILLA = {
    admin: { modulo1: true, modulo2: true, modulo3: true, modulo4: true, modulo5: true, modulo6: true, modulo6_pagina4: true, consultas: true, ver_visitas_otros: true, editar_campos: true, eliminar_documentos: true, descargar_pdfs: true, panel_admin: true },
    supervisor: { modulo1: true, modulo2: true, modulo3: true, modulo4: true, modulo5: true, modulo6: true, modulo6_pagina4: false, consultas: false, ver_visitas_otros: false, editar_campos: false, eliminar_documentos: false, descargar_pdfs: true, panel_admin: false },
    capturista: { modulo1: true, modulo2: true, modulo3: true, modulo4: true, modulo5: true, modulo6: false, modulo6_pagina4: false, consultas: false, ver_visitas_otros: false, editar_campos: false, eliminar_documentos: false, descargar_pdfs: true, panel_admin: false },
    vista: { modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false, modulo6_pagina4: false, consultas: false, ver_visitas_otros: true, editar_campos: false, eliminar_documentos: false, descargar_pdfs: true, panel_admin: false },
};

const permisosVacios = { modulo1: false, modulo2: false, modulo3: false, modulo4: false, modulo5: false, modulo6: false, modulo6_pagina4: false, consultas: false, ver_visitas_otros: false, editar_campos: false, eliminar_documentos: false, descargar_pdfs: true, panel_admin: false };

const Switch = ({ valor, onChange }) => (
    <button
        onClick={() => onChange(!valor)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${valor ? 'bg-green-500' : 'bg-gray-300'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${valor ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const AdminUsuarios = () => {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const token = localStorage.getItem('seiot_token');

    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [expandido, setExpandido] = useState(null);
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroRol, setFiltroRol] = useState('');

    // Formulario
    const [nombre, setNombre] = useState('');
    const [usuarioInput, setUsuarioInput] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [rol, setRol] = useState('capturista');
    const [permisos, setPermisos] = useState(permisosVacios);
    const [guardando, setGuardando] = useState(false);

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const cargarUsuarios = async () => {
        setCargando(true);
        try {
            const res = await apiFetch('/api/auth/usuarios');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsuarios(data);
            } else {
                setUsuarios([]);
                alert(data.error || 'Error al obtener usuarios');
            }
        } catch { alert('Error al cargar usuarios'); }
        setCargando(false);
    };

    useEffect(() => { cargarUsuarios(); }, []);

    const aplicarRol = (nuevoRol) => {
        setRol(nuevoRol);
        setPermisos(ROLES_PLANTILLA[nuevoRol] || permisosVacios);
    };

    const togglePermiso = (key) => {
        setPermisos(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const abrirCrear = () => {
        setUsuarioEditando(null);
        setNombre(''); setUsuarioInput(''); setPassword('');
        setRol('capturista'); setPermisos(ROLES_PLANTILLA.capturista);
        setMostrarFormulario(true);
    };

    const abrirEditar = (u) => {
        setUsuarioEditando(u);
        setNombre(u.nombre); setUsuarioInput(u.usuario); setPassword('');
        setRol(u.rol);
        setPermisos({
            modulo1: u.modulo1, modulo2: u.modulo2, modulo3: u.modulo3,
            modulo4: u.modulo4, modulo5: u.modulo5, modulo6: u.modulo6, modulo6_pagina4: u.modulo6_pagina4, consultas: u.consultas,
            ver_visitas_otros: u.ver_visitas_otros, editar_campos: u.editar_campos,
            eliminar_documentos: u.eliminar_documentos, descargar_pdfs: u.descargar_pdfs,
            panel_admin: u.panel_admin
        });
        setMostrarFormulario(true);
    };

    const guardar = async () => {
        if (!nombre || !usuarioInput) { alert('Nombre y usuario son requeridos'); return; }
        if (!usuarioEditando && !password) { alert('La contraseña es requerida para usuarios nuevos'); return; }
        setGuardando(true);
        try {
            if (usuarioEditando) {
                // Actualizar permisos
                const res = await apiFetch(`/api/auth/usuarios/${usuarioEditando.id}`, {
                    method: 'PUT', headers,
                    body: JSON.stringify({ nombre, rol, activo: usuarioEditando.activo, ...permisos })
                });
                if (!res.ok) {
                    const data = await res.json();
                    alert(data.error || 'Error al actualizar usuario');
                    setGuardando(false);
                    return;
                }
                // Cambiar contraseña si se escribió una
                if (password) {
                    const resPass = await apiFetch(`/api/auth/usuarios/${usuarioEditando.id}/password`, {
                        method: 'PUT', headers,
                        body: JSON.stringify({ password })
                    });
                    if (!resPass.ok) {
                        const dataPass = await resPass.json();
                        alert(`El usuario se actualizó pero falló el cambio de contraseña: ${dataPass.error}`);
                        setGuardando(false);
                        return;
                    }
                }
                alert('Usuario actualizado correctamente');
            } else {
                const res = await apiFetch('/api/auth/usuarios', {
                    method: 'POST', headers,
                    body: JSON.stringify({ nombre, usuario: usuarioInput, password, rol, ...permisos })
                });
                if (!res.ok) {
                    const data = await res.json();
                    alert(data.error || 'Error al crear usuario');
                    setGuardando(false);
                    return;
                }
                alert('Usuario creado correctamente');
            }
            setMostrarFormulario(false);
            cargarUsuarios();
        } catch { alert('Error de comunicación con el servidor'); }
        setGuardando(false);
    };

    const desactivar = async (id, activo) => {
        const accion = activo ? 'desactivar' : 'activar';
        if (!confirm(`¿Deseas ${accion} este usuario?`)) return;
        try {
            const res = await apiFetch(`/api/auth/usuarios/${id}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ activo: !activo })
            });
            const data = await res.json();
            if (!res.ok) { 
                alert(data.error || 'Error al cambiar estado del usuario'); 
                return; 
            }
            alert(`Usuario ${activo ? 'desactivado' : 'activado'} correctamente`);
            cargarUsuarios();
        } catch {
            alert('Error de conexión al servidor');
        }
    };

    const usuariosFiltrados = usuarios.filter(u => {
        const matchesNombre = u.nombre.toLowerCase().includes(filtroNombre.toLowerCase()) || 
                             u.usuario.toLowerCase().includes(filtroNombre.toLowerCase());
        const matchesRol = filtroRol === '' || u.rol === filtroRol;
        return matchesNombre && matchesRol;
    });

    const getRolBadgeStyles = (rol) => {
        switch (rol) {
            case 'admin':
            case 'superadmin':
                return 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-sm shadow-red-950/20';
            case 'supervisor':
                return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-950/20';
            case 'vista':
                return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm shadow-slate-950/20';
            default:
                return 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm shadow-green-950/20';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans pb-16">
            <Navbar />

            <div className="max-w-6xl mx-auto p-6 md:p-8">
                
                {/* Cabecera de la sección */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <span className="text-[10px] bg-red-800/10 border border-red-800/20 text-red-900 font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                            Seguridad & Personal
                        </span>
                        <h1 className="text-2xl font-extrabold text-slate-800 mt-1">Gestión de Usuarios</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Controla quién accede al sistema y personaliza sus permisos de supervisión.</p>
                    </div>

                    <button 
                        onClick={abrirCrear} 
                        className="bg-gradient-to-r from-red-800 to-red-900 text-white px-5 py-2.5 rounded-xl shadow-lg hover:from-red-900 hover:to-red-950 flex items-center gap-2 font-bold text-xs tracking-wider transition-all active:scale-95 shrink-0"
                    >
                        <Plus size={16} /> NUEVO USUARIO
                    </button>
                </div>

                {/* Filtros de búsqueda */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            value={filtroNombre} 
                            onChange={(e) => setFiltroNombre(e.target.value)} 
                            placeholder="Buscar por nombre o usuario..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-red-800 transition-all font-bold text-slate-700" 
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="text-slate-400 shrink-0" size={16} />
                        <select 
                            value={filtroRol} 
                            onChange={(e) => setFiltroRol(e.target.value)}
                            className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-red-800 transition-all font-bold text-slate-600"
                        >
                            <option value="">Todos los roles</option>
                            <option value="admin">Administrador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="capturista">Capturista</option>
                            <option value="vista">Vista</option>
                        </select>
                    </div>
                </div>

                {/* Listado de usuarios */}
                {cargando ? (
                    <div className="text-center py-20 text-slate-400 font-bold text-sm flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-red-800" size={24} /> Cargando plantilla de personal...
                    </div>
                ) : usuariosFiltrados.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-slate-200/60 rounded-2xl p-6 text-slate-400 font-bold text-sm">
                        No se encontraron usuarios registrados con los criterios seleccionados.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {usuariosFiltrados.map(u => (
                            <div 
                                key={u.id} 
                                className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 ${
                                    !u.activo 
                                        ? 'opacity-65 border-slate-200 bg-slate-50/30' 
                                        : 'border-slate-200/80 hover:shadow-md hover:border-slate-300'
                                }`}
                            >
                                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm ${getRolBadgeStyles(u.rol)}`}>
                                            {u.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-extrabold text-slate-800 text-sm">{u.nombre}</p>
                                                <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                                                    {u.rol}
                                                </span>
                                                {u.superadmin && (
                                                    <span className="text-[9px] bg-yellow-50 border border-yellow-200 text-yellow-700 font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                                                        ⭐ SuperAdmin
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold mt-0.5">
                                                @{u.usuario}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                        {/* Indicador de estado */}
                                        <div className={`flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                            u.activo 
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                                : 'bg-rose-50 border-rose-200 text-rose-700'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </div>

                                        <button 
                                            onClick={() => setExpandido(expandido === u.id ? null : u.id)} 
                                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all outline-none"
                                            title="Ver permisos"
                                        >
                                            {expandido === u.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {!u.superadmin && (
                                            <>
                                                <button 
                                                    onClick={() => abrirEditar(u)} 
                                                    className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 outline-none"
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => desactivar(u.id, u.activo)} 
                                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 outline-none ${
                                                        u.activo 
                                                            ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700' 
                                                            : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                                                    }`}
                                                >
                                                    {u.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Permisos expandidos */}
                                {expandido === u.id && (
                                    <div className="border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-2xl animate-fade-in">
                                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Permisos asignados:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {PERMISOS_CONFIG.map(p => (
                                                <div key={p.key} className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border ${
                                                    u[p.key] 
                                                        ? 'bg-white border-green-200 text-green-700 font-bold shadow-sm' 
                                                        : 'bg-slate-100/40 border-slate-200/40 text-slate-400 font-medium'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u[p.key] ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                                    {p.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* VENTANA EMERGENTE MODAL (Crear / Editar) */}
                {mostrarFormulario && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col transform transition-all duration-300 scale-100 max-h-[90vh] overflow-hidden animate-scale-up">
                            
                            {/* Cabecera del Modal */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <span className="text-[9px] bg-red-800/10 border border-red-800/20 text-red-950 font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                                        Formulario
                                    </span>
                                    <h2 className="font-extrabold text-slate-800 text-lg mt-0.5">
                                        {usuarioEditando ? `Editar Usuario: ${usuarioEditando.nombre}` : 'Nuevo Usuario'}
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => setMostrarFormulario(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-lg transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Contenido del Modal (Scrollable) */}
                            <div className="p-6 overflow-y-auto space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Nombre completo</label>
                                        <input 
                                            value={nombre} 
                                            onChange={e => setNombre(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-red-850 text-slate-700 font-bold transition-all" 
                                            placeholder="Nombre completo del empleado" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Usuario</label>
                                        <input 
                                            value={usuarioInput} 
                                            onChange={e => setUsuarioInput(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-red-850 text-slate-700 font-bold transition-all disabled:opacity-75 disabled:bg-slate-100 disabled:cursor-not-allowed" 
                                            placeholder="Nombre de usuario para acceder" 
                                            disabled={!!usuarioEditando} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-500 mb-1 uppercase tracking-wider">
                                            {usuarioEditando ? 'Nueva contraseña (vacío para conservar)' : 'Contraseña'}
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={mostrarPassword ? 'text' : 'password'} 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-red-850 text-slate-700 font-bold transition-all pr-10" 
                                                placeholder={usuarioEditando ? 'Ingresar nueva contraseña...' : 'Contraseña de acceso'} 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setMostrarPassword(!mostrarPassword)} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Rol de acceso</label>
                                        <select 
                                            value={rol} 
                                            onChange={e => aplicarRol(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-red-850 text-slate-700 font-bold transition-all"
                                        >
                                            <option value="admin">Administrador</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="capturista">Capturista</option>
                                            <option value="vista">Vista</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Listado de Switches de Permisos */}
                                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                                    <h3 className="font-extrabold text-slate-700 text-xs mb-3 uppercase tracking-wider border-b border-slate-200/50 pb-2 flex justify-between items-center">
                                        <span>Permisos Individuales</span>
                                        <span className="text-[10px] text-slate-400 lowercase font-bold">Personaliza los accesos precargados</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                        {PERMISOS_CONFIG.map(p => (
                                            <div key={p.key} className="flex items-center justify-between gap-3 bg-white border border-slate-200/50 rounded-xl p-2.5 shadow-sm hover:border-slate-350 transition-all">
                                                <span className="text-xs text-slate-600 font-bold leading-tight">{p.label}</span>
                                                <Switch valor={permisos[p.key]} onChange={() => togglePermiso(p.key)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Botonera de Acciones (Footer del Modal) */}
                            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
                                <button 
                                    onClick={() => setMostrarFormulario(false)} 
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-150 hover:text-slate-700 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={guardar} 
                                    disabled={guardando} 
                                    className="bg-gradient-to-r from-red-800 to-red-900 text-white px-5 py-2 rounded-xl shadow hover:from-red-900 hover:to-red-950 flex items-center gap-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {guardando ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} /> Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} /> GUARDAR USUARIO
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsuarios;