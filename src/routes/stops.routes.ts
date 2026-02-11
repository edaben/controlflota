import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticate, tenantMiddleware, authorize } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, tenantMiddleware);

// --- Stops (Paradas/Geocercas) ---

router.get('/stops', async (req: AuthRequest, res: Response) => {
    try {
        const stops = await prisma.stop.findMany({
            where: { tenantId: req.user?.tenantId as string },
            include: { route: true },
            orderBy: { order: 'asc' }
        });
        res.json(stops);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch stops' });
    }
});

router.post('/stops', authorize([], [PERMISSIONS.MANAGE_ROUTES]), async (req: AuthRequest, res: Response) => {
    try {
        const { routeId, name, geofenceId, geofenceType, geofenceRadius, geofenceCoordinates, latitude, longitude, order } = req.body;

        const stop = await prisma.stop.create({
            data: {
                tenantId: req.user?.tenantId as string,
                routeId,
                name,
                geofenceId,
                geofenceType,
                geofenceRadius: geofenceRadius ? Number(geofenceRadius) : null,
                geofenceCoordinates,
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
                order: Number(order)
            }
        });
        res.status(201).json(stop);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Could not create stop' });
    }
});

router.put('/stops/:id', authorize([], [PERMISSIONS.MANAGE_ROUTES]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const { routeId, name, geofenceId, geofenceType, geofenceRadius, geofenceCoordinates, latitude, longitude, order } = req.body;

        const stop = await prisma.stop.update({
            where: { id, tenantId: req.user?.tenantId as string },
            data: {
                routeId,
                name,
                geofenceId,
                geofenceType,
                geofenceRadius: geofenceRadius ? Number(geofenceRadius) : null,
                geofenceCoordinates,
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
                order: Number(order)
            }
        });
        res.json(stop);
    } catch (error) {
        res.status(400).json({ error: 'Could not update stop' });
    }
});

router.delete('/stops/:id', authorize([], [PERMISSIONS.MANAGE_ROUTES]), async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId as string;

    try {
        // Manual Cascade Delete due to lack of DB cascade
        await prisma.$transaction(async (tx: any) => {
            // 1. Delete SegmentRules relying on this stop
            await tx.segmentRule.deleteMany({
                where: {
                    tenantId,
                    OR: [{ fromStopId: id }, { toStopId: id }]
                }
            });

            // 2. Delete StopRules (e.g. dwell time)
            await tx.stopRule.deleteMany({
                where: { tenantId, stopId: id }
            });

            // 3. Delete StopArrivals (History) - or we could keep them if we made stopId optional, but it's not.
            // WARNING: This deletes history. User requested deletion, so we proceed.
            await tx.stopArrival.deleteMany({
                where: { tenantId, stopId: id }
            });

            // 4. Finally delete the Stop
            await tx.stop.delete({
                where: { id, tenantId }
            });
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting stop:', error);
        res.status(500).json({ error: 'Could not delete stop. It might be referenced by other records.' });
    }
});

export default router;
