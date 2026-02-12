
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuración
const DB_NAME = 'control_bus';
const DB_USER = 'postgres';
const DB_HOST = '127.0.0.1';
const DB_PORT = '5432';
const BACKUP_DIR = path.join(__dirname, '../backups');

// Crear directorio si no existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const date = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${DB_NAME}-${date}.sql`);

// Comando pg_dump (necesita password en .pgpass o variable de entorno PGPASSWORD)
// Usando PostgreSQL 16
const command = `PGPASSWORD=${DB_USER} /opt/homebrew/opt/postgresql@16/bin/pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -b -v -f "${backupFile}"`;

console.log(`📦 Iniciando respaldo de ${DB_NAME}...`);

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Error al crear respaldo: ${error.message}`);
        return;
    }
    if (stderr && !stderr.includes('compressing')) { // pg_dump escribe info en stderr
        // console.log(`📝 Log pg_dump: ${stderr}`); 
    }

    console.log(`✅ Respaldo exitoso creado en:`);
    console.log(`   📂 ${backupFile}`);

    // Limpieza: Mantener solo los últimos 5 backups
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(`backup-${DB_NAME}-`));
    files.sort(); // Los más viejos primero por nombre (ISO date)

    if (files.length > 5) {
        const toDelete = files.slice(0, files.length - 5);
        toDelete.forEach(file => {
            fs.unlinkSync(path.join(BACKUP_DIR, file));
            console.log(`🗑️ Backup antiguo eliminado: ${file}`);
        });
    }
});
