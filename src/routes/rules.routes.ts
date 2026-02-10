import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate, tenantMiddleware } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, tenantMiddleware);

// --- Segment Rules (Tramo A -> B) ---
router.get('/segment-rules', async (req: AuthRequest, res: Response) => {
    const rules = await prisma.segmentRule.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { fromStop: true, toStop: true, route: true }
    });
    res.json(rules);
});

router.post('/segment-rules', async (req: AuthRequest, res: Response) => {
    const { routeId, fromStopId, toStopId, expectedMaxMinutes, fineAmountUsd } = req.body;
    try {
        const rule = await prisma.segmentRule.create({
            data: {
                tenantId: req.user?.tenantId as string,
                routeId,
                fromStopId,
                toStopId,
                expectedMaxMinutes: Number(expectedMaxMinutes),
                fineAmountUsd: Number(fineAmountUsd)
            }
        });
        res.status(201).json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Error creating segment rule' });
    }
});

router.put('/segment-rules/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { expectedMaxMinutes, fineAmountUsd } = req.body;
    try {
        const rule = await prisma.segmentRule.update({
            where: { id },
            data: {
                expectedMaxMinutes: Number(expectedMaxMinutes),
                fineAmountUsd: Number(fineAmountUsd)
            }
        });
        res.json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Error updating segment rule' });
    }
});

router.delete('/segment-rules/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.segmentRule.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting segment rule' });
    }
});

// --- Stop Rules (Dwell Time) ---
router.get('/stop-rules', async (req: AuthRequest, res: Response) => {
    const rules = await prisma.stopRule.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { stop: true }
    });
    res.json(rules);
});

router.post('/stop-rules', async (req: AuthRequest, res: Response) => {
    const { stopId, maxDwellMinutes, fineAmountUsd } = req.body;
    try {
        const rule = await prisma.stopRule.create({
            data: {
                tenantId: req.user?.tenantId as string,
                stopId,
                maxDwellMinutes: Number(maxDwellMinutes),
                fineAmountUsd: Number(fineAmountUsd)
            }
        });
        res.status(201).json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Error creating stop rule' });
    }
});

router.put('/stop-rules/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { maxDwellMinutes, fineAmountUsd } = req.body;
    try {
        const rule = await prisma.stopRule.update({
            where: { id },
            data: {
                maxDwellMinutes: Number(maxDwellMinutes),
                fineAmountUsd: Number(fineAmountUsd)
            }
        });
        res.json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Error updating stop rule' });
    }
});

router.delete('/stop-rules/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.stopRule.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting stop rule' });
    }
});

// --- Speed Zones ---
router.get('/speed-zones', async (req: AuthRequest, res: Response) => {
    const zones = await prisma.speedZone.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { route: true }
    });
    res.json(zones);
});

router.post('/speed-zones', async (req: AuthRequest, res: Response) => {
    const { name, routeId, geofenceId, maxSpeedKmh, fineAmountUsd } = req.body;
    try {
        const zone = await prisma.speedZone.create({
            data: {
                tenantId: req.user?.tenantId as string,
                name,
                routeId, // Ensure routeId is provided from frontend or optional
                geofenceId, // Maps to traccarGeofenceId in frontend
                maxSpeedKmh: Number(maxSpeedKmh),
                fineAmountUsd: Number(fineAmountUsd)
            }
        });
        res.status(201).json(zone);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating speed zone' });
    }
});

router.put('/speed-zones/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, maxSpeedKmh, fineAmountUsd } = req.body;
    try {
        const zone = await prisma.speedZone.update({
            where: { id },
            data: {
                name,
                maxSpeedKmh: Number(maxSpeedKmh),
                fineAmountUsd: Number(fineAmountUsd)
            }
        });
        res.json(zone);
    } catch (error) {
        res.status(500).json({ error: 'Error updating speed zone' });
    }
});

router.delete('/speed-zones/:id', async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.speedZone.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting speed zone' });
    }
});

export default router;
