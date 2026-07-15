import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, ArrowLeft, Save, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Navbar />

            <div className="max-w-5xl mx-auto p-6">

                {/* Botón crear */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Users size={20} />
                        <span className="font-bold">{usuarios.length} usuario(s) registrados</span>
                    </div>
                    <button onClick={abrirCrear} className="bg-red-800 text-white px-4 py-2 rounded shadow hover:bg-red-900 flex items-center gap-2 font-bold text-sm">
                        <Plus size={18} /> NUEVO USUARIO
                    </button>
                </div>

                {/* Formulario crear/editar */}
                {mostrarFormulario && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                        <h2 className="font-bold text-gray-800 text-lg mb-4 border-b pb-2">
                            {usuarioEditando ? `Editando: ${usuarioEditando.nombre}` : 'Nuevo Usuario'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nombre completo</label>
                                <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-red-700" placeholder="Nombre completo" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Usuario</label>
                                <input value={usuarioInput} onChange={e => setUsuarioInput(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-red-700" placeholder="Usuario para login" disabled={!!usuarioEditando} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">
                                    {usuarioEditando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                                </label>
                                <div className="relative">
                                    <input type={mostrarPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-red-700 pr-10" placeholder={usuarioEditando ? 'Nueva contraseña...' : 'Contraseña'} />
                                    <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                        {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Rol base</label>
                                <select value={rol} onChange={e => aplicarRol(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-red-700 font-bold">
                                    <option value="admin">Admin</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="capturista">Capturista</option>
                                    <option value="vista">Vista</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Seleccionar un rol precarga los permisos, pero puedes ajustarlos</p>
                            </div>
                        </div>

                        {/* Switches de permisos */}
                        <div className="border border-gray-200 rounded-lg p-4 mb-4">
                            <h3 className="font-bold text-gray-700 text-sm mb-3 uppercase">Permisos individuales</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PERMISOS_CONFIG.map(p => (
                                    <div key={p.key} className="flex items-center justify-between gap-2 bg-gray-50 rounded p-2">
                                        <span className="text-sm text-gray-700">{p.label}</span>
                                        <Switch valor={permisos[p.key]} onChange={() => togglePermiso(p.key)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setMostrarFormulario(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={guardar} disabled={guardando} className="bg-red-800 text-white px-6 py-2 rounded shadow hover:bg-red-900 flex items-center gap-2 text-sm font-bold disabled:opacity-60">
                                <Save size={16} /> {guardando ? 'Guardando...' : 'GUARDAR'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de usuarios */}
                {cargando ? (
                    <div className="text-center py-10 text-gray-400 font-bold">Cargando usuarios...</div>
                ) : (
                    <div className="space-y-3">
                        {usuarios.map(u => (
                            <div key={u.id} className={`bg-white rounded-xl shadow border ${!u.activo ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${u.es_admin ? 'bg-red-800' : u.rol === 'supervisor' ? 'bg-blue-600' : u.rol === 'vista' ? 'bg-gray-500' : 'bg-green-600'}`}>
                                            {u.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{u.nombre}</p>
                                            <p className="text-xs text-gray-500">@{u.usuario} — <span className="font-bold uppercase">{u.rol}</span> {!u.activo && <span className="text-red-500 font-bold">INACTIVO</span>}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setExpandido(expandido === u.id ? null : u.id)} className="text-gray-400 hover:text-gray-600 p-1">
                                            {expandido === u.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                        {u.superadmin ? (
                                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-bold border border-yellow-300">⭐ SUPERADMIN</span>
                                        ) : (
                                            <>
                                                <button onClick={() => abrirEditar(u)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">
                                                    Editar
                                                </button>
                                                <button onClick={() => desactivar(u.id, u.activo)} className={`px-3 py-1 rounded text-xs font-bold ${u.activo ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                                    {u.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Permisos expandidos */}
                                {expandido === u.id && (
                                    <div className="border-t border-gray-100 p-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Permisos activos:</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {PERMISOS_CONFIG.map(p => (
                                                <div key={p.key} className={`flex items-center gap-1 text-xs rounded px-2 py-1 ${u[p.key] ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${u[p.key] ? 'bg-green-500' : 'bg-gray-300'}`}></span>
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
            </div>
        </div>
    );
};

export default AdminUsuarios;