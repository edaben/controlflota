import cron from 'node-cron';
import { PrismaClient, Frequency } from '@prisma/client';
import { ConsolidatedService } from './consolidated.service';

const prisma = new PrismaClient();

export class SchedulerService {
    static init() {
        // Tarea que corre cada hora para revisar qué reportes deben enviarse
        cron.schedule('0 * * * *', async () => {
            console.log('⏰ Running scheduler check for reports...');
            await this.processScheduledReports();
        });

        // 🛡️ Tarea de Respaldo de Base de Datos (Cada 4 horas)
        cron.schedule('0 */4 * * *', async () => {
            console.log('📦 Iniciando respaldo programado de base de datos...');
            const { exec } = require('child_process');
            const path = require('path');
            const scriptPath = path.join(__dirname, '../../scripts/backup_db.ts');

            exec(`npx ts-node "${scriptPath}"`, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.error(`❌ Error en respaldo programado: ${error.message}`);
                    return;
                }
                console.log(`✅ Respaldo programado completado.`);
            });
        });
    }

    static async processScheduledReports() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const activeSchedules = await prisma.reportSchedule.findMany({
            where: { enabled: true }
        });

        for (const schedule of activeSchedules) {
            const [sendHour, sendMinute] = schedule.sendTimeLocal.split(':').map(Number);

            // Si es la hora de envío (dentro del rango de la hora actual)
            if (currentHour === sendHour) {
                const start = new Date();
                const end = new Date();

                if (schedule.frequency === 'DAILY' || schedule.frequency === 'EVERY_24_HOURS') {
                    start.setDate(now.getDate() - 1);
                } else if (schedule.frequency === 'WEEKLY') {
                    start.setDate(now.getDate() - 7);
                } else if (schedule.frequency === 'MONTHLY') {
                    start.setMonth(now.getMonth() - 1);
                }

                await ConsolidatedService.generateAndSend(schedule.tenantId, start, end);
            }
        }
    }
}
