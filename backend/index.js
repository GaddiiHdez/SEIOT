import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import psgRoutes from './routes/psg.js';
import authRoutes from './routes/auth.js';
import modulosRoutes from './routes/modulos.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos (PDFs firmados)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
            res.status(500).json({ error: error.message });
        }
    });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});