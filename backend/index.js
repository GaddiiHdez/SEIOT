import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import psgRoutes from './routes/psg.js';
import authRoutes from './routes/auth.js';
import modulosRoutes from './routes/modulos.js';
import { verificarToken } from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
                          origin.endsWith('.vercel.app') ||
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

// 🔴 CORRECCIÓN 3: Ruta protegida para documentos firmados (Transmitir desde Google Drive)
import { google } from 'googleapis';
import fs from 'fs';

app.get('/uploads/documentos_firmados/:archivo', verificarToken, async (req, res) => {
    try {
        const safeFilename = path.basename(req.params.archivo);

        // Buscar el File ID en la base de datos
        const dbRes = await pool.query(
            'SELECT ruta_archivo FROM documentos_firmados WHERE nombre_archivo = $1',
            [safeFilename]
        );

        if (dbRes.rows.length === 0) {
            return res.status(404).json({ error: 'Archivo no encontrado en la base de datos.' });
        }

        const driveFileId = dbRes.rows[0].ruta_archivo;

        // Obtener el cliente de Google Drive
        let driveClient = null;
        let credentials;
        if (process.env.GOOGLE_CREDENTIALS) {
            credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        } else {
            const credPath = path.resolve('./google-credentials.json');
            if (fs.existsSync(credPath)) {
                credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
            }
        }

        if (credentials) {
            const auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key,
                ['https://www.googleapis.com/auth/drive']
            );
            driveClient = google.drive({ version: 'v3', auth });
        }

        if (!driveClient) {
            return res.status(500).json({ error: 'Google Drive no configurado.' });
        }

        // Descargar y transmitir el archivo desde Google Drive al cliente
        const response = await driveClient.files.get({
            fileId: driveFileId,
            alt: 'media'
        }, { responseType: 'stream' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

        response.data
            .on('error', err => {
                console.error("Error en streaming de Google Drive:", err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al descargar el archivo de Google Drive.' });
                }
            })
            .pipe(res);

    } catch (err) {
        console.error("Error al obtener archivo firmado:", err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ✅ Error 12: Un único health check en /api/health
// AWS ECS Task Definition debe apuntar a /api/health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SEIOT API corriendo', version: '1.0.0' });
});

app.use('/api/psg', psgRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/modulos', modulosRoutes);

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