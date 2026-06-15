import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'seiot_secret_2026';

// ─── MIDDLEWARE: VERIFICAR TOKEN ──────────────────────────────────────────────
export const verificarToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
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
    try {
        const { usuario, password } = req.body;

        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE usuario = $1 AND activo = true',
            [usuario]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = resultado.rows[0];
        const passwordValido = await bcrypt.compare(password, user.password_hash);

        if (!passwordValido) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                es_admin: user.es_admin,
                superadmin: user.superadmin || false,
                rol: user.rol,
                permisos: {
                    modulo1: user.modulo1,
                    modulo2: user.modulo2,
                    modulo3: user.modulo3,
                    modulo4: user.modulo4,
                    modulo5: user.modulo5,
                    modulo6: user.modulo6,
                    ver_visitas_otros: user.ver_visitas_otros,
                    editar_campos: user.editar_campos,
                    eliminar_documentos: user.eliminar_documentos,
                    descargar_pdfs: user.descargar_pdfs,
                    panel_admin: user.panel_admin
                }
            },
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
                permisos: {
                    modulo1: user.modulo1,
                    modulo2: user.modulo2,
                    modulo3: user.modulo3,
                    modulo4: user.modulo4,
                    modulo5: user.modulo5,
                    modulo6: user.modulo6,
                    ver_visitas_otros: user.ver_visitas_otros,
                    editar_campos: user.editar_campos,
                    eliminar_documentos: user.eliminar_documentos,
                    descargar_pdfs: user.descargar_pdfs,
                    panel_admin: user.panel_admin
                }
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── OBTENER PERFIL ACTUAL ────────────────────────────────────────────────────
router.get('/perfil', verificarToken, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT id, nombre, usuario, es_admin, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin FROM usuarios WHERE id = $1',
            [req.usuario.id]
        );
        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── CREAR USUARIO (solo admin) ───────────────────────────────────────────────
router.post('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { nombre, usuario, password, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin } = req.body;

        const existe = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', [usuario]);
        if (existe.rows.length > 0) return res.status(400).json({ error: 'El usuario ya existe' });

        const password_hash = await bcrypt.hash(password, 10);
        const es_admin = rol === 'admin' || rol === 'superadmin';

        const resultado = await pool.query(
            `INSERT INTO usuarios (nombre, usuario, password_hash, es_admin, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id, nombre, usuario, rol`,
            [nombre, usuario, password_hash, es_admin, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin]
        );

        res.json({ mensaje: 'Usuario creado correctamente', usuario: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── LISTAR USUARIOS (solo admin) ────────────────────────────────────────────
router.get('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT id, nombre, usuario, activo, es_admin, superadmin, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, creado_en FROM usuarios ORDER BY creado_en DESC'
        );
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── ACTUALIZAR PERMISOS DE USUARIO (solo admin) ─────────────────────────────
router.put('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, activo, rol, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin } = req.body;

        // Verificar que no sea superadmin
        const checkS = await pool.query('SELECT superadmin FROM usuarios WHERE id = $1', [id]);
        if (checkS.rows[0]?.superadmin && !req.usuario.superadmin) {
            return res.status(403).json({ error: 'No se puede editar al superadmin.' });
        }
        const es_admin = rol === 'admin' || rol === 'superadmin';

        await pool.query(
            `UPDATE usuarios SET nombre=$1, activo=$2, rol=$3, es_admin=$4, modulo1=$5, modulo2=$6, modulo3=$7, modulo4=$8, modulo5=$9, modulo6=$10, ver_visitas_otros=$11, editar_campos=$12, eliminar_documentos=$13, descargar_pdfs=$14, panel_admin=$15, modificado_en=NOW()
             WHERE id=$16`,
            [nombre, activo, rol, es_admin, modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, id]
        );

        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── CAMBIAR CONTRASEÑA ───────────────────────────────────────────────────────
router.put('/usuarios/:id/password', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Solo admin o el mismo usuario puede cambiar contraseña
        if (!req.usuario.es_admin && req.usuario.id !== parseInt(id)) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE usuarios SET password_hash=$1, modificado_en=NOW() WHERE id=$2', [password_hash, id]);

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── ELIMINAR/DESACTIVAR USUARIO (solo admin) ────────────────────────────────
router.delete('/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar que no sea superadmin
        const check = await pool.query('SELECT superadmin FROM usuarios WHERE id = $1', [id]);
        if (check.rows[0]?.superadmin) {
            return res.status(403).json({ error: 'No se puede desactivar al superadmin.' });
        }
        await pool.query('UPDATE usuarios SET activo=false, modificado_en=NOW() WHERE id=$1', [id]);
        res.json({ mensaje: 'Usuario desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;