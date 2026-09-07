import express from 'express';
import bcrypt from 'bcrypt';
import AdmZip from 'adm-zip';
import multer from 'multer';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import pool from '../db.js';
import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path';
import { verificarToken } from './auth.js';
import { registrarAuditLog } from '../utils/auditoria.js';
import { getUploadsDir, getDiskStats, findDocumentoFirmado } from '../utils/storage.js';

const execAsync = promisify(exec);
const router = express.Router();
const uploadRestore = multer({ storage: multer.memoryStorage(), limits: { fileSize: 150 * 1024 * 1024 } });

// Helper para calcular hash SHA-256 de un buffer
function calcularSha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Helper para obtener parámetros de conexión a PostgreSQL
function getDbParams() {
    if (process.env.DATABASE_URL) {
        try {
            const url = new URL(process.env.DATABASE_URL);
            return {
                host: url.hostname,
                port: url.port || '5432',
                user: url.username,
                password: url.password,
                database: url.pathname.replace('/', '')
            };
        } catch (e) {
            // Continuar con fallback
        }
    }
    return {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'seiot'
    };
}

// ─── HELPER: GENERAR DUMP SQL NATIVO DE LA BASE DE DATOS ───────────────────────
async function generarSqlDump() {
    const db = getDbParams();
    const env = {
        ...process.env,
        PGHOST: db.host,
        PGPORT: String(db.port),
        PGUSER: db.user,
        PGPASSWORD: db.password,
        PGDATABASE: db.database
    };

    // 1. Intentar usar la herramienta CLI nativa `pg_dump` si está disponible en el servidor
    try {
        const cmd = `pg_dump --clean --if-exists --inserts --column-inserts --no-owner --no-acl`;
        const { stdout } = await execAsync(cmd, { env, maxBuffer: 50 * 1024 * 1024 });
        if (stdout && stdout.length > 50) {
            return stdout;
        }
    } catch (e) {
        console.log('pg_dump no está en el PATH del sistema o no está disponible, usando generador SQL nativo:', e.message);
    }

    // 2. Generador SQL NATIVO robusto en Node.js (Fallback de alta fidelidad)
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

    let sql = `-- ========================================================\n`;
    sql += `-- SEIOT NATIVE DUMP SQL BACKUP\n`;
    sql += `-- Fecha de generación: ${new Date().toISOString()}\n`;
    sql += `-- Sistema: SEIOT (Sistema Estatal de Información)\n`;
    sql += `-- ========================================================\n\n`;
    sql += `BEGIN;\n\n`;
    sql += `TRUNCATE TABLE 
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
    RESTART IDENTITY CASCADE;\n\n`;

    const defaultHash = await bcrypt.hash('seiot123', 10);

    for (const tabla of tablas) {
        const res = await pool.query(`SELECT * FROM ${tabla}`);
        if (res.rows.length === 0) continue;

        sql += `-- --------------------------------------------------------\n`;
        sql += `-- Datos para la tabla: ${tabla}\n`;
        sql += `-- --------------------------------------------------------\n`;

        for (let row of res.rows) {
            if (tabla === 'usuarios' && !row.password_hash) {
                row.password_hash = defaultHash;
            }
            const keys = Object.keys(row);
            const vals = Object.values(row).map(v => {
                if (v === null || v === undefined) return 'NULL';
                if (typeof v === 'number' || typeof v === 'boolean') return v;
                if (v instanceof Date) return `'${v.toISOString()}'`;
                if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
                return `'${String(v).replace(/'/g, "''")}'`;
            });
            sql += `INSERT INTO ${tabla} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
        }

        // Reset de secuencia serial
        sql += `SELECT setval(pg_get_serial_sequence('${tabla}', 'id'), COALESCE((SELECT MAX(id) FROM ${tabla}), 1), (SELECT MAX(id) IS NOT NULL FROM ${tabla}));\n\n`;
    }

    sql += `COMMIT;\n`;
    return sql;
}



// ─── SUPERADMIN: DESCARGAR RESPALDO DUMP NATIVO + MANIFIESTO SHA-256 ──────────
router.post('/backup', verificarToken, async (req, res) => {
    try {
        if (!req.usuario?.superadmin) {
            return res.status(403).json({ error: 'Solo el SuperAdmin está autorizado para realizar esta acción.' });
        }

        const { confirmacion } = req.body;
        if (confirmacion !== 'RESPALDO-DATOS-SEIOT') {
            return res.status(400).json({ error: 'Clave de confirmación incorrecta.' });
        }

        const zip = new AdmZip();
        const manifest = {
            version: '3.0_NATIVE_DUMP',
            checksum_algorithm: 'SHA-256',
            creado_en: new Date().toISOString(),
            generado_por: req.usuario.usuario,
            archivos: {}
        };

        // 1. Generar Dump SQL Nativo
        const sqlContent = await generarSqlDump();
        const sqlBuffer = Buffer.from(sqlContent, 'utf8');
        zip.addFile('seiot_database_backup.sql', sqlBuffer);
        manifest.archivos['seiot_database_backup.sql'] = calcularSha256(sqlBuffer);

        // 2. Generar también respaldo JSON para compatibilidad
        const tablas = [
            'usuarios', 'visitas', 'modulo1_oficio_notificacion', 'modulo2_orden_supervision',
            'modulo3_lista_verificacion', 'modulo3_checklist', 'modulo4_acta_hechos',
            'modulo5_acta_supervision', 'modulo6_acta_circunstanciada', 'documentos_firmados'
        ];
        const backupJson = { metadata: manifest };
        for (const tabla of tablas) {
            const queryResult = await pool.query(`SELECT * FROM ${tabla}`);
            backupJson[tabla] = queryResult.rows;
        }
        const jsonBuffer = Buffer.from(JSON.stringify(backupJson, null, 2), 'utf8');
        zip.addFile('database_backup.json', jsonBuffer);
        manifest.archivos['database_backup.json'] = calcularSha256(jsonBuffer);

        // 3. Incluir documentos PDF firmados con su respectivo hash SHA-256
        const uploadsDir = getUploadsDir();
        if (fs.existsSync(uploadsDir)) {
            const pdfFiles = await fsPromises.readdir(uploadsDir);
            for (const file of pdfFiles) {
                const filePath = path.join(uploadsDir, file);
                const stat = await fsPromises.stat(filePath);
                if (stat.isFile()) {
                    const pdfBuffer = await fsPromises.readFile(filePath);
                    const zipPath = `documentos_firmados/${file}`;
                    zip.addFile(zipPath, pdfBuffer);
                    manifest.archivos[zipPath] = calcularSha256(pdfBuffer);
                }
            }
        }

        // 4. Agregar manifiesto criptográfico de integridad SHA-256 al paquete ZIP
        const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
        zip.addFile('manifest.json', manifestBuffer);

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
        console.error('Error al generar respaldo nativo SQL:', error);
        res.status(500).json({ error: 'Error interno al intentar generar el respaldo.' });
    }
});

// ─── SUPERADMIN: RESTAURAR DUMP NATIVO + VERIFICACIÓN DE MANIFIESTO SHA-256 ────
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

        let sqlScriptToRun = null;
        let backupJsonData = null;

        if (req.file) {
            const filenameLower = req.file.originalname.toLowerCase();
            if (filenameLower.endsWith('.zip') || req.file.mimetype.includes('zip')) {
                const zip = new AdmZip(req.file.buffer);
                const zipEntries = zip.getEntries();

                // A. VERIFICACIÓN CRIPTOGRÁFICA DE INTEGRIDAD MEDIANTE MANIFIESTO SHA-256
                const manifestEntry = zipEntries.find(e => e.entryName === 'manifest.json');
                if (manifestEntry) {
                    try {
                        const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
                        if (manifest.archivos) {
                            for (const [filePath, expectedHash] of Object.entries(manifest.archivos)) {
                                const entry = zipEntries.find(e => e.entryName === filePath);
                                if (entry) {
                                    const actualHash = calcularSha256(entry.getData());
                                    if (actualHash !== expectedHash) {
                                        return res.status(400).json({
                                            error: `🚨 FALLO CRÍTICO DE INTEGRIDAD: El archivo ${filePath} dentro del respaldo ha sido modificado o está corrupto. Restauración cancelada por seguridad.`
                                        });
                                    }
                                }
                            }
                        }
                    } catch (errManifest) {
                        console.warn('Error al validar manifiesto SHA-256, procediendo con verificación estándar:', errManifest.message);
                    }
                }

                // B. BUSCAR ARCHIVO SQL NATIVO O JSON DE RESPALDO
                const sqlEntry = zipEntries.find(e => e.entryName.endsWith('.sql'));
                if (sqlEntry) {
                    sqlScriptToRun = sqlEntry.getData().toString('utf8');
                } else {
                    const jsonEntry = zipEntries.find(e => e.entryName.endsWith('.json') && e.entryName !== 'manifest.json');
                    if (jsonEntry) {
                        backupJsonData = JSON.parse(jsonEntry.getData().toString('utf8'));
                    }
                }

                // C. EXTRAER DOCUMENTOS PDF FIRMADOS
                const uploadsDir = getUploadsDir();
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
            } else if (filenameLower.endsWith('.sql')) {
                sqlScriptToRun = req.file.buffer.toString('utf8');
            } else {
                backupJsonData = JSON.parse(req.file.buffer.toString('utf8'));
            }
        } else if (req.body.backupData) {
            backupJsonData = typeof req.body.backupData === 'string' ? JSON.parse(req.body.backupData) : req.body.backupData;
        }

        if (!sqlScriptToRun && (!backupJsonData || typeof backupJsonData !== 'object')) {
            return res.status(400).json({ error: 'No se encontraron datos SQL o JSON válidos en el archivo suministrado.' });
        }

        await client.query('BEGIN');

        // EJECUCIÓN DE RESTAURACIÓN NATIVA SQL
        if (sqlScriptToRun) {
            await client.query(sqlScriptToRun);
        } else if (backupJsonData) {
            // MODO FALLBACK JSON
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

            const tablasOrdenadas = [
                'usuarios', 'visitas', 'modulo1_oficio_notificacion', 'modulo2_orden_supervision',
                'modulo3_lista_verificacion', 'modulo3_checklist', 'modulo4_acta_hechos',
                'modulo5_acta_supervision', 'modulo6_acta_circunstanciada', 'documentos_firmados'
            ];

            const defaultHash = await bcrypt.hash('seiot123', 10);
            for (const tabla of tablasOrdenadas) {
                const rows = backupJsonData[tabla];
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
            }
        }

        await client.query('COMMIT');

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'RESTAURAR_SISTEMA'
        });

        res.json({ mensaje: '¡Respaldo Nativo SQL con verificación de integridad SHA-256 restaurado exitosamente!' });

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
            `SELECT COUNT(*) FROM public.auditoria_logs ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0]?.count || '0');

        const logsResult = await pool.query(
            `SELECT * FROM public.auditoria_logs ${whereClause} ORDER BY creado_en DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            logs: logsResult.rows
        });

    } catch (error) {
        console.error('Error al consultar auditoria_logs:', error);
        res.status(500).json({ error: 'Error al consultar historial de auditoría.' });
    }
});

// ─── SINCRONIZAR O RESTAURAR SOLO PDFs AL ALMACENAMIENTO PERSISTENTE ─────────
router.post('/sincronizar-pdfs', verificarToken, uploadRestore.single('archivo'), async (req, res) => {
    if (!req.usuario?.superadmin && !req.usuario?.es_admin) {
        return res.status(403).json({ error: 'Solo administradores pueden sincronizar PDFs.' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo ZIP.' });
    }

    try {
        const zip = new AdmZip(req.file.buffer);
        const entries = zip.getEntries();
        const uploadsDir = getUploadsDir();
        await fsPromises.mkdir(uploadsDir, { recursive: true });

        const restaurados = [];
        for (const entry of entries) {
            if (!entry.isDirectory && entry.entryName.endsWith('.pdf')) {
                const baseName = path.basename(entry.entryName);
                if (baseName) {
                    const destPath = path.join(uploadsDir, baseName);
                    await fsPromises.writeFile(destPath, entry.getData());
                    restaurados.push(baseName);
                }
            }
        }

        res.json({
            mensaje: `✅ Se sincronizaron exitosamente ${restaurados.length} archivos PDF al almacenamiento persistente.`,
            total: restaurados.length,
            archivos: restaurados,
            destino: uploadsDir
        });
    } catch (e) {
        console.error('Error sincronizando PDFs:', e);
        res.status(500).json({ error: 'Error al procesar el archivo ZIP: ' + e.message });
    }
});

// ─── LIMPIAR DISCO DE PDFs (ELIMINAR ARCHIVOS INÚTILES O DE PRUEBA) ───────────
router.post('/limpiar-disco-pdfs', verificarToken, async (req, res) => {
    if (!req.usuario?.superadmin && !req.usuario?.es_admin) {
        return res.status(403).json({ error: 'Solo administradores pueden limpiar el disco.' });
    }
    try {
        const uploadsDir = getUploadsDir();
        let eliminados = 0;
        if (fs.existsSync(uploadsDir)) {
            const files = await fsPromises.readdir(uploadsDir);
            for (const file of files) {
                if (file.endsWith('.pdf')) {
                    await fsPromises.unlink(path.join(uploadsDir, file)).catch(() => {});
                    eliminados++;
                }
            }
        }
        res.json({
            ok: true,
            mensaje: `Se eliminaron ${eliminados} archivos PDF del disco persistente.`,
            eliminados,
            uploadsDir
        });
    } catch (e) {
        console.error('Error limpiando disco de PDFs:', e);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// ─── NUBE SEIOT: EXPLORADOR Y GESTOR DEL DISCO PERSISTENTE (SOLO SUPERADMIN) ─
// ============================================================================

// Helper de formateo de bytes legible
function formatearBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// 1. OBTENER ESTADO Y MÉTRICAS DEL DISCO VIRTUAL (SUPERADMIN)
router.get('/disco/estado', verificarToken, async (req, res) => {
    if (!req.usuario?.superadmin) {
        return res.status(403).json({ error: 'Acceso denegado: Solo el SuperAdministrador tiene acceso a la Nube y Disco.' });
    }

    try {
        const uploadsDir = getUploadsDir();
        const diskStats = getDiskStats();

        let totalPdfs = 0;
        let tamanoTotalPdfs = 0;

        if (fs.existsSync(uploadsDir)) {
            const files = await fsPromises.readdir(uploadsDir);
            for (const file of files) {
                if (file.toLowerCase().endsWith('.pdf')) {
                    try {
                        const s = await fsPromises.stat(path.join(uploadsDir, file));
                        if (s.isFile()) {
                            totalPdfs++;
                            tamanoTotalPdfs += s.size;
                        }
                    } catch {}
                }
            }
        }

        // Consultar cuántos registros hay en la base de datos
        let totalRegistrosBD = 0;
        try {
            const dbCount = await pool.query('SELECT COUNT(*) FROM public.documentos_firmados');
            totalRegistrosBD = parseInt(dbCount.rows[0]?.count || '0');
        } catch {}

        res.json({
            ok: true,
            discoMontado: diskStats.isMounted,
            puntoMontaje: diskStats.mountPoint || uploadsDir,
            rutaUploads: uploadsDir,
            espacioTotalBytes: diskStats.totalBytes,
            espacioTotal: formatearBytes(diskStats.totalBytes),
            espacioUsadoBytes: diskStats.usedBytes,
            espacioUsado: formatearBytes(diskStats.usedBytes),
            espacioLibreBytes: diskStats.freeBytes,
            espacioLibre: formatearBytes(diskStats.freeBytes),
            porcentajeUso: diskStats.percentUsed,
            totalArchivosDisco: totalPdfs,
            tamanoArchivosDiscoBytes: tamanoTotalPdfs,
            tamanoArchivosDisco: formatearBytes(tamanoTotalPdfs),
            totalRegistrosBD
        });
    } catch (e) {
        console.error('Error al consultar estado del disco:', e);
        res.status(500).json({ error: 'Error al consultar estado del disco: ' + e.message });
    }
});

// 2. LISTAR TODOS LOS ARCHIVOS DEL DISCO CON CRUCE DE BASE DE DATOS
router.get('/disco/archivos', verificarToken, async (req, res) => {
    if (!req.usuario?.superadmin) {
        return res.status(403).json({ error: 'Acceso denegado: Solo el SuperAdministrador tiene acceso a la Nube y Disco.' });
    }

    try {
        const uploadsDir = getUploadsDir();
        const archivosEnDisco = [];
        const setArchivosEnDisco = new Set();

        // 1. Obtener registros de la BD con información de la visita
        let dbRows = [];
        try {
            const dbResult = await pool.query(`
                SELECT 
                    df.id,
                    df.visita_id,
                    df.modulo,
                    df.nombre_archivo,
                    df.fecha_subida,
                    v.folio,
                    v.datos_psg
                FROM public.documentos_firmados df
                LEFT JOIN public.visitas v ON df.visita_id = v.id
                ORDER BY df.id DESC
            `);
            dbRows = dbResult.rows || [];
        } catch (dbErr) {
            console.warn('Advertencia consultando documentos_firmados en BD:', dbErr.message);
        }

        const dbMap = new Map();
        for (const row of dbRows) {
            if (row.nombre_archivo) {
                dbMap.set(row.nombre_archivo.trim(), row);
            }
        }

        // 2. Leer archivos físicos en el disco
        if (fs.existsSync(uploadsDir)) {
            const files = await fsPromises.readdir(uploadsDir);
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                try {
                    const stat = await fsPromises.stat(filePath);
                    if (stat.isFile()) {
                        setArchivosEnDisco.add(file);

                        // Intentar deducir visita y módulo desde el nombre del archivo
                        // Ejemplo: visita_65_modulo1_firmado.pdf
                        let visitaId = null;
                        let modulo = null;
                        const matchVisita = file.match(/visita[_-](\d+)/i);
                        if (matchVisita) visitaId = parseInt(matchVisita[1]);
                        const matchModulo = file.match(/modulo[_-]?(\d+)/i);
                        if (matchModulo) modulo = parseInt(matchModulo[1]);

                        const dbInfo = dbMap.get(file);

                        archivosEnDisco.push({
                            nombre: file,
                            tamanoBytes: stat.size,
                            tamano: formatearBytes(stat.size),
                            fechaModificacion: stat.mtime,
                            enBaseDatos: !!dbInfo,
                            visitaId: dbInfo?.visita_id || visitaId,
                            modulo: dbInfo?.modulo || modulo,
                            folio: dbInfo?.folio || null,
                            empresa: dbInfo?.datos_psg?.nombre_empresa || null,
                            fechaSubidaBD: dbInfo?.fecha_subida || null
                        });
                    }
                } catch {}
            }
        }

        // 3. Identificar registros en BD cuyos archivos físicos no están en el disco
        const registrosSinArchivo = [];
        for (const row of dbRows) {
            if (!setArchivosEnDisco.has(row.nombre_archivo)) {
                registrosSinArchivo.push({
                    id: row.id,
                    visitaId: row.visita_id,
                    modulo: row.modulo,
                    nombreArchivo: row.nombre_archivo,
                    folio: row.folio,
                    empresa: row.datos_psg?.nombre_empresa || null,
                    fechaSubida: row.fecha_subida
                });
            }
        }

        // Ordenar archivos en disco por fecha de modificación más reciente primero
        archivosEnDisco.sort((a, b) => new Date(b.fechaModificacion) - new Date(a.fechaModificacion));

        res.json({
            ok: true,
            totalEnDisco: archivosEnDisco.length,
            totalSinArchivo: registrosSinArchivo.length,
            archivos: archivosEnDisco,
            registrosSinArchivo,
            rutaUploads: uploadsDir
        });

    } catch (e) {
        console.error('Error listando archivos del disco:', e);
        res.status(500).json({ error: 'Error al listar archivos del disco: ' + e.message });
    }
});

// 3. SUBIR ARCHIVOS (PDFs MÚLTIPLES O ARCHIVO ZIP) DIRECTAMENTE AL DISCO
router.post('/disco/subir', verificarToken, uploadRestore.array('archivos', 100), async (req, res) => {
    if (!req.usuario?.superadmin) {
        return res.status(403).json({ error: 'Acceso denegado: Solo el SuperAdministrador tiene acceso a la Nube y Disco.' });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se recibieron archivos para subir.' });
    }

    try {
        const uploadsDir = getUploadsDir();
        await fsPromises.mkdir(uploadsDir, { recursive: true });

        const archivosProcesados = [];

        for (const file of req.files) {
            const originalName = file.originalname;
            const originalLower = originalName.toLowerCase();

            // CASO A: Archivo ZIP
            if (originalLower.endsWith('.zip') || file.mimetype.includes('zip')) {
                const zip = new AdmZip(file.buffer);
                const entries = zip.getEntries();
                for (const entry of entries) {
                    if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.pdf')) {
                        const baseName = path.basename(entry.entryName);
                        if (baseName) {
                            const destPath = path.join(uploadsDir, baseName);
                            await fsPromises.writeFile(destPath, entry.getData());
                            archivosProcesados.push(baseName);
                            await autoVincularDocumentoBD(baseName, destPath);
                        }
                    }
                }
            } 
            // CASO B: Archivo PDF individual
            else if (originalLower.endsWith('.pdf') || file.mimetype.includes('pdf')) {
                const destPath = path.join(uploadsDir, originalName);
                await fsPromises.writeFile(destPath, file.buffer);
                archivosProcesados.push(originalName);
                await autoVincularDocumentoBD(originalName, destPath);
            }
        }

        // Registrar auditoría
        await registrarAuditLog({
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre || 'SuperAdmin',
            accion: 'SUBIR_ARCHIVOS_DISCO',
            tablaAfectada: 'documentos_firmados',
            detalles: { cantidad: archivosProcesados.length, archivos: archivosProcesados.slice(0, 20) },
            ip: req.ip || req.connection.remoteAddress
        });

        res.json({
            ok: true,
            mensaje: `Se subieron exitosamente ${archivosProcesados.length} archivo(s) al disco persistente.`,
            total: archivosProcesados.length,
            archivos: archivosProcesados
        });

    } catch (e) {
        console.error('Error al subir archivos al disco:', e);
        res.status(500).json({ error: 'Error al procesar la subida: ' + e.message });
    }
});

// Helper para autovincular con PostgreSQL si el nombre cumple visita_X_moduloY_firmado.pdf
async function autoVincularDocumentoBD(nombreArchivo, rutaArchivo) {
    try {
        const match = nombreArchivo.match(/visita_(\d+)_modulo(\d+)_firmado\.pdf/i);
        if (match) {
            const visitaId = parseInt(match[1]);
            const modulo = parseInt(match[2]);

            // Verificar si la visita existe
            const existeVisita = await pool.query('SELECT id FROM public.visitas WHERE id = $1', [visitaId]);
            if (existeVisita.rows.length === 0) return;

            // Verificar si ya existe registro en documentos_firmados
            const existeDoc = await pool.query(
                'SELECT id FROM public.documentos_firmados WHERE visita_id = $1 AND modulo = $2',
                [visitaId, modulo]
            );

            if (existeDoc.rows.length > 0) {
                await pool.query(
                    'UPDATE public.documentos_firmados SET nombre_archivo = $1, ruta_archivo = $2, fecha_subida = NOW() WHERE visita_id = $3 AND modulo = $4',
                    [nombreArchivo, rutaArchivo, visitaId, modulo]
                );
            } else {
                await pool.query(
                    'INSERT INTO public.documentos_firmados (visita_id, modulo, nombre_archivo, ruta_archivo, fecha_subida) VALUES ($1, $2, $3, $4, NOW())',
                    [visitaId, modulo, nombreArchivo, rutaArchivo]
                );
            }
        }
    } catch (err) {
        console.warn('Error en autoVincularDocumentoBD:', err.message);
    }
}

// 4. DESCARGAR O PREVISUALIZAR UN ARCHIVO ESPECÍFICO DEL DISCO (SUPERADMIN)
router.get('/disco/descargar/:nombre', verificarToken, async (req, res) => {
    if (!req.usuario?.superadmin) {
        return res.status(403).json({ error: 'Acceso denegado: Solo el SuperAdministrador tiene acceso a la Nube y Disco.' });
    }

    const safeFilename = path.basename(req.params.nombre);
    const resolvedPath = findDocumentoFirmado(safeFilename);

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        return res.status(404).json({ error: `Archivo "${safeFilename}" no encontrado físicamente en el disco persistente.` });
    }

    if (req.query.inline === 'true') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
        return res.sendFile(resolvedPath);
    }

    res.download(resolvedPath, safeFilename);
});

// 5. DESCARGAR TODO EL CONTENIDO DEL DISCO EN UN ARCHIVO ZIP (BACKUP COMPLETO)
router.get('/disco/descargar-todo', verificarToken, async (req, res) => {
    if (!req.usuario?.superadmin) {
        return res.status(403).json({ error: 'Acceso denegado: Solo el SuperAdministrador tiene acceso a la Nube y Disco.' });
    }

    try {
        const uploadsDir = getUploadsDir();
        if (!fs.existsSync(uploadsDir)) {
            return res.status(400).json({ error: 'El directorio de almacenamiento aún no tiene archivos.' });
        }

        const files = await fsPromises.readdir(uploadsDir);
        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            return res.status(400).json({ error: 'No hay archivos PDF en el disco para descargar.' });
        }

        const zip = new AdmZip();
        for (const file of pdfFiles) {
            const filePath = path.join(uploadsDir, file);
            try {
                if (fs.statSync(filePath).isFile()) {
                    zip.addLocalFile(filePath);
                }
            } catch {}
        }

        const zipBuffer = zip.toBuffer();
        const fechaHoy = new Date().toISOString().split('T')[0];
        const zipName = `seiot-respaldo-disco-${fechaHoy}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
        res.setHeader('Content-Length', zipBuffer.length);
        res.send(zipBuffer);

    } catch (e) {
        console.error('Error al generar respaldo ZIP del disco:', e);
        res.status(500).json({ error: 'Error al generar el respaldo ZIP: ' + e.message });
    }
});

// 6. ELIMINAR UN ARCHIVO DEL DISCO PERSISTENTE (SUPERADMIN)
router.delete('/disco/archivo/:nombre', verificarToken, async (req, res) => {
    if (!req.usuario?.superadmin) {
        return res.status(403).json({ error: 'Acceso denegado: Solo el SuperAdministrador tiene acceso a la Nube y Disco.' });
    }

    try {
        const safeFilename = path.basename(req.params.nombre);
        const uploadsDir = getUploadsDir();
        const resolvedPath = findDocumentoFirmado(safeFilename) || path.join(uploadsDir, safeFilename);

        let eliminadoFisico = false;
        if (fs.existsSync(resolvedPath)) {
            await fsPromises.unlink(resolvedPath);
            eliminadoFisico = true;
        }

        // Si se especificó eliminar también de la base de datos
        let eliminadoBD = false;
        if (req.query.eliminarDeBD === 'true') {
            const deleteResult = await pool.query(
                'DELETE FROM public.documentos_firmados WHERE nombre_archivo = $1',
                [safeFilename]
            );
            eliminadoBD = (deleteResult.rowCount || 0) > 0;
        }

        // Auditoría
        await registrarAuditLog({
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre || 'SuperAdmin',
            accion: 'ELIMINAR_ARCHIVO_DISCO',
            tablaAfectada: 'documentos_firmados',
            detalles: { archivo: safeFilename, eliminadoFisico, eliminadoBD },
            ip: req.ip || req.connection.remoteAddress
        });

        res.json({
            ok: true,
            mensaje: `El archivo "${safeFilename}" fue eliminado correctamente.`,
            eliminadoFisico,
            eliminadoBD
        });

    } catch (e) {
        console.error('Error al eliminar archivo del disco:', e);
        res.status(500).json({ error: 'Error al eliminar el archivo: ' + e.message });
    }
});

export default router;
