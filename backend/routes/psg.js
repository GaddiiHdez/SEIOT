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
        res.status(500).json({ error: error.message });
    }
});
// Obtener todos los supervisores
router.get('/supervisores', verificarToken, async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM excel_supervisores ORDER BY nombre');
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Crear nueva visita
router.post('/visitas', verificarToken, async (req, res) => {
    try {
        const { folio, psg, supervisor } = req.body;
        const capturista_id = req.usuario.id;

        const resultado = await pool.query(
            `INSERT INTO visitas (folio, psg, supervisor, capturista_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [folio, psg, supervisor, capturista_id]
        );

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Buscar visita por folio
router.get('/visitas/buscar', verificarToken, async (req, res) => {
    try {
        const folio = req.query.folio;
        if (!folio) return res.status(400).json({ error: 'Folio requerido' });
        const puedeVerOtros = req.usuario.es_admin || req.usuario.permisos?.ver_visitas_otros;

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
        if (!puedeVerOtros && v.capturista_id && v.capturista_id !== req.usuario.id) {
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
        res.status(500).json({ error: error.message });
    }
});

export default router;