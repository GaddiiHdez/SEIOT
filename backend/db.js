/* eslint-env node */
import pkg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

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

const initAuditLogsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.auditoria_logs (
                id SERIAL PRIMARY KEY,
                usuario_id INT REFERENCES public.usuarios(id) ON DELETE SET NULL,
                usuario_nombre VARCHAR(100),
                usuario_username VARCHAR(100),
                accion VARCHAR(50) NOT NULL,
                tabla_afectada VARCHAR(50),
                registro_id VARCHAR(100),
                detalles JSONB,
                creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_auditoria_logs_creado_en ON public.auditoria_logs (creado_en DESC)
        `);
        console.log('✅ Tabla auditoria_logs inicializada');
    } catch (err) {
        console.error('❌ Error al inicializar auditoria_logs:', err);
    }
};

const initModulo1Columns = async () => {
    try {
        await pool.query(`
            ALTER TABLE public.modulo1_oficio_notificacion 
            ADD COLUMN IF NOT EXISTS hora_emision time;
        `);
    } catch (err) {
        console.error('❌ Error al agregar hora_emision a modulo1_oficio_notificacion:', err);
    }
};

const initSeguimiento = async () => {
    try {
        // 1. Columnas en modulo3_lista_verificacion, visitas y usuarios
        const migraciones = [
            'ALTER TABLE public.modulo3_lista_verificacion ADD COLUMN IF NOT EXISTS instancias_notificadas text[];',
            'ALTER TABLE public.modulo3_lista_verificacion ADD COLUMN IF NOT EXISTS token_seguimiento varchar(100);',
            'ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS seguimiento_atendido BOOLEAN DEFAULT FALSE;',
            'ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS dictamen_seguimiento VARCHAR(50);',
            'ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS fecha_atencion_seguimiento TIMESTAMP WITH TIME ZONE;',
            'ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS instancia VARCHAR(50);',
            `CREATE TABLE IF NOT EXISTS public.modulo3_seguimiento_atencion (
                id SERIAL PRIMARY KEY,
                visita_id INT REFERENCES public.visitas(id) ON DELETE CASCADE,
                instancia VARCHAR(100) NOT NULL,
                nombre_responsable VARCHAR(150),
                cargo_responsable VARCHAR(150),
                oficio_referencia VARCHAR(100),
                acciones_tomadas TEXT NOT NULL,
                dictamen VARCHAR(50) DEFAULT 'SOLVENTADO',
                estatus VARCHAR(50) DEFAULT 'ATENDIDO',
                creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`,
            "ALTER TABLE public.modulo3_seguimiento_atencion ADD COLUMN IF NOT EXISTS dictamen VARCHAR(50) DEFAULT 'SOLVENTADO';",
            "ALTER TABLE public.modulo3_seguimiento_atencion ADD COLUMN IF NOT EXISTS estatus VARCHAR(50) DEFAULT 'ATENDIDO';"
        ];

        for (const sql of migraciones) {
            try {
                await pool.query(sql);
            } catch (migErr) {
                console.warn('[DB INIT] Advertencia en migración seguimiento:', migErr.message);
            }
        }

        // 2. Auto-generar tokens de seguimiento para registros existentes que lo tengan en NULL
        try {
            await pool.query(`
                UPDATE public.modulo3_lista_verificacion 
                SET token_seguimiento = md5(random()::text || id::text || clock_timestamp()::text) || md5(random()::text || visita_id::text)
                WHERE token_seguimiento IS NULL;
            `);
        } catch (tokenErr) {
            console.warn('[DB INIT] Advertencia al auto-generar tokens:', tokenErr.message);
        }

        // 3. Asegurar que las visitas existentes con módulos completados tengan asignación a instancias para pruebas
        try {
            await pool.query(`
                UPDATE public.modulo3_lista_verificacion 
                SET requiere_seguimiento = true,
                    instancias_notificadas = ARRAY['test_henry', 'seder_juridico', 'cefppenay', 'senasica']::text[]
                WHERE (instancias_notificadas IS NULL OR array_length(instancias_notificadas, 1) IS NULL OR array_length(instancias_notificadas, 1) = 0);
            `);
        } catch (seedErr) {
            console.warn('[DB INIT] Advertencia al respaldar instancias:', seedErr.message);
        }

        // 4. Crear o actualizar cuentas institucionales con permisos estrictos de solo seguimiento
        const cuentas = [
            {
                nombre: 'Lic. Carlos Esteban Henson Reyes (Director Jurídico SEDER)',
                usuario: 'juridico.seder',
                pass: 'SederJuridico2026!',
                rol: 'seguimiento',
                instancia: 'seder_juridico'
            },
            {
                nombre: 'M.V.Z. Ricardo Álvarez Hernández (Gerente CEFPPENAY)',
                usuario: 'cefp.penay',
                pass: 'CefpPenay2026!',
                rol: 'seguimiento',
                instancia: 'cefppenay'
            },
            {
                nombre: 'M.V.Z. Zaida Elizabeth García Alonso (SENASICA)',
                usuario: 'senasica.nayarit',
                pass: 'Senasica2026!',
                rol: 'seguimiento',
                instancia: 'senasica'
            },
            {
                nombre: 'Henry Hernández (Pruebas y Soporte Técnico)',
                usuario: 'henry.hernandez',
                pass: 'HenryTest2026!',
                rol: 'seguimiento',
                instancia: 'test_henry'
            }
        ];

        for (const c of cuentas) {
            const existe = await pool.query('SELECT id FROM public.usuarios WHERE usuario = $1', [c.usuario]);
            if (existe.rows.length === 0) {
                const hash = await bcrypt.hash(c.pass, 10);
                await pool.query(`
                    INSERT INTO public.usuarios 
                    (nombre, usuario, password_hash, es_admin, superadmin, rol, activo, instancia,
                     modulo1, modulo2, modulo3, modulo4, modulo5, modulo6, modulo6_pagina4,
                     ver_visitas_otros, editar_campos, eliminar_documentos, descargar_pdfs, panel_admin, consultas)
                    VALUES ($1, $2, $3, false, false, $4, true, $5,
                            false, false, false, false, false, false, false,
                            false, false, false, true, false, false)
                `, [c.nombre, c.usuario, hash, c.rol, c.instancia]);
                console.log(`✅ Usuario institucional ${c.usuario} creado.`);
            } else {
                // Actualizar permisos existentes para asegurar que estén restringidos
                await pool.query(`
                    UPDATE public.usuarios SET
                        rol = $1,
                        instancia = $2,
                        es_admin = false,
                        superadmin = false,
                        modulo1 = false, modulo2 = false, modulo3 = false, modulo4 = false, modulo5 = false, modulo6 = false, modulo6_pagina4 = false,
                        ver_visitas_otros = false,
                        editar_campos = false,
                        eliminar_documentos = false,
                        descargar_pdfs = true,
                        panel_admin = false,
                        consultas = false
                    WHERE usuario = $3
                `, [c.rol, c.instancia, c.usuario]);
            }
        }
        console.log('✅ Esquema de seguimiento y permisos restringidos inicializados');
    } catch (err) {
        console.error('❌ Error al inicializar seguimiento:', err);
    }
};

pool.connect()
    .then(async client => {
        console.log('✅ Conectado a PostgreSQL');
        client.release();
        await initConfigTable();
        await initAuditLogsTable();
        await initModulo1Columns();
        await initSeguimiento();
    })
    .catch(err => console.error('❌ Error conectando a PostgreSQL:', err));

export default pool;