import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoGobierno from '../assets/logo-gobierno.jpg';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error al iniciar sesión');
                setCargando(false);
                return;
            }

            login(data.token, data.usuario);

            // Redirigir según rol
            navigate('/dashboard', { replace: true });

        } catch {
            setError('Error de conexión con el servidor');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-red-950 to-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/10 flex flex-col">
                    {/* Logo */}
                    <div className="bg-slate-50/80 p-5 flex items-center justify-center border-b border-slate-100 overflow-hidden">
                        <img src={logoGobierno} alt="Logo Gobierno" className="h-16 object-contain max-w-full" />
                    </div>

                    {/* Formulario */}
                    <div className="p-8">
                        <h1 className="text-center text-slate-800 font-extrabold text-2xl mb-1 tracking-tight">SEIOT</h1>
                        <p className="text-center text-slate-400 font-semibold text-[10px] mb-8 uppercase tracking-widest">Sistema de Supervisión Pecuaria</p>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label htmlFor="login-usuario" className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        id="login-usuario"
                                        type="text"
                                        value={usuario}
                                        onChange={(e) => setUsuario(e.target.value)}
                                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-red-800 focus:ring-4 focus:ring-red-900/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                        placeholder="Ingresa tu usuario"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="login-password" className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        id="login-password"
                                        type={mostrarPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:bg-white focus:border-red-800 focus:ring-4 focus:ring-red-900/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                        placeholder="Ingresa tu contraseña"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                                    >
                                        {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50/80 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-bold">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full bg-gradient-to-r from-red-900 to-red-800 text-white py-3.5 rounded-xl font-bold text-xs hover:from-red-950 hover:to-red-900 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] shadow-md shadow-red-950/20 hover:shadow-lg"
                            >
                                {cargando ? 'Iniciando sesión...' : <><LogIn size={14} /> INICIAR SESIÓN</>}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-slate-500/80 text-[10px] font-bold mt-6 uppercase tracking-widest">
                    SEIOT © {new Date().getFullYear()} — Secretaría de Desarrollo Rural
                </p>
            </div>
        </div>
    );
};

export default Login;