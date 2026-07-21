import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path';
import { verificarToken } from './auth.js';
import { registrarAuditLog } from '../utils/auditoria.js';

const router = express.Router();

// ─── SUPERADMIN: REINICIAR BASE DE DATOS Y PDFS ──────────────────────────────
router.post('/reset', verificarToken, async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para realizar esta acción.' });
        }

        const { confirmacion } = req.body;
        if (confirmacion !== 'RESET-DATOS-SEIOT') {
            return res.status(400).json({ error: 'Clave de confirmación incorrecta.' });
        }

        // 1. Truncar tablas relacionales
        await client.query('BEGIN');
        await client.query(`
            TRUNCATE TABLE 
            	public.documentos_firmados, 
            	public.modulo1_oficio_notificacion, 
            	public.modulo2_orden_supervision, 
            	public.modulo3_checklist, 
            	public.modulo3_lista_verificacion, 
            	public.modulo4_acta_hechos, 
            	public.modulo5_acta_supervision, 
            	public.modulo6_acta_circunstanciada, 
            	public.visitas 
            RESTART IDENTITY CASCADE
        `);
        await client.query('COMMIT');

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'REINICIAR_SISTEMA',
            detalles: { motivo: 'Reinicio general a ceros solicitado por el SuperAdmin' }
        });

        // 2. Eliminar archivos PDF físicamente de forma asíncrona
        const uploadsDir = path.join(process.cwd(), 'uploads', 'documentos_firmados');
        if (fs.existsSync(uploadsDir)) {
            const files = await fsPromises.readdir(uploadsDir);
            await Promise.all(files.map(async (file) => {
                const filePath = path.join(uploadsDir, file);
                const stat = await fsPromises.stat(filePath);
                if (stat.isFile()) {
                    await fsPromises.unlink(filePath);
                }
            }));
        }

        res.json({ mensaje: 'Base de datos y archivos PDF limpiados correctamente. El sistema está en ceros.' });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Error al hacer rollback en reset:', rollbackErr);
        }
        console.error('Error reset base de datos:', error);
        res.status(500).json({ error: 'Error interno al intentar restablecer la base de datos.' });
    } finally {
        client.release();
    }
});

// ─── SUPERADMIN: EXPORTAR RESPALDO DE BASE DE DATOS ──────────────────────────
router.post('/backup', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para realizar esta acción.' });
        }

        const { confirmacion } = req.body;
        if (confirmacion !== 'RESPALDO-DATOS-SEIOT') {
            return res.status(400).json({ error: 'Clave de confirmación incorrecta.' });
        }

        const tablas = [
            'usuarios',
            'visitas',
            'modulo1_oficio_notificacion',
            'modulo2_orden_supervision',
            'modulo3_lista_verificacion',
            'modulo3_checklist',
            'modulo4_acta_hechos',
            'modulo5_acta_supervision',
            'modulo6_acta_circunstanciada',
            'documentos_firmados'
        ];

        const backup = {
            metadata: {
                version: '1.0',
                fecha: new Date().toISOString(),
                generado_por: req.usuario.usuario
            }
        };

        for (const tabla of tablas) {
            const queryResult = await pool.query(`SELECT * FROM ${tabla}`);
            backup[tabla] = queryResult.rows;
        }

        await registrarAuditLog(pool, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GENERAR_RESPALDO'
        });

        res.json(backup);
    } catch (error) {
        console.error('Error al generar respaldo:', error);
        res.status(500).json({ error: 'Error interno al intentar generar el respaldo.' });
    }
});

// ─── SUPERADMIN: RESTAURAR RESPALDO DE BASE DE DATOS ─────────────────────────
router.post('/restore', verificarToken, async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para realizar esta acción.' });
        }

        const { confirmacion, backupData } = req.body;
        if (confirmacion !== 'RESPALDO-DATOS-SEIOT') {
            return res.status(400).json({ error: 'Clave de confirmación incorrecta.' });
        }

        if (!backupData || typeof backupData !== 'object' || !backupData.metadata) {
            return res.status(400).json({ error: 'Datos de respaldo inválidos o corruptos.' });
        }

        const tablasOrdenadas = [
            'usuarios',
            'visitas',
            'modulo1_oficio_notificacion',
            'modulo2_orden_supervision',
            'modulo3_lista_verificacion',
            'modulo3_checklist',
            'modulo4_acta_hechos',
            'modulo5_acta_supervision',
            'modulo6_acta_circunstanciada',
            'documentos_firmados'
        ];

        await client.query('BEGIN');

        // 1. Truncar todas las tablas
        await client.query(`
            TRUNCATE TABLE 
                public.documentos_firmados, 
                public.modulo1_oficio_notificacion, 
                public.modulo2_orden_supervision, 
                public.modulo3_checklist, 
                public.modulo3_lista_verificacion, 
                public.modulo4_acta_hechos, 
                public.modulo5_acta_supervision, 
                public.modulo6_acta_circunstanciada, 
                public.visitas,
                public.usuarios
            RESTART IDENTITY CASCADE
        `);

        // Hash por defecto para respaldos antiguos que no contenían password_hash (ej: 'seiot123')
        const defaultHash = await bcrypt.hash('seiot123', 10);

        // 2. Restaurar tablas en orden jerárquico
        for (const tabla of tablasOrdenadas) {
            const rows = backupData[tabla];
            if (!rows || rows.length === 0) continue;

            for (let row of rows) {
                // Si la tabla es usuarios y falta el campo password_hash, asignar fallback por defecto
                if (tabla === 'usuarios' && !row.password_hash) {
                    row = { ...row, password_hash: defaultHash };
                }

                const keys = Object.keys(row);
                const values = Object.values(row);
                const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
                const query = `INSERT INTO ${tabla} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`;
                await client.query(query, values);
            }

            // Resetear secuencia serial de ID si aplica
            try {
                await client.query(`
                    SELECT setval(
                        pg_get_serial_sequence('${tabla}', 'id'), 
                        COALESCE(MAX(id), 1), 
                        max(id) IS NOT null
                    ) FROM ${tabla}
                `);
            } catch (e) {
                console.log(`Tabla ${tabla} no tiene secuencia serial o falló al resetear:`, e.message);
            }
        }

        await client.query('COMMIT');

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'RESTAURAR_SISTEMA'
        });

        res.json({ mensaje: 'Respaldo de base de datos restaurado correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al restaurar respaldo:', error);
        res.status(500).json({ error: `Error interno al restaurar: ${error.message}` });
    } finally {
        client.release();
    }
});

// Obtener la configuración actual de folios
router.get('/config-folios', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.es_admin && !req.usuario?.superadmin) {
            return res.status(403).json({ error: 'No autorizado.' });
        }
        const resultado = await pool.query("SELECT nomenclatura, consecutivo_actual, longitud_consecutivo FROM configuracion_folios WHERE clave = 'general'");
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada.' });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error obteniendo config-folios:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Guardar la configuración de folios
router.put('/config-folios', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para realizar esta acción.' });
        }
        const { nomenclatura, consecutivo_actual, longitud_consecutivo } = req.body;
        
        if (!nomenclatura || typeof consecutivo_actual !== 'number' || typeof longitud_consecutivo !== 'number') {
            return res.status(400).json({ error: 'Datos de configuración incompletos o inválidos.' });
        }
        
        await pool.query(
            `UPDATE configuracion_folios 
             SET nomenclatura = $1, consecutivo_actual = $2, longitud_consecutivo = $3 
             WHERE clave = 'general'`,
            [nomenclatura.trim(), consecutivo_actual, longitud_consecutivo]
        );

        await registrarAuditLog({
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'CONFIGURAR_FOLIOS',
            tablaAfectada: 'configuracion_folios',
            registroId: 'general',
            detalles: {
                nomenclatura,
                consecutivo_actual,
                longitud_consecutivo
            }
        });
        
        res.json({ mensaje: 'Configuración de folios actualizada correctamente.' });
    } catch (error) {
        console.error('Error guardando config-folios:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Obtener bitácora de auditoría (solo SuperAdmin)
router.get('/auditoria', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para ver la bitácora.' });
        }

        const { limit = 100, offset = 0, usuario_id, accion, fecha_inicio, fecha_fin } = req.query;
        
        let queryStr = `
            SELECT a.*, u.nombre as real_usuario_nombre, u.usuario as real_usuario_username 
            FROM auditoria_logs a
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (usuario_id) {
            queryStr += ` AND a.usuario_id = $${paramIndex}`;
            params.push(parseInt(usuario_id));
            paramIndex++;
        }

        if (accion) {
            queryStr += ` AND a.accion = $${paramIndex}`;
            params.push(accion);
            paramIndex++;
        }

        if (fecha_inicio) {
            queryStr += ` AND a.creado_en >= $${paramIndex}`;
            params.push(fecha_inicio);
            paramIndex++;
        }

        if (fecha_fin) {
            queryStr += ` AND a.creado_en <= $${paramIndex}`;
            params.push(fecha_fin);
            paramIndex++;
        }

        queryStr += ` ORDER BY a.creado_en DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const resultado = await pool.query(queryStr, params);
        
        // También obtener el total para paginación
        let countQueryStr = `SELECT COUNT(*) FROM auditoria_logs a WHERE 1=1`;
        const countParams = [];
        let countParamIndex = 1;

        if (usuario_id) {
            countQueryStr += ` AND a.usuario_id = $${countParamIndex}`;
            countParams.push(parseInt(usuario_id));
            countParamIndex++;
        }

        if (accion) {
            countQueryStr += ` AND a.accion = $${countParamIndex}`;
            countParams.push(accion);
            countParamIndex++;
        }

        if (fecha_inicio) {
            countQueryStr += ` AND a.creado_en >= $${countParamIndex}`;
            countParams.push(fecha_inicio);
            countParamIndex++;
        }

        if (fecha_fin) {
            countQueryStr += ` AND a.creado_en <= $${countParamIndex}`;
            countParams.push(fecha_fin);
            countParamIndex++;
        }

        const countResult = await pool.query(countQueryStr, countParams);

        res.json({
            logs: resultado.rows,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('Error al consultar bitácora de auditoría:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

export default router;
