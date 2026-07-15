import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [permisosListos, setPermisosListos] = useState(false);

    const actualizarPermisos = async () => {
        const token = localStorage.getItem('seiot_token');
        if (!token) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/perfil`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setUsuario(prev => prev ? {
                    ...prev,
                    nombre: data.nombre,
                    usuario: data.usuario,
                    es_admin: data.es_admin,
                    superadmin: data.superadmin || false,
                    rol: data.rol,
                    permisos: {
                        ...data.permisos,
                        consultas: data.rol === 'vista' ? true : data.permisos.consultas
                    }
                } : null);
                setPermisosListos(true);
            }
        } catch {
            // Error de red — no cerrar sesión
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('seiot_token');
        let usuarioInicial = null;
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    usuarioInicial = decoded;
                } else {
                    localStorage.removeItem('seiot_token');
                    localStorage.removeItem('visitaActiva');
                }
            } catch {
                localStorage.removeItem('seiot_token');
                localStorage.removeItem('visitaActiva');
            }
        }
        if (usuarioInicial?.rol === 'vista') {
            usuarioInicial = {
                ...usuarioInicial,
                permisos: { ...usuarioInicial.permisos, consultas: true }
            };
        }
        setUsuario(usuarioInicial);
        setCargando(false);

        if (usuarioInicial) {
            actualizarPermisos();
        } else {
            setPermisosListos(true);
        }
    }, []);

    useEffect(() => {
        if (!usuario) return;
        const intervalo = setInterval(() => {
            actualizarPermisos();
        }, 300000); // 5 minutos (300000 ms) en lugar de 10 segundos
        return () => clearInterval(intervalo);
    }, [usuario?.id]);

    const login = (token, datosUsuario) => {
        localStorage.setItem('seiot_token', token);
        setUsuario(datosUsuario);
        setPermisosListos(false);
        // Actualizar permisos inmediatamente después del login
        actualizarPermisos();
    };

    const logout = () => {
        localStorage.removeItem('seiot_token');
        localStorage.removeItem('visitaActiva');
        localStorage.removeItem('desdeConsultas');
        setUsuario(null);
        setPermisosListos(false);
        window.location.replace('/login');
    };

    const tienePermiso = (permiso) => {
        if (!usuario) return false;
        if (usuario.es_admin) return true;
        return usuario.permisos?.[permiso] === true;
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout, tienePermiso, cargando, permisosListos }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };