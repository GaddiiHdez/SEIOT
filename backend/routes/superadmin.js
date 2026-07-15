import express from 'express';
import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { verificarToken } from './auth.js';

const router = express.Router();

// ─── SUPERADMIN: REINICIAR BASE DE DATOS Y PDFS ──────────────────────────────
router.post('/reset', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para realizar esta acción.' });
        }

        const { confirmacion } = req.body;
        if (confirmacion !== 'RESET-DATOS-SEIOT') {
            return res.status(400).json({ error: 'Clave de confirmación incorrecta.' });
        }

        // 1. Truncar tablas relacionales
        await pool.query('BEGIN');
        await pool.query(`
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
        await pool.query('COMMIT');

        // 2. Eliminar archivos PDF físicamente
        const uploadsDir = path.join(process.cwd(), 'uploads', 'documentos_firmados');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        res.json({ mensaje: 'Base de datos y archivos PDF limpiados correctamente. El sistema está en ceros.' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error reset base de datos:', error);
        res.status(500).json({ error: 'Error interno al intentar restablecer la base de datos.' });
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

        // 2. Restaurar tablas en orden jerárquico
        for (const tabla of tablasOrdenadas) {
            const rows = backupData[tabla];
            if (!rows || rows.length === 0) continue;

            for (const row of rows) {
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
        res.json({ mensaje: 'Respaldo de base de datos restaurado correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al restaurar respaldo:', error);
        res.status(500).json({ error: `Error interno al restaurar: ${error.message}` });
    } finally {
        client.release();
    }
});

export default router;
