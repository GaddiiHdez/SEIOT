import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

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
        setUsuario(usuarioInicial);
        setCargando(false);
    }, []);

    const login = (token, datosUsuario) => {
        localStorage.setItem('seiot_token', token);
        setUsuario(datosUsuario);
    };

    const logout = () => {
        localStorage.removeItem('seiot_token');
        localStorage.removeItem('visitaActiva');
        setUsuario(null);
        // Reemplazar historial para que la flecha atrás no regrese al dashboard
        window.history.pushState(null, '', '/login');
    };

    const tienePermiso = (permiso) => {
        if (!usuario) return false;
        if (usuario.es_admin) return true;
        return usuario.permisos?.[permiso] === true;
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout, tienePermiso, cargando }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };