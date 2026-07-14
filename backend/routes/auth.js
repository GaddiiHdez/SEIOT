import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// 🔴 CORRECCIÓN 1: Si no existe JWT_SECRET el servidor no arranca
if (!process.env.JWT_SECRET) {
    throw new Error('❌ JWT_SECRET no está definido en las variables de entorno');
}
const JWT_SECRET = process.env.JWT_SECRET;

// ─── RATE LIMITING SIMPLE EN LOGIN ───────────────────────────────────────────
const loginAttempts = new Map();
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

function verificarRateLimit(ip) {
    const ahora = Date.now();
    const datos = loginAttempts.get(ip);
    if (!datos) return { bloqueado: false };
    if (datos.bloqueadoHasta && ahora > datos.bloqueadoHasta) {
        loginAttempts.delete(ip);
        return { bloqueado: false };
    }
    if (datos.bloqueadoHasta) {
        const restanteSeg = Math.ceil((datos.bloqueadoHasta - ahora) / 1000);
        return { bloqueado: true, restanteSeg };
    }
    return { bloqueado: false };
}

function registrarIntentoFallido(ip) {
    const datos = loginAttempts.get(ip) || { intentos: 0 };
    datos.intentos += 1;
    if (datos.intentos >= MAX_INTENTOS) {
        datos.bloqueadoHasta = Date.now() + BLOQUEO_MS;
    }
    loginAttempts.set(ip, datos);
}

function limpiarIntento(ip) {
    loginAttempts.delete(ip);
}

setInterval(() => {
    const ahora = Date.now();
    for (const [ip, datos] of loginAttempts.entries()) {
        if (!datos.bloqueadoHasta || ahora > datos.bloqueadoHasta) {
            loginAttempts.delete(ip);
        }
    }
}, 60 * 60 * 1000);

// ─── HELPER: construir objeto permisos ────────────────────────────────────────
function construirPermisos(user) {
    return {
        modulo1: user.modulo1,
        modulo2: user.modulo2,
        modulo3: user.modulo3,
        modulo4: user.modulo4,
        modulo5: user.modulo5,
        modulo6: user.modulo6,
        modulo6_pagina4: user.modulo6_pagina4,
        ver_visitas_otros: user.ver_visitas_otros,
        editar_campos: user.editar_campos,
        eliminar_documentos: user.eliminar_documentos,
        descargar_pdfs: user.descargar_pdfs,
        panel_admin: user.panel_admin,
        consultas: user.consultas
    };
}

// ─── MIDDLEWARE: VERIFICAR TOKEN ──────────────────────────────────────────────
// Consulta permisos actuales en BD en cada request para cambios en tiempo real
export const verificarToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Consultar usuario y permisos actuales en BD
        const resultado = await pool.query(
            `SELECT id, nombre, usuario, es_admin, superadmin, rol, activo,
                    modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4,
                    ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs,
                    panel_admin, consultas
             FROM usuarios WHERE id = $1`,
            [decoded.id]
        );

        // Si el usuario no existe o fue desactivado
        if (resultado.rows.length === 0 || !resultado.rows[0].activo) {
            return res.status(401).json({ error: 'Usuario no autorizado o desactivado.' });
        }

        const user = resultado.rows[0];

        // Combinar datos del token con permisos actuales de BD
        req.usuario = {
            id: user.id,
            nombre: user.nombre,
            usuario: user.usuario,
            es_admin: user.es_admin,
            superadmin: user.superadmin || false,
            rol: user.rol,
            permisos: construirPermisos(user)
        };

        next();
    } catch {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// ─── MIDDLEWARE: VERIFICAR ADMIN ──────────────────────────────────────────────
export const verificarAdmin = (req, res, next) => {
    if (!req.usuario?.es_admin) return res.status(403).json({ error: 'Acceso denegado' });
    next();
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const { bloqueado, restanteSeg } = verificarRateLimit(ip);
    if (bloqueado) {
        return res.status(429).json({
            error: `Demasiados intentos fallidos. Intenta de nuevo en ${restanteSeg} segundos.`
        });
    }

    try {
        const { usuario, password } = req.body;

        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE usuario = $1 AND activo = true',
            [usuario]
        );

        if (resultado.rows.length === 0) {
            registrarIntentoFallido(ip);
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = resultado.rows[0];
        const passwordValido = await bcrypt.compare(password, user.password_hash);

        if (!passwordValido) {
            registrarIntentoFallido(ip);
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        limpiarIntento(ip);

        const permisos = construirPermisos(user);

        const token = jwt.sign(
            { id: user.id },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                es_admin: user.es_admin,
                superadmin: user.superadmin || false,
                rol: user.rol,
                permisos
            }
        });

    } catch (error) {
        console.error('Error login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── OBTENER PERFIL ACTUAL ────────────────────────────────────────────────────
router.get('/perfil', verificarToken, async (req, res) => {
    try {
        // verificarToken ya consultó la BD, usar req.usuario directamente
        res.json({
            id: req.usuario.id,
            nombre: req.usuario.nombre,
            usuario: req.usuario.usuario,
            es_admin: req.usuario.es_admin,
            superadmin: req.usuario.superadmin,
            rol: req.usuario.rol,
            permisos: req.usuario.permisos
        });
    } catch (error) {
        console.error('Error perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── CREAR USUARIO (solo admin) ───────────────────────────────────────────────
router.post('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { nombre, usuario, password, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, consultas } = req.body;

        const existe = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', [usuario]);
        if (existe.rows.length > 0) return res.status(400).json({ error: 'El usuario ya existe' });

        const password_hash = await bcrypt.hash(password, 10);
        const es_admin = rol === 'admin' || rol === 'superadmin';

        const resultado = await pool.query(
            `INSERT INTO usuarios (nombre, usuario, password_hash, es_admin, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, consultas)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id, nombre, usuario, rol`,
            [nombre, usuario, password_hash, es_admin, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, consultas]
        );

        res.json({ mensaje: 'Usuario creado correctamente', usuario: resultado.rows[0] });
    } catch (error) {
        console.error('Error crear usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── LISTAR USUARIOS (solo admin) ────────────────────────────────────────────
router.get('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT id, nombre, usuario, activo, es_admin, superadmin, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, consultas, creado_en FROM usuarios ORDER BY creado_en DESC'
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error listar usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── ACTUALIZAR PERMISOS DE USUARIO (solo admin) ─────────────────────────────
router.put('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, activo, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, consultas } = req.body;

        const checkS = await pool.query('SELECT superadmin FROM usuarios WHERE id = $1', [id]);
        if (checkS.rows[0]?.superadmin && !req.usuario.superadmin) {
            return res.status(403).json({ error: 'No se puede editar al superadmin.' });
        }
        const es_admin = rol === 'admin' || rol === 'superadmin';

        await pool.query(
            `UPDATE usuarios SET nombre=$1, activo=$2, rol=$3, es_admin=$4, modulo1=$5, modulo2=$6, modulo3=$7, modulo4=$8, modulo5=$9, modulo6=$10, modulo6_pagina4=$11, ver_visitas_otros=$12, editar_campos=$13, eliminar_documentos=$14, descargar_pdfs=$15, panel_admin=$16, consultas=$17, modificado_en=NOW()
             WHERE id=$18`,
            [nombre, activo, rol, es_admin, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, consultas, id]
        );

        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── CAMBIAR CONTRASEÑA ───────────────────────────────────────────────────────
router.put('/usuarios/:id/password', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!req.usuario.es_admin && req.usuario.id !== parseInt(id)) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE usuarios SET password_hash=$1, modificado_en=NOW() WHERE id=$2', [password_hash, id]);

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error cambiar contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ─── ELIMINAR/DESACTIVAR USUARIO (solo admin) ────────────────────────────────
router.delete('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const check = await pool.query('SELECT superadmin FROM usuarios WHERE id = $1', [id]);
        if (check.rows[0]?.superadmin) {
            return res.status(403).json({ error: 'No se puede desactivar al superadmin.' });
        }
        await pool.query('UPDATE usuarios SET activo=false, modificado_en=NOW() WHERE id=$1', [id]);
        res.json({ mensaje: 'Usuario desactivado correctamente' });
    } catch (error) {
        console.error('Error desactivar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

export default router;