import cron from 'node-cron';
import { PrismaClient, Frequency } from '@prisma/client';
import { ConsolidatedService } from './consolidated.service';

const prisma = new PrismaClient();

export class SchedulerService {
    static init() {
        // Tarea que corre cada hora para revisar qué reportes deben enviarse
        cron.schedule('0 * * * *', async () => {
            console.log('Running scheduler check...');
            await this.processScheduledReports();
        });

        // También podríamos usar cron dinámico por cada tenantId si es necesario,
        // pero para empezar, una revisión horaria es eficiente.
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
