import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebhookService } from '../services/webhook.service';

const router = Router();
const prisma = new PrismaClient();

router.post('/traccar', async (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key']?.toString();

    if (!apiKey) {
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

export default router;
