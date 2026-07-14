/* eslint-env node */
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();


const { Pool } = pkg;
let pool;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // Validar variables de entorno requeridas si no hay DATABASE_URL
    const requeridas = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    for (const variable of requeridas) {
        if (!process.env[variable]) {
            throw new Error(`❌ Variable de entorno ${variable} no está definida`);
        }
    }

    pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
}

pool.connect()
    .then(() => console.log('✅ Conectado a PostgreSQL'))
    .catch(err => console.error('❌ Error conectando a PostgreSQL:', err));

export default pool;