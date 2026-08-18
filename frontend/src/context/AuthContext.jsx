import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS } from '../constants/storageKeys.js';
import { apiFetch } from '../utils/api.js';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [permisosListos, setPermisosListos] = useState(false);

    const actualizarPermisos = async () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) return;

        try {
            const response = await apiFetch('/api/auth/perfil');
            if (!response) return;

            if (response.ok) {
                const data = await response.json();
                setUsuario(prev => ({
                    ...(prev || {}),
                    id: data.id ?? prev?.id,
                    nombre: data.nombre || prev?.nombre,
                    usuario: data.usuario || prev?.usuario,
                    es_admin: data.es_admin ?? prev?.es_admin,
                    superadmin: data.superadmin ?? prev?.superadmin ?? false,
                    rol: data.rol || prev?.rol,
                    permisos: {
                        ...(prev?.permisos || {}),
                        ...(data.permisos || {}),
                        consultas: data.rol === 'vista' ? true : (data.permisos?.consultas ?? prev?.permisos?.consultas)
                    }
                }));
                setPermisosListos(true);
            }
        } catch {
            // Error de red — no cerrar sesión
        }
    };

        useEffect(() => {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            let usuarioInicial = null;
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 > Date.now()) {
                        usuarioInicial = decoded;
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.TOKEN);
                        localStorage.removeItem(STORAGE_KEYS.VISITA_ACTIVA);
                    }
                } catch {
                    localStorage.removeItem(STORAGE_KEYS.TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.VISITA_ACTIVA);
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
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            setUsuario(datosUsuario);
            setPermisosListos(false);
            // Actualizar permisos inmediatamente después del login
            actualizarPermisos();
        };

        const logout = () => {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.VISITA_ACTIVA);
            localStorage.removeItem(STORAGE_KEYS.DESDE_CONSULTAS);
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