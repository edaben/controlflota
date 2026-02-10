import { PrismaClient, ReportStatus } from '@prisma/client';
import { ReportingService } from './reporting.service';

const prisma = new PrismaClient();

export class ConsolidatedService {
    static async generateAndSend(tenantId: string, start: Date, end: Date) {
        // 1. Obtener multas del periodo
        const fines = await prisma.fine.findMany({
            where: {
                tenantId,
                createdAt: { gte: start, lte: end }
            },
            include: { infraction: true }
        });

        if (fines.length === 0) return null;

        const totalUsd = fines.reduce((sum, f) => sum + Number(f.amountUsd), 0);

        // 2. Crear registro del reporte
        const report = await prisma.consolidatedReport.create({
            data: {
                tenantId,
                periodStart: start,
                periodEnd: end,
                totalUsd,
                status: 'GENERATED',
                items: {
                    create: fines.map(f => ({
                        vehicleId: f.infraction.vehicleId,
                        infractionId: f.infractionId,
                        fineId: f.id,
                        amountUsd: f.amountUsd
                    }))
                }
            }
        });

        // 3. Generar PDF
        const pdfPath = await ReportingService.generateConsolidatedPDF(report.id);
        await prisma.consolidatedReport.update({
            where: { id: report.id },
            data: { pdfPath }
        });

        // 4. Enviar Email si hay configuración
        const schedule = await prisma.reportSchedule.findUnique({ where: { tenantId } });
        if (schedule && schedule.enabled && schedule.recipientsEmails.length > 0) {
            try {
                await ReportingService.sendEmail(
                    tenantId,
                    schedule.recipientsEmails,
                    `Reporte Consolidado de Multas - ${new Date().toLocaleDateString()}`,
                    `<p>Hola, adjuntamos el reporte consolidado de multas del periodo ${start.toLocaleDateString()} al ${end.toLocaleDateString()}.</p>`,
                    [{ filename: `Reporte_${report.id}.pdf`, path: pdfPath }]
                );

                await prisma.consolidatedReport.update({
                    where: { id: report.id },
                    data: { status: 'SENT', sentAt: new Date() }
                });
            } catch (error) {
                await prisma.consolidatedReport.update({
                    where: { id: report.id },
                    data: { status: 'ERROR' }
                });
            }
        }

        return report;
    }
}
