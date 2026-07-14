/* eslint-env node */
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 🔴 Validar variables de entorno requeridas
const requeridas = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
for (const variable of requeridas) {
    if (!process.env[variable]) {
        throw new Error(`❌ Variable de entorno ${variable} no está definida`);
    }
}

const { Pool } = pkg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

pool.connect()
    .then(() => console.log('✅ Conectado a PostgreSQL'))
    .catch(err => console.error('❌ Error conectando a PostgreSQL:', err));

export default pool;