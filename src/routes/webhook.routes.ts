import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebhookService } from '../services/webhook.service';

const router = Router();
const prisma = new PrismaClient();

router.post('/traccar', async (req: Request, res: Response) => {
    // Log para depuración
    console.log('[Webhook] --- Incoming Webhook ---');
    console.log(`[Webhook] Method: ${req.method} | Params:`, JSON.stringify(req.query));
    console.log('[Webhook] Body:', JSON.stringify(req.body));

    const apiKey = (req.headers['x-api-key'] || req.query.apiKey)?.toString();

    if (!apiKey) {
        console.log('[Webhook] ❌ Error: API Key is missing in headers or query');
        return res.status(401).json({ error: 'API Key is required' });
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { apiKey }
        });

        if (!tenant) {
            console.log(`[Webhook] ❌ Error: Tenant not found for apiKey: ${apiKey}`);
            return res.status(401).json({ error: 'Invalid tenant' });
        }

        if (!tenant.active) {
            console.log(`[Webhook] ❌ Error: Tenant ${tenant.name} is inactive`);
            return res.status(401).json({ error: 'Inactive tenant' });
        }

        let { deviceId, type, ...payload } = req.body;

        // Normalizar deviceId (Traccar envía snake_case)
        if (!deviceId && req.body.device_id) {
            deviceId = req.body.device_id;
        }

        if (!deviceId || !type) {
            console.log('[Webhook] ❌ Error: deviceId or type missing in body');
            return res.status(400).json({ error: 'deviceId and type are required' });
        }

        // Mappear tipos de eventos de Traccar a los internos
        if (type === 'zone_in') type = 'geofenceEnter';
        if (type === 'zone_out') type = 'geofenceExit';
        // type === 'deviceOverspeed' suele ser igual, pero si llega distinto se puede añadir aquí

        console.log(`[Webhook] ✅ Valid request for tenant ${tenant.name}. Processing event: ${type} for device: ${deviceId}`);

        // Procesar asíncronamente para no bloquear el webhook
        WebhookService.processEvent(tenant.id, deviceId, type, req.body);

        res.status(202).json({ message: 'Event received and processing started' });
    } catch (error) {
        console.error('[Webhook] ❌ Internal Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint para ver logs (protegido si se quisiera, pero por ahora público para debug o usar middleware)
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

router.get('/logs', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.user?.tenantId as string },
            select: { apiKey: true }
        });

        const vehicles = await prisma.vehicle.findMany({
            where: { tenantId: req.user?.tenantId as string },
            select: { traccarDeviceId: true, plate: true }
        });

        const vehicleMap: Record<string, string> = {};
        vehicles.forEach((v: any) => {
            if (v.traccarDeviceId) {
                vehicleMap[v.traccarDeviceId.toString()] = v.plate;
            }
        });

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
            vehiclePlate: vehicleMap[log.deviceId] || 'N/A',
            success: !!log.processedAt,
            payload: log.rawPayload
        }));

        res.json({
            apiKey: tenant?.apiKey,
            logs: formattedLogs,
            stats: {
                total: await prisma.gpsEvent.count({ where: { tenantId: req.user?.tenantId as string } }),
                today: await prisma.gpsEvent.count({
                    where: {
                        tenantId: req.user?.tenantId as string,
                        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                    }
                }),
                errors: 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching logs' });
    }
});

router.delete('/logs', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId as string;

        await prisma.gpsEvent.deleteMany({
            where: { tenantId }
        });

        res.json({ success: true, message: 'Recent events cleared successfully' });
    } catch (error) {
        console.error('[Webhook] Error clearing logs:', error);
        res.status(500).json({ error: 'Error clearing logs' });
    }
});

export default router;
