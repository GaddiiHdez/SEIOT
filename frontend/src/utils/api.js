// Helper para hacer fetch con token automáticamente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('seiot_token');
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    // Si el token expiró, limpiar sesión y redirigir
    if (res.status === 401) {
        localStorage.removeItem('seiot_token');
        localStorage.removeItem('visitaActiva');
        window.location.replace('/login');
        return null;
    }

    return res;
};

export { API_URL };