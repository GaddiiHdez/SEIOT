import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoGobierno from '../assets/logo-gobierno.jpg';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="bg-white rounded-t-2xl p-4 flex items-center justify-center shadow-xl overflow-hidden">
                    <img src={logoGobierno} alt="Logo Gobierno" className="h-16 object-contain max-w-full" />
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-b-2xl shadow-xl p-8">
                    <h1 className="text-center text-gray-800 font-bold text-xl mb-1">SEIOT</h1>
                    <p className="text-center text-gray-500 text-xs mb-6 uppercase tracking-widest">Sistema de Supervisión Pecuaria</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Usuario</label>
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                                placeholder="Ingresa tu usuario"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={mostrarPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 pr-10"
                                    placeholder="Ingresa tu contraseña"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-300 text-red-700 text-sm p-3 rounded font-bold">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-red-800 text-white py-3 rounded font-bold text-sm hover:bg-red-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {cargando ? 'Iniciando sesión...' : <><LogIn size={18} /> INICIAR SESIÓN</>}
                        </button>
                    </form>
                </div>

                <p className="text-center text-white/50 text-xs mt-4">SEIOT © {new Date().getFullYear()} — Secretaría de Desarrollo Rural</p>
            </div>
        </div>
    );
};

export default Login;