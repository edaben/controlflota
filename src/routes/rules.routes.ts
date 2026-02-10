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
    const rule = await prisma.segmentRule.create({
        data: {
            tenantId: req.user?.tenantId as string,
            routeId,
            fromStopId,
            toStopId,
            expectedMaxMinutes,
            fineAmountUsd
        }
    });
    res.status(201).json(rule);
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
    const rule = await prisma.stopRule.create({
        data: {
            tenantId: req.user?.tenantId as string,
            stopId,
            maxDwellMinutes,
            fineAmountUsd
        }
    });
    res.status(201).json(rule);
});

export default router;
