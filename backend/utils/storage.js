import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de rutas candidatas donde Render suele montar el disco persistente
const DISK_CANDIDATE_PATHS = [
    '/var/data',
    '/data',
    '/uploads',
    '/mnt/data'
];

/**
 * Retorna la ruta absoluta del directorio donde deben guardarse los PDFs firmados.
 * 1. Variable de entorno UPLOADS_DIR (configurada en Render)
 * 2. Auto-detección de disco persistente montado en Render (/var/data, /data, etc.)
 * 3. Directorio local './uploads/documentos_firmados' unificado
 */
export const getUploadsDir = () => {
    // 1. Si el usuario configuró explícitamente UPLOADS_DIR en Render o .env
    if (process.env.UPLOADS_DIR) {
        const customDir = path.resolve(process.env.UPLOADS_DIR);
        try {
            if (!fs.existsSync(customDir)) {
                fs.mkdirSync(customDir, { recursive: true });
            }
            return customDir;
        } catch (e) {
            console.warn(`[STORAGE] Error al inicializar UPLOADS_DIR (${customDir}):`, e.message);
        }
    }

    // 2. Auto-detección de disco persistente en Render
    for (const diskPath of DISK_CANDIDATE_PATHS) {
        try {
            if (fs.existsSync(diskPath)) {
                fs.accessSync(diskPath, fs.constants.W_OK);
                const targetSubdir = path.join(diskPath, 'documentos_firmados');
                if (!fs.existsSync(targetSubdir)) {
                    fs.mkdirSync(targetSubdir, { recursive: true });
                }
                return targetSubdir;
            }
        } catch {
            // Continuar con el siguiente candidato
        }
    }

    // 3. Fallback: Directorio local en el servidor
    const fallbackDir = path.join(process.cwd(), 'uploads', 'documentos_firmados');
    try {
        if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
        }
    } catch (e) {
        console.warn(`[STORAGE] Error creando fallback dir:`, e.message);
    }
    return fallbackDir;
};

/**
 * Busca un archivo firmado en todos los posibles directorios (disco persistente, ruta en BD, relativas)
 */
export const findDocumentoFirmado = (filename, rutaGuardada = null) => {
    if (!filename) return null;
    const safeFilename = path.basename(filename);
    const candidatePaths = [];

    // 1. Ruta exacta guardada en PostgreSQL
    if (rutaGuardada) {
        candidatePaths.push(path.resolve(rutaGuardada));
        candidatePaths.push(rutaGuardada);
    }

    // 2. Directorio activo de almacenamiento
    const activeDir = getUploadsDir();
    candidatePaths.push(path.join(activeDir, safeFilename));
    candidatePaths.push(path.join(path.dirname(activeDir), safeFilename));

    // 3. Variable UPLOADS_DIR si existe
    if (process.env.UPLOADS_DIR) {
        candidatePaths.push(path.join(process.env.UPLOADS_DIR, safeFilename));
        candidatePaths.push(path.join(process.env.UPLOADS_DIR, 'documentos_firmados', safeFilename));
    }

    // 4. Discos persistentes de Render conocidos
    for (const disk of DISK_CANDIDATE_PATHS) {
        candidatePaths.push(path.join(disk, safeFilename));
        candidatePaths.push(path.join(disk, 'documentos_firmados', safeFilename));
    }

    // 5. Directorios del proyecto Node.js
    candidatePaths.push(path.join(process.cwd(), 'uploads', 'documentos_firmados', safeFilename));
    candidatePaths.push(path.join(process.cwd(), 'backend', 'uploads', 'documentos_firmados', safeFilename));
    candidatePaths.push(path.join(__dirname, '..', 'uploads', 'documentos_firmados', safeFilename));
    candidatePaths.push(path.join(__dirname, '..', '..', 'uploads', 'documentos_firmados', safeFilename));

    // Revisar cada candidato
    const tested = new Set();
    for (const cand of candidatePaths) {
        if (!cand || tested.has(cand)) continue;
        tested.add(cand);
        try {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
                return cand;
            }
        } catch {}
    }

    return null;
};
