import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RutaProtegida = ({ children }) => {
    const { usuario, cargando } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Bloquear navegación hacia atrás después de logout
        const bloquearAtras = () => {
            const token = localStorage.getItem('seiot_token');
            if (!token) {
                window.history.pushState(null, '', '/login');
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('popstate', bloquearAtras);
        return () => window.removeEventListener('popstate', bloquearAtras);
    }, [navigate]);

    if (cargando) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto mb-4"></div>
                <p className="text-gray-500 font-bold">Cargando...</p>
            </div>
        </div>
    );

    const token = localStorage.getItem('seiot_token');
    if (!usuario || !token) return <Navigate to="/login" replace />;

    return children;
};

export default RutaProtegida;