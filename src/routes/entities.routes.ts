import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate, tenantMiddleware } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Aplicar auth y tenant isolation a todas estas rutas
router.use(authenticate, tenantMiddleware);

// --- Vehículos ---
router.get('/vehicles', async (req: AuthRequest, res: Response) => {
    const vehicles = await prisma.vehicle.findMany({
        where: { tenantId: req.user?.tenantId as string }
    });
    res.json(vehicles);
});

router.post('/vehicles', async (req: AuthRequest, res: Response) => {
    const { plateNumber, traccarDeviceId, fleetId } = req.body;
    try {
        const vehicle = await prisma.vehicle.create({
            data: {
                tenantId: req.user?.tenantId as string,
                plateNumber,
                traccarDeviceId: traccarDeviceId?.toString(),
                fleetId
            }
        });
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(400).json({ error: 'Could not create vehicle' });
    }
});

// --- Rutas ---
router.get('/routes', async (req: AuthRequest, res: Response) => {
    const routes = await prisma.route.findMany({
        where: { tenantId: req.user?.tenantId as string },
        include: { stops: { orderBy: { order: 'asc' } } }
    });
    res.json(routes);
});

router.post('/routes', async (req: AuthRequest, res: Response) => {
    const { name, code, description } = req.body;
    const route = await prisma.route.create({
        data: {
            tenantId: req.user?.tenantId as string,
            name,
            code,
            description
        }
    });
    res.status(201).json(route);
});

export default router;
