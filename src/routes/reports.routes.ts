import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate, tenantMiddleware, authorize } from '../middleware/auth.middleware';
import { ConsolidatedService } from '../services/consolidated.service';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, tenantMiddleware);

// --- Infractions ---
router.get('/infractions', async (req: AuthRequest, res: Response) => {
    const infractions = await prisma.infraction.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { vehicle: true, fine: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(infractions);
});

// --- Fines ---
router.get('/fines', async (req: AuthRequest, res: Response) => {
    const fines = await prisma.fine.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { infraction: { include: { vehicle: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(fines);
});

// --- Consolidated Reports ---
router.get('/consolidated-reports', async (req: AuthRequest, res: Response) => {
    try {
        const reports = await prisma.consolidatedReport.findMany({
            where: { tenantId: req.user?.tenantId as string },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (error: any) {
        console.error('[Reports] Error fetching reports:', error.message);
        res.status(500).json({ error: 'Error fetching reports' });
    }
});

// --- Report Schedule (Configuration) ---
router.get('/schedule', async (req: AuthRequest, res: Response) => {
    try {
        const schedule = await prisma.reportSchedule.findUnique({
            where: { tenantId: req.user?.tenantId as string }
        });
        res.json(schedule || {
            enabled: false,
            frequency: 'DAILY',
            sendTimeLocal: '23:59',
            timezone: 'America/Guayaquil',
            includeStatus: 'CONFIRMED_ONLY',
            recipientsEmails: []
        });
    } catch (error: any) {
        console.error('[Reports] Error fetching schedule:', error.message);
        res.status(500).json({ error: 'Error fetching schedule' });
    }
});

router.put('/schedule', async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId as string;
        const { enabled, frequency, everyNDays, sendTimeLocal, timezone, includeStatus, recipientsEmails } = req.body;

        // Parse emails - accept string (comma-separated) or array
        let emails: string[] = [];
        if (Array.isArray(recipientsEmails)) {
            emails = recipientsEmails.filter((e: string) => e && e.trim() !== '');
        } else if (typeof recipientsEmails === 'string') {
            emails = recipientsEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '');
        }

        const schedule = await prisma.reportSchedule.upsert({
            where: { tenantId },
            update: {
                enabled: !!enabled,
                frequency: frequency || 'DAILY',
                everyNDays: everyNDays ? Number(everyNDays) : null,
                sendTimeLocal: sendTimeLocal || '23:59',
                timezone: timezone || 'America/Guayaquil',
                includeStatus: includeStatus || 'CONFIRMED_ONLY',
                recipientsEmails: emails
            },
            create: {
                tenantId,
                enabled: !!enabled,
                frequency: frequency || 'DAILY',
                everyNDays: everyNDays ? Number(everyNDays) : null,
                sendTimeLocal: sendTimeLocal || '23:59',
                timezone: timezone || 'America/Guayaquil',
                includeStatus: includeStatus || 'CONFIRMED_ONLY',
                recipientsEmails: emails
            }
        });

        console.log('[Reports] ✅ Schedule saved for tenant:', tenantId);
        res.json(schedule);
    } catch (error: any) {
        console.error('[Reports] ❌ Error saving schedule:', error.message);
        res.status(500).json({ error: 'Error saving schedule', details: error.message });
    }
});

// --- Generate Consolidated Report On-Demand ---
router.post('/generate', async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId as string;
        const { periodStart, periodEnd } = req.body;

        let start: Date;
        let end: Date;

        if (periodStart && periodEnd) {
            start = new Date(periodStart);
            end = new Date(periodEnd);
        } else {
            // Default: last 30 days
            end = new Date();
            start = new Date();
            start.setDate(start.getDate() - 30);
        }

        console.log(`[Reports] 📊 Generating consolidated report for tenant ${tenantId}: ${start.toISOString()} to ${end.toISOString()}`);

        // Get fines in the period
        const fines = await prisma.fine.findMany({
            where: {
                tenantId,
                createdAt: { gte: start, lte: end }
            },
            include: {
                infraction: { include: { vehicle: true } }
            }
        });

        if (fines.length === 0) {
            return res.status(400).json({
                error: 'No hay multas en el periodo seleccionado',
                details: `Periodo: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
            });
        }

        const totalUsd = fines.reduce((sum, f) => sum + Number(f.amountUsd), 0);

        // Create the report
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
            },
            include: { items: true }
        });

        console.log(`[Reports] ✅ Report generated: ${report.id} with ${fines.length} fines, total: $${totalUsd.toFixed(2)}`);

        // Try to send email if schedule is configured
        const schedule = await prisma.reportSchedule.findUnique({ where: { tenantId } });
        if (schedule && schedule.enabled && schedule.recipientsEmails.length > 0) {
            try {
                const { ReportingService } = require('../services/reporting.service');
                await ReportingService.sendEmail(
                    tenantId,
                    schedule.recipientsEmails,
                    `Reporte Consolidado de Multas - ${start.toLocaleDateString()} al ${end.toLocaleDateString()}`,
                    `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 10px;">🚌 Reporte Consolidado de Multas</h2>
                        <p>Se ha generado un nuevo reporte consolidado:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="background: #f8f9fa;">
                                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Periodo</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${start.toLocaleDateString()} - ${end.toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Total Multas</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6;">${fines.length}</td>
                            </tr>
                            <tr style="background: #f8f9fa;">
                                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Total USD</td>
                                <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 18px; color: #e94560; font-weight: bold;">$${totalUsd.toFixed(2)}</td>
                            </tr>
                        </table>
                        <h3>Detalle por Vehículo:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="background: #1a1a2e; color: white;">
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Vehículo</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Tipo</th>
                                <th style="padding: 8px; border: 1px solid #dee2e6;">Monto</th>
                            </tr>
                            ${fines.map(f => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #dee2e6;">${f.infraction.vehicle.plate}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6;">${f.infraction.type}</td>
                                    <td style="padding: 8px; border: 1px solid #dee2e6;">$${Number(f.amountUsd).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </table>
                        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
                        <p style="font-size: 12px; color: #666;">Generado por Control Bus - Sistema de Infracciones</p>
                    </div>
                    `
                );

                await prisma.consolidatedReport.update({
                    where: { id: report.id },
                    data: { status: 'SENT', sentAt: new Date() }
                });

                console.log('[Reports] 📧 Email sent to:', schedule.recipientsEmails.join(', '));
                res.status(201).json({ ...report, status: 'SENT', emailSent: true });
            } catch (emailError: any) {
                console.error('[Reports] ⚠️ Report generated but email failed:', emailError.message);
                res.status(201).json({ ...report, emailError: emailError.message });
            }
        } else {
            res.status(201).json(report);
        }
    } catch (error: any) {
        console.error('[Reports] ❌ Error generating report:', error.message);
        res.status(500).json({ error: 'Error generating report', details: error.message });
    }
});

// --- Send existing report by email NOW ---
router.post('/send/:id', async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId as string;
        const reportId = req.params.id;
        const { emails } = req.body; // Optional: override recipients

        const report = await prisma.consolidatedReport.findFirst({
            where: { id: reportId, tenantId },
            include: { items: true }
        });

        if (!report) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        // Determine recipients: from request body or from saved schedule
        let recipients: string[] = [];
        if (emails && typeof emails === 'string') {
            recipients = emails.split(',').map((e: string) => e.trim()).filter((e: string) => e !== '');
        } else if (Array.isArray(emails)) {
            recipients = emails.filter((e: string) => e && e.trim() !== '');
        }

        if (recipients.length === 0) {
            // Fallback to schedule recipients
            const schedule = await prisma.reportSchedule.findUnique({ where: { tenantId } });
            if (schedule && schedule.recipientsEmails.length > 0) {
                recipients = schedule.recipientsEmails;
            }
        }

        if (recipients.length === 0) {
            return res.status(400).json({
                error: 'No hay destinatarios',
                details: 'Ingresa al menos un email destinatario o configura los destinatarios en la programación.'
            });
        }

        // Get fines for the report period to include detail
        const fines = await prisma.fine.findMany({
            where: {
                tenantId,
                createdAt: { gte: report.periodStart, lte: report.periodEnd }
            },
            include: { infraction: { include: { vehicle: true } } }
        });

        const { ReportingService } = require('../services/reporting.service');
        await ReportingService.sendEmail(
            tenantId,
            recipients,
            `Reporte Consolidado de Multas - ${report.periodStart.toLocaleDateString()} al ${report.periodEnd.toLocaleDateString()}`,
            `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 10px;">🚌 Reporte Consolidado de Multas</h2>
                <p>Se adjunta el reporte consolidado del periodo:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Periodo</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">${report.periodStart.toLocaleDateString()} - ${report.periodEnd.toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Total Multas</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">${report.items.length}</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Total USD</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 18px; color: #e94560; font-weight: bold;">$${Number(report.totalUsd).toFixed(2)}</td>
                    </tr>
                </table>
                ${fines.length > 0 ? `
                <h3>Detalle:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #1a1a2e; color: white;">
                        <th style="padding: 8px; border: 1px solid #dee2e6;">Vehículo</th>
                        <th style="padding: 8px; border: 1px solid #dee2e6;">Tipo</th>
                        <th style="padding: 8px; border: 1px solid #dee2e6;">Monto</th>
                    </tr>
                    ${fines.map(f => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${f.infraction.vehicle.plate}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${f.infraction.type}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">$${Number(f.amountUsd).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>` : ''}
                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #666;">Generado por Control Bus - Sistema de Infracciones</p>
            </div>
            `
        );

        await prisma.consolidatedReport.update({
            where: { id: report.id },
            data: { status: 'SENT', sentAt: new Date() }
        });

        console.log(`[Reports] 📧 Report ${reportId} sent to: ${recipients.join(', ')}`);
        res.json({ success: true, message: `Reporte enviado a: ${recipients.join(', ')}` });
    } catch (error: any) {
        console.error('[Reports] ❌ Error sending report:', error.message);
        res.status(500).json({ error: 'Error al enviar reporte', details: error.message });
    }
});

export default router;
