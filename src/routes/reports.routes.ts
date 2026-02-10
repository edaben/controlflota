import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate, tenantMiddleware } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, tenantMiddleware);

router.get('/infractions', async (req: AuthRequest, res: Response) => {
    const infractions = await prisma.infraction.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { vehicle: true, fine: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(infractions);
});

router.get('/fines', async (req: AuthRequest, res: Response) => {
    const fines = await prisma.fine.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { infraction: { include: { vehicle: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(fines);
});

router.get('/consolidated-reports', async (req: AuthRequest, res: Response) => {
    const reports = await prisma.consolidatedReport.findMany({
        where: { tenantId: req.user?.tenantId as string },
        orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
});

export default router;
