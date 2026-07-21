import express from 'express';
import bcrypt from 'bcrypt';
import AdmZip from 'adm-zip';
import multer from 'multer';
import pool from '../db.js';
import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path';
import { verificarToken } from './auth.js';
import { registrarAuditLog } from '../utils/auditoria.js';

const router = express.Router();
const uploadRestore = multer({ storage: multer.memoryStorage(), limits: { fileSize: 150 * 1024 * 1024 } });

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

        await client.query('BEGIN');

        // Truncar todas las tablas excepto catálogos
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

        // Eliminar archivos físicos subidos de manera asíncrona
        const uploadsDir = path.join(process.cwd(), 'uploads', 'documentos_firmados');
        try {
            const files = await fsPromises.readdir(uploadsDir);
            await Promise.all(files.map(async (file) => {
                const filePath = path.join(uploadsDir, file);
                const stat = await fsPromises.stat(filePath);
                if (stat.isFile()) await fsPromises.unlink(filePath);
            }));
        } catch (e) {
            // El directorio no existe o está vacío
        }

        await client.query('COMMIT');

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'REINICIO_FABRICA'
        });

        res.json({ mensaje: 'Sistema reiniciado a ceros correctamente. Todos los datos de visitas y PDFs fueron eliminados.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en reset:', error);
        res.status(500).json({ error: 'Error al intentar reiniciar el sistema.' });
    } finally {
        client.release();
    }
});

// ─── SUPERADMIN: DESCARGAR RESPALDO COMPLETO (BASE DE DATOS + PDFS EN .ZIP) ────
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

        const backupData = {
            metadata: {
                version: '2.0',
                fecha: new Date().toISOString(),
                generado_por: req.usuario.usuario
            }
        };

        for (const tabla of tablas) {
            const queryResult = await pool.query(`SELECT * FROM ${tabla}`);
            backupData[tabla] = queryResult.rows;
        }

        // Crear paquete ZIP con datos y archivos PDF
        const zip = new AdmZip();
        zip.addFile('database_backup.json', Buffer.from(JSON.stringify(backupData, null, 2), 'utf8'));

        // Empaquetar PDF firmados si existen físicamente en uploads/documentos_firmados
        const uploadsDir = path.join(process.cwd(), 'uploads', 'documentos_firmados');
        if (fs.existsSync(uploadsDir)) {
            const pdfFiles = await fsPromises.readdir(uploadsDir);
            for (const file of pdfFiles) {
                const filePath = path.join(uploadsDir, file);
                const stat = await fsPromises.stat(filePath);
                if (stat.isFile()) {
                    const content = await fsPromises.readFile(filePath);
                    zip.addFile(`documentos_firmados/${file}`, content);
                }
            }
        }

        const zipBuffer = zip.toBuffer();
        const fecha = new Date().toISOString().split('T')[0];

        await registrarAuditLog(pool, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GENERAR_RESPALDO'
        });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="respaldo_seiot_${fecha}.zip"`);
        res.send(zipBuffer);

    } catch (error) {
        console.error('Error al generar respaldo ZIP:', error);
        res.status(500).json({ error: 'Error interno al intentar generar el respaldo.' });
    }
});

// ─── SUPERADMIN: RESTAURAR RESPALDO COMPLETO (ZIP O JSON) ─────────────────────
router.post('/restore', verificarToken, uploadRestore.single('archivo'), async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para realizar esta acción.' });
        }

        const confirmacion = req.body?.confirmacion || req.body;
        if (confirmacion !== 'RESPALDO-DATOS-SEIOT') {
            return res.status(400).json({ error: 'Clave de confirmación incorrecta.' });
        }

        let backupData = null;

        if (req.file) {
            const filenameLower = req.file.originalname.toLowerCase();
            if (filenameLower.endsWith('.zip') || req.file.mimetype.includes('zip')) {
                const zip = new AdmZip(req.file.buffer);
                const zipEntries = zip.getEntries();

                // 1. Extraer JSON de la base de datos
                const jsonEntry = zipEntries.find(e => e.entryName === 'database_backup.json' || e.entryName.endsWith('.json'));
                if (!jsonEntry) {
                    return res.status(400).json({ error: 'El archivo ZIP no contiene un respaldo JSON de base de datos válido.' });
                }

                backupData = JSON.parse(jsonEntry.getData().toString('utf8'));

                // 2. Extraer archivos PDF firmados a la carpeta física uploads/documentos_firmados
                const uploadsDir = path.join(process.cwd(), 'uploads', 'documentos_firmados');
                await fsPromises.mkdir(uploadsDir, { recursive: true });

                for (const entry of zipEntries) {
                    if (!entry.isDirectory && (entry.entryName.startsWith('documentos_firmados/') || entry.entryName.endsWith('.pdf'))) {
                        const baseName = path.basename(entry.entryName);
                        if (baseName) {
                            const destPath = path.join(uploadsDir, baseName);
                            await fsPromises.writeFile(destPath, entry.getData());
                        }
                    }
                }
            } else {
                // Respaldo de solo JSON
                backupData = JSON.parse(req.file.buffer.toString('utf8'));
            }
        } else if (req.body.backupData) {
            backupData = typeof req.body.backupData === 'string' ? JSON.parse(req.body.backupData) : req.body.backupData;
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

        res.json({ mensaje: 'Respaldo de sistema (base de datos y documentos PDF firmados) restaurado correctamente.' });

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
        console.error('Error al obtener config de folios:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Actualizar la configuración de folios
router.put('/config-folios', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.es_admin && !req.usuario?.superadmin) {
            return res.status(403).json({ error: 'No autorizado.' });
        }

        const { nomenclatura, consecutivo_actual, longitud_consecutivo } = req.body;
        if (!nomenclatura || consecutivo_actual === undefined || !longitud_consecutivo) {
            return res.status(400).json({ error: 'Todos los campos son requeridos.' });
        }

        const resultado = await pool.query(
            `UPDATE configuracion_folios 
             SET nomenclatura = $1, consecutivo_actual = $2, longitud_consecutivo = $3, actualizado_en = NOW()
             WHERE clave = 'general'
             RETURNING *`,
            [nomenclatura, consecutivo_actual, longitud_consecutivo]
        );

        await registrarAuditLog(pool, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'ACTUALIZAR_CONFIG_FOLIOS'
        });

        res.json({ mensaje: 'Configuración de folios actualizada correctamente.', config: resultado.rows[0] });
    } catch (error) {
        console.error('Error al actualizar config de folios:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/superadmin/auditoria - Consultar historial de eventos con filtros y paginación
router.get('/auditoria', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.superadmin && !req.usuario?.es_admin) {
            return res.status(403).json({ error: 'Solo administradores pueden consultar el historial de auditoría.' });
        }

        const { limit = 50, offset = 0, usuario_id, accion, fecha_inicio, fecha_fin } = req.query;

        let conditions = [];
        let params = [];
        let paramIdx = 1;

        if (usuario_id) {
            conditions.push(`usuario_id = $${paramIdx++}`);
            params.push(usuario_id);
        }
        if (accion) {
            conditions.push(`accion = $${paramIdx++}`);
            params.push(accion);
        }
        if (fecha_inicio) {
            conditions.push(`creado_en >= $${paramIdx++}`);
            params.push(fecha_inicio);
        }
        if (fecha_fin) {
            conditions.push(`creado_en <= $${paramIdx++}::timestamp + interval '1 day'`);
            params.push(fecha_fin);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const logsResult = await pool.query(
            `SELECT * FROM audit_logs ${whereClause} ORDER BY creado_en DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            logs: logsResult.rows
        });

    } catch (error) {
        console.error('Error al consultar audit_logs:', error);
        res.status(500).json({ error: 'Error al consultar historial de auditoría.' });
    }
});

export default router;
