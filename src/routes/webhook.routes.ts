import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebhookService } from '../services/webhook.service';

const router = Router();
const prisma = new PrismaClient();

router.post('/traccar', async (req: Request, res: Response) => {
    // Log para depuración
    console.log('--- Incoming Webhook Request ---');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const apiKey = req.headers['x-api-key']?.toString();

    if (!apiKey) {
        console.log('Error: API Key is missing');
        return res.status(401).json({ error: 'API Key is required' });
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { apiKey }
        });

        if (!tenant || !tenant.active) {
            return res.status(401).json({ error: 'Invalid or inactive tenant' });
        }

        const { deviceId, type, ...payload } = req.body;

        if (!deviceId || !type) {
            return res.status(400).json({ error: 'deviceId and type are required' });
        }

        // Procesar asíncronamente para no bloquear el webhook
        WebhookService.processEvent(tenant.id, deviceId, type, req.body);

        res.status(202).json({ message: 'Event received and processing started' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint para ver logs (protegido si se quisiera, pero por ahora público para debug o usar middleware)
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

router.get('/logs', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.gpsEvent.findMany({
            where: { tenantId: req.user?.tenantId as string },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Simular formato que espera el frontend
        const formattedLogs = logs.map((log: any) => ({
            timestamp: log.createdAt,
            eventType: log.eventType,
            deviceId: log.deviceId,
            success: !!log.processedAt,
            payload: log.rawPayload
        }));

        res.json({
            logs: formattedLogs,
            stats: {
                total: await prisma.gpsEvent.count({ where: { tenantId: req.user?.tenantId as string } }),
                today: await prisma.gpsEvent.count({
                    where: {
                        tenantId: req.user?.tenantId as string,
                        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                    }
                }),
                errors: 0 // Por ahora no trackeamos errores explícitos en BD
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching logs' });
    }
});

export default router;
