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

// 🔴 CORRECCIÓN 3: Ruta protegida para documentos firmados
app.get('/uploads/documentos_firmados/:archivo', verificarToken, (req, res) => {
    const safeFilename = path.basename(req.params.archivo);
    const rutaArchivo = path.join(__dirname, 'uploads', 'documentos_firmados', safeFilename);
    res.sendFile(rutaArchivo, (err) => {
        if (err) {
            res.status(404).json({ error: 'Archivo no encontrado.' });
        }
    });
});

// ✅ Error 12: Un único health check en /api/health
// AWS ECS Task Definition debe apuntar a /api/health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SEIOT API corriendo', version: '1.0.0' });
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