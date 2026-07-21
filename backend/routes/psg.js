import express from 'express';
import pool from '../db.js';
import { verificarToken } from './auth.js';

const router = express.Router();

// Buscar PSG por código
router.get('/buscar/:psg', verificarToken, async (req, res) => {
    try {
        const { psg } = req.params;
        const resultado = await pool.query(
            'SELECT * FROM excel_psg WHERE psg = $1',
            [psg]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'PSG no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
// Autocompletar / Sugerencias de PSG
router.get('/sugerencias', verificarToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 1) {
            return res.json([]);
        }

        const rawQuery = q.trim();
        const cleanQuery = rawQuery.replace(/[^A-Za-z0-9]/g, '');

        const resultado = await pool.query(
            `SELECT * FROM excel_psg 
             WHERE psg ILIKE $1 
                OR REPLACE(psg, '-', '') ILIKE $2
                OR razon_social ILIKE $1 
                OR representante ILIKE $1
                OR municipio ILIKE $1
             ORDER BY psg ASC LIMIT 10`,
            [`%${rawQuery}%`, `%${cleanQuery}%`]
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al buscar sugerencias de PSG:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Obtener todos los supervisores activos (filtrado temporal para producción)
router.get('/supervisores', verificarToken, async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT * FROM excel_supervisores WHERE nombre = 'MVZ. Octavio Herrera Ulloa' ORDER BY nombre"
        );
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// Helper para generar el siguiente folio de manera transaccional
const generarFolioInterno = async (client, psg) => {
    // Bloquear la fila de configuración para evitar condiciones de carrera simultáneas
    const configRes = await client.query(
        "SELECT nomenclatura, consecutivo_actual, longitud_consecutivo FROM configuracion_folios WHERE clave = 'general' FOR UPDATE"
    );
    
    if (configRes.rows.length === 0) {
        throw new Error('Configuración de folios no encontrada.');
    }
    
    const { nomenclatura, consecutivo_actual, longitud_consecutivo } = configRes.rows[0];
    const anioActual = new Date().getFullYear();
    const consecutivoStr = String(consecutivo_actual).padStart(longitud_consecutivo, '0');
    
    const folio = nomenclatura
        .replace(/{PSG}/g, psg)
        .replace(/{ANIO}/g, anioActual)
        .replace(/{CONSECUTIVO}/g, consecutivoStr);
        
    await client.query(
        "UPDATE configuracion_folios SET consecutivo_actual = consecutivo_actual + 1 WHERE clave = 'general'"
    );
    
    return folio;
};

// Crear nueva visita
router.post('/visitas', verificarToken, async (req, res) => {
    const client = await pool.connect();
    try {
        let { folio, psg, supervisor } = req.body;
        const capturista_id = req.usuario.id;

        await client.query('BEGIN');

        // Generar folio dinámicamente si no se recibe uno pre-establecido (ej. offline)
        if (!folio) {
            folio = await generarFolioInterno(client, psg);
        }

        const resultado = await client.query(
            `INSERT INTO visitas (folio, psg, supervisor, capturista_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [folio, psg, supervisor, capturista_id]
        );

        await client.query('COMMIT');
        res.json(resultado.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando visita:', error);
        res.status(500).json({ error: 'Error al iniciar la visita o generar el folio en el servidor.' });
    } finally {
        client.release();
    }
});
// Buscar visita por folio
router.get('/visitas/buscar', verificarToken, async (req, res) => {
    try {
        const folio = req.query.folio;
        if (!folio) return res.status(400).json({ error: 'Folio requerido' });
        const puedeVerOtros = req.usuario.superadmin || req.usuario.es_admin || req.usuario.permisos?.ver_visitas_otros;

        const resultado = await pool.query(
            `SELECT v.*, 
                    p.razon_social, p.representante, p.localidad, p.municipio,
                    p.domicilio, p.estado, p.tipo_psg, p.telefono, 
                    p.latitud, p.longitud, p.capacidad_maxima_bovinos,
                    p.tipo_identificacion as tipo_identificacion_psg, p.numero_identificacion, p.expedida_por,
                    s.nombre as supervisor_nombre, s.cargo, s.adscripcion, s.tipo_supervisor, s.credencial_oficial, s.tipo_identificacion, s.folio_identificacion
             FROM visitas v
             LEFT JOIN excel_psg p ON p.psg = v.psg
             LEFT JOIN excel_supervisores s ON s.nombre = v.supervisor
             WHERE v.folio = $1`,
            [folio]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Visita no encontrada' });
        }

        const v = resultado.rows[0];

        // Verificar permiso para ver visitas de otros
        if (!puedeVerOtros && (v.capturista_id === null || v.capturista_id !== req.usuario.id)) {
            return res.status(403).json({ error: 'No tienes permiso para ver visitas de otros usuarios.' });
        }

        res.json({
            id: v.id,
            folio: v.folio,
            psg: v.psg,
            datosPsg: {
                psg: v.psg,
                nombre_titular: v.razon_social,
                representante: v.representante,
                localidad: v.localidad,
                municipio: v.municipio,
                domicilio: v.domicilio,
                estado: v.estado || 'NAYARIT',
                tipo_psg: v.tipo_psg,
                telefono: v.telefono,
                latitud: v.latitud,
                longitud: v.longitud,
                capacidad_maxima_bovinos: v.capacidad_maxima_bovinos,
                tipo_identificacion: v.tipo_identificacion_psg || '',
                numero_identificacion: v.numero_identificacion || '',
                expedida_por: v.expedida_por || ''
            },
            supervisor: v.supervisor,
            datosSupervisor: {
                nombre: v.supervisor,
                cargo: v.cargo || '',
                adscripcion: v.adscripcion || '',
                tipo_supervisor: v.tipo_supervisor || '',
                credencial_oficial: v.credencial_oficial || '',
                tipo_identificacion: v.tipo_identificacion || '',
                folio_identificacion: v.folio_identificacion || ''
            },
            visita_id: v.id,
            fecha: new Date(v.fecha_inicio).toLocaleDateString('es-MX'),
            estado_visita: v.estado_visita,
            avance: {
                modulo1: v.modulo1_completado || false,
                modulo2: v.modulo2_completado || false,
                modulo3: v.modulo3_completado || false,
                modulo4: v.modulo4_completado || false,
                modulo5: v.modulo5_completado || false,
                modulo6: v.modulo6_completado || false
            },
            respuestas: {}
        });

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── CONSULTAS CON FILTROS ────────────────────────────────────────────────────
router.get('/consultas', verificarToken, async (req, res) => {
    try {
        // Verificar permiso de consultas
        const puedeConsultas = req.usuario.es_admin || req.usuario.permisos?.consultas;
        if (!puedeConsultas) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a consultas.' });
        }

        const puedeVerOtros = req.usuario.es_admin || req.usuario.permisos?.ver_visitas_otros;

        let { psg, folio, municipios, estatus, modulos_completados, fecha_desde, fecha_hasta, page, limit } = req.query;

        let condiciones = [];
        let params = [];
        let i = 1;

        // Si no puede ver visitas de otros, solo muestra las suyas
        if (!puedeVerOtros) {
            condiciones.push(`v.capturista_id = $${i}`);
            params.push(req.usuario.id);
            i++;
        }

        if (folio) {
            condiciones.push(`v.folio ILIKE $${i}`);
            params.push(`%${folio}%`);
            i++;
        }

        if (psg) {
            condiciones.push(`v.psg ILIKE $${i}`);
            params.push(`%${psg}%`);
            i++;
        }

        if (municipios) {
            const lista = municipios.split(',').map(m => m.trim()).filter(Boolean);
            if (lista.length > 0) {
                condiciones.push(`p.municipio = ANY($${i})`);
                params.push(lista);
                i++;
            }
        }

        if (estatus === 'finalizado') {
            condiciones.push(`(v.estado_visita = 'finalizado' OR (v.modulo1_completado = true AND v.modulo2_completado = true AND v.modulo3_completado = true AND v.modulo4_completado = true AND v.modulo5_completado = true AND v.modulo6_completado = true))`);
        } else if (estatus === 'en_proceso') {
            condiciones.push(`v.estado_visita != 'finalizado' AND NOT (v.modulo1_completado = true AND v.modulo2_completado = true AND v.modulo3_completado = true AND v.modulo4_completado = true AND v.modulo5_completado = true AND v.modulo6_completado = true)`);
        }

        if (modulos_completados) {
            const mods = modulos_completados.split(',').map(m => m.trim()).filter(Boolean);
            const MODULOS_VALIDOS = ['modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5', 'modulo6'];
            mods.forEach(mod => {
                if (MODULOS_VALIDOS.includes(mod)) {
                    condiciones.push(`v.${mod}_completado = true`);
                }
            });
        }

        if (fecha_desde) {
            condiciones.push(`v.fecha_inicio >= $${i}`);
            params.push(fecha_desde);
            i++;
        }

        if (fecha_hasta) {
            condiciones.push(`v.fecha_inicio <= $${i}`);
            params.push(fecha_hasta + ' 23:59:59');
            i++;
        }

        const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

        // Consultar el conteo total
        const countQuery = `SELECT COUNT(*) FROM visitas v LEFT JOIN excel_psg p ON p.psg = v.psg ${where}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        let queryStr = `SELECT 
                v.id, v.folio, v.psg, v.supervisor, v.fecha_inicio,
                v.modulo1_completado, v.modulo2_completado, v.modulo3_completado,
                v.modulo4_completado, v.modulo5_completado, v.modulo6_completado,
                v.estado_visita,
                p.razon_social, p.municipio, p.localidad, p.tipo_psg,
                u.nombre AS capturista_nombre
             FROM visitas v
             LEFT JOIN excel_psg p ON p.psg = v.psg
             LEFT JOIN usuarios u ON u.id = v.capturista_id
             ${where}
             ORDER BY v.fecha_inicio DESC`;

        // Paginación si es aplicable
        const pageVal = parseInt(page);
        const limitVal = parseInt(limit);
        if (!isNaN(pageVal) && !isNaN(limitVal)) {
            const offset = (pageVal - 1) * limitVal;
            queryStr += ` LIMIT $${i} OFFSET $${i+1}`;
            params.push(limitVal, offset);
        }

        const resultado = await pool.query(queryStr, params);

        res.json({
            rows: resultado.rows,
            total
        });
    } catch (error) {
        console.error('Error consultas:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── EXPORTAR TODO A EXCEL (datos completos) ─────────────────────────────────
router.get('/consultas/exportar', verificarToken, async (req, res) => {
    try {
        // Verificar permiso de consultas
        const puedeConsultas = req.usuario.es_admin || req.usuario.permisos?.consultas;
        if (!puedeConsultas) {
            return res.status(403).json({ error: 'No tienes permiso para exportar.' });
        }

        const puedeVerOtros = req.usuario.es_admin || req.usuario.permisos?.ver_visitas_otros;

        const { psg, municipios, estatus, modulos_completados, fecha_desde, fecha_hasta, solo_filtrados } = req.query;

        let condiciones = [];
        let params = [];
        let i = 1;

        // Si no puede ver visitas de otros, solo muestra las suyas
        if (!puedeVerOtros) {
            condiciones.push(`v.capturista_id = $${i}`);
            params.push(req.usuario.id);
            i++;
        }

        // Si es exportar resultados, aplicar los mismos filtros
        if (solo_filtrados === 'true') {
            if (psg) { condiciones.push(`v.psg ILIKE $${i}`); params.push(`%${psg}%`); i++; }
            if (municipios) {
                const lista = municipios.split(',').map(m => m.trim()).filter(Boolean);
                if (lista.length > 0) { condiciones.push(`p.municipio = ANY($${i})`); params.push(lista); i++; }
            }
            if (estatus === 'finalizado') {
                condiciones.push(`(v.estado_visita = 'finalizado' OR (v.modulo1_completado = true AND v.modulo2_completado = true AND v.modulo3_completado = true AND v.modulo4_completado = true AND v.modulo5_completado = true AND v.modulo6_completado = true))`);
            } else if (estatus === 'en_proceso') {
                condiciones.push(`v.estado_visita != 'finalizado' AND NOT (v.modulo1_completado = true AND v.modulo2_completado = true AND v.modulo3_completado = true AND v.modulo4_completado = true AND v.modulo5_completado = true AND v.modulo6_completado = true)`);
            }
            if (modulos_completados) {
                const mods = modulos_completados.split(',').map(m => m.trim()).filter(Boolean);
                const MODULOS_VALIDOS = ['modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5', 'modulo6'];
                mods.forEach(mod => {
                    if (MODULOS_VALIDOS.includes(mod)) {
                        condiciones.push(`v.${mod}_completado = true`);
                    }
                });
            }
            if (fecha_desde) { condiciones.push(`v.fecha_inicio >= $${i}`); params.push(fecha_desde); i++; }
            if (fecha_hasta) { condiciones.push(`v.fecha_inicio <= $${i}`); params.push(fecha_hasta + ' 23:59:59'); i++; }
        }

        const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

        const visitas = await pool.query(
            `SELECT v.id, v.folio, v.psg, v.supervisor, v.fecha_inicio,
                    v.modulo1_completado, v.modulo2_completado, v.modulo3_completado,
                    v.modulo4_completado, v.modulo5_completado, v.modulo6_completado,
                    v.estado_visita, p.razon_social, p.municipio, p.localidad, p.tipo_psg, p.telefono, p.domicilio 
             FROM visitas v 
             LEFT JOIN excel_psg p ON p.psg = v.psg 
             ${where} 
             ORDER BY v.fecha_inicio DESC`, 
            params
        );

        if (visitas.rows.length === 0) {
            return res.json([]);
        }

        const visitaIds = visitas.rows.map(v => v.id);

        const [m1, m2, m3, m4, m5, m6] = await Promise.all([
            pool.query('SELECT * FROM modulo1_oficio_notificacion WHERE visita_id = ANY($1)', [visitaIds]),
            pool.query('SELECT * FROM modulo2_orden_supervision WHERE visita_id = ANY($1)', [visitaIds]),
            pool.query('SELECT * FROM modulo3_lista_verificacion WHERE visita_id = ANY($1)', [visitaIds]),
            pool.query('SELECT * FROM modulo4_acta_hechos WHERE visita_id = ANY($1)', [visitaIds]),
            pool.query('SELECT * FROM modulo5_acta_supervision WHERE visita_id = ANY($1)', [visitaIds]),
            pool.query('SELECT * FROM modulo6_acta_circunstanciada WHERE visita_id = ANY($1)', [visitaIds]),
        ]);

        // Indexar módulos por visita_id
        const idx = (rows) => rows.reduce((acc, r) => { acc[r.visita_id] = r; return acc; }, {});
        const im1 = idx(m1.rows), im2 = idx(m2.rows), im3 = idx(m3.rows);
        const im4 = idx(m4.rows), im5 = idx(m5.rows), im6 = idx(m6.rows);

        const datos = visitas.rows.map(v => ({
            // Visita
            folio: v.folio, psg: v.psg, razon_social: v.razon_social,
            municipio: v.municipio, localidad: v.localidad, tipo_psg: v.tipo_psg,
            telefono: v.telefono, domicilio: v.domicilio,
            supervisor: v.supervisor, fecha_inicio: v.fecha_inicio,
            estado_visita: v.estado_visita,
            modulo1_completado: v.modulo1_completado, modulo2_completado: v.modulo2_completado,
            modulo3_completado: v.modulo3_completado, modulo4_completado: v.modulo4_completado,
            modulo5_completado: v.modulo5_completado, modulo6_completado: v.modulo6_completado,
            // Módulo 1
            m1_fecha_emision: im1[v.id]?.fecha_emision, m1_nombre_servidor: im1[v.id]?.nombre_servidor, m1_cargo_servidor: im1[v.id]?.cargo_servidor,
            // Módulo 2
            m2_fecha: im2[v.id]?.fecha, m2_nombre_ordena: im2[v.id]?.nombre_ordena,
            // Módulo 3
            m3_fecha: im3[v.id]?.fecha, m3_hora_inicio: im3[v.id]?.hora_inicio, m3_hora_termino: im3[v.id]?.hora_termino,
            m3_cumple: im3[v.id]?.cumple, m3_presenta_observaciones: im3[v.id]?.presenta_observaciones,
            m3_requiere_seguimiento: im3[v.id]?.requiere_seguimiento, m3_observaciones: im3[v.id]?.observaciones,
            // Módulo 4
            m4_acta_no: im4[v.id]?.acta_no, m4_fecha: im4[v.id]?.fecha, m4_hechos_observados: im4[v.id]?.hechos_observados,
            // Módulo 5
            m5_acta_no: im5[v.id]?.acta_no, m5_fecha: im5[v.id]?.fecha,
            m5_cumple: im5[v.id]?.cumple, m5_presenta_observaciones: im5[v.id]?.presenta_observaciones,
            m5_requiere_seguimiento: im5[v.id]?.requiere_seguimiento,
            m5_observaciones_detectadas: im5[v.id]?.observaciones_detectadas,
            // Módulo 6
            m6_acta_no: im6[v.id]?.acta_no, m6_fecha: im6[v.id]?.fecha,
        }));

        res.json(datos);
    } catch (error) {
        console.error('Error exportar:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Finalizar visita voluntariamente
router.post('/visitas/finalizar/:visita_id', verificarToken, async (req, res) => {
    try {
        const { visita_id } = req.params;
        const resultado = await pool.query(
            "UPDATE visitas SET estado_visita = 'finalizado' WHERE id = $1 RETURNING *",
            [visita_id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Visita no encontrada.' });
        }

        res.json({ mensaje: 'Visita finalizada correctamente.', visita: resultado.rows[0] });
    } catch (error) {
        console.error('Error al finalizar visita:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

export default router;