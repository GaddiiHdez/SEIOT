import pool from '../db.js';

/**
 * Registra una acción de auditoría en la base de datos de manera segura y asíncrona.
 * 
 * @param {Object} [client] - Opcional. Cliente de base de datos dentro de una transacción activa.
 * @param {Object} logData - Datos del log a guardar.
 * @param {number} [logData.usuarioId] - ID del usuario responsable.
 * @param {string} [logData.usuarioNombre] - Nombre del usuario responsable.
 * @param {string} [logData.usuarioUsername] - Username del usuario responsable.
 * @param {string} logData.accion - Tipo de acción ('INICIO_SESION', 'CREAR_USUARIO', etc.).
 * @param {string} [logData.tablaAfectada] - Tabla SQL involucrada en el cambio.
 * @param {string} [logData.registroId] - ID del registro (Folio, ID de usuario, etc.).
 * @param {Object} [logData.detalles] - JSON con información detallada adicional (IP, User-Agent, datos cambiados).
 */
export const registrarAuditLog = async (client, logData) => {
    let activeClient = client;
    let data = logData;
    
    // Si solo se pasa un argumento, significa que es logData y usaremos el pool por defecto
    if (!logData && client && typeof client === 'object' && client.accion) {
        data = client;
        activeClient = pool;
    }
    
    const db = activeClient || pool;
    
    try {
        const { usuarioId, usuarioNombre, usuarioUsername, accion, tablaAfectada, registroId, detalles } = data;
        
        await db.query(
            `INSERT INTO public.auditoria_logs 
                (usuario_id, usuario_nombre, usuario_username, accion, tabla_afectada, registro_id, detalles)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                usuarioId || null,
                usuarioNombre || null,
                usuarioUsername || null,
                accion,
                tablaAfectada || null,
                registroId || null,
                detalles ? JSON.stringify(detalles) : null
            ]
        );
    } catch (err) {
        // No arrojamos el error hacia arriba para evitar interrumpir la operación principal
        console.error('❌ Error al guardar log de auditoría:', err);
    }
};
