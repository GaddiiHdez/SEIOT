import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import pool from './db.js';
import psgRoutes from './routes/psg.js';
import authRoutes from './routes/auth.js';
import modulosRoutes from './routes/modulos.js';
import superadminRoutes from './routes/superadmin.js';
import { verificarToken } from './routes/auth.js';
import { findDocumentoFirmado, getUploadsDir } from './utils/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174'
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) || 
                          /^https:\/\/seiot(-[a-z0-9-]+)?\.vercel\.app$/.test(origin) ||
                          /^http:\/\/localhost:\d+$/.test(origin);
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔴 Ruta protegida para documentos firmados (con soporte para disco persistente en Render)
app.get('/uploads/documentos_firmados/:archivo', verificarToken, (req, res) => {
    const rutaArchivo = findDocumentoFirmado(req.params.archivo);
    if (!rutaArchivo) {
        return res.status(404).json({ error: 'Archivo no encontrado.' });
    }
    res.sendFile(rutaArchivo);
});

// ✅ Health check con diagnóstico de disco persistente
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SEIOT API corriendo',
        version: '1.2.3-disk-diag',
        uploadsDir: getUploadsDir()
    });
});

// 🔍 Diagnóstico detallado del disco y sistema de archivos (requiere token)
app.get('/api/health/disco', verificarToken, (req, res) => {
    let mounts = [];
    try {
        if (fs.existsSync('/proc/mounts')) {
            const raw = fs.readFileSync('/proc/mounts', 'utf8');
            mounts = raw.split('\n').filter(line => 
                line.includes('/dev/') || 
                line.includes('data') || 
                line.includes('upload') || 
                line.includes('disk') ||
                line.includes('/var/')
            );
        }
    } catch (e) {
        mounts = [e.message];
    }

    const currentUploads = getUploadsDir();
    let archivosEnUploads = [];
    try {
        if (fs.existsSync(currentUploads)) {
            archivosEnUploads = fs.readdirSync(currentUploads);
        }
    } catch (e) {
        archivosEnUploads = [e.message];
    }

    const candidatos = ['/var/data', '/data', '/uploads', '/mnt/data', '/app/uploads'].map(dir => {
        const exists = fs.existsSync(dir);
        let archivos = [];
        if (exists) {
            try { archivos = fs.readdirSync(dir); } catch (e) { archivos = [e.message]; }
        }
        return { dir, exists, archivos };
    });

    res.json({
        uploadsDir: currentUploads,
        env_UPLOADS_DIR: process.env.UPLOADS_DIR || null,
        totalArchivosEnUploads: archivosEnUploads.length,
        archivos: archivosEnUploads,
        candidatos,
        mounts
    });
});

app.use('/api/psg', psgRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/modulos', modulosRoutes);
app.use('/api/superadmin', superadminRoutes);

// Rutas de diagnóstico - solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/estado', (req, res) => {
        res.json({ mensaje: '¡El Servidor del SEIOT está vivo! 🚀' });
    });

    app.get('/api/test-bd', async (req, res) => {
        try {
            const resultado = await pool.query('SELECT COUNT(*) FROM excel_psg');
            res.json({ mensaje: '✅ BD conectada', registros: resultado.rows[0].count });
        } catch (error) {
            console.error('Error test-bd:', error);
            res.status(500).json({ error: 'Error al conectar con la base de datos.' }); // ✅ Error 9
        }
    });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});