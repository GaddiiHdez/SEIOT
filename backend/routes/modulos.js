import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verificarToken } from './auth.js';

const router = express.Router();

// ─── CONFIGURACIÓN MULTER ────────────────────────────────────────────────────
// Nombre temporal — se renombra después de leer el body completo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/documentos_firmados';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// ─── SUBIR DOCUMENTO FIRMADO ─────────────────────────────────────────────────
router.post('/subir-firmado', upload.single('archivo'), verificarToken, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo.' });
        }

        const { visita_id, modulo } = req.body;

        // Validar que visita_id y modulo sean válidos
        if (!visita_id || !modulo) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Visita y módulo son requeridos.' });
        }

        const moduloNum = parseInt(modulo);
        if (isNaN(moduloNum) || moduloNum < 1 || moduloNum > 6) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Módulo inválido.' });
        }

        // Verificar que la visita existe
        const visitaCheck = await pool.query(
            'SELECT id, capturista_id FROM visitas WHERE id = $1',
            [visita_id]
        );
        if (visitaCheck.rows.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'La visita no existe.' });
        }

        // Verificar que el usuario tiene acceso a esta visita
        const visita = visitaCheck.rows[0];
        const puedeVerOtros = req.usuario.es_admin || req.usuario.permisos?.ver_visitas_otros;
        if (!puedeVerOtros && visita.capturista_id && visita.capturista_id !== req.usuario.id) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'No tienes permiso para subir documentos a esta visita.' });
        }

        // Renombrar el archivo temporal con los datos reales
        const ext = path.extname(req.file.originalname);
        const nombreFinal = `visita_${visita_id}_modulo${modulo}_firmado${ext}`;
        const rutaFinal = path.join(path.dirname(req.file.path), nombreFinal);
        fs.renameSync(req.file.path, rutaFinal);

        const ruta = rutaFinal;
        const nombre = nombreFinal;

        // Verificar si ya existe un documento para esta visita+modulo
        const existe = await pool.query(
            'SELECT id FROM documentos_firmados WHERE visita_id = $1 AND modulo = $2',
            [visita_id, modulo]
        );

        if (existe.rows.length > 0) {
            // Eliminar archivo recién subido ya que ya existe uno
            fs.unlinkSync(ruta);
            return res.status(409).json({
                error: 'Ya existe un documento firmado para este módulo.',
                bloqueado: true
            });
        }

        const resultado = await pool.query(
            `INSERT INTO documentos_firmados (visita_id, modulo, nombre_archivo, ruta_archivo)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [visita_id, modulo, nombre, ruta]
        );

        res.json({
            mensaje: 'Documento firmado subido correctamente.',
            documento: resultado.rows[0]
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── ELIMINAR DOCUMENTO FIRMADO ──────────────────────────────────────────────
router.delete('/firmado/:visita_id/:modulo', verificarToken, async (req, res) => {
    try {
        const { visita_id, modulo } = req.params;

        const resultado = await pool.query(
            'SELECT ruta_archivo FROM documentos_firmados WHERE visita_id = $1 AND modulo = $2',
            [visita_id, modulo]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'No existe documento para eliminar.' });
        }

        const ruta = resultado.rows[0].ruta_archivo;

        // Eliminar archivo físico
        if (fs.existsSync(ruta)) fs.unlinkSync(ruta);

        // Eliminar registro de BD
        await pool.query(
            'DELETE FROM documentos_firmados WHERE visita_id = $1 AND modulo = $2',
            [visita_id, modulo]
        );

        res.json({ mensaje: 'Documento eliminado correctamente.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── CONSULTAR SI YA EXISTE DOCUMENTO FIRMADO ────────────────────────────────
router.get('/firmado/:visita_id/:modulo', verificarToken, async (req, res) => {
    try {
        const { visita_id, modulo } = req.params;

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
        res.status(500).json({ error: error.message });
    }
});

// ─── GUARDAR MÓDULO 1 ─────────────────────────────────────────────────────────
router.post('/modulo1', verificarToken, async (req, res) => {
    try {
        const {
            visita_id, fecha_emision, localidad, municipio, estado,
            nombre_psg, domicilio, nombre_servidor, cargo_servidor
        } = req.body;

        const resultado = await pool.query(
            `INSERT INTO modulo1_oficio_notificacion 
            (visita_id, fecha_emision, localidad, municipio, estado, nombre_psg, domicilio, nombre_servidor, cargo_servidor)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *`,
            [visita_id, fecha_emision, localidad, municipio, estado, nombre_psg, domicilio, nombre_servidor, cargo_servidor]
        );

        // Marcar módulo 1 como completado en visitas
        await pool.query(
            'UPDATE visitas SET modulo1_completado = true WHERE id = $1',
            [visita_id]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GUARDAR MÓDULO 2 ─────────────────────────────────────────────────────────
router.post('/modulo2', verificarToken, async (req, res) => {
    try {
        const { visita_id, fecha, nombre_psg, domicilio, calidad_sujeto, nombre_pc, cargo_pc, adscripcion, tipo_identificacion, folio_identificacion, nombre_ordena } = req.body;
        const resultado = await pool.query(
            `INSERT INTO modulo2_orden_supervision 
            (visita_id, fecha, nombre_psg, domicilio, calidad_sujeto, nombre_pc, cargo_pc, adscripcion, tipo_identificacion, folio_identificacion, nombre_ordena)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [visita_id, fecha, nombre_psg, domicilio, calidad_sujeto, nombre_pc, cargo_pc, adscripcion, tipo_identificacion, folio_identificacion, nombre_ordena]
        );

        await pool.query(
            'UPDATE visitas SET modulo2_completado = true WHERE id = $1',
            [visita_id]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GUARDAR MÓDULO 3 ─────────────────────────────────────────────────────────
router.post('/modulo3', verificarToken, async (req, res) => {
    try {
        const { visita_id, nombre_psg, tipo_psg, nombre_titular, telefono, municipio, localidad, latitud, longitud, capacidad_instalada, nombre_supervisor, fecha, hora_inicio, hora_termino, observaciones, cumple, presenta_observaciones, requiere_seguimiento, responsable_psg, responsable_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, respuestas, recomendaciones } = req.body;

        // Convertir valores — evitar string vacío en campos numéricos y time
        const latitudVal = latitud !== '' && latitud !== null ? parseFloat(latitud) : null;
        const longitudVal = longitud !== '' && longitud !== null ? parseFloat(longitud) : null;
        const capacidadVal = capacidad_instalada !== '' && capacidad_instalada !== null ? parseInt(capacidad_instalada) : null;
        const horaInicioVal = hora_inicio !== '' && hora_inicio !== null ? hora_inicio : null;
        const horaTerminoVal = hora_termino !== '' && hora_termino !== null ? hora_termino : null;

        await pool.query(
            `INSERT INTO modulo3_lista_verificacion 
            (visita_id, nombre_psg, tipo_psg, nombre_titular, telefono, municipio, localidad, latitud, longitud, capacidad_instalada, nombre_supervisor, fecha, hora_inicio, hora_termino, observaciones, cumple, presenta_observaciones, requiere_seguimiento, responsable_psg, responsable_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
            [visita_id, nombre_psg, tipo_psg, nombre_titular, telefono, municipio, localidad, latitudVal, longitudVal, capacidadVal, nombre_supervisor, fecha, horaInicioVal, horaTerminoVal, observaciones, cumple, presenta_observaciones, requiere_seguimiento, responsable_psg, responsable_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo]
        );

        for (const [key, respuesta] of Object.entries(respuestas)) {
            const pregunta_id = parseInt(key.replace('p', ''));
            const observacion = recomendaciones[key] || '';
            await pool.query(
                `INSERT INTO modulo3_checklist (visita_id, pregunta_id, respuesta, observacion)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (visita_id, pregunta_id) 
                DO UPDATE SET respuesta = $3, observacion = $4, modificado_en = NOW()`,
                [visita_id, pregunta_id, respuesta, observacion]
            );
        }

        await pool.query(
            'UPDATE visitas SET modulo3_completado = true WHERE id = $1',
            [visita_id]
        );

        res.json({ mensaje: 'Módulo 3 guardado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GUARDAR MÓDULO 4 ─────────────────────────────────────────────────────────
router.post('/modulo4', verificarToken, async (req, res) => {
    try {
        const { visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, hechos_observados, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, nombre_testigo_cierre } = req.body;
        
        const nullTime = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nullStr = v => (v !== '' && v !== null && v !== undefined) ? v : null;

        const resultado = await pool.query(
            `INSERT INTO modulo4_acta_hechos 
            (visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, hechos_observados, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo, nombre_testigo_cierre)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
            [visita_id, nullStr(acta_no), nullStr(fecha), nullTime(hora), nullTime(hora_inicio), nullTime(hora_termino), nullStr(hechos_observados), no_realizo_manifestaciones, nullStr(manifestaciones), nullStr(localidad), nullStr(municipio), nullStr(nombre_psg), nullStr(tipo_psg), nullStr(nombre_titular), nullStr(domicilio), nullStr(telefono), nullStr(nombre_supervisor), nullStr(nombre_testigo), nullStr(domicilio_testigo), nullStr(tipo_id_testigo), nullStr(numero_id_testigo), nullStr(nombre_testigo_cierre)]
        );

        await pool.query(
            'UPDATE visitas SET modulo4_completado = true WHERE id = $1',
            [visita_id]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GUARDAR MÓDULO 5 ─────────────────────────────────────────────────────────
router.post('/modulo5', verificarToken, async (req, res) => {
    try {
        const { visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, acta_hechos, otros_documentos, cumple, presenta_observaciones, requiere_seguimiento, observaciones_detectadas, medidas_preventivas, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo } = req.body;

        const nullTime = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nullStr = v => (v !== '' && v !== null && v !== undefined) ? v : null;

        const resultado = await pool.query(
            `INSERT INTO modulo5_acta_supervision 
            (visita_id, acta_no, fecha, hora, hora_inicio, hora_termino, acta_hechos, otros_documentos, cumple, presenta_observaciones, requiere_seguimiento, observaciones_detectadas, medidas_preventivas, no_realizo_manifestaciones, manifestaciones, localidad, municipio, nombre_psg, tipo_psg, nombre_titular, domicilio, telefono, nombre_supervisor, nombre_testigo, domicilio_testigo, tipo_id_testigo, numero_id_testigo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING *`,
            [visita_id, nullStr(acta_no), nullStr(fecha), nullTime(hora), nullTime(hora_inicio), nullTime(hora_termino), acta_hechos, nullStr(otros_documentos), cumple, presenta_observaciones, requiere_seguimiento, nullStr(observaciones_detectadas), nullStr(medidas_preventivas), no_realizo_manifestaciones, nullStr(manifestaciones), nullStr(localidad), nullStr(municipio), nullStr(nombre_psg), nullStr(tipo_psg), nullStr(nombre_titular), nullStr(domicilio), nullStr(telefono), nullStr(nombre_supervisor), nullStr(nombre_testigo), nullStr(domicilio_testigo), nullStr(tipo_id_testigo), nullStr(numero_id_testigo)]
        );

        await pool.query(
            'UPDATE visitas SET modulo5_completado = true WHERE id = $1',
            [visita_id]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GUARDAR MÓDULO 6 ─────────────────────────────────────────────────────────
router.post('/modulo6', verificarToken, async (req, res) => {
    try {
        const { visita_id, acta_no, fecha, hora, establecimiento, clave_psg, ubicacion, localidad, municipio, estado, nombre_oficial, tipo_id_responsable, numero_id_responsable, id_expedida_por, fecha_expedicion_id, ubicacion_compareciente, credencial_oficial_no, nombre_testigo1, domicilio_testigo1, tipo_id_testigo1, numero_id_testigo1, nombre_testigo2, domicilio_testigo2, tipo_id_testigo2, numero_id_testigo2, oficio_comision, fecha_comision, emite_comision, hechos_observaciones, articulo1, de1, articulo2, de2, articulo3, de3, articulo4, de4, manifestaciones, fecha_cierre, hora_cierre } = req.body;

        const n = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nTime = v => (v !== '' && v !== null && v !== undefined) ? v : null;
        const nDate = v => (v !== '' && v !== null && v !== undefined) ? v : null;

        const resultado = await pool.query(
            `INSERT INTO modulo6_acta_circunstanciada 
            (visita_id, acta_no, fecha, hora, establecimiento, clave_psg, ubicacion, localidad, municipio, estado, nombre_oficial, tipo_id_responsable, numero_id_responsable, id_expedida_por, fecha_expedicion_id, ubicacion_compareciente, credencial_oficial_no, nombre_testigo1, domicilio_testigo1, tipo_id_testigo1, numero_id_testigo1, nombre_testigo2, domicilio_testigo2, tipo_id_testigo2, numero_id_testigo2, oficio_comision, fecha_comision, emite_comision, hechos_observaciones, articulo1, de1, articulo2, de2, articulo3, de3, articulo4, de4, manifestaciones, fecha_cierre, hora_cierre)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40) RETURNING *`,
            [visita_id, n(acta_no), nDate(fecha), nTime(hora), n(establecimiento), n(clave_psg), n(ubicacion), n(localidad), n(municipio), n(estado), n(nombre_oficial), n(tipo_id_responsable), n(numero_id_responsable), n(id_expedida_por), nDate(fecha_expedicion_id), n(ubicacion_compareciente), n(credencial_oficial_no), n(nombre_testigo1), n(domicilio_testigo1), n(tipo_id_testigo1), n(numero_id_testigo1), n(nombre_testigo2), n(domicilio_testigo2), n(tipo_id_testigo2), n(numero_id_testigo2), n(oficio_comision), nDate(fecha_comision), n(emite_comision), n(hechos_observaciones), n(articulo1), n(de1), n(articulo2), n(de2), n(articulo3), n(de3), n(articulo4), n(de4), n(manifestaciones), nDate(fecha_cierre), nTime(hora_cierre)]
        );

        await pool.query(
            'UPDATE visitas SET modulo6_completado = true WHERE id = $1',
            [visita_id]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error módulo 6:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;