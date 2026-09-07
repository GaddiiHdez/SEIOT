import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { verificarToken } from './auth.js';
import { registrarAuditLog } from '../utils/auditoria.js';
import { generarTokenSeguimiento, enviarNotificacionesSeguimiento } from '../utils/mailer.js';

const router = express.Router();

// Helper para convertir DD/MM/YYYY a YYYY-MM-DD antes de guardar en PostgreSQL
function formatDateForDb(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string') return null;
    const parts = fechaStr.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        if (year.length === 4) {
            return `${year}-${month}-${day}`;
        }
    }
    return fechaStr;
}

// ─── CONFIGURACIÓN MULTER (Almacenamiento local persistente) ───────────────────
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = './uploads/documentos_firmados';
        try {
            await fsPromises.mkdir(dir, { recursive: true });
            cb(null, dir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `temp_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se permiten archivos PDF'), false);
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ─── HELPER: Verificar acceso a visita ────────────────────────────────────────
async function verificarAccesoVisita(req, res, visita_id, client = pool) {
    const visitaCheck = await client.query(
        'SELECT id, capturista_id, folio, psg, supervisor, fecha_inicio FROM visitas WHERE id = $1',
        [visita_id]
    );
    if (visitaCheck.rows.length === 0) {
        res.status(404).json({ error: 'La visita no existe.' });
        return null;
    }
    const visita = visitaCheck.rows[0];
    const puedeVerOtros = req.usuario.superadmin || req.usuario.es_admin || req.usuario.permisos?.ver_visitas_otros;
    if (!puedeVerOtros && (visita.capturista_id === null || visita.capturista_id !== req.usuario.id)) {
        res.status(403).json({ error: 'No tienes permiso para modificar esta visita.' });
        return null;
    }
    return visita;
}

// ─── SUBIR DOCUMENTO FIRMADO LOCAL ───────────────────────────────────────────
router.post('/subir-firmado', verificarToken, upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo.' });
        }

        const { visita_id, modulo } = req.body;

        if (!visita_id || !modulo) {
            await fsPromises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ error: 'Visita y módulo son requeridos.' });
        }

        const moduloNum = parseInt(modulo);
        if (isNaN(moduloNum) || moduloNum < 1 || moduloNum > 6) {
            await fsPromises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ error: 'Módulo inválido.' });
        }

        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) {
            await fsPromises.unlink(req.file.path).catch(() => {});
            return;
        }

        const existe = await pool.query(
            'SELECT id FROM documentos_firmados WHERE visita_id = $1 AND modulo = $2',
            [visita_id, modulo]
        );

        if (existe.rows.length > 0) {
            await fsPromises.unlink(req.file.path).catch(() => {});
            return res.status(409).json({
                error: 'Ya existe un documento firmado para este módulo.',
                bloqueado: true
            });
        }

        const ext = path.extname(req.file.originalname);
        const nombreFinal = `visita_${visita_id}_modulo${modulo}_firmado${ext}`;
        const rutaFinal = path.join(path.dirname(req.file.path), nombreFinal);
        await fsPromises.rename(req.file.path, rutaFinal);

        const resultado = await pool.query(
            `INSERT INTO documentos_firmados (visita_id, modulo, nombre_archivo, ruta_archivo)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [visita_id, modulo, nombreFinal, rutaFinal]
        );

        await registrarAuditLog({
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'SUBIR_PDF_FIRMADO',
            tablaAfectada: 'documentos_firmados',
            registroId: String(visita_id),
            detalles: {
                modulo: moduloNum,
                folio: visita.folio,
                nombre_archivo: nombreFinal
            }
        });

        res.json({
            mensaje: 'Documento firmado subido correctamente.',
            documento: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error subir-firmado:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── ELIMINAR DOCUMENTO FIRMADO LOCAL ─────────────────────────────────────────
router.delete('/firmado/:visita_id/:modulo', verificarToken, async (req, res) => {
    try {
        const { visita_id, modulo } = req.params;

        // 1. Verificar permiso específico de eliminar documentos
        const puedeEliminar = req.usuario.es_admin || req.usuario.permisos?.eliminar_documentos;
        if (!puedeEliminar) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar documentos firmados.' });
        }

        // 2. Verificar acceso a la visita
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const resultado = await pool.query(
            'SELECT ruta_archivo FROM documentos_firmados WHERE visita_id = $1 AND modulo = $2',
            [visita_id, modulo]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'No existe documento para eliminar.' });
        }

        const ruta = resultado.rows[0].ruta_archivo;

        try {
            await fsPromises.unlink(ruta);
        } catch {
            // El archivo físico puede no existir, continuar con eliminación en BD
        }

        await pool.query(
            'DELETE FROM documentos_firmados WHERE visita_id = $1 AND modulo = $2',
            [visita_id, modulo]
        );

        await registrarAuditLog({
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'ELIMINAR_PDF_FIRMADO',
            tablaAfectada: 'documentos_firmados',
            registroId: String(visita_id),
            detalles: {
                modulo: parseInt(modulo),
                folio: visita.folio
            }
        });

        res.json({ mensaje: 'Documento eliminado correctamente.' });

    } catch (error) {
        console.error('Error eliminar firmado:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── CONSULTAR SI YA EXISTE DOCUMENTO FIRMADO ────────────────────────────────
router.get('/firmado/:visita_id/:modulo', verificarToken, async (req, res) => {
    try {
        const { visita_id, modulo } = req.params;

        // Verificar acceso a la visita
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const resultado = await pool.query(
            `SELECT id, nombre_archivo, fecha_subida 
             FROM documentos_firmados 
             WHERE visita_id = $1 AND modulo = $2`,
            [visita_id, modulo]
        );

        if (resultado.rows.length > 0) {
            res.json({ existe: true, documento: resultado.rows[0] });
        } else {
            res.json({ existe: false });
        }

    } catch (error) {
        console.error('Error consultar firmado:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── GUARDAR MÓDULO 1 ─────────────────────────────────────────────────────────
router.post('/modulo1', verificarToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const { visita_id, fecha_emision, hora_emision, localidad, municipio, estado, nombre_psg, domicilio, nombre_servidor, cargo_servidor } = req.body;

        const visita = await verificarAccesoVisita(req, res, visita_id, client);
        if (!visita) { await client.query('ROLLBACK'); return; }

        const fechaVal = formatDateForDb(fecha_emision);
        const horaVal = hora_emision ? String(hora_emision).substring(0, 5) : null;

        let resultado;
        try {
            resultado = await client.query(
                `INSERT INTO modulo1_oficio_notificacion 
                (visita_id, fecha_emision, hora_emision, localidad, municipio, estado, nombre_psg, domicilio, nombre_servidor, cargo_servidor)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                ON CONFLICT (visita_id)
                DO UPDATE SET
                    fecha_emision = EXCLUDED.fecha_emision,
                    hora_emision = EXCLUDED.hora_emision,
                    localidad = EXCLUDED.localidad,
                    municipio = EXCLUDED.municipio,
                    estado = EXCLUDED.estado,
                    nombre_psg = EXCLUDED.nombre_psg,
                    domicilio = EXCLUDED.domicilio,
                    nombre_servidor = EXCLUDED.nombre_servidor,
                    cargo_servidor = EXCLUDED.cargo_servidor
                RETURNING *`,
                [visita_id, fechaVal, horaVal, localidad, municipio, estado, nombre_psg, domicilio, nombre_servidor, cargo_servidor]
            );
        } catch (colErr) {
            resultado = await client.query(
                `INSERT INTO modulo1_oficio_notificacion 
                (visita_id, fecha_emision, localidad, municipio, estado, nombre_psg, domicilio, nombre_servidor, cargo_servidor)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                ON CONFLICT (visita_id)
                DO UPDATE SET
                    fecha_emision = EXCLUDED.fecha_emision,
                    localidad = EXCLUDED.localidad,
                    municipio = EXCLUDED.municipio,
                    estado = EXCLUDED.estado,
                    nombre_psg = EXCLUDED.nombre_psg,
                    domicilio = EXCLUDED.domicilio,
                    nombre_servidor = EXCLUDED.nombre_servidor,
                    cargo_servidor = EXCLUDED.cargo_servidor
                RETURNING *`,
                [visita_id, fechaVal, localidad, municipio, estado, nombre_psg, domicilio, nombre_servidor, cargo_servidor]
            );
        }

        await client.query(
            'UPDATE visitas SET modulo1_completado = true WHERE id = $1',
            [visita_id]
        );

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GUARDAR_MODULO',
            tablaAfectada: 'modulo1_oficio_notificacion',
            registroId: String(visita_id),
            detalles: {
                modulo: 1,
                folio: visita.folio
            }
        });

        await client.query('COMMIT');
        res.json(resultado.rows[0]);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error módulo 1:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (client) client.release();
    }
});

// ─── OBTENER MÓDULO 1 ─────────────────────────────────────────────────────────
router.get('/modulo1/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const resultado = await pool.query(
            'SELECT * FROM modulo1_oficio_notificacion WHERE visita_id = $1',
            [visita_id]
        );

        if (resultado.rows.length === 0) return res.json({ existe: false });
        res.json({ existe: true, datos: resultado.rows[0] });

    } catch (error) {
        console.error('Error obtener módulo 1:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── GUARDAR MÓDULO 2 ─────────────────────────────────────────────────────────
router.post('/modulo2', verificarToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const { visita_id, fecha, nombre_psg, domicilio, calidad_sujeto, nombre_pc, cargo_pc, adscripcion, tipo_identificacion, folio_identificacion, nombre_ordena } = req.body;

        const visita = await verificarAccesoVisita(req, res, visita_id, client);
        if (!visita) { await client.query('ROLLBACK'); return; }

        const fechaVal = formatDateForDb(fecha);

        const resultado = await client.query(
            `INSERT INTO modulo2_orden_supervision 
            (visita_id, fecha, nombre_psg, domicilio, calidad_sujeto, nombre_pc, cargo_pc, adscripcion, tipo_identificacion, folio_identificacion, nombre_ordena)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT (visita_id)
            DO UPDATE SET
                fecha = EXCLUDED.fecha,
                nombre_psg = EXCLUDED.nombre_psg,
                domicilio = EXCLUDED.domicilio,
                calidad_sujeto = EXCLUDED.calidad_sujeto,
                nombre_pc = EXCLUDED.nombre_pc,
                cargo_pc = EXCLUDED.cargo_pc,
                adscripcion = EXCLUDED.adscripcion,
                tipo_identificacion = EXCLUDED.tipo_identificacion,
                folio_identificacion = EXCLUDED.folio_identificacion,
                nombre_ordena = EXCLUDED.nombre_ordena
            RETURNING *`,
            [visita_id, fechaVal, nombre_psg, domicilio, calidad_sujeto, nombre_pc, cargo_pc, adscripcion, tipo_identificacion, folio_identificacion, nombre_ordena]
        );

        await client.query(
            'UPDATE visitas SET modulo2_completado = true WHERE id = $1',
            [visita_id]
        );

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GUARDAR_MODULO',
            tablaAfectada: 'modulo2_orden_supervision',
            registroId: String(visita_id),
            detalles: {
                modulo: 2,
                folio: visita.folio
            }
        });

        await client.query('COMMIT');
        res.json(resultado.rows[0]);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error módulo 2:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (client) client.release();
    }
});

// ─── OBTENER MÓDULO 2 ─────────────────────────────────────────────────────────
router.get('/modulo2/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const resultado = await pool.query(
            'SELECT * FROM modulo2_orden_supervision WHERE visita_id = $1',
            [visita_id]
        );

        if (resultado.rows.length === 0) return res.json({ existe: false });
        res.json({ existe: true, datos: resultado.rows[0] });

    } catch (error) {
        console.error('Error obtener módulo 2:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── GUARDAR MÓDULO 3 ─────────────────────────────────────────────────────────
router.post('/modulo3', verificarToken, async (req, res) => {
    const { visita_id, nombre_psg, tipo_psg, nombre_titular, telefono, municipio, localidad, latitud, longitud, capacidad_instalada, nombre_supervisor, fecha, hora_inicio, hora_termino, observaciones, cumple, presenta_observaciones, requiere_seguimiento, responsable_psg, responsable_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, respuestas, recomendaciones, instancias_seguimiento } = req.body;

    if (!respuestas || typeof respuestas !== 'object') {
        return res.status(400).json({ error: 'El campo respuestas es requerido y debe ser un objeto.' });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const visita = await verificarAccesoVisita(req, res, visita_id, client);
        if (!visita) { await client.query('ROLLBACK'); return; }

        const latitudVal = (latitud !== '' && latitud !== null && latitud !== undefined && !isNaN(parseFloat(latitud))) ? parseFloat(latitud) : null;
        const longitudVal = (longitud !== '' && longitud !== null && longitud !== undefined && !isNaN(parseFloat(longitud))) ? parseFloat(longitud) : null;
        const capacidadVal = (capacidad_instalada !== '' && capacidad_instalada !== null && capacidad_instalada !== undefined && !isNaN(parseInt(capacidad_instalada))) ? parseInt(capacidad_instalada) : null;
        const horaInicioVal = hora_inicio !== '' && hora_inicio !== null ? hora_inicio : null;
        const horaTerminoVal = hora_termino !== '' && hora_termino !== null ? hora_termino : null;
        const fechaVal = formatDateForDb(fecha);

        // Gestionar token de seguimiento para acceso directo
        let tokenSeguimiento = null;
        if (requiere_seguimiento) {
            const existingM3 = await client.query('SELECT token_seguimiento FROM modulo3_lista_verificacion WHERE visita_id = $1', [visita_id]);
            if (existingM3.rows.length > 0 && existingM3.rows[0].token_seguimiento) {
                tokenSeguimiento = existingM3.rows[0].token_seguimiento;
            } else {
                tokenSeguimiento = generarTokenSeguimiento();
            }
        }

        const instanciasArray = (requiere_seguimiento && Array.isArray(instancias_seguimiento)) ? instancias_seguimiento : [];

        await client.query(
            `INSERT INTO modulo3_lista_verificacion 
            (visita_id, nombre_psg, tipo_psg, nombre_titular, telefono, municipio, localidad, latitud, longitud, capacidad_instalada, nombre_supervisor, fecha, hora_inicio, hora_termino, observaciones, cumple, presenta_observaciones, requiere_seguimiento, responsable_psg, responsable_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, instancias_notificadas, token_seguimiento)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
            ON CONFLICT (visita_id)
            DO UPDATE SET
                nombre_psg = EXCLUDED.nombre_psg,
                tipo_psg = EXCLUDED.tipo_psg,
                nombre_titular = EXCLUDED.nombre_titular,
                telefono = EXCLUDED.telefono,
                municipio = EXCLUDED.municipio,
                localidad = EXCLUDED.localidad,
                latitud = EXCLUDED.latitud,
                longitud = EXCLUDED.longitud,
                capacidad_instalada = EXCLUDED.capacidad_instalada,
                nombre_supervisor = EXCLUDED.nombre_supervisor,
                fecha = EXCLUDED.fecha,
                hora_inicio = EXCLUDED.hora_inicio,
                hora_termino = EXCLUDED.hora_termino,
                observaciones = EXCLUDED.observaciones,
                cumple = EXCLUDED.cumple,
                presenta_observaciones = EXCLUDED.presenta_observaciones,
                requiere_seguimiento = EXCLUDED.requiere_seguimiento,
                responsable_psg = EXCLUDED.responsable_psg,
                responsable_supervisor = EXCLUDED.responsable_supervisor,
                nombre_testigo = EXCLUDED.nombre_testigo,
                domicilio_testigo = EXCLUDED.domicilio_testigo,
                tipo_id_testigo = EXCLUDED.tipo_id_testigo,
                numero_id_testigo = EXCLUDED.numero_id_testigo,
                instancias_notificadas = EXCLUDED.instancias_notificadas,
                token_seguimiento = COALESCE(EXCLUDED.token_seguimiento, modulo3_lista_verificacion.token_seguimiento)`,
            [visita_id, nombre_psg, tipo_psg, nombre_titular, telefono, municipio, localidad, latitudVal, longitudVal, capacidadVal, nombre_supervisor, fechaVal, horaInicioVal, horaTerminoVal, observaciones, cumple, presenta_observaciones, requiere_seguimiento, responsable_psg, responsable_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, instanciasArray, tokenSeguimiento]
        );

        const entries = Object.entries(respuestas);
        if (entries.length > 0) {
            const preguntaIds = [];
            const respuestaVals = [];
            const observacionVals = [];
            
            for (const [key, respuesta] of entries) {
                preguntaIds.push(parseInt(key.replace('p', '')));
                respuestaVals.push(respuesta);
                observacionVals.push(recomendaciones?.[key] || '');
            }
            
            await client.query(
                `INSERT INTO modulo3_checklist (visita_id, pregunta_id, respuesta, observacion)
                 SELECT $1, * FROM unnest($2::int[], $3::text[], $4::text[])
                 ON CONFLICT (visita_id, pregunta_id) 
                 DO UPDATE SET respuesta = EXCLUDED.respuesta, observacion = EXCLUDED.observacion, modificado_en = NOW()`,
                [visita_id, preguntaIds, respuestaVals, observacionVals]
            );
        }

        await client.query(
            'UPDATE visitas SET modulo3_completado = true WHERE id = $1',
            [visita_id]
        );

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GUARDAR_MODULO',
            tablaAfectada: 'modulo3_lista_verificacion',
            registroId: String(visita_id),
            detalles: {
                modulo: 3,
                folio: visita.folio,
                requiere_seguimiento: !!requiere_seguimiento,
                instancias_notificadas: instanciasArray
            }
        });

        await client.query('COMMIT');

        // Detonar el envío de correos en segundo plano si se requiere seguimiento y hay instancias
        if (requiere_seguimiento && instanciasArray.length > 0 && tokenSeguimiento) {
            (async () => {
                try {
                    const psgRes = await pool.query(
                        `SELECT v.folio, v.psg, v.supervisor, v.fecha_inicio,
                                p.razon_social, p.representante, p.municipio, p.localidad, p.telefono
                         FROM visitas v
                         LEFT JOIN excel_psg p ON p.psg = v.psg
                         WHERE v.id = $1`,
                        [visita_id]
                    );
                    const infoVisita = psgRes.rows[0] || {};
                    const fechaEmail = fecha || (infoVisita.fecha_inicio ? new Date(infoVisita.fecha_inicio).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'));
                    const psgClave = infoVisita.psg || visita.psg || 'N/D';
                    const titularEmail = infoVisita.razon_social || nombre_psg || infoVisita.representante || nombre_titular || 'N/D';
                    const municipioEmail = infoVisita.municipio || municipio || 'N/D';
                    const supervisorEmail = nombre_supervisor || infoVisita.supervisor || 'N/D';

                    await enviarNotificacionesSeguimiento({
                        visitaId: visita_id,
                        folio: infoVisita.folio || visita.folio,
                        datosPsg: {
                            psg: psgClave,
                            nombre_titular: titularEmail,
                            municipio: municipioEmail,
                            localidad: infoVisita.localidad || localidad || '',
                            telefono: infoVisita.telefono || telefono || ''
                        },
                        supervisor: supervisorEmail,
                        fecha: fechaEmail,
                        observaciones,
                        instanciasSeleccionadas: instanciasArray,
                        tokenSeguimiento,
                        usuarioEmisor: req.usuario
                    });
                } catch (err) {
                    console.error('❌ Error asíncrono al enviar correos de seguimiento:', err);
                }
            })();
        }

        res.json({ mensaje: 'Módulo 3 guardado correctamente', token_seguimiento: tokenSeguimiento });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error módulo 3:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (client) client.release();
    }
});

// ─── OBTENER MÓDULO 3 ─────────────────────────────────────────────────────────
router.get('/modulo3/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const [lista, checklist] = await Promise.all([
            pool.query('SELECT * FROM modulo3_lista_verificacion WHERE visita_id = $1', [visita_id]),
            pool.query('SELECT * FROM modulo3_checklist WHERE visita_id = $1 ORDER BY pregunta_id ASC', [visita_id])
        ]);

        if (lista.rows.length === 0) return res.json({ existe: false });
        res.json({ existe: true, datos: lista.rows[0], checklist: checklist.rows });

    } catch (error) {
        console.error('Error obtener módulo 3:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── OBTENER CHECKLIST MÓDULO 3 ───────────────────────────────────────────────
router.get('/modulo3/checklist/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const checklist = await pool.query('SELECT * FROM modulo3_checklist WHERE visita_id = $1 ORDER BY pregunta_id ASC', [visita_id]);
        res.json(checklist.rows);

    } catch (error) {
        console.error('Error obtener checklist módulo 3:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── GUARDAR MÓDULO 4 ─────────────────────────────────────────────────────────
router.post('/modulo4', verificarToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const { visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, hechos_observados, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, nombre_testigo_cierre } = req.body;

        const visita = await verificarAccesoVisita(req, res, visita_id, client);
        if (!visita) { await client.query('ROLLBACK'); return; }

        const nullTime = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nullStr = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const fechaVal = formatDateForDb(fecha);

        const resultado = await client.query(
            `INSERT INTO modulo4_acta_hechos 
            (visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, hechos_observados, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, nombre_testigo_cierre)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
            ON CONFLICT (visita_id)
            DO UPDATE SET
                acta_no = EXCLUDED.acta_no,
                fecha = EXCLUDED.fecha,
                hora = EXCLUDED.hora,
                hora_inicio = EXCLUDED.hora_inicio,
                hora_termino = EXCLUDED.hora_termino,
                hechos_observados = EXCLUDED.hechos_observados,
                no_realizo_manifestaciones = EXCLUDED.no_realizo_manifestaciones,
                manifestaciones = EXCLUDED.manifestaciones,
                localidad = EXCLUDED.localidad,
                municipio = EXCLUDED.municipio,
                nombre_psg = EXCLUDED.nombre_psg,
                tipo_psg = EXCLUDED.tipo_psg,
                nombre_titular = EXCLUDED.nombre_titular,
                domicilio = EXCLUDED.domicilio,
                telefono = EXCLUDED.telefono,
                nombre_supervisor = EXCLUDED.nombre_supervisor,
                nombre_testigo = EXCLUDED.nombre_testigo,
                domicilio_testigo = EXCLUDED.domicilio_testigo,
                tipo_id_testigo = EXCLUDED.tipo_id_testigo,
                numero_id_testigo = EXCLUDED.numero_id_testigo,
                nombre_testigo_cierre = EXCLUDED.nombre_testigo_cierre
            RETURNING *`,
            [visita_id, nullStr(acta_no), nullStr(fechaVal), nullTime(hora), nullTime(hora_inicio), nullTime(hora_termino), nullStr(hechos_observados), no_realizo_manifestaciones, nullStr(manifestaciones), nullStr(localidad), nullStr(municipio), nullStr(nombre_psg), nullStr(tipo_psg), nullStr(nombre_titular), nullStr(domicilio), nullStr(telefono), nullStr(nombre_supervisor), nullStr(nombre_testigo), nullStr(domicilio_testigo), nullStr(tipo_id_testigo), nullStr(numero_id_testigo), nullStr(nombre_testigo_cierre)]
        );

        await client.query(
            'UPDATE visitas SET modulo4_completado = true WHERE id = $1',
            [visita_id]
        );

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GUARDAR_MODULO',
            tablaAfectada: 'modulo4_acta_hechos',
            registroId: String(visita_id),
            detalles: {
                modulo: 4,
                folio: visita.folio
            }
        });

        await client.query('COMMIT');
        res.json(resultado.rows[0]);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error módulo 4:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (client) client.release();
    }
});

// ─── OBTENER MÓDULO 4 ─────────────────────────────────────────────────────────
router.get('/modulo4/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const resultado = await pool.query(
            'SELECT * FROM modulo4_acta_hechos WHERE visita_id = $1',
            [visita_id]
        );

        if (resultado.rows.length === 0) return res.json({ existe: false });
        res.json({ existe: true, datos: resultado.rows[0] });

    } catch (error) {
        console.error('Error obtener módulo 4:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── GUARDAR MÓDULO 5 ─────────────────────────────────────────────────────────
router.post('/modulo5', verificarToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const { visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, acta_hechos, otros_documentos, cumple, presenta_observaciones, requiere_seguimiento, observaciones_detectadas, medidas_preventivas, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo } = req.body;

        const visita = await verificarAccesoVisita(req, res, visita_id, client);
        if (!visita) { await client.query('ROLLBACK'); return; }

        const nullTime = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nullStr = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const fechaVal = formatDateForDb(fecha);

        const resultado = await client.query(
            `INSERT INTO modulo5_acta_supervision 
            (visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, acta_hechos, otros_documentos, cumple, presenta_observaciones, requiere_seguimiento, observaciones_detectadas, medidas_preventivas, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
            ON CONFLICT (visita_id)
            DO UPDATE SET
                acta_no = EXCLUDED.acta_no,
                fecha = EXCLUDED.fecha,
                hora = EXCLUDED.hora,
                hora_inicio = EXCLUDED.hora_inicio,
                hora_termino = EXCLUDED.hora_termino,
                acta_hechos = EXCLUDED.acta_hechos,
                otros_documentos = EXCLUDED.otros_documentos,
                cumple = EXCLUDED.cumple,
                presenta_observaciones = EXCLUDED.presenta_observaciones,
                requiere_seguimiento = EXCLUDED.requiere_seguimiento,
                observaciones_detectadas = EXCLUDED.observaciones_detectadas,
                medidas_preventivas = EXCLUDED.medidas_preventivas,
                no_realizo_manifestaciones = EXCLUDED.no_realizo_manifestaciones,
                manifestaciones = EXCLUDED.manifestaciones,
                localidad = EXCLUDED.localidad,
                municipio = EXCLUDED.municipio,
                nombre_psg = EXCLUDED.nombre_psg,
                tipo_psg = EXCLUDED.tipo_psg,
                nombre_titular = EXCLUDED.nombre_titular,
                domicilio = EXCLUDED.domicilio,
                telefono = EXCLUDED.telefono,
                nombre_supervisor = EXCLUDED.nombre_supervisor,
                nombre_testigo = EXCLUDED.nombre_testigo,
                domicilio_testigo = EXCLUDED.domicilio_testigo,
                tipo_id_testigo = EXCLUDED.tipo_id_testigo,
                numero_id_testigo = EXCLUDED.numero_id_testigo
            RETURNING *`,
            [visita_id, nullStr(acta_no), nullStr(fechaVal), nullTime(hora), nullTime(hora_inicio), nullTime(hora_termino), acta_hechos, nullStr(otros_documentos), cumple, presenta_observaciones, requiere_seguimiento, nullStr(observaciones_detectadas), nullStr(medidas_preventivas), no_realizo_manifestaciones, nullStr(manifestaciones), nullStr(localidad), nullStr(municipio), nullStr(nombre_psg), nullStr(tipo_psg), nullStr(nombre_titular), nullStr(domicilio), nullStr(telefono), nullStr(nombre_supervisor), nullStr(nombre_testigo), nullStr(domicilio_testigo), nullStr(tipo_id_testigo), nullStr(numero_id_testigo)]
        );

        await client.query(
            'UPDATE visitas SET modulo5_completado = true WHERE id = $1',
            [visita_id]
        );

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GUARDAR_MODULO',
            tablaAfectada: 'modulo5_acta_supervision',
            registroId: String(visita_id),
            detalles: {
                modulo: 5,
                folio: visita.folio
            }
        });

        await client.query('COMMIT');
        res.json(resultado.rows[0]);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error módulo 5:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (client) client.release();
    }
});

// ─── OBTENER MÓDULO 5 ─────────────────────────────────────────────────────────
router.get('/modulo5/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const resultado = await pool.query(
            'SELECT * FROM modulo5_acta_supervision WHERE visita_id = $1',
            [visita_id]
        );

        if (resultado.rows.length === 0) return res.json({ existe: false });
        res.json({ existe: true, datos: resultado.rows[0] });

    } catch (error) {
        console.error('Error obtener módulo 5:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── GUARDAR MÓDULO 6 ─────────────────────────────────────────────────────────
router.post('/modulo6', verificarToken, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const { visita_id, acta_no, fecha, hora, establecimiento, clave_psg, ubicacion, localidad, municipio, estado, nombre_oficial, tipo_id_responsable, numero_id_responsable, id_expedida_por, fecha_expedicion_id, ubicacion_compareciente, credencial_oficial_no, nombre_testigo1, domicilio_testigo1, tipo_id_testigo1, numero_id_testigo1, nombre_testigo2, domicilio_testigo2, tipo_id_testigo2, numero_id_testigo2, oficio_comision, fecha_comision, emite_comision, hechos_observaciones, articulo1, de1, articulo2, de2, articulo3, de3, articulo4, de4, manifestaciones, fecha_cierre, hora_cierre, nombre_testigo_cierre1, tipo_id_cierre1, numero_id_cierre1, nombre_testigo_cierre2, tipo_id_cierre2, numero_id_cierre2 } = req.body;

        const visita = await verificarAccesoVisita(req, res, visita_id, client);
        if (!visita) { await client.query('ROLLBACK'); return; }

        const n = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nTime = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nDate = v => {
            const formatted = formatDateForDb(v);
            return (formatted !== '' && formatted !== null && formatted !== undefined) ? formatted : null;
        };

        const resultado = await client.query(
            `INSERT INTO modulo6_acta_circunstanciada 
            (visita_id, acta_no, fecha, hora, establecimiento, clave_psg, ubicacion, localidad, municipio, estado, nombre_oficial, tipo_id_responsable, numero_id_responsable, id_expedida_por, fecha_expedicion_id, ubicacion_compareciente, credencial_oficial_no, nombre_testigo1, domicilio_testigo1, tipo_id_testigo1, numero_id_testigo1, nombre_testigo2, domicilio_testigo2, tipo_id_testigo2, numero_id_testigo2, oficio_comision, fecha_comision, emite_comision, hechos_observaciones, articulo1, de1, articulo2, de2, articulo3, de3, articulo4, de4, manifestaciones, fecha_cierre, hora_cierre, nombre_testigo_cierre1, tipo_id_cierre1, numero_id_cierre1, nombre_testigo_cierre2, tipo_id_cierre2, numero_id_cierre2)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46)
            ON CONFLICT (visita_id)
            DO UPDATE SET
                acta_no = EXCLUDED.acta_no,
                fecha = EXCLUDED.fecha,
                hora = EXCLUDED.hora,
                establecimiento = EXCLUDED.establecimiento,
                clave_psg = EXCLUDED.clave_psg,
                ubicacion = EXCLUDED.ubicacion,
                localidad = EXCLUDED.localidad,
                municipio = EXCLUDED.municipio,
                estado = EXCLUDED.estado,
                nombre_oficial = EXCLUDED.nombre_oficial,
                tipo_id_responsable = EXCLUDED.tipo_id_responsable,
                numero_id_responsable = EXCLUDED.numero_id_responsable,
                id_expedida_por = EXCLUDED.id_expedida_por,
                fecha_expedicion_id = EXCLUDED.fecha_expedicion_id,
                ubicacion_compareciente = EXCLUDED.ubicacion_compareciente,
                credencial_oficial_no = EXCLUDED.credencial_oficial_no,
                nombre_testigo1 = EXCLUDED.nombre_testigo1,
                domicilio_testigo1 = EXCLUDED.domicilio_testigo1,
                tipo_id_testigo1 = EXCLUDED.tipo_id_testigo1,
                numero_id_testigo1 = EXCLUDED.numero_id_testigo1,
                nombre_testigo2 = EXCLUDED.nombre_testigo2,
                domicilio_testigo2 = EXCLUDED.domicilio_testigo2,
                tipo_id_testigo2 = EXCLUDED.tipo_id_testigo2,
                numero_id_testigo2 = EXCLUDED.numero_id_testigo2,
                oficio_comision = EXCLUDED.oficio_comision,
                fecha_comision = EXCLUDED.fecha_comision,
                emite_comision = EXCLUDED.emite_comision,
                hechos_observaciones = EXCLUDED.hechos_observaciones,
                articulo1 = EXCLUDED.articulo1,
                de1 = EXCLUDED.de1,
                articulo2 = EXCLUDED.articulo2,
                de2 = EXCLUDED.de2,
                articulo3 = EXCLUDED.articulo3,
                de3 = EXCLUDED.de3,
                articulo4 = EXCLUDED.articulo4,
                de4 = EXCLUDED.de4,
                manifestaciones = EXCLUDED.manifestaciones,
                fecha_cierre = EXCLUDED.fecha_cierre,
                hora_cierre = EXCLUDED.hora_cierre,
                nombre_testigo_cierre1 = EXCLUDED.nombre_testigo_cierre1,
                tipo_id_cierre1 = EXCLUDED.tipo_id_cierre1,
                numero_id_cierre1 = EXCLUDED.numero_id_cierre1,
                nombre_testigo_cierre2 = EXCLUDED.nombre_testigo_cierre2,
                tipo_id_cierre2 = EXCLUDED.tipo_id_cierre2,
                numero_id_cierre2 = EXCLUDED.numero_id_cierre2
            RETURNING *`,
            [visita_id, n(acta_no), nDate(fecha), nTime(hora), n(establecimiento), n(clave_psg), n(ubicacion), n(localidad), n(municipio), n(estado), n(nombre_oficial), n(tipo_id_responsable), n(numero_id_responsable), n(id_expedida_por), nDate(fecha_expedicion_id), n(ubicacion_compareciente), n(credencial_oficial_no), n(nombre_testigo1), n(domicilio_testigo1), n(tipo_id_testigo1), n(numero_id_testigo1), n(nombre_testigo2), n(domicilio_testigo2), n(tipo_id_testigo2), n(numero_id_testigo2), n(oficio_comision), nDate(fecha_comision), n(emite_comision), n(hechos_observaciones), n(articulo1), n(de1), n(articulo2), n(de2), n(articulo3), n(de3), n(articulo4), n(de4), n(manifestaciones), nDate(fecha_cierre), nTime(hora_cierre), n(nombre_testigo_cierre1), n(tipo_id_cierre1), n(numero_id_cierre1), n(nombre_testigo_cierre2), n(tipo_id_cierre2), n(numero_id_cierre2)]
        );

        await client.query(
            'UPDATE visitas SET modulo6_completado = true WHERE id = $1',
            [visita_id]
        );

        await registrarAuditLog(client, {
            usuarioId: req.usuario.id,
            usuarioNombre: req.usuario.nombre,
            usuarioUsername: req.usuario.usuario,
            accion: 'GUARDAR_MODULO',
            tablaAfectada: 'modulo6_acta_circunstanciada',
            registroId: String(visita_id),
            detalles: {
                modulo: 6,
                folio: visita.folio
            }
        });

        await client.query('COMMIT');
        res.json(resultado.rows[0]);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Error módulo 6:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        if (client) client.release();
    }
});

// ─── OBTENER MÓDULO 6 ─────────────────────────────────────────────────────────
router.get('/modulo6/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const visita = await verificarAccesoVisita(req, res, visita_id);
        if (!visita) return;

        const resultado = await pool.query(
            'SELECT * FROM modulo6_acta_circunstanciada WHERE visita_id = $1',
            [visita_id]
        );

        if (resultado.rows.length === 0) return res.json({ existe: false });
        res.json({ existe: true, datos: resultado.rows[0] });

    } catch (error) {
        console.error('Error obtener módulo 6:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── ENDPOINTS DE SEGUIMIENTO (ACCESO POR TOKEN DIRECTO PARA INSTANCIAS) ──────

// Consultar expediente completo mediante token de seguimiento
router.get('/seguimiento/:token', async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) return res.status(400).json({ error: 'Token requerido.' });

        const m3Query = await pool.query(
            `SELECT m3.*, v.folio, v.psg, v.estado_visita, v.creado_en as fecha_creacion,
                    p.razon_social as psg_titular, p.representante as psg_representante,
                    p.municipio as psg_municipio, p.localidad as psg_localidad,
                    p.domicilio as psg_domicilio, p.telefono as psg_telefono,
                    p.tipo_psg
             FROM modulo3_lista_verificacion m3
             JOIN visitas v ON v.id = m3.visita_id
             LEFT JOIN excel_psg p ON p.psg = v.psg
             WHERE m3.token_seguimiento = $1`,
            [token]
        );

        if (m3Query.rows.length === 0) {
            return res.status(404).json({ error: 'Expediente no encontrado o enlace de seguimiento no válido.' });
        }

        const datosM3 = m3Query.rows[0];
        const visitaId = datosM3.visita_id;

        // Obtener checklist de preguntas
        const checklistQuery = await pool.query(
            'SELECT pregunta_id, respuesta, observacion FROM modulo3_checklist WHERE visita_id = $1 ORDER BY pregunta_id ASC',
            [visitaId]
        );

        // Obtener historial de atenciones registradas
        const atencionesQuery = await pool.query(
            'SELECT * FROM modulo3_seguimiento_atencion WHERE visita_id = $1 ORDER BY creado_en DESC',
            [visitaId]
        );

        // Obtener lista de documentos firmados disponibles
        const docsQuery = await pool.query(
            'SELECT id, modulo, nombre_archivo, fecha_subida FROM documentos_firmados WHERE visita_id = $1 ORDER BY modulo ASC',
            [visitaId]
        );

        res.json({
            expediente: {
                visita_id: visitaId,
                folio: datosM3.folio,
                psg: datosM3.psg,
                estado_visita: datosM3.estado_visita,
                fecha_creacion: datosM3.fecha_creacion,
                psg_datos: {
                    titular: datosM3.psg_titular || datosM3.nombre_psg || datosM3.nombre_titular,
                    representante: datosM3.psg_representante || datosM3.nombre_titular,
                    municipio: datosM3.psg_municipio || datosM3.municipio,
                    localidad: datosM3.psg_localidad || datosM3.localidad,
                    domicilio: datosM3.psg_domicilio,
                    telefono: datosM3.psg_telefono || datosM3.telefono,
                    tipo_psg: datosM3.tipo_psg
                },
                modulo3: {
                    fecha: datosM3.fecha,
                    hora_inicio: datosM3.hora_inicio,
                    hora_termino: datosM3.hora_termino,
                    nombre_supervisor: datosM3.nombre_supervisor,
                    observaciones: datosM3.observaciones,
                    cumple: datosM3.cumple,
                    presenta_observaciones: datosM3.presenta_observaciones,
                    requiere_seguimiento: datosM3.requiere_seguimiento,
                    instancias_notificadas: datosM3.instancias_notificadas || []
                },
                checklist: checklistQuery.rows,
                atenciones: atencionesQuery.rows,
                documentos_firmados: docsQuery.rows
            }
        });
    } catch (error) {
        console.error('Error consultar seguimiento por token:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Registrar atención / oficio de seguimiento por parte de la dependencia
router.post('/seguimiento/:token/atender', async (req, res) => {
    try {
        const { token } = req.params;
        const { instancia, nombre_responsable, cargo_responsable, oficio_referencia, acciones_tomadas } = req.body;

        if (!acciones_tomadas || !instancia) {
            return res.status(400).json({ error: 'La instancia y las acciones tomadas son obligatorias.' });
        }

        const m3Query = await pool.query(
            'SELECT m3.visita_id, v.folio FROM modulo3_lista_verificacion m3 JOIN visitas v ON v.id = m3.visita_id WHERE m3.token_seguimiento = $1',
            [token]
        );

        if (m3Query.rows.length === 0) {
            return res.status(404).json({ error: 'Token de seguimiento inválido.' });
        }

        const { visita_id, folio } = m3Query.rows[0];

        const insertQuery = await pool.query(
            `INSERT INTO modulo3_seguimiento_atencion 
            (visita_id, instancia, nombre_responsable, cargo_responsable, oficio_referencia, acciones_tomadas)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [visita_id, instancia, nombre_responsable || '', cargo_responsable || '', oficio_referencia || '', acciones_tomadas]
        );

        await registrarAuditLog({
            usuarioId: null,
            usuarioNombre: nombre_responsable || instancia,
            usuarioUsername: `ext_${instancia}`,
            accion: 'ATENCION_SEGUIMIENTO',
            tablaAfectada: 'modulo3_seguimiento_atencion',
            registroId: String(insertQuery.rows[0].id),
            detalles: {
                visita_id,
                folio,
                instancia,
                oficio_referencia
            }
        });

        res.json({
            mensaje: 'Atención de seguimiento registrada exitosamente.',
            atencion: insertQuery.rows[0]
        });

    } catch (error) {
        console.error('Error registrar atencion seguimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Descargar archivo firmado autorizado por token de seguimiento
router.get('/seguimiento/:token/archivo/:modulo', async (req, res) => {
    try {
        const { token, modulo } = req.params;
        const m3Query = await pool.query(
            'SELECT visita_id FROM modulo3_lista_verificacion WHERE token_seguimiento = $1',
            [token]
        );
        if (m3Query.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso no autorizado.' });
        }
        const visitaId = m3Query.rows[0].visita_id;

        const docQuery = await pool.query(
            'SELECT ruta_archivo, nombre_archivo FROM documentos_firmados WHERE visita_id = $1 AND modulo = $2',
            [visitaId, modulo]
        );
        if (docQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado.' });
        }

        const { ruta_archivo, nombre_archivo } = docQuery.rows[0];
        const fullPath = path.resolve(ruta_archivo);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'El archivo físico no se encuentra disponible.' });
        }
        res.download(fullPath, nombre_archivo);
    } catch (error) {
        console.error('Error descargar archivo por seguimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

export default router;