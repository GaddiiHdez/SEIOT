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
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        },
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '2000')
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
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '2000')
    });
}

const initConfigTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.configuracion_folios (
                clave VARCHAR(50) PRIMARY KEY,
                nomenclatura VARCHAR(100) NOT NULL DEFAULT 'SDR/{PSG}/{ANIO}/{CONSECUTIVO}',
                consecutivo_actual INT NOT NULL DEFAULT 1,
                longitud_consecutivo INT NOT NULL DEFAULT 3
            )
        `);
        const res = await pool.query("SELECT * FROM public.configuracion_folios WHERE clave = 'general'");
        if (res.rows.length === 0) {
            await pool.query(`
                INSERT INTO public.configuracion_folios (clave, nomenclatura, consecutivo_actual, longitud_consecutivo)
                VALUES ('general', 'SDR/{PSG}/{ANIO}/{CONSECUTIVO}', 1, 3)
            `);
        }
        console.log('✅ Tabla configuracion_folios inicializada');
    } catch (err) {
        console.error('❌ Error al inicializar configuracion_folios:', err);
    }
};

pool.connect()
    .then(async client => {
        console.log('✅ Conectado a PostgreSQL');
        client.release();
        await initConfigTable();
    })
    .catch(err => console.error('❌ Error conectando a PostgreSQL:', err));

export default pool;