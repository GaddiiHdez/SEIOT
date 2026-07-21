import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const fsPromises = fs.promises;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n======================================================');
console.log('🚨 ATENCIÓN: SCRIPT ADMINISTRATIVO DE REINICIO SEIOT');
console.log('======================================================\n');
console.log('Este script limpiará todas las visitas, formularios y archivos PDF del servidor.');
console.log('Conservará intactas las cuentas de usuario, catálogo de PSG y supervisores.\n');

rl.question('¿Estás seguro de que deseas REINICIAR EL SISTEMA A CEROS? (Escribe "CONFIRMAR" para proceder): ', async (respuesta) => {
    if (respuesta.trim() !== 'CONFIRMAR') {
        console.log('\n❌ Operación cancelada. No se realizó ningún cambio.');
        rl.close();
        process.exit(0);
    }

    const client = await pool.connect();
    try {
        console.log('\n⏳ Iniciando limpieza de base de datos...');
        await client.query('BEGIN');

        // Truncar tablas de visitas y módulos
        await client.query(`
            TRUNCATE TABLE 
                public.documentos_firmados, 
                public.modulo1_oficio_notificacion, 
                public.modulo2_orden_supervision, 
                public.modulo3_checklist, 
                public.modulo3_lista_verificacion, 
                public.modulo4_acta_hechos, 
                public.modulo5_acta_supervision, 
                public.modulo6_acta_circunstanciada, 
                public.visitas 
            RESTART IDENTITY CASCADE
        `);

        console.log('✅ Tablas limpiadas e identificadores reiniciados.');

        // Limpiar archivos físicos PDF
        const uploadsDir = path.join(process.cwd(), 'uploads', 'documentos_firmados');
        try {
            const files = await fsPromises.readdir(uploadsDir);
            let eliminados = 0;
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                const stat = await fsPromises.stat(filePath);
                if (stat.isFile()) {
                    await fsPromises.unlink(filePath);
                    eliminados++;
                }
            }
            console.log(`✅ ${eliminados} archivo(s) PDF firmados eliminados del servidor.`);
        } catch (e) {
            console.log('ℹ️ La carpeta de descargas no contiene archivos o no existe.');
        }

        await client.query('COMMIT');
        console.log('\n✨ ¡REINICIO COMPLETADO CON ÉXITO!\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error durante el reinicio:', error.message);
    } finally {
        client.release();
        rl.close();
        process.exit(0);
    }
});
