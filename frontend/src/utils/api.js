// Helper para hacer fetch con token automáticamente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const queueOfflineSync = (endpoint, options) => {
    let queue = [];
    try {
        queue = JSON.parse(localStorage.getItem('seiot_sync_queue') || '[]');
    } catch {
        queue = [];
    }

    let visitaId = null;
    try {
        if (options.body) {
            const bodyObj = JSON.parse(options.body);
            visitaId = bodyObj.visita_id;
        }
    } catch (e) {
        console.error('Error parseando body para offline sync:', e);
    }

    // Filtrar entradas anteriores del mismo endpoint y visita
    queue = queue.filter(item => {
        let itemVisitaId = null;
        try {
            if (item.options?.body) {
                const itemBody = JSON.parse(item.options.body);
                itemVisitaId = itemBody.visita_id;
            }
        } catch {}
        return !(item.endpoint === endpoint && itemVisitaId === visitaId);
    });

    queue.push({
        endpoint,
        options,
        timestamp: Date.now()
    });

    localStorage.setItem('seiot_sync_queue', JSON.stringify(queue));

    // Notificar al usuario (usando window.alert interceptado)
    setTimeout(() => {
        window.alert("📦 Sin conexión a Internet.\nTus datos han sido guardados de manera segura en este dispositivo y se subirán al servidor en cuanto se recupere la señal.");
    }, 100);
};

export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('seiot_token');
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const isPost = options.method === 'POST' || options.method === 'PUT';
    const isModuloSave = endpoint && endpoint.startsWith('/api/modulos/modulo');
    const isSyncing = options.isSyncing;

    // Si no hay red y es un guardado de módulo, encolar localmente de inmediato
    if (!navigator.onLine && isPost && isModuloSave && !isSyncing) {
        queueOfflineSync(endpoint, options);
        return new Response(JSON.stringify({ ok: true, offline: true, mensaje: 'Guardado en cola offline.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        // Si el token expiró, limpiar sesión y redirigir
        if (res.status === 401) {
            localStorage.removeItem('seiot_token');
            localStorage.removeItem('visitaActiva');
            window.location.replace('/login');
            return null;
        }

        return res;
    } catch (error) {
        // Si hay una falla de red (catch fetch), y es guardado de módulo, encolar
        if (isPost && isModuloSave && !isSyncing) {
            queueOfflineSync(endpoint, options);
            return new Response(JSON.stringify({ ok: true, offline: true, mensaje: 'Guardado en cola offline.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        throw error;
    }
};

export { API_URL };