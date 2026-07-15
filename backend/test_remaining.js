import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pkg;

async function main() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'admin123'
    });

    try {
        await client.connect();
        console.log("Conectado a Postgres local. Limpiando conexiones activas a seiot_test_db...");
        await client.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid) 
            FROM pg_stat_activity 
            WHERE pg_stat_activity.datname = 'seiot_test_db' AND pid <> pg_backend_pid()
        `).catch(() => {});
        
        await client.query('DROP DATABASE IF EXISTS seiot_test_db');
        await client.query('CREATE DATABASE seiot_test_db');
        await client.end();
        
        // Conectar a la nueva BD de prueba
        const testClient = new Client({
            host: 'localhost',
            port: 5432,
            database: 'seiot_test_db',
            user: 'postgres',
            password: 'admin123'
        });
        
        await testClient.connect();
        
        // Crear las tablas base primero (usuarios, excel_psg, excel_supervisores) ya que las restantes tienen llaves foráneas a estas!
        console.log("Creando tablas catálogo base...");
        const sqlBase = `
            CREATE TABLE public.usuarios ( id SERIAL PRIMARY KEY );
            CREATE TABLE public.excel_psg ( id SERIAL PRIMARY KEY, psg varchar(50) );
            CREATE TABLE public.excel_supervisores ( id SERIAL PRIMARY KEY );
        `;
        await testClient.query(sqlBase);
        
        console.log("Conectado a seiot_test_db. Ejecutando remaining_tables_setup.sql...");
        const sql = fs.readFileSync('remaining_tables_setup.sql', 'utf8');
        await testClient.query(sql);
        console.log("✅ SQL de tablas restantes ejecutado sin errores de sintaxis.");
        
        const tablesRes = await testClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);
        
        console.log(`Total de tablas creadas: ${tablesRes.rows.length}`);
        console.log(tablesRes.rows.map(r => r.table_name));
        
        await testClient.end();
    } catch (e) {
        console.error("❌ Error de SQL detectado:", e);
    }
}

main();
